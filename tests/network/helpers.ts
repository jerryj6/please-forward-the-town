/**
 * helpers.ts — test plumbing for network suites.
 *
 * TestClient wraps a real ws connection against a real running server: no
 * mocks (master §6.2 — live multiplayer gates run against the actual server).
 * CounterAdapter is a tiny deterministic GameAdapter used to exercise the
 * room plumbing; it is deliberately NOT any shipping game.
 */
import { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import {
  PROTOCOL_VERSION,
  type FullState,
  type ServerMessage,
  type StatePatch,
} from '../../src/server/protocol.js';
import { hashCanonicalState } from '../../src/server/protocol.js';
import type { GameAdapter, RoomDraft, RoomView } from '../../src/server/adapter.js';

/* ---------------- deterministic RNG ---------------- */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/* ---------------- test adapter ---------------- */

export interface CounterState {
  score: number;
  ops: number;
  appliedBy: string[];
  finished: boolean;
}
export type CounterCmd =
  | { kind: 'add'; n: number; note?: string }
  | { kind: 'reject' }
  | { kind: 'crash' }
  | { kind: 'finish' };

export class CounterAdapter implements GameAdapter<CounterState> {
  readonly gameType = 'counter';
  readonly rulesVersion = 'counter-1';
  applyCalls = 0;

  initRoomState(): CounterState {
    return { score: 0, ops: 0, appliedBy: [], finished: false };
  }
  validateCommand(_room: RoomView<CounterState>, _actor: string, cmd: unknown) {
    if (typeof cmd !== 'object' || cmd === null) {
      return { ok: false as const, reason: 'command must be an object' };
    }
    const kind = (cmd as { kind?: unknown }).kind;
    if (typeof kind !== 'string') {
      return { ok: false as const, reason: 'command needs a string kind' };
    }
    switch (kind) {
      case 'add': {
        const n = (cmd as { n?: unknown }).n;
        if (typeof n !== 'number' || !Number.isInteger(n)) return { ok: false as const, reason: 'n must be an integer' };
        if (n < 0) return { ok: false as const, reason: 'n must be >= 0' };
        return { ok: true as const };
      }
      case 'reject':
        return { ok: false as const, reason: 'deliberate rejection' };
      case 'crash':
      case 'finish':
        return { ok: true as const };
      default:
        return { ok: false as const, reason: `unknown kind ${kind}` };
    }
  }
  applyCommand(room: RoomDraft<CounterState>, actor: string, cmd: unknown): unknown[] {
    this.applyCalls++;
    const c = cmd as CounterCmd;
    if (c.kind === 'crash') throw new Error('intentional apply failure');
    if (c.kind === 'finish') {
      room.state.finished = true;
      return [{ type: 'finished', by: actor }];
    }
    const add = c as { kind: 'add'; n: number };
    room.state.score += add.n;
    room.state.ops += 1;
    room.state.appliedBy.push(actor);
    return [{ type: 'added', by: actor, n: add.n, score: room.state.score }];
  }
  snapshot(room: RoomView<CounterState>): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(room.state));
  }
  restore(draft: { state: CounterState }, bytes: Uint8Array): void {
    draft.state = JSON.parse(new TextDecoder().decode(bytes)) as CounterState;
  }
  hashState(room: RoomView<CounterState>): string {
    return hashCanonicalState(room.state);
  }
  isFinished(room: RoomView<CounterState>): boolean {
    return room.state.finished;
  }
}

/* ---------------- test ws client ---------------- */

type MsgOf<T extends ServerMessage['type']> = Extract<ServerMessage, { type: T }>;
type ErrorMsg = Extract<ServerMessage, { type: 'error' }>;

