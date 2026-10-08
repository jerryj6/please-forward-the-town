/**
 * rooms.ts — RoomManager: the authoritative core of the room server.
 *
 * Owns, per room:
 *  - one authoritative game state (opaque; mutated only via the adapter),
 *  - a monotonically increasing revision (1,2,3… one per accepted command),
 *  - a command log (bounded — trimmed at each snapshot) used to rebuild
 *    joiners from snapshot + history,
 *  - a command-id index enforcing idempotent commands,
 *  - a roster of seats 1..maxSeats with reconnect/resume plumbing.
 *
 * All members are equal: there is no host seat, no creator privilege, and no
 * privileged browser. The room survives its creator leaving.
 *
 * Time is injectable (`opts.now`) so the 30-minute reconnect window and
 * 24-hour idle expiry are testable with a simulated clock; `sweep()` is
 * invoked by a real interval in production and can be called directly in
 * tests after advancing the injected clock.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import type {
  ErrorCode,
  FullState,
  HistoryEntry,
  JoinServer,
  LeaveReason,
  LeaveServer,
  MemberInfo,
  RoomMeta,
  ServerMessage,
  StatePatch,
} from './protocol.js';
import { ErrorCodes, b64encode, hashCanonicalState } from './protocol.js';
import type { GameAdapter, MemberView, RoomDraft, RoomView } from './adapter.js';
import type { RoomStore, StoredRoom } from './store.js';

export interface Logger {
  (level: 'debug' | 'info' | 'warn' | 'error', event: string, fields?: Record<string, unknown>): void;
}

const defaultLog: Logger = (level, event, fields) => {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...(fields ?? {}) });
  (level === 'error' || level === 'warn' ? console.error : console.log)(line);
};

/** Transport callbacks supplied by the ws layer. */
export interface RoomTransport {
  send(connId: string, msg: ServerMessage): void;
  /** Close a live connection (e.g. seat takeover). */
  closeConn(connId: string, code: number, reason: string): void;
}

export interface RoomManagerOptions {
  /** Registered game adapters, keyed by adapter.gameType. */
  adapters: GameAdapter[];
  /** gameType used when a `create` message omits it (single-game deployments). */
  defaultGameType?: string;
  transport: RoomTransport;
  maxSeats?: number;              // default 4
  reconnectWindowMs?: number;     // default 30 min
  idleExpiryMs?: number;          // default 24 h
  ephemeralIdleExpiryMs?: number; // default 5 min (disposable/test rooms)
  snapshotEvery?: number;         // default 50 accepted commands
  sweepIntervalMs?: number;       // default 5 s; 0 disables the timer
  now?: () => number;             // injectable clock
  store?: RoomStore;
  log?: Logger;
}

export interface RoomMember {
  actorId: string;
  seat: number;
  displayName: string;
  connId: string | null;
  connected: boolean;
  disconnectedAt: number | null;
  resumeToken: string;
  joinedAt: number;
}

export interface LogEntry {
  revision: number;
  commandId: string;
  actorId: string;
  baseRevision: number;
  payload: unknown;
  events: unknown[];
  stateHash: string;
  at: number;
}

export class Room<S = unknown> {
  readonly id: string;
  readonly code: string;
  readonly gameType: string;
  readonly rulesVersion: string;
  readonly contentHash: string;
  readonly createdAt: number;
  readonly maxSeats: number;
  readonly ephemeral: boolean;
  readonly seed?: string;

  revision = 0;
  state: S;
  finished = false;
  lastActivityAt: number;
  /** When the room last had zero connected members (null = someone is in). */
  lastEmptyAt: number | null;

  members = new Map<string, RoomMember>();
  seats: (string | null)[]; // index = seat-1 → actorId
  log: LogEntry[] = [];
  /** commandId → committed entry; the idempotency index. Survives log trims. */
  seen = new Map<string, LogEntry>();
  /** Latest adapter snapshot: {revision, bytes, stateHash}. */
  snap: { revision: number; bytes: Uint8Array; stateHash: string };
  nextActorSeq = 1;

