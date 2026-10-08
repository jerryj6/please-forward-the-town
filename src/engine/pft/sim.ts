/**
 * simulate(level, plan, seed) — run a committed plan through the production
 * engine and report the deterministic result (§IV.5.1: the engine is the
 * ground truth for outcomes; reference solutions drive the same public
 * action paths as ordinary play — GME-004/§3.6).
 *
 * A plan is an ordered list of PftAction. Each action commits at a shared
 * planning boundary (PFT-012): it is validated fully, then applied atomically.
 * A rejected action stops the run — its assumptions broke (PFT-006) — and the
 * run reports failure with the reason. A plan that ends with unfulfilled
 * orders fails with the stranded/incomplete explanation.
 */

import type { CommittedAction, GameEvent, RunEvaluation } from '../contracts.js';
import { PftEngine, analyzeOrderStatuses } from './engine.js';
import type { OrderStatus, PftAction, PftLevel, PftPlayState } from './types.js';

export interface SimStats {
  /** Committed actions = beats consumed. */
  moves: number;
  ferryTrips: number;
  packs: number;
  deploys: number;
  deliveries: number;
  /**
   * Exact lateness penalty: moves - par when the level declares `par`, else 0.
   * PFT planning is untimed (GME-003); this is mastery feedback, never a failure.
   */
  lateMoves: number;
}

export interface SimResult {
  success: boolean;
  /** Plan index + reason when a committed action was rejected (run stops there). */
  rejectedAt?: number;
  rejectionReason?: string;
  finalState: PftPlayState;
  finalHash: string;
  events: GameEvent[];
  committed: CommittedAction[];
  evaluation: RunEvaluation;
  /** Per-order verdicts at the final state (achievable/stranded+recovery). */
  orderStatuses: OrderStatus[];
  /** Human-readable causal explanation of the outcome (GME-004). */
  explanation: string;
  stats: SimStats;
}

export function simulate(level: PftLevel, plan: PftAction[], seed = ''): SimResult {
  const engine = new PftEngine();
  engine.begin(level, seed);

  const events: GameEvent[] = [];
  const committed: CommittedAction[] = [];
  let rejectedAt: number | undefined;
  let rejectionReason: string | undefined;

  for (let i = 0; i < plan.length; i++) {
    const action = plan[i]!;
    const res = engine.commit({
      actorId: 'sim',
      actionId: `sim-${i}`,
      baseRevision: engine.currentRevision,
      action: action,
    });
    if (!res.ok) {
      rejectedAt = i;
      rejectionReason = res.reason ?? 'rejected';
      break;
    }
    committed.push(res.committed!);
    events.push(...(res.events ?? []));
  }

  const state = engine.currentState;
  const evaluation = engine.evaluate(level, state);
  const orderStatuses = analyzeOrderStatuses(level, state);
  const finalHash = engine.canonicalHash(level, state);

  const rejected = rejectedAt !== undefined;
  const success = !rejected && evaluation.success && state.completed;

  const stats: SimStats = {
    moves: committed.length,
    ferryTrips: plan.slice(0, committed.length).filter((a) => a.type === 'ride_ferry').length,
    packs: plan.slice(0, committed.length).filter((a) => a.type === 'pack').length,
    deploys: plan.slice(0, committed.length).filter((a) => a.type === 'deploy').length,
    deliveries: plan
      .slice(0, committed.length)
      .filter((a) => a.type === 'deliver' || a.type === 'hand_over_ferry').length,
    lateMoves: level.par !== undefined ? Math.max(0, committed.length - level.par) : 0,
  };

  return {
    success,
    ...(rejected ? { rejectedAt: rejectedAt!, rejectionReason: rejectionReason! } : {}),
    finalState: state,
    finalHash,
    events,
    committed,
    evaluation,
    orderStatuses,
    explanation: explain(level, state, orderStatuses, stats, rejectedAt, rejectionReason),
    stats,
  };
}

function explain(
  level: PftLevel,
  state: PftPlayState,
  statuses: OrderStatus[],
  stats: SimStats,
  rejectedAt: number | undefined,
  rejectionReason: string | undefined,
): string {
  const parts: string[] = [];
  if (rejectedAt !== undefined) {
    parts.push(`Plan rejected at step ${rejectedAt}: ${rejectionReason}.`);
    return parts.join(' ');
  }
  if (state.completed) {
    parts.push(`Contract completed in ${stats.moves} moves.`);
    if (stats.lateMoves > 0) {
      parts.push(`${stats.lateMoves} moves over par ${level.par} (lateness penalty).`);
    }
    return parts.join(' ');
  }
  const stranded = statuses.filter((s) => !s.fulfilled && !s.achievable);
  const open = statuses.filter((s) => !s.fulfilled && s.achievable);
  if (stranded.length) {
    parts.push('Contract failed — stranded orders:');
    for (const s of stranded) parts.push(`- ${s.orderId}: ${s.reason}`);
  }
  if (open.length) {
    parts.push(`Unfinished but still achievable: ${open.map((s) => s.orderId).join(', ')}.`);
  }
  return parts.join(' ') || 'Contract incomplete.';
}
