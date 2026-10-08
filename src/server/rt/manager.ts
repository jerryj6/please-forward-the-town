import { randomBytes, randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { addPlayer, createWorld, removePlayer, snapshot, step } from "../../rt/sim.js";
import { getLevel } from "../../rt/levels/index.js";
import type { Input, SimEvent, World } from "../../rt/types.js";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const SEAT_COLORS = ["red", "blue", "gold", "green"] as const;
const RESUME_WINDOW_MS = 30 * 60 * 1000;
const ROOM_IDLE_MS = 24 * 60 * 60 * 1000;

interface Member {
  id: string;
  name: string;
  token: string;
  seat: number;
  color: typeof SEAT_COLORS[number];
  socket: WebSocket | null;
  disconnectedAt: number | null;
  lastSeq: number;
  input: Input;
  actionQueued: boolean;
}

interface Room {
  code: string;
  members: Member[];
  hostId: string;
  levelId: string;
  phase: "lobby" | "playing" | "results";
  world: World | null;
  tick: number;
  lastActivityAt: number;
}

interface Connection {
  socket: WebSocket;
  name: string;
  member: Member | null;
  room: Room | null;
  greeted: boolean;
}

export interface RtRoomServer {
  wss: WebSocketServer;
  close(): Promise<void>;
}

function send(socket: WebSocket, message: unknown): void {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function randomCode(): string {
  const bytes = randomBytes(5);
  return [...bytes].map((byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join("");
}

function nameFrom(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 24) || "Courier" : "Courier";
}

function roomPlayers(room: Room) {
  return room.members.map((member) => ({
    playerId: member.id,
    name: member.name,
    seat: member.seat,
    color: member.color,
    connected: member.socket !== null,
  }));
}

export function startRtRoomServer(httpServer: Server, now: () => number = Date.now): RtRoomServer {
  const rooms = new Map<string, Room>();
  const connections = new Set<Connection>();
  const wss = new WebSocketServer({ server: httpServer, path: "/rt", maxPayload: 16 * 1024 });

  function broadcast(room: Room, message: unknown): void {
    for (const member of room.members) if (member.socket) send(member.socket, message);
  }

  function publishLobby(room: Room): void {
    broadcast(room, {
      type: "lobby",
      players: roomPlayers(room),
      hostId: room.hostId,
      levelId: room.levelId,
      phase: room.phase,
    });
  }

  function sendWelcome(room: Room, member: Member): void {
    if (!member.socket) return;
    send(member.socket, {
      type: "welcome",
      playerId: member.id,
      resumeToken: member.token,
      code: room.code,
      seat: member.seat,
      color: member.color,
      lastSeq: member.lastSeq,
    });
    publishLobby(room);
  }

  function setHostIfNeeded(room: Room, member: Member): void {
    if (room.hostId !== member.id) return;
    const next = room.members
      .filter((candidate) => candidate.id !== member.id && candidate.socket !== null)
      .sort((a, b) => a.seat - b.seat)[0];
    if (next) room.hostId = next.id;
  }

  function disconnect(connection: Connection): void {
    const room = connection.room;
    const member = connection.member;
    connection.room = null;
    connection.member = null;
    if (!room || !member || member.socket !== connection.socket) return;
    member.socket = null;
    member.disconnectedAt = now();
    member.input = { dx: 0, dy: 0, action: false };
    member.actionQueued = false;
    room.lastActivityAt = now();
    if (room.world) removePlayer(room.world, member.id);
    setHostIfNeeded(room, member);
    publishLobby(room);
  }

  function fail(connection: Connection, reason: string): void {
    send(connection.socket, { type: "error", reason });
  }

  function roomFor(connection: Connection): Room | null {
    if (!connection.room || !connection.member) {
      fail(connection, "not_in_room");
      return null;
    }
    return connection.room;
  }

  function createRoom(connection: Connection): void {
    if (connection.room) {
      fail(connection, "already_in_room");
      return;
    }
    let code = randomCode();
    while (rooms.has(code)) code = randomCode();
    const member: Member = {
      id: randomUUID(),
      name: connection.name,
      token: randomBytes(24).toString("hex"),
      seat: 0,
      color: SEAT_COLORS[0],
      socket: connection.socket,
      disconnectedAt: null,
      lastSeq: -1,
      input: { dx: 0, dy: 0, action: false },
      actionQueued: false,
    };
    const room: Room = {
      code,
      members: [member],
      hostId: member.id,
      levelId: "L1",
      phase: "lobby",
      world: null,
      tick: 0,
      lastActivityAt: now(),
    };
    rooms.set(code, room);
    connection.room = room;
    connection.member = member;
    sendWelcome(room, member);
  }

  function joinRoom(connection: Connection, codeValue: unknown, resumeValue: unknown): void {
    if (connection.room) {
      fail(connection, "already_in_room");
      return;
    }
    const code = typeof codeValue === "string" ? codeValue.toUpperCase() : "";
    const room = rooms.get(code);
    if (!room) {
      fail(connection, "room_not_found");
      return;
    }
    const token = typeof resumeValue === "string" ? resumeValue : "";
    const resumed = token ? room.members.find((candidate) =>
      candidate.token === token &&
      candidate.socket === null &&
      candidate.disconnectedAt !== null &&
      now() - candidate.disconnectedAt <= RESUME_WINDOW_MS,
    ) : undefined;

    let member = resumed;
    if (!member) {
      if (room.members.length >= 4) {
        fail(connection, "room_full");
        return;
      }
      const usedSeats = new Set(room.members.map((candidate) => candidate.seat));
      const seat = [0, 1, 2, 3].find((candidate) => !usedSeats.has(candidate));
      if (seat === undefined) {
        fail(connection, "room_full");
        return;
      }
      member = {
        id: randomUUID(),
        name: connection.name,
        token: randomBytes(24).toString("hex"),
        seat,
        color: SEAT_COLORS[seat]!,
        socket: connection.socket,
        disconnectedAt: null,
        lastSeq: -1,
        input: { dx: 0, dy: 0, action: false },
        actionQueued: false,
      };
      room.members.push(member);
      if (room.phase === "playing" && room.world) addPlayer(room.world, member.id);
    } else {
      member.socket = connection.socket;
      member.disconnectedAt = null;
      member.input = { dx: 0, dy: 0, action: false };
      member.actionQueued = false;
      if (room.world) addPlayer(room.world, member.id);
    }
    member.name = connection.name || member.name;
    if (!room.members.some((candidate) => candidate.id === room.hostId && candidate.socket)) {
      room.hostId = member.id;
    }
    connection.room = room;
    connection.member = member;
    room.lastActivityAt = now();
    sendWelcome(room, member);
  }

  function startRoom(room: Room, member: Member): void {
    if (member.id !== room.hostId) {
      if (member.socket) send(member.socket, { type: "error", reason: "not_host" });
      return;
    }
    if (room.phase !== "lobby" && room.phase !== "results") {
      if (member.socket) send(member.socket, { type: "error", reason: "bad_phase" });
      return;
    }
    const level = getLevel(room.levelId);
    if (!level) {
      if (member.socket) send(member.socket, { type: "error", reason: "unknown_level" });
      return;
    }
    room.world = createWorld(level, room.members.filter((candidate) => candidate.socket).map((candidate) => candidate.id));
    room.tick = 0;
    room.phase = "playing";
    room.lastActivityAt = now();
    publishLobby(room);
  }

  function onMessage(connection: Connection, raw: Buffer): void {
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(raw.toString()) as Record<string, unknown>;
    } catch {
      fail(connection, "invalid_json");
      return;
    }
    if (!connection.greeted) {
      if (message.type !== "hello" || message.v !== 1) {
        fail(connection, "hello_required");
        return;
      }
      connection.name = nameFrom(message.name);
      connection.greeted = true;
      return;
    }
    switch (message.type) {
      case "create":
        createRoom(connection);
        break;
      case "join":
        joinRoom(connection, message.code, message.resumeToken);
        break;
      case "leave": {
        const room = connection.room;
        const member = connection.member;
        if (room && member) {
          disconnect(connection);
          room.members = room.members.filter((candidate) => candidate.id !== member.id);
          if (room.hostId === member.id) setHostIfNeeded(room, member);
          publishLobby(room);
          if (room.members.length === 0) room.lastActivityAt = now();
        }
        break;
      }
      case "select": {
        const room = roomFor(connection);
        const member = connection.member;
        if (!room || !member) break;
        if (member.id !== room.hostId) {
          fail(connection, "not_host");
          break;
        }
        if (room.phase !== "lobby" && room.phase !== "results") {
          fail(connection, "bad_phase");
          break;
        }
        if (!getLevel(message.levelId as string)) {
          fail(connection, "unknown_level");
          break;
        }
        room.levelId = message.levelId as string;
        room.lastActivityAt = now();
        publishLobby(room);
        break;
      }
      case "start": {
        const room = roomFor(connection);
        const member = connection.member;
        if (room && member) startRoom(room, member);
        break;
      }
      case "input": {
        const room = roomFor(connection);
        const member = connection.member;
        if (!room || !member || room.phase !== "playing" || !room.world) break;
        if (
          !Number.isSafeInteger(message.seq) ||
          (message.seq as number) <= member.lastSeq ||
          !Number.isInteger(message.dx) ||
          !Number.isInteger(message.dy) ||
          Math.abs(message.dx as number) > 100 ||
          Math.abs(message.dy as number) > 100 ||
          typeof message.action !== "boolean"
        ) {
          fail(connection, "invalid_input");
          break;
        }
        member.lastSeq = message.seq as number;
        member.input = { dx: message.dx as number, dy: message.dy as number, action: false };
        member.actionQueued ||= message.action;
        room.lastActivityAt = now();
        break;
      }
      default:
        fail(connection, "unknown_message");
    }
  }

  wss.on("connection", (socket) => {
    const connection: Connection = { socket, name: "Courier", member: null, room: null, greeted: false };
    connections.add(connection);
    socket.on("message", (data, isBinary) => {
      if (isBinary) {
        fail(connection, "text_messages_only");
        return;
      }
      onMessage(connection, data as Buffer);
    });
    socket.on("close", () => {
      disconnect(connection);
      connections.delete(connection);
    });
    socket.on("error", () => {
      disconnect(connection);
      connections.delete(connection);
    });
  });

  const interval = setInterval(() => {
    const at = now();
    for (const [code, room] of rooms) {
      room.members = room.members.filter((member) => {
        if (member.socket) return true;
        return member.disconnectedAt === null || at - member.disconnectedAt <= RESUME_WINDOW_MS;
      });
      if (!room.members.some((member) => member.id === room.hostId)) {
        const next = [...room.members].sort((a, b) => a.seat - b.seat)[0];
        if (next) room.hostId = next.id;
      }
      if (at - room.lastActivityAt >= ROOM_IDLE_MS) {
        rooms.delete(code);
        continue;
      }
      if (room.phase !== "playing" || !room.world) {
        continue;
      }
      const inputs = new Map<string, Input>();
      for (const member of room.members) {
        if (!member.socket) continue;
        inputs.set(member.id, { ...member.input, action: member.actionQueued });
        member.actionQueued = false;
      }
      const events: SimEvent[] = step(room.world, inputs);
      room.tick = room.world.tick;
      if (events.length > 0) broadcast(room, { type: "events", tick: room.tick, list: events });
      if (room.tick % 2 === 0) broadcast(room, { type: "snap", tick: room.tick, world: snapshot(room.world) });
      if (room.world.phase !== "playing") {
        room.phase = "results";
        publishLobby(room);
      }
    }
  }, 50);
  interval.unref();

  return {
    wss,
    close: async () => {
      clearInterval(interval);
      for (const connection of connections) connection.socket.close();
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    },
  };
}
