/**
 * Canonical engine contracts (master §3.3). Versioned, deterministic, render-free.
 * Game-specific adapters extend these; vocabulary must not fork.
 */

export const RULES_VERSION = "trs-0.1.0" as const;

/** Stable entity identifier — immutable across movement, reskinning, replay, editing (TRS-004). */
export type EntityId = string;
export type Beat = number; // integer beat, 1-based per level convention
export type Revision = number;

export interface Versioned {
  rulesVersion: string;
  contentHash: string;
}

/** Player-visible proposal before commitment. */
export interface ProposedAction<A = unknown> {
  actionId: string; // client-generated, idempotent
  actorId: string; // session/member identity
  baseRevision: Revision;
  action: A;
}

/** Server-authoritative committed action. */
export interface CommittedAction<A = unknown> {
  actionId: string;
  actorId: string;
  revision: Revision;
  baseRevision: Revision;
  action: A;
  committedAtBeat: Beat | null;
}

/** Deterministic event emitted by the engine; drives UI, audio, observations. */
export interface GameEvent {
  beat: Beat;
  type: string;
  entityId?: EntityId;
  data?: Record<string, unknown>;
}

/** Result of evaluating one observation/outcome predicate against a run. */
export interface PredicateResult {
  predicateId: string;
  kind: "observation" | "outcome" | "constraint";
  passed: boolean;
  /** Earliest meaningful divergence for failed predicates (TRS-010). */
  divergence?: { beat: Beat; entityId?: EntityId; expected: string; actual: string };
}

export interface RunEvaluation {
  observations: PredicateResult[];
  outcomes: PredicateResult[];
  allObservationsPass: boolean;
  allOutcomesPass: boolean;
  success: boolean;
}

/** A recorded deterministic play-through. */
export interface Replay<A = unknown> extends Versioned {
  levelId: string;
  seed: number;
  actions: CommittedAction<A>[];
  stateHashes: string[]; // canonical hash after each beat/step
  eventLog: GameEvent[];
  finalHash: string;
}

/** Versioned local save (master §3.3). */
export interface SaveEnvelope extends Versioned {
  levelId: string;
  engineVersion: string;
  seed: number;
  actionLog: CommittedAction[];
  checkpoints: string[]; // canonical hashes
  savedAtIso: string;
}

/** The pure deterministic engine every game implements. No DOM, no Date.now, no Math.random. */
export interface DeterministicEngine<L, S, A> {
  readonly rulesVersion: string;
  createInitialState(level: L): S;
  getLegalActions(level: L, state: S, actorId?: string): A[];
  validateAction(level: L, state: S, action: A): { ok: true } | { ok: false; reason: string };
  /** Pure transition. Must be deterministic for (rulesVersion, contentHash, seed, state, action). */
  applyAction(level: L, state: S, action: A): { state: S; events: GameEvent[] };
  /** Canonical hash: excludes camera/animation/transport metadata; includes every gameplay field. */
  canonicalHash(state: S): string;
  serialize(state: S): unknown;
  restore(level: L, data: unknown): S;
}

/** Reject-without-partial-mutation helper contract (master §5.1). */
export type ApplyResult<S> = { ok: true; state: S } | { ok: false; reason: string; state: S };
