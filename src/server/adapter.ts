/**
 * adapter.ts — the seam between the room server and each game.
 *
 * The room server owns room lifecycle, authoritative ordering, revisioning,
 * idempotency, reconnect windows and transport. Everything puzzle-specific —
 * what a command means, whether it is legal, what it changes, and how the
 * canonical game state serializes — is delegated to a GameAdapter.
 *
 * A GameAdapter MUST be deterministic and free of I/O: given the same room
 * state and the same accepted command sequence it must produce the same
 * states, events, snapshot bytes and hashes on every machine. Wall-clock
 * decisions belong to the room server, never to puzzle outcomes.
 *
 * `room.state` is opaque to the server: it is only ever passed back to the
 * adapter (validate/apply/snapshot/hash/restore) and hashed canonically for
 * convergence checks. It must remain JSON-serializable.
 */

export type ValidationResult = { ok: true } | { ok: false; reason?: string };

export interface MemberView {
  readonly actorId: string;
  readonly seat: number;
  readonly displayName: string;
  readonly connected: boolean;
}

/**
 * Read-only view of a room handed to adapters. `state` is typed read-only by
 * convention: adapters must not mutate it inside validate/snapshot/hash/
 * admitJoiner/isFinished — mutation is only legal through RoomDraft.
 */
export interface RoomView<S = unknown> {
  readonly id: string;
  readonly code: string;
  readonly revision: number;
  readonly state: Readonly<S>;
  readonly members: ReadonlyMap<string, MemberView>;
  readonly maxSeats: number;
  /** Seat number (1..maxSeats) currently held by actorId, else null. */
  seatOf(actorId: string): number | null;
}

/** Mutable facade used for applyCommand/restore. Adapters mutate `state`. */
export type RoomDraft<S = unknown> = Omit<RoomView<S>, 'state'> & { state: S };

export interface RoomInitContext {
  roomId: string;
  roomCode: string;
  /** Optional client-supplied seed recorded on the room for deterministic setup. */
  seed?: string;
}

export interface GameAdapter<S = unknown> {
  /** Unique game identifier ('trs' | 'rbm' | 'pft' | …); selects this adapter in `create`. */
  readonly gameType: string;
  /** Rules/content version the adapter validates; carried in room meta so a
   *  client on a stale build can be told to upgrade instead of mixing engines. */
  readonly rulesVersion: string;

  /** Initial canonical state for a new room. */
  initRoomState(ctx: RoomInitContext): S;

  /**
   * Legality check only — must not mutate room.state. Called after membership,
   * idempotency and baseRevision checks have already passed, immediately before
   * applyCommand. Reject here anything the game considers illegal so that
   * applyCommand can assume a valid command.
   */
  validateCommand(room: RoomView<S>, actorId: string, cmd: unknown): ValidationResult;

  /**
   * Apply an accepted command to room.state (mutate the draft) and return the
   * events to broadcast inside the state_patch. The server runs this against a
   * scratch copy of the state and commits only on success, so a throw rejects
   * the command with zero partial mutation.
   */
  applyCommand(room: RoomDraft<S>, actorId: string, cmd: unknown): unknown[];

  /** Canonical serialization of room.state for snapshot/history transport. */
  snapshot(room: RoomView<S>): Uint8Array;

  /** Rebuild room.state from snapshot bytes (used on recovery). */
  restore(draft: { state: S }, bytes: Uint8Array): void;

  /**
   * Canonical convergence hash of room.state. Default: sha256 of recursively
   * key-sorted JSON. Override only if the canonical form needs game knowledge
   * (e.g. unordered collections serialized in a fixed order).
   */
  hashState?(room: RoomView<S>): string;

  /** Optional join gate (e.g. admit only at a planning boundary). */
  admitJoiner?(room: RoomView<S>): ValidationResult;

  /** Optional finished marker; finished rooms reject new joiners. */
  isFinished?(room: RoomView<S>): boolean;
}