  constructor(init: {
    id: string;
    code: string;
    gameType: string;
    rulesVersion: string;
    contentHash: string;
    maxSeats: number;
    ephemeral: boolean;
    state: S;
    snapBytes: Uint8Array;
    snapHash: string;
    now: number;
    seed?: string;
  }) {
    this.id = init.id;
    this.code = init.code;
    this.gameType = init.gameType;
    this.rulesVersion = init.rulesVersion;
    this.contentHash = init.contentHash;
    this.maxSeats = init.maxSeats;
    this.ephemeral = init.ephemeral;
    this.state = init.state;
    this.createdAt = init.now;
    this.lastActivityAt = init.now;
    this.lastEmptyAt = init.now;
    this.seats = new Array<string | null>(init.maxSeats).fill(null);
    this.snap = { revision: 0, bytes: init.snapBytes, stateHash: init.snapHash };
    if (init.seed !== undefined) this.seed = init.seed;
  }

  seatOf(actorId: string): number | null {
    const m = this.members.get(actorId);
    return m ? m.seat : null;
  }
  freeSeatIndex(): number {
    return this.seats.indexOf(null);
  }
  connectedCount(): number {
    let n = 0;
    for (const m of this.members.values()) if (m.connected) n++;
    return n;
  }
}

export type ManagerResult<T> = { ok: true } & T | { ok: false; code: ErrorCode; message: string };

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // unambiguous: no 0/O/1/I/L
const CODE_LEN = 6;

export class RoomManager {
  private adapters = new Map<string, GameAdapter>();
  private rooms = new Map<string, Room>();
  private codes = new Map<string, string>(); // UPPER(code) → roomId
  /** connId → {roomId, actorId} for seated connections. */
  private connIndex = new Map<string, { roomId: string; actorId: string }>();
  private transport: RoomTransport;
  private store: RoomStore | undefined;
  private log: Logger;
  private nowFn: () => number;
  private sweeper: ReturnType<typeof setInterval> | null = null;

  readonly maxSeats: number;
  readonly reconnectWindowMs: number;
  readonly idleExpiryMs: number;
  readonly ephemeralIdleExpiryMs: number;
  readonly snapshotEvery: number;
  private defaultGameType?: string;

  constructor(opts: RoomManagerOptions) {
    for (const a of opts.adapters) this.adapters.set(a.gameType, a);
    if (this.adapters.size === 0) throw new Error('RoomManager requires at least one GameAdapter');
    this.transport = opts.transport;
    this.store = opts.store;
    this.log = opts.log ?? defaultLog;
    this.nowFn = opts.now ?? Date.now;
    this.maxSeats = opts.maxSeats ?? 4;
    this.reconnectWindowMs = opts.reconnectWindowMs ?? 30 * 60_000;
    this.idleExpiryMs = opts.idleExpiryMs ?? 24 * 3_600_000;
    this.ephemeralIdleExpiryMs = opts.ephemeralIdleExpiryMs ?? 5 * 60_000;
    this.snapshotEvery = Math.max(1, opts.snapshotEvery ?? 50);
    if (opts.defaultGameType !== undefined) this.defaultGameType = opts.defaultGameType;
    const interval = opts.sweepIntervalMs ?? 5_000;
    if (interval > 0) {
      this.sweeper = setInterval(() => this.sweep(), interval);
      this.sweeper.unref?.();
    }
  }

  private now(): number {
    return this.nowFn();
  }

  /** Restore all persisted rooms (call once at boot when a store is wired). */
  recoverFromStore(): number {
    if (!this.store) return 0;
    let n = 0;
    for (const rec of this.store.listRooms()) {
      try {
        this.recoverRoom(rec);
        n++;
      } catch (err) {
        this.log('error', 'room_recover_failed', { roomId: rec.meta.roomId, err: String(err) });
      }
    }
    if (n > 0) this.log('info', 'rooms_recovered', { count: n });
    return n;
  }

  private adapterFor(gameType: string): GameAdapter | undefined {
    return this.adapters.get(gameType);
  }

