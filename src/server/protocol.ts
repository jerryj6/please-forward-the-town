/**
 * protocol.ts — typed wire protocol for the game-agnostic room server.
 *
 * Transport: one JSON text message per WebSocket frame.
 *
 * Client -> Server:  hello | create | join | leave | command | ping
 * Server -> Client:  hello | join | leave | state_patch | snapshot |
 *                    full_state | ping | pong | error
 *
 * Semantics (see REPORT.md for the full contract):
 *  - `hello` must be the first client message; it negotiates the protocol
 *    version and binds an anonymous session id.
 *  - `create` / `join` seat the connection in a room. The joiner always
 *    receives `full_state` (canonical snapshot + history + roster); every
 *    other connected member receives a `join` roster notice.
 *  - `command` carries {commandId, baseRevision, payload}. Exactly one of:
 *    broadcast `state_patch` (accepted; doubles as the ack to the sender)
 *    or `error` (rejected without any state mutation). A re-sent, already
 *    accepted commandId re-sends its recorded `state_patch` with dup:true.
 *  - `snapshot` is a standalone canonical-state frame (adapter bytes,
 *    base64); `full_state` is the join-time resync envelope.
 *  - `leave` is broadcast for explicit leaves, disconnects (with a
 *    reconnect deadline), reconnect-window expiries and takeovers.
 *  - `ping`/`pong` is the application-level heartbeat (ws-level ping/pong
 *    liveness is also used, but invisible to the protocol).
 */
import { createHash } from 'node:crypto';

export const PROTOCOL_VERSION = 1;
export const SERVER_VERSION = '0.1.0';

/** Hard transport bound: any single text frame larger than this is rejected. */
export const MAX_MESSAGE_BYTES = 256 * 1024;
/** Game payload bound inside a `command` message (canonical JSON bytes). */
export const MAX_COMMAND_PAYLOAD_BYTES = 64 * 1024;
export const MAX_HISTORY_PAYLOAD_BYTES = MAX_COMMAND_PAYLOAD_BYTES;
export const MAX_DISPLAY_NAME_LEN = 40;
export const MAX_COMMAND_ID_LEN = 96;
export const MAX_ROOM_REF_LEN = 64;
export const MAX_TOKEN_LEN = 128;
export const HELLO_TIMEOUT_MS = 5_000;

export const ErrorCodes = {
  HELLO_REQUIRED: 'hello_required',
  INCOMPATIBLE_VERSION: 'incompatible_version',
  PROTOCOL: 'protocol_error',
  NOT_IN_ROOM: 'not_in_room',
  ROOM_NOT_FOUND: 'room_not_found',
  ROOM_FULL: 'room_full',
  ROOM_FINISHED: 'room_finished',
  JOIN_REFUSED: 'join_refused',
  BAD_RESUME: 'bad_resume',
  UNKNOWN_GAME: 'unknown_game',
  STALE_REVISION: 'stale_revision',
  VALIDATION: 'validation_failed',
  APPLY: 'apply_failed',
  COMMAND_TOO_LARGE: 'command_too_large',
  MESSAGE_TOO_LARGE: 'message_too_large',
  SERVER_SHUTDOWN: 'server_shutdown',
  INTERNAL: 'internal_error',
} as const;
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/* ------------------------------------------------------------------ */
/* Client -> Server                                                    */
/* ------------------------------------------------------------------ */

export interface HelloClient {
  type: 'hello';
  protocolVersion: number;
  clientVersion?: string;
  sessionId?: string;
}
export interface CreateClient {
  type: 'create';
  gameType?: string;
  rulesVersion?: string;
  contentHash?: string;
  displayName?: string;
  roomCode?: string;
  ephemeral?: boolean;
  seed?: string;
}
export interface JoinClient {
  type: 'join';
  /** Room id (`r_…`) or shareable room code. */
  room: string;
  displayName?: string;
  /** Present (with resumeToken) to re-take a held seat after disconnect. */
  actorId?: string;
  resumeToken?: string;
}
export interface LeaveClient {
  type: 'leave';
}
export interface CommandClient {
  type: 'command';
  commandId: string;
  baseRevision: number;
  payload: unknown;
}
export interface PingClient {
  type: 'ping';
  t?: number;
}

export type ClientMessage =
  | HelloClient
  | CreateClient
  | JoinClient
  | LeaveClient
  | CommandClient
  | PingClient;

/* ------------------------------------------------------------------ */
/* Server -> Client                                                    */
/* ------------------------------------------------------------------ */

