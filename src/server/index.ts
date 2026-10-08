/**
 * index.ts — WebSocket + HTTP ops surface for the room server.
 *
 *   ws    ws://<host>/           — the game protocol (see protocol.ts)
 *   http  GET /healthz           — liveness + counters
 *         GET /rooms             — ops view: live rooms, seats, revisions
 *         GET /rooms/<id|code>   — one room's detail
 *
 * Env:
 *   PORT             listen port (default 8787)
 *   HOST             bind host (default 0.0.0.0)
 *   ROOM_DATA_DIR    durable store dir (default ./data/rooms; set empty to disable)
 *   HEARTBEAT_MS     ws ping interval (default 10000)
 *   RECONNECT_WINDOW_MS / IDLE_EXPIRY_MS / SNAPSHOT_EVERY — tunables
 *
 * Every connection must `hello` within HELLO_TIMEOUT_MS. All logs are
 * structured JSON lines on stdout. SIGINT/SIGTERM close politely: clients get
 * a `server_shutdown` error and a 1001 close so they can reconnect cleanly.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import {
  encode,
  parseClientMessage,
  ErrorCodes,
  PROTOCOL_VERSION,
  SERVER_VERSION,
  MAX_MESSAGE_BYTES,
  HELLO_TIMEOUT_MS,
  type ClientMessage,
  type ErrorCode,
  type ServerMessage,
} from './protocol.js';
import { RoomManager, type Logger } from './rooms.js';
import type { GameAdapter } from './adapter.js';
import { FileRoomStore, type RoomStore } from './store.js';

export interface RoomServerOptions {
  adapters: GameAdapter[];
  defaultGameType?: string;
  port?: number;
  host?: string;
  dataDir?: string | null;   // null disables durable store
  heartbeatMs?: number;
  reconnectWindowMs?: number;
  idleExpiryMs?: number;
  ephemeralIdleExpiryMs?: number;
  snapshotEvery?: number;
  sweepIntervalMs?: number;
  maxSeats?: number;
  now?: () => number;
  logger?: Logger;
  /** Test hook: expose the RoomManager (sweep, stats, …). */
  onReady?: (srv: RoomServer) => void;
  /** Attach mode: serve ws on an existing HTTP server instead of creating one.
   *  When set, the built-in HTTP ops surface is skipped and no listen() happens. */
  httpServer?: import('node:http').Server;
  wsPath?: string;
}

export interface RoomServer {
  port: number;
  manager: RoomManager;
  httpServer: Server;
  wss: WebSocketServer;
  close(): Promise<void>;
}

interface Conn {
  id: string;
  ws: WebSocket;
  sessionId: string;
  helloDone: boolean;
  helloTimer: ReturnType<typeof setTimeout>;
  isAlive: boolean;
}

const jsonLog: Logger = (level, event, fields) => {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...(fields ?? {}) });
  (level === 'error' || level === 'warn' ? console.error : console.log)(line);
};