  /** Narrowed adapter-facing view of a room. */
  private view<S>(room: Room<S>): RoomView<S> {
    const members = new Map<string, MemberView>();
    for (const m of room.members.values()) {
      members.set(m.actorId, { actorId: m.actorId, seat: m.seat, displayName: m.displayName, connected: m.connected });
    }
    return {
      id: room.id,
      code: room.code,
      revision: room.revision,
      state: room.state,
      members,
      maxSeats: room.maxSeats,
      seatOf: (actorId) => room.seatOf(actorId),
    };
  }

  private draft<S>(room: Room<S>, clonedState: S): RoomDraft<S> {
    const v = this.view(room);
    return { ...v, state: clonedState };
  }

  private stateHash<S>(room: Room<S>): string {
    const adapter = this.adapterFor(room.gameType);
    const view = this.view(room);
    return adapter?.hashState ? adapter.hashState(view) : hashCanonicalState(room.state);
  }

  private cloneState<S>(state: S): S {
    // Room state is required to be JSON-serializable; structuredClone is the
    // cheapest correct deep copy and also covers Uint8Array/Map/Set/Date.
    return structuredClone(state);
  }

  private genCode(): string {
    for (let i = 0; i < 100; i++) {
      const raw = randomBytes(CODE_LEN);
      let code = '';
      for (let j = 0; j < CODE_LEN; j++) code += CODE_ALPHABET[raw[j]! % CODE_ALPHABET.length];
      if (!this.codes.has(code)) return code;
    }
    throw new Error('could not allocate room code');
  }

  private roomMeta(room: Room): RoomMeta {
    const idleFor = room.ephemeral ? this.ephemeralIdleExpiryMs : this.idleExpiryMs;
    return {
      roomId: room.id,
      roomCode: room.code,
      gameType: room.gameType,
      rulesVersion: room.rulesVersion,
      contentHash: room.contentHash,
      createdAt: room.createdAt,
      maxSeats: room.maxSeats,
      ephemeral: room.ephemeral,
      idleDeadline: (room.lastEmptyAt ?? room.createdAt) + idleFor,
      reconnectWindowMs: this.reconnectWindowMs,
    };
  }

  private roster(room: Room): MemberInfo[] {
    return [...room.members.values()]
      .sort((a, b) => a.seat - b.seat)
      .map((m) => ({ actorId: m.actorId, seat: m.seat, displayName: m.displayName, connected: m.connected }));
  }

  private toHistoryEntry(e: LogEntry): HistoryEntry {
    return {
      revision: e.revision,
      commandId: e.commandId,
      actorId: e.actorId,
      baseRevision: e.baseRevision,
      payload: e.payload,
      events: e.events,
      stateHash: e.stateHash,
    };
  }

  private fullState(room: Room, member: RoomMember, reconnected: boolean): FullState {
    return {
      type: 'full_state',
      room: this.roomMeta(room),
      actorId: member.actorId,
      seat: member.seat,
      resumeToken: member.resumeToken,
      reconnected,
      revision: room.revision,
      stateHash: this.stateHash(room),
      snapshot: { revision: room.snap.revision, data: b64encode(room.snap.bytes) },
      history: room.log.filter((e) => e.revision > room.snap.revision).map((e) => this.toHistoryEntry(e)),
      members: this.roster(room),
    };
  }

  private broadcast(room: Room, msg: ServerMessage, exceptConnId?: string): void {
    for (const m of room.members.values()) {
      if (m.connected && m.connId !== null && m.connId !== exceptConnId) {
        this.transport.send(m.connId, msg);
      }
    }
  }

  private markEmptyIfUnoccupied(room: Room): void {
    if (room.connectedCount() === 0) room.lastEmptyAt = this.now();
  }

  /* ---------------------------------------------------------------- */
  /* Room lifecycle                                                     */
  /* ---------------------------------------------------------------- */