export interface HelloServer {
  type: 'hello';
  protocolVersion: number;
  serverVersion: string;
  sessionId: string;
  heartbeatMs: number;
}
export interface MemberInfo {
  actorId: string;
  seat: number;
  displayName: string;
  connected: boolean;
}
/** Roster notice broadcast to connected members when a seat changes hands. */
export interface JoinServer {
  type: 'join';
  roomId: string;
  actorId: string;
  seat: number;
  displayName: string;
  reconnected: boolean;
}
export type LeaveReason = 'left' | 'disconnected' | 'reconnect_expired' | 'taken_over' | 'room_closed';
export interface LeaveServer {
  type: 'leave';
  roomId: string;
  actorId: string;
  seat: number;
  reason: LeaveReason;
  /** Present on 'disconnected': ms epoch deadline for reclaiming the seat. */
  reconnectDeadline?: number;
}
/** One committed command. Also serves as the sender's acknowledgement. */
export interface StatePatch {
  type: 'state_patch';
  roomId: string;
  revision: number;
  stateHash: string;
  commandId: string;
  actorId: string;
  baseRevision: number;
  payload: unknown;
  events: unknown[];
  /** Present + true when this is a re-ack of an already-seen commandId. */
  dup?: boolean;
}
export interface SnapshotMsg {
  type: 'snapshot';
  roomId: string;
  revision: number;
  stateHash: string;
  /** Adapter-produced canonical state bytes, base64. */
  data: string;
}
export interface HistoryEntry {
  revision: number;
  commandId: string;
  actorId: string;
  baseRevision: number;
  payload: unknown;
  events: unknown[];
  stateHash: string;
}
export interface RoomMeta {
  roomId: string;
  roomCode: string;
  gameType: string;
  rulesVersion: string;
  contentHash: string;
  createdAt: number;
  maxSeats: number;
  ephemeral: boolean;
  /** ms epoch; room is destroyed when empty past this deadline. */
  idleDeadline: number;
  reconnectWindowMs: number;
}
/** Join-time resync envelope: snapshot + subsequent history + roster. */
export interface FullState {
  type: 'full_state';
  room: RoomMeta;
  actorId: string;
  seat: number;
  resumeToken: string;
  reconnected: boolean;
  revision: number;
  stateHash: string;
  snapshot: { revision: number; data: string };
  history: HistoryEntry[];
  members: MemberInfo[];
}
export interface PingServer {
  type: 'ping';
  t: number;
}
export interface PongServer {
  type: 'pong';
  t?: number;
}
export interface ErrorMsg {
  type: 'error';
  code: ErrorCode;
  message: string;
  commandId?: string;
}

export type ServerMessage =
  | HelloServer
  | JoinServer
  | LeaveServer
  | StatePatch
  | SnapshotMsg
  | FullState
  | PingServer
  | PongServer
  | ErrorMsg;

/* ------------------------------------------------------------------ */
/* Parsing / validation (hand-rolled; no runtime deps)                 */
/* ------------------------------------------------------------------ */

export type ParseResult =
  | { ok: true; msg: ClientMessage }
  | { ok: false; code: ErrorCode; message: string; commandId?: string };