export class TestClient {
  ws!: WebSocket;
  port: number;
  msgs: ServerMessage[] = [];
  sessionId = '';
  actorId = '';
  seat = 0;
  resumeToken = '';
  roomId = '';
  roomCode = '';
  /** Last revision/hash this client has observed (patch or full_state). */
  knownRev = 0;
  knownHash = '';
  closeCode: number | null = null;
  closeReason = '';
  private waiters: Array<{
    pred: (m: ServerMessage) => boolean;
    resolve: (m: ServerMessage) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = [];

  constructor(port: number) {
    this.port = port;
  }

  static async connect(
    port: number,
    opts: { protocolVersion?: number; noHello?: boolean } = {},
  ): Promise<TestClient> {
    const c = new TestClient(port);
    await c.open(opts);
    return c;
  }

  async open(opts: { protocolVersion?: number; noHello?: boolean } = {}): Promise<void> {
    this.ws = new WebSocket(`ws://127.0.0.1:${this.port}/`);
    this.ws.on('message', (data: Buffer) => {
      const msg = JSON.parse(data.toString('utf8')) as ServerMessage;
      this.observe(msg);
      this.msgs.push(msg);
      this.dispatch(msg);
    });
    this.ws.on('close', (code: number, reason: Buffer) => {
      this.closeCode = code;
      this.closeReason = reason.toString('utf8');
    });
    await new Promise<void>((resolve, reject) => {
      this.ws.once('open', () => resolve());
      this.ws.once('error', (e) => reject(e));
    });
    if (!opts.noHello) {
      this.send({ type: 'hello', protocolVersion: opts.protocolVersion ?? PROTOCOL_VERSION, clientVersion: 'test/1' });
      const hello = await this.waitFor('hello');
      this.sessionId = hello.sessionId;
    }
  }

  private observe(msg: ServerMessage): void {
    if (msg.type === 'state_patch') {
      this.knownRev = Math.max(this.knownRev, msg.revision);
      this.knownHash = msg.stateHash;
    } else if (msg.type === 'full_state') {
      this.knownRev = msg.revision;
      this.knownHash = msg.stateHash;
      this.roomId = msg.room.roomId;
      this.roomCode = msg.room.roomCode;
      this.actorId = msg.actorId;
      this.seat = msg.seat;
      this.resumeToken = msg.resumeToken;
    }
  }

  private dispatch(msg: ServerMessage): void {
    for (let i = this.waiters.length - 1; i >= 0; i--) {
      const w = this.waiters[i]!;
      if (w.pred(msg)) {
        this.waiters.splice(i, 1);
        clearTimeout(w.timer);
        w.resolve(msg);
      }
    }
  }

  private describeMsgs(): string {
    return this.msgs.map((m) => m.type).join(',');
  }

  /** Wait for any message satisfying `pred` — backlog scanned first. */
  waitMatching(pred: (m: ServerMessage) => boolean, timeoutMs = 5_000, fromIdx = 0): Promise<ServerMessage> {
    for (let i = fromIdx; i < this.msgs.length; i++) {
      const m = this.msgs[i]!;
      if (pred(m)) return Promise.resolve(m);
    }
    return new Promise<ServerMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.waiters.findIndex((w) => w.timer === timer);
        if (idx >= 0) this.waiters.splice(idx, 1);
        reject(new Error(`timeout waiting for message (got: ${this.describeMsgs()})`));
      }, timeoutMs);
      this.waiters.push({ pred, resolve, timer });
    });
  }

  /** Wait for a message of `type` matching `pred` (backlog included). */
  waitFor<T extends ServerMessage['type']>(
    type: T,
    pred?: (m: MsgOf<T>) => boolean,
    timeoutMs = 5_000,
  ): Promise<MsgOf<T>> {
    return this.waitMatching(
      (m) => m.type === type && (pred === undefined || pred(m as MsgOf<T>)),
      timeoutMs,
    ) as Promise<MsgOf<T>>;
  }

  /** Wait for the next matching message strictly after now. */
  waitNext<T extends ServerMessage['type']>(
    type: T,
    pred?: (m: MsgOf<T>) => boolean,
    timeoutMs = 5_000,
  ): Promise<MsgOf<T>> {
    return this.waitMatching(
      (m) => m.type === type && (pred === undefined || pred(m as MsgOf<T>)),
      timeoutMs,
      this.msgs.length,
    ) as Promise<MsgOf<T>>;
  }

  /** Outcome of a sent command: its state_patch (ack) or its error. */
  waitCommand(commandId: string, timeoutMs = 5_000): Promise<StatePatch | ErrorMsg> {
    return this.waitMatching(
      (m) =>
        (m.type === 'state_patch' && m.commandId === commandId) ||
        (m.type === 'error' && m.commandId === commandId),
      timeoutMs,
    ) as Promise<StatePatch | ErrorMsg>;
  }

  send(obj: Record<string, unknown>): void {
    this.ws.send(JSON.stringify(obj));
  }
  sendRaw(text: string): void {
    this.ws.send(text);
  }

  async create(opts: { displayName?: string; gameType?: string; ephemeral?: boolean } = {}): Promise<FullState> {
    this.send({ type: 'create', gameType: opts.gameType ?? 'counter', displayName: opts.displayName, ephemeral: opts.ephemeral });
    return this.waitNext('full_state');
  }

  async join(room: string, opts: { displayName?: string; actorId?: string; resumeToken?: string } = {}): Promise<FullState> {
    const msg: Record<string, unknown> = { type: 'join', room };
    if (opts.displayName !== undefined) msg.displayName = opts.displayName;
    if (opts.actorId !== undefined) msg.actorId = opts.actorId;
    if (opts.resumeToken !== undefined) msg.resumeToken = opts.resumeToken;
    this.send(msg);
    return this.waitNext('full_state');
  }

  /**
   * Send a command and resolve with ITS outcome — the state_patch ack or the
   * error carrying this commandId. The wait window opens at send time, so a
   * duplicate replay resolves with the dup patch, not the original ack.
   */
  command(commandId: string, baseRevision: number, payload: unknown): Promise<StatePatch | ErrorMsg> {
    const from = this.msgs.length;
    this.send({ type: 'command', commandId, baseRevision, payload });
    return this.waitMatching(
      (m) =>
        (m.type === 'state_patch' && m.commandId === commandId) ||
        (m.type === 'error' && m.commandId === commandId),
      5_000,
      from,
    ) as Promise<StatePatch | ErrorMsg>;
  }
  newCommandId(): string {
    return `c_${randomUUID().slice(0, 8)}`;
  }

  /** Simulate a network drop (no polite close). */
  drop(): void {
    this.ws.terminate();
  }
  async close(): Promise<void> {
    if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.close();
      await new Promise<void>((r) => this.ws.once('close', () => r()));
    }
  }

  patches(): StatePatch[] {
    return this.msgs.filter((m): m is StatePatch => m.type === 'state_patch');
  }
  errors(): ErrorMsg[] {
    return this.msgs.filter((m): m is ErrorMsg => m.type === 'error');
  }
}

/** Sleep for real milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Minimal HTTP GET helper for the ops endpoints. */
export async function httpGet(port: number, path: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  return { status: res.status, body: await res.json() };
}