export async function startRoomServer(opts: RoomServerOptions): Promise<RoomServer> {
  const log = opts.logger ?? jsonLog;
  const heartbeatMs = opts.heartbeatMs ?? 10_000;
  const store: RoomStore | undefined =
    opts.dataDir === null ? undefined : new FileRoomStore(opts.dataDir ?? './data/rooms');

  const conns = new Map<string, Conn>();

  const managerOpts: ConstructorParameters<typeof RoomManager>[0] = {
    adapters: opts.adapters,
    transport: {
      send(connId, msg) {
        const c = conns.get(connId);
        if (c && c.ws.readyState === WebSocket.OPEN) c.ws.send(encode(msg));
      },
      closeConn(connId, code, reason) {
        const c = conns.get(connId);
        if (c) c.ws.close(code, reason);
      },
    },
    ...(opts.maxSeats !== undefined ? { maxSeats: opts.maxSeats } : {}),
    ...(opts.reconnectWindowMs !== undefined ? { reconnectWindowMs: opts.reconnectWindowMs } : {}),
    ...(opts.idleExpiryMs !== undefined ? { idleExpiryMs: opts.idleExpiryMs } : {}),
    ...(opts.ephemeralIdleExpiryMs !== undefined ? { ephemeralIdleExpiryMs: opts.ephemeralIdleExpiryMs } : {}),
    ...(opts.snapshotEvery !== undefined ? { snapshotEvery: opts.snapshotEvery } : {}),
    ...(opts.sweepIntervalMs !== undefined ? { sweepIntervalMs: opts.sweepIntervalMs } : {}),
    ...(opts.now !== undefined ? { now: opts.now } : {}),
    ...(store !== undefined ? { store } : {}),
    log,
  };
  if (opts.defaultGameType !== undefined) managerOpts.defaultGameType = opts.defaultGameType;
  const manager = new RoomManager(managerOpts);
  const recovered = manager.recoverFromStore();

  /* ---------------- HTTP ops surface ---------------- */
  const providedHttp = opts.httpServer;
  const httpServer = providedHttp ?? createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const send = (code: number, body: unknown) => {
      const text = JSON.stringify(body);
      res.writeHead(code, { 'content-type': 'application/json' });
      res.end(text);
    };
    if (req.method === 'GET' && url.pathname === '/healthz') {
      const s = manager.stats();
      send(200, {
        ok: true,
        version: SERVER_VERSION,
        protocolVersion: PROTOCOL_VERSION,
        uptimeMs: Date.now() - startedAt,
        rooms: s.rooms,
        connections: s.connections,
        seatedMembers: s.seatedMembers,
        recoveredRooms: recovered,
      });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/rooms') {
      send(200, { rooms: manager.listRooms() });
      return;
    }
    const m = /^\/rooms\/([A-Za-z0-9_-]+)$/.exec(url.pathname);
    if (req.method === 'GET' && m) {
      const room = manager.findRoom(m[1]!);
      if (!room) {
        send(404, { error: 'room_not_found' });
        return;
      }
      send(200, { room: manager.listRooms().find((r) => r.roomId === room.id) });
      return;
    }
    if (req.method === 'DELETE' && m) {
      const ok = manager.closeRoom(m[1]!, 'ops_closed');
      send(ok ? 200 : 404, ok ? { closed: true } : { error: 'room_not_found' });
      return;
    }
    send(404, { error: 'not_found' });
  });

  /* ---------------- WebSocket surface ---------------- */
  const wss = new WebSocketServer({ server: httpServer, path: opts.wsPath ?? '/', maxPayload: MAX_MESSAGE_BYTES });
  const startedAt = Date.now();

  function sendError(conn: Conn, code: ErrorCode, message: string, commandId?: string): void {
    const msg: ServerMessage = { type: 'error', code, message };
    if (commandId !== undefined) msg.commandId = commandId;
    if (conn.ws.readyState === WebSocket.OPEN) conn.ws.send(encode(msg));
  }

  function handleMessage(conn: Conn, raw: string): void {
    const parsed = parseClientMessage(raw);
    if (!parsed.ok) {
      sendError(conn, parsed.code, parsed.message, parsed.commandId);
      return;
    }
    const msg: ClientMessage = parsed.msg;

    if (!conn.helloDone) {
      if (msg.type !== 'hello') {
        sendError(conn, ErrorCodes.HELLO_REQUIRED, 'first message must be hello');
        return;
      }
      if (msg.protocolVersion !== PROTOCOL_VERSION) {
        sendError(
          conn,
          ErrorCodes.INCOMPATIBLE_VERSION,
          `protocol version mismatch: server=${PROTOCOL_VERSION} client=${msg.protocolVersion}; reload the client`,
        );
        conn.ws.close(4002, 'incompatible protocol version');
        return;
      }
      conn.helloDone = true;
      clearTimeout(conn.helloTimer);
      if (msg.sessionId) conn.sessionId = msg.sessionId;
      conn.ws.send(
        encode({ type: 'hello', protocolVersion: PROTOCOL_VERSION, serverVersion: SERVER_VERSION, sessionId: conn.sessionId, heartbeatMs }),
      );
      return;
    }

    switch (msg.type) {
      case 'hello':
        sendError(conn, ErrorCodes.PROTOCOL, 'duplicate hello');
        return;
      case 'ping':
        conn.ws.send(encode({ type: 'pong', ...(msg.t !== undefined ? { t: msg.t } : {}) }));
        return;
      case 'create': {
        const res = manager.createRoom(conn.id, msg);
        if (!res.ok) {
          sendError(conn, res.code, res.message);
          return;
        }
        conn.ws.send(encode(res.msg));
        log('info', 'ws_room_created', { connId: conn.id, roomId: res.room.id, seat: res.member.seat });
        return;
      }
      case 'join': {
        const res = manager.joinRoom(conn.id, msg);
        if (!res.ok) {
          sendError(conn, res.code, res.message);
          return;
        }
        conn.ws.send(encode(res.msg));
        return;
      }
      case 'leave':
        manager.leaveByConn(conn.id, 'left');
        return;
      case 'command': {
        const res = manager.submitCommand(conn.id, msg);
        if (!res.ok) {
          sendError(conn, res.code, res.message, msg.commandId);
        }
        // success path is delivered by the broadcast state_patch
        return;
      }
    }
  }

  wss.on('connection', (ws: WebSocket) => {
    const conn: Conn = {
      id: randomUUID(),
      ws,
      sessionId: randomUUID(),
      helloDone: false,
      isAlive: true,
      helloTimer: setTimeout(() => {
        if (!conn.helloDone) ws.close(4003, 'hello timeout');
      }, HELLO_TIMEOUT_MS),
    };
    conns.set(conn.id, conn);
    log('debug', 'ws_open', { connId: conn.id });

    ws.on('pong', () => {
      conn.isAlive = true;
    });
    ws.on('message', (data: Buffer, isBinary: boolean) => {
      if (isBinary) {
        sendError(conn, ErrorCodes.PROTOCOL, 'binary frames are not part of this protocol');
        return;
      }
      try {
        handleMessage(conn, data.toString('utf8'));
      } catch (err) {
        log('error', 'ws_handler_error', { connId: conn.id, err: String(err) });
        sendError(conn, ErrorCodes.INTERNAL, 'internal error');
      }
    });
    ws.on('close', () => {
      clearTimeout(conn.helloTimer);
      conns.delete(conn.id);
      manager.onSocketClosed(conn.id);
      log('debug', 'ws_close', { connId: conn.id });
    });
    ws.on('error', () => {
      /* close follows; handled there */
    });
  });

  // Transport-level heartbeat: ws ping/pong detects dead sockets even when
  // the tab is suspended; the seat itself is held for reconnectWindowMs.
  const heartbeat = setInterval(() => {
    for (const c of conns.values()) {
      if (!c.isAlive) {
        log('info', 'ws_heartbeat_timeout', { connId: c.id });
        c.ws.terminate();
        continue;
      }
      c.isAlive = false;
      c.ws.ping();
    }
  }, heartbeatMs);
  heartbeat.unref?.();

  let actualPort = 0;
  if (providedHttp) {
    const addr = providedHttp.address();
    actualPort = typeof addr === 'object' && addr ? addr.port : 0;
  } else {
    const port = opts.port ?? Number(process.env.PORT ?? 8787);
    const host = opts.host ?? process.env.HOST ?? '0.0.0.0';
    await new Promise<void>((resolve) => httpServer.listen(port, host, resolve));
    actualPort = (httpServer.address() as { port: number }).port;
  }

  const srv: RoomServer = {
    port: actualPort,
    manager,
    httpServer,
    wss,
    async close() {
      clearInterval(heartbeat);
      for (const c of conns.values()) {
        sendError(c, ErrorCodes.SERVER_SHUTDOWN, 'server is shutting down');
        c.ws.close(1001, 'server shutdown');
      }
      manager.shutdown();
      await new Promise<void>((resolve) => wss.close(() => resolve()));
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    },
  };
  opts.onReady?.(srv);
  log('info', 'room_server_up', { port: actualPort, host: opts.host ?? process.env.HOST ?? '0.0.0.0', heartbeatMs, store: store ? 'file' : 'off' });
  return srv;
}