  createRoom(connId: string, opts: {
    gameType?: string;
    rulesVersion?: string;
    contentHash?: string;
    displayName?: string;
    roomCode?: string;
    ephemeral?: boolean;
    seed?: string;
  }): ManagerResult<{ room: Room; member: RoomMember; msg: FullState }> {
    const gameType = opts.gameType ?? this.defaultGameType ?? (this.adapters.size === 1 ? [...this.adapters.keys()][0]! : undefined);
    if (!gameType) {
      return { ok: false, code: ErrorCodes.UNKNOWN_GAME, message: 'create.gameType is required on a multi-game server' };
    }
    const adapter = this.adapterFor(gameType);
    if (!adapter) {
      return { ok: false, code: ErrorCodes.UNKNOWN_GAME, message: `no adapter registered for gameType '${gameType}'` };
    }
    // A connection seats in at most one room: creating elsewhere leaves the old seat.
    this.leaveByConn(connId, 'left');

    const now = this.now();
    const roomId = `r_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const code = opts.roomCode ? opts.roomCode.toUpperCase() : this.genCode();
    if (this.codes.has(code)) {
      return { ok: false, code: ErrorCodes.PROTOCOL, message: `roomCode '${code}' is already in use` };
    }

    const initCtx: { roomId: string; roomCode: string; seed?: string } = { roomId, roomCode: code };
    if (opts.seed !== undefined) initCtx.seed = opts.seed;
    const state = adapter.initRoomState(initCtx);
    const room = new Room({
      id: roomId,
      code,
      gameType,
      rulesVersion: opts.rulesVersion ?? adapter.rulesVersion,
      contentHash: opts.contentHash ?? '',
      maxSeats: this.maxSeats,
      ephemeral: opts.ephemeral ?? false,
      state,
      snapBytes: new Uint8Array(),
      snapHash: '',
      now,
      ...(opts.seed !== undefined ? { seed: opts.seed } : {}),
    });
    // Seed snapshot at revision 0 so every joiner gets snapshot+history.
    room.snap = { revision: 0, bytes: adapter.snapshot(this.view(room)), stateHash: this.stateHash(room) };

    this.rooms.set(roomId, room);
    this.codes.set(code, roomId);
    this.store?.createRoom(this.persistMeta(room), { revision: room.snap.revision, bytes: room.snap.bytes, stateHash: room.snap.stateHash });
    this.log('info', 'room_created', { roomId, code, gameType, ephemeral: room.ephemeral });

    const res = this.seatNewMember(room, connId, opts.displayName);
    if (!res.ok) {
      this.rooms.delete(roomId);
      this.codes.delete(code);
      this.store?.deleteRoom(roomId);
      return res;
    }
    const member = res.member;
    room.lastEmptyAt = null;
    return { ok: true, room, member, msg: this.fullState(room, member, false) };
  }

  private seatNewMember(room: Room, connId: string, displayName?: string): ManagerResult<{ member: RoomMember }> {
    const seatIdx = room.freeSeatIndex();
    if (seatIdx < 0) {
      return { ok: false, code: ErrorCodes.ROOM_FULL, message: `room ${room.code} is full (${room.maxSeats} seats)` };
    }
    const actorId = `p${room.nextActorSeq++}`;
    const seat = seatIdx + 1;
    const member: RoomMember = {
      actorId,
      seat,
      displayName: displayName ?? actorId,
      connId,
      connected: true,
      disconnectedAt: null,
      resumeToken: randomBytes(24).toString('base64url'),
      joinedAt: this.now(),
    };
    room.members.set(actorId, member);
    room.seats[seatIdx] = actorId;
    this.connIndex.set(connId, { roomId: room.id, actorId });
    this.persistMetaNow(room);
    return { ok: true, member };
  }

  joinRoom(connId: string, opts: {
    room: string;
    displayName?: string;
    actorId?: string;
    resumeToken?: string;
  }): ManagerResult<{ room: Room; member: RoomMember; msg: FullState }> {
    const room = this.findRoom(opts.room);
    if (!room) {
      return { ok: false, code: ErrorCodes.ROOM_NOT_FOUND, message: `no room '${opts.room}'` };
    }
    const adapter = this.adapterFor(room.gameType);

    /* ----- reconnect / seat-resume path ----- */
    if (opts.actorId !== undefined || opts.resumeToken !== undefined) {
      const member = opts.actorId !== undefined ? room.members.get(opts.actorId) : undefined;
      if (!member || member.resumeToken !== opts.resumeToken) {
        return { ok: false, code: ErrorCodes.BAD_RESUME, message: 'no held seat for those credentials (expired or wrong token)' };
      }
      if (opts.displayName !== undefined) member.displayName = opts.displayName;
      this.leaveByConn(connId, 'left');
      // Same invite on two devices: the newest valid connection takes the seat;
      // the displaced socket is closed with a clear reason.
      if (member.connected && member.connId !== null && member.connId !== connId) {
        this.transport.closeConn(member.connId, 4000, 'seat taken over by a newer connection');
        this.log('info', 'seat_takeover', { roomId: room.id, actorId: member.actorId });
      }
      const wasConnected = member.connected;
      member.connId = connId;
      member.connected = true;
      member.disconnectedAt = null;
      this.connIndex.set(connId, { roomId: room.id, actorId: member.actorId });
      room.lastEmptyAt = null;
      this.persistMetaNow(room);
      if (!wasConnected) {
        this.broadcast(room, this.joinNotice(room, member, true), connId);
      }
      this.log('info', 'member_reconnected', { roomId: room.id, actorId: member.actorId, seat: member.seat });
      return { ok: true, room, member, msg: this.fullState(room, member, true) };
    }

    /* ----- fresh join path ----- */
    if (room.finished || (adapter?.isFinished?.(this.view(room)) ?? false)) {
      return { ok: false, code: ErrorCodes.ROOM_FINISHED, message: `room ${room.code} has finished` };
    }
    if (room.freeSeatIndex() < 0) {
      return { ok: false, code: ErrorCodes.ROOM_FULL, message: `room ${room.code} is full (${room.maxSeats} seats)` };
    }
    if (adapter?.admitJoiner) {
      let v;
      try {
        v = adapter.admitJoiner(this.view(room));
      } catch (err) {
        this.log('warn', 'admitJoiner_threw', { roomId: room.id, err: String(err) });
        return { ok: false, code: ErrorCodes.JOIN_REFUSED, message: 'adapter rejected the join (adapter error)' };
      }
      if (!v.ok) {
        return { ok: false, code: ErrorCodes.JOIN_REFUSED, message: v.reason ?? 'adapter refused the join' };
      }
    }
    this.leaveByConn(connId, 'left');
    const res = this.seatNewMember(room, connId, opts.displayName);
    if (!res.ok) return res;
    room.lastEmptyAt = null;
    this.broadcast(room, this.joinNotice(room, res.member, false), connId);
    this.log('info', 'member_joined', { roomId: room.id, actorId: res.member.actorId, seat: res.member.seat });
    return { ok: true, room, member: res.member, msg: this.fullState(room, res.member, false) };
  }

  private joinNotice(room: Room, member: RoomMember, reconnected: boolean): JoinServer {
    return {
      type: 'join',
      roomId: room.id,
      actorId: member.actorId,
      seat: member.seat,
      displayName: member.displayName,
      reconnected,
    };
  }

  private leaveNotice(room: Room, member: RoomMember, reason: LeaveReason): LeaveServer {
    const msg: LeaveServer = {
      type: 'leave',
      roomId: room.id,
      actorId: member.actorId,
      seat: member.seat,
      reason,
    };
    if (reason === 'disconnected') {
      msg.reconnectDeadline = this.now() + this.reconnectWindowMs;
    }
    return msg;
  }

  /** Explicit leave: the seat is released immediately and cannot be resumed. */
  leaveByConn(connId: string, reason: LeaveReason = 'left'): void {
    const ref = this.connIndex.get(connId);
    if (!ref) return;
    const room = this.rooms.get(ref.roomId);
    this.connIndex.delete(connId);
    if (!room) return;
    const member = room.members.get(ref.actorId);
    if (!member) return;
    this.releaseSeat(room, member, reason);
  }

  private releaseSeat(room: Room, member: RoomMember, reason: LeaveReason): void {
    room.members.delete(member.actorId);
    const idx = room.seats.indexOf(member.actorId);
    if (idx >= 0) room.seats[idx] = null;
    if (member.connId !== null) this.connIndex.delete(member.connId);
    this.broadcast(room, this.leaveNotice(room, member, reason));
    this.markEmptyIfUnoccupied(room);
    this.persistMetaNow(room);
    this.log('info', 'member_left', { roomId: room.id, actorId: member.actorId, reason });
  }

  /** Socket dropped without a `leave`: hold the seat for the reconnect window. */
  onSocketClosed(connId: string): void {
    const ref = this.connIndex.get(connId);
    if (!ref) return;
    const room = this.rooms.get(ref.roomId);
    if (!room) {
      this.connIndex.delete(connId);
      return;
    }
    const member = room.members.get(ref.actorId);
    if (!member || member.connId !== connId) return; // stale close after takeover
    member.connected = false;
    member.connId = null;
    member.disconnectedAt = this.now();
    this.connIndex.delete(connId);
    this.broadcast(room, this.leaveNotice(room, member, 'disconnected'));
    this.markEmptyIfUnoccupied(room);
    this.log('info', 'member_disconnected', {
      roomId: room.id,
      actorId: member.actorId,
      seat: member.seat,
      reconnectInMs: this.reconnectWindowMs,
    });
  }

  /* ---------------------------------------------------------------- */
  /* Commands — the authoritative ordering point                        */
  /* ---------------------------------------------------------------- */

  submitCommand(connId: string, cmd: { commandId: string; baseRevision: number; payload: unknown }):
    ManagerResult<{ room: Room; entry: LogEntry; duplicate: boolean }> {
    const ref = this.connIndex.get(connId);
    if (!ref) {
      return { ok: false, code: ErrorCodes.NOT_IN_ROOM, message: 'connection is not seated in a room' };
    }
    const room = this.rooms.get(ref.roomId);
    if (!room) {
      return { ok: false, code: ErrorCodes.ROOM_NOT_FOUND, message: 'room no longer exists' };
    }
    const member = room.members.get(ref.actorId);
    if (!member || !member.connected) {
      return { ok: false, code: ErrorCodes.NOT_IN_ROOM, message: 'member is not connected to the room' };
    }
    const adapter = this.adapterFor(room.gameType);
    if (!adapter) {
      return { ok: false, code: ErrorCodes.INTERNAL, message: 'room has no registered adapter' };
    }

    // Idempotency first: a retry of an already-accepted command gets its
    // recorded patch back, even if baseRevision is now stale.
    const dup = room.seen.get(cmd.commandId);
    if (dup) {
      this.transport.send(connId, { ...this.toPatch(room, dup), dup: true });
      return { ok: true, room, entry: dup, duplicate: true };
    }

    if (cmd.baseRevision !== room.revision) {
      return {
        ok: false,
        code: ErrorCodes.STALE_REVISION,
        message: `command baseRevision ${cmd.baseRevision} != room revision ${room.revision}; resync from latest state`,
      };
    }

    let v;
    try {
      v = adapter.validateCommand(this.view(room), member.actorId, cmd.payload);
    } catch (err) {
      this.log('warn', 'validate_threw', { roomId: room.id, commandId: cmd.commandId, err: String(err) });
      return { ok: false, code: ErrorCodes.VALIDATION, message: 'command validator threw' };
    }
    if (!v.ok) {
      return { ok: false, code: ErrorCodes.VALIDATION, message: v.reason ?? 'command rejected by game rules' };
    }

    // Atomic apply: run the adapter against a scratch copy; commit on success.
    // A throw or error leaves room.state untouched — rejection is never partial.
    const draftState = this.cloneState(room.state);
    let events: unknown[];
    try {
      events = adapter.applyCommand(this.draft(room, draftState), member.actorId, cmd.payload) ?? [];
    } catch (err) {
      this.log('warn', 'apply_threw', { roomId: room.id, commandId: cmd.commandId, err: String(err) });
      return { ok: false, code: ErrorCodes.APPLY, message: `applyCommand threw: ${String(err)}` };
    }

    room.state = draftState;
    room.revision += 1;
    const entry: LogEntry = {
      revision: room.revision,
      commandId: cmd.commandId,
      actorId: member.actorId,
      baseRevision: cmd.baseRevision,
      payload: cmd.payload,
      events,
      stateHash: '',
      at: this.now(),
    };
    entry.stateHash = this.stateHash(room);
    room.log.push(entry);
    room.seen.set(cmd.commandId, entry);
    room.lastActivityAt = this.now();

    const patch = this.toPatch(room, entry);
    this.broadcast(room, patch);
    this.persistCommand(room, entry);

    if (room.revision % this.snapshotEvery === 0) {
      this.takeSnapshot(room);
    }
    return { ok: true, room, entry, duplicate: false };
  }

  private toPatch(room: Room, entry: LogEntry): StatePatch {
    return {
      type: 'state_patch',
      roomId: room.id,
      revision: entry.revision,
      stateHash: entry.stateHash,
      commandId: entry.commandId,
      actorId: entry.actorId,
      baseRevision: entry.baseRevision,
      payload: entry.payload,
      events: entry.events,
    };
  }

  /** Fresh adapter snapshot; the log is then trimmed to entries after it. */
  private takeSnapshot(room: Room): void {
    const adapter = this.adapterFor(room.gameType);
    if (!adapter) return;
    const bytes = adapter.snapshot(this.view(room));
    room.snap = { revision: room.revision, bytes, stateHash: this.stateHash(room) };
    room.log = room.log.filter((e) => e.revision > room.snap.revision);
    this.store?.saveSnapshot(
      this.persistMeta(room),
      { revision: room.snap.revision, bytes: room.snap.bytes, stateHash: room.snap.stateHash },
      room.log.map((e) => this.toHistoryEntry(e)),
    );
    this.log('debug', 'snapshot_taken', { roomId: room.id, revision: room.snap.revision });
  }

  /* ---------------------------------------------------------------- */
  /* Sweeper: reconnect expiry + idle-room expiry                       */
  /* ---------------------------------------------------------------- */

  sweep(): void {
    const now = this.now();
    for (const room of [...this.rooms.values()]) {
      // 1) seats whose 30-minute reconnect window has elapsed are released
      for (const member of [...room.members.values()]) {
        if (!member.connected && member.disconnectedAt !== null && now - member.disconnectedAt >= this.reconnectWindowMs) {
          this.releaseSeat(room, member, 'reconnect_expired');
        }
      }
      // 2) rooms with nobody inside expire after the idle budget
      const idleMs = room.ephemeral ? this.ephemeralIdleExpiryMs : this.idleExpiryMs;
      if (room.connectedCount() === 0 && room.lastEmptyAt !== null && now - room.lastEmptyAt >= idleMs) {
        this.destroyRoom(room, 'idle_expired');
      }
    }
  }

  private destroyRoom(room: Room, reason: string): void {
    this.rooms.delete(room.id);
    this.codes.delete(room.code);
    for (const member of room.members.values()) {
      if (member.connId !== null) {
        this.connIndex.delete(member.connId);
        this.transport.send(member.connId, this.leaveNotice(room, member, 'room_closed'));
        this.transport.closeConn(member.connId, 4001, `room closed: ${reason}`);
      }
    }
    room.members.clear();
    this.store?.deleteRoom(room.id);
    this.log('info', 'room_destroyed', { roomId: room.id, reason });
  }

  closeRoom(roomRef: string, reason = 'closed'): boolean {
    const room = this.findRoom(roomRef);
    if (!room) return false;
    this.destroyRoom(room, reason);
    return true;
  }

  /* ---------------------------------------------------------------- */
  /* Queries                                                            */
  /* ---------------------------------------------------------------- */

  findRoom(ref: string): Room | undefined {
    return this.rooms.get(ref) ?? this.rooms.get(this.codes.get(ref.toUpperCase()) ?? '');
  }

  connRef(connId: string): { roomId: string; actorId: string } | undefined {
    return this.connIndex.get(connId);
  }

  listRooms(): Array<RoomMeta & { connected: number; seated: number; revision: number; stateHash: string }> {
    return [...this.rooms.values()].map((room) => ({
      ...this.roomMeta(room),
      connected: room.connectedCount(),
      seated: room.members.size,
      revision: room.revision,
      stateHash: this.stateHash(room),
    }));
  }

  stats(): { rooms: number; connections: number; seatedMembers: number } {
    let connections = 0;
    let seated = 0;
    for (const room of this.rooms.values()) {
      connections += room.connectedCount();
      seated += room.members.size;
    }
    return { rooms: this.rooms.size, connections, seatedMembers: seated };
  }

  shutdown(): void {
    if (this.sweeper) clearInterval(this.sweeper);
    this.sweeper = null;
  }

  /* ---------------------------------------------------------------- */
  /* Persistence                                                        */
  /* ---------------------------------------------------------------- */

  private persistMeta(room: Room): StoredRoom['meta'] {
    return {
      roomId: room.id,
      roomCode: room.code,
      gameType: room.gameType,
      rulesVersion: room.rulesVersion,
      contentHash: room.contentHash,
      createdAt: room.createdAt,
      maxSeats: room.maxSeats,
      ephemeral: room.ephemeral,
      ...(room.seed !== undefined ? { seed: room.seed } : {}),
      nextActorSeq: room.nextActorSeq,
      members: [...room.members.values()].map((m) => ({
        actorId: m.actorId,
        seat: m.seat,
        displayName: m.displayName,
        resumeToken: m.resumeToken,
        joinedAt: m.joinedAt,
      })),
    };
  }

  private persistMetaNow(room: Room): void {
    this.store?.saveMeta(this.persistMeta(room));
  }

  private persistCommand(room: Room, entry: LogEntry): void {
    this.store?.appendCommand(room.id, this.toHistoryEntry(entry));
  }

  private recoverRoom(rec: StoredRoom): void {
    const adapter = this.adapterFor(rec.meta.gameType);
    if (!adapter) throw new Error(`no adapter for gameType '${rec.meta.gameType}'`);
    const now = this.now();
    const initCtx: { roomId: string; roomCode: string; seed?: string } = { roomId: rec.meta.roomId, roomCode: rec.meta.roomCode };
    if (rec.meta.seed !== undefined) initCtx.seed = rec.meta.seed;
    const room = new Room({
      id: rec.meta.roomId,
      code: rec.meta.roomCode,
      gameType: rec.meta.gameType,
      rulesVersion: rec.meta.rulesVersion,
      contentHash: rec.meta.contentHash,
      maxSeats: rec.meta.maxSeats,
      ephemeral: rec.meta.ephemeral,
      state: adapter.initRoomState(initCtx),
      snapBytes: rec.snapshot.bytes,
      snapHash: rec.snapshot.stateHash,
      now,
      ...(rec.meta.seed !== undefined ? { seed: rec.meta.seed } : {}),
    });
    room.nextActorSeq = rec.meta.nextActorSeq;
    const restoreDraft = { state: room.state };
    adapter.restore(restoreDraft, rec.snapshot.bytes);
    room.state = restoreDraft.state;
    room.revision = rec.snapshot.revision;

    // Rebuild members as disconnected; the reconnect window restarts at boot.
    for (const sm of rec.meta.members) {
      const member: RoomMember = {
        actorId: sm.actorId,
        seat: sm.seat,
        displayName: sm.displayName,
        connId: null,
        connected: false,
        disconnectedAt: now,
        resumeToken: sm.resumeToken,
        joinedAt: sm.joinedAt,
      };
      room.members.set(sm.actorId, member);
      if (sm.seat - 1 < room.seats.length) room.seats[sm.seat - 1] = sm.actorId;
    }

    // Deterministically re-apply the tail history over the snapshot.
    for (const h of rec.commands) {
      if (h.revision <= room.revision) continue;
      const draftState = this.cloneState(room.state);
      const events = adapter.applyCommand(this.draft(room, draftState), h.actorId, h.payload) ?? [];
      room.state = draftState;
      room.revision = h.revision;
      const entry: LogEntry = {
        revision: h.revision,
        commandId: h.commandId,
        actorId: h.actorId,
        baseRevision: h.baseRevision,
        payload: h.payload,
        events,
        stateHash: '',
        at: now,
      };
      entry.stateHash = this.stateHash(room);
      room.log.push(entry);
      room.seen.set(h.commandId, entry);
    }
    // Recovered rooms start empty; sweep handles their idle expiry.
    room.lastEmptyAt = now;
    this.rooms.set(room.id, room);
    this.codes.set(room.code, room.id);
  }
}