const CLIENT_TYPES = new Set(['hello', 'create', 'join', 'leave', 'command', 'ping']);

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function optStr(v: unknown, max: number): v is string | undefined {
  return v === undefined || (typeof v === 'string' && v.length <= max);
}
function str(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}
function nonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}
function jsonSize(v: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(v) ?? '', 'utf8');
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
function serializable(v: unknown): boolean {
  try {
    JSON.stringify(v);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse and validate a raw text frame into a ClientMessage.
 * Never throws; malformed input yields {ok:false} and the connection stays
 * usable (the sender just gets an `error` frame back).
 */
export function parseClientMessage(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, code: ErrorCodes.PROTOCOL, message: 'frame is not valid JSON' };
  }
  /* Echo commandId back on post-parse failures so senders can correlate
   * the rejection with an in-flight command. */
  const rawCid =
    isObj(raw) && typeof raw.commandId === 'string' && raw.commandId.length <= MAX_COMMAND_ID_LEN
      ? raw.commandId
      : undefined;
  const bad = (code: ErrorCode, message: string): ParseResult => ({ ok: false, code, message, ...(rawCid !== undefined ? { commandId: rawCid } : {}) });
  if (!isObj(raw) || typeof raw.type !== 'string' || !CLIENT_TYPES.has(raw.type)) {
    return { ok: false, code: ErrorCodes.PROTOCOL, message: 'unknown or missing message type' };
  }
  switch (raw.type) {
    case 'hello': {
      if (!nonNegInt(raw.protocolVersion)) {
        return { ok: false, code: ErrorCodes.PROTOCOL, message: 'hello.protocolVersion must be a non-negative integer' };
      }
      if (!optStr(raw.clientVersion, 64) || !optStr(raw.sessionId, MAX_TOKEN_LEN)) {
        return { ok: false, code: ErrorCodes.PROTOCOL, message: 'hello has invalid optional fields' };
      }
      return {
        ok: true,
        msg: {
          type: 'hello',
          protocolVersion: raw.protocolVersion,
          ...(raw.clientVersion !== undefined ? { clientVersion: raw.clientVersion } : {}),
          ...(raw.sessionId !== undefined ? { sessionId: raw.sessionId } : {}),
        },
      };
    }
    case 'create': {
      if (
        !optStr(raw.gameType, 64) ||
        !optStr(raw.rulesVersion, 64) ||
        !optStr(raw.contentHash, 128) ||
        !optStr(raw.displayName, MAX_DISPLAY_NAME_LEN) ||
        !optStr(raw.roomCode, MAX_ROOM_REF_LEN) ||
        !optStr(raw.seed, 128) ||
        (raw.ephemeral !== undefined && typeof raw.ephemeral !== 'boolean')
      ) {
        return { ok: false, code: ErrorCodes.PROTOCOL, message: 'create has invalid fields' };
      }
      return {
        ok: true,
        msg: {
          type: 'create',
          ...(raw.gameType !== undefined ? { gameType: raw.gameType } : {}),
          ...(raw.rulesVersion !== undefined ? { rulesVersion: raw.rulesVersion } : {}),
          ...(raw.contentHash !== undefined ? { contentHash: raw.contentHash } : {}),
          ...(raw.displayName !== undefined ? { displayName: raw.displayName } : {}),
          ...(raw.roomCode !== undefined ? { roomCode: raw.roomCode } : {}),
          ...(raw.ephemeral !== undefined ? { ephemeral: raw.ephemeral } : {}),
          ...(raw.seed !== undefined ? { seed: raw.seed } : {}),
        },
      };
    }
    case 'join': {
      if (!str(raw.room, MAX_ROOM_REF_LEN)) {
        return { ok: false, code: ErrorCodes.PROTOCOL, message: 'join.room is required' };
      }
      if (!optStr(raw.displayName, MAX_DISPLAY_NAME_LEN) || !optStr(raw.actorId, 64) || !optStr(raw.resumeToken, MAX_TOKEN_LEN)) {
        return { ok: false, code: ErrorCodes.PROTOCOL, message: 'join has invalid optional fields' };
      }
      if ((raw.actorId === undefined) !== (raw.resumeToken === undefined)) {
        return { ok: false, code: ErrorCodes.PROTOCOL, message: 'join.resume requires both actorId and resumeToken' };
      }
      return {
        ok: true,
        msg: {
          type: 'join',
          room: raw.room,
          ...(raw.displayName !== undefined ? { displayName: raw.displayName } : {}),
          ...(raw.actorId !== undefined ? { actorId: raw.actorId } : {}),
          ...(raw.resumeToken !== undefined ? { resumeToken: raw.resumeToken } : {}),
        },
      };
    }
    case 'leave':
      return { ok: true, msg: { type: 'leave' } };
    case 'command': {
      if (!str(raw.commandId, MAX_COMMAND_ID_LEN)) {
        return bad(ErrorCodes.PROTOCOL, 'command.commandId is required (<=96 chars)');
      }
      if (!nonNegInt(raw.baseRevision)) {
        return bad(ErrorCodes.PROTOCOL, 'command.baseRevision must be a non-negative integer');
      }
      if (!('payload' in raw) || !serializable(raw.payload)) {
        return bad(ErrorCodes.PROTOCOL, 'command.payload must be JSON-serializable');
      }
      if (jsonSize(raw.payload) > MAX_COMMAND_PAYLOAD_BYTES) {
        return bad(ErrorCodes.COMMAND_TOO_LARGE, 'command.payload exceeds 64KiB');
      }
      return {
        ok: true,
        msg: { type: 'command', commandId: raw.commandId, baseRevision: raw.baseRevision, payload: raw.payload },
      };
    }
    case 'ping': {
      if (raw.t !== undefined && typeof raw.t !== 'number') {
        return { ok: false, code: ErrorCodes.PROTOCOL, message: 'ping.t must be a number' };
      }
      return { ok: true, msg: { type: 'ping', ...(raw.t !== undefined ? { t: raw.t } : {}) } };
    }
    default:
      return { ok: false, code: ErrorCodes.PROTOCOL, message: 'unhandled message type' };
  }
}

/* ------------------------------------------------------------------ */
/* Canonical JSON + state hashing                                      */
/* ------------------------------------------------------------------ */

function sortValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v !== null && typeof v === 'object') {
    const src = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src).sort()) out[k] = sortValue(src[k]);
    return out;
  }
  return v;
}

/** Deterministic JSON: object keys sorted recursively, no whitespace. */
export function canonicalJson(v: unknown): string {
  return JSON.stringify(sortValue(v));
}

/**
 * Canonical room-state hash. Covers every gameplay-relevant field the
 * adapter serializes; transport metadata (revisions, command ids, sockets)
 * lives outside `state` and is excluded by construction.
 */
export function hashCanonicalState(state: unknown): string {
  return createHash('sha256').update(canonicalJson(state), 'utf8').digest('hex');
}

export function encode(msg: ServerMessage): string {
  return JSON.stringify(msg);
}

export function b64encode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}
export function b64decode(data: string): Uint8Array {
  return new Uint8Array(Buffer.from(data, 'base64'));
}