/* ---------------- standalone entry ---------------- */

/**
 * Dev-only adapter used when the server is run standalone (no game plugged
 * in): accepts any object payload and records it. Real deployments inject
 * their game adapter via startRoomServer({adapters}).
 */
const devAdapter: GameAdapter<{ score: number; applied: unknown[] }> = {
  gameType: 'dev',
  rulesVersion: 'dev-0',
  initRoomState: () => ({ score: 0, applied: [] }),
  validateCommand: (_room, _actor, cmd) =>
    typeof cmd === 'object' && cmd !== null ? { ok: true } : { ok: false, reason: 'payload must be an object' },
  applyCommand: (room, _actor, cmd) => {
    room.state.applied.push(cmd);
    room.state.score += 1;
    return [{ type: 'applied', by: _actor }];
  },
  snapshot: (room) => new TextEncoder().encode(JSON.stringify(room.state)),
  restore: (draft, bytes) => {
    draft.state = JSON.parse(new TextDecoder().decode(bytes)) as { score: number; applied: unknown[] };
  },
};

const isMain = process.argv[1] !== undefined && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const srv = await startRoomServer({
    adapters: [devAdapter],
    dataDir: process.env.ROOM_DATA_DIR === '' ? null : process.env.ROOM_DATA_DIR ?? './data/rooms',
    ...(process.env.HEARTBEAT_MS ? { heartbeatMs: Number(process.env.HEARTBEAT_MS) } : {}),
    ...(process.env.RECONNECT_WINDOW_MS ? { reconnectWindowMs: Number(process.env.RECONNECT_WINDOW_MS) } : {}),
    ...(process.env.IDLE_EXPIRY_MS ? { idleExpiryMs: Number(process.env.IDLE_EXPIRY_MS) } : {}),
    ...(process.env.SNAPSHOT_EVERY ? { snapshotEvery: Number(process.env.SNAPSHOT_EVERY) } : {}),
  });
  const shutdown = () => {
    void srv.close().then(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
