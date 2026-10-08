/**
 * PFT-01 "The Last Crossing" acceptance tests (master §II PFT-C, §IV.5.5, PFT-F).
 *
 * Asserts: both valid delivery orders (A and B) succeed; early bridge handover
 * strands the lantern recoverably (undo path); early packing is recoverable via
 * redeployment; pack-without-deliver fails with a stranded explanation; ferry
 * capacity rejects an overload; deterministic replay is identical;
 * serialize/restore is stable; plus conservation, no-ghost-route, idempotent
 * commits and stale-revision rejection.
 */

import { describe, expect, it } from 'vitest';
import { PftEngine, analyzeOrderStatuses } from '../../src/engine/pft/engine.js';
import { simulate } from '../../src/engine/pft/sim.js';
import { PFT01_LAST_CROSSING as LEVEL } from '../../src/content/levels/pft01-last-crossing.js';
import type { PftAction } from '../../src/engine/pft/types.js';

const C = 'courier-1';
const F = 'ferry-1';
const SEED = 'pft01-test-seed';

/** Reference trace A: retrieve lantern, deliver it first, then hand over the bridge. */
const TRACE_A: PftAction[] = [
  { type: 'travel', courierId: C, path: ['west'] },
  { type: 'pickup', courierId: C, itemId: 'lantern' },
  { type: 'travel', courierId: C, path: ['middle'] },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C, itemId: 'lantern', recipientId: 'orchard' },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: C, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C, itemId: 'bridge-1', recipientId: 'museum' },
];

/** Reference trace B: stage the lantern on Middle, ship the bridge first, return for it. */
const TRACE_B: PftAction[] = [
  { type: 'travel', courierId: C, path: ['west'] },
  { type: 'pickup', courierId: C, itemId: 'lantern' },
  { type: 'travel', courierId: C, path: ['middle'] },
  { type: 'drop', courierId: C, itemId: 'lantern' },
  { type: 'pack', courierId: C, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: C, itemId: 'lantern' },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C, itemId: 'lantern', recipientId: 'orchard' },
];

describe('PFT-01 The Last Crossing — acceptance (PFT-C)', () => {
  it('order A passes: lantern delivered before bridge handover', () => {
    const res = simulate(LEVEL, TRACE_A, SEED);
    expect(res.success).toBe(true);
    expect(res.evaluation.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.finalState.fulfilled['order-lantern']).toBe(true);
    expect(res.finalState.fulfilled['order-bridge']).toBe(true);
    expect(res.finalState.fulfilled['order-courier']).toBe(true);
    expect(res.stats.lateMoves).toBe(0); // 9 moves, par 9
  });

  it('order B passes: bridge shipped first while lantern staged on Middle', () => {
    const res = simulate(LEVEL, TRACE_B, SEED);
    expect(res.success).toBe(true);
    expect(res.evaluation.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    // Not a hardcoded single delivery order: the second strategy commits the bridge first.
    const firstDeliver = res.events.find((e) => e.type === 'item.delivered');
    expect(firstDeliver?.entityId).toBe('bridge-1');
    expect(res.stats.lateMoves).toBe(2); // 11 moves, par 9 — exact lateness penalty, informational
  });

  it('early bridge handover strands the lantern, flagged recoverable, and completes via the undo path', () => {
    const engine = new PftEngine();
    engine.begin(LEVEL, SEED);
    const prefix: PftAction[] = [
      { type: 'pack', courierId: C, pieceId: 'bridge-1' },
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: C, itemId: 'bridge-1', recipientId: 'museum' },
    ];
    const allEvents = [];
    for (let i = 0; i < prefix.length; i++) {
      const res = engine.commit(engine.propose('test', `early-${i}`, prefix[i]!));
      expect(res.ok).toBe(true);
      allEvents.push(...(res.events ?? []));
    }

    // The lantern order is stranded — recoverable only via undo (final handover, PFT-C).
    const stranded = allEvents.filter(
      (e) => e.type === 'order.stranded' && e.entityId === 'order-lantern',
    );
    expect(stranded.length).toBeGreaterThanOrEqual(2);
    // At pack: flagged recoverable via redeployment (still owned). After the final
    // handover: reclassified — recoverable only via undo.
    expect(stranded[0]?.data?.['recovery']).toBe('redeploy');
    const lanternStrand = stranded[stranded.length - 1]!;
    expect(lanternStrand.data?.['recoverable']).toBe(true);
    expect(lanternStrand.data?.['recovery']).toBe('undo');

    const statuses = analyzeOrderStatuses(LEVEL, engine.currentState);
    const lantern = statuses.find((s) => s.orderId === 'order-lantern')!;
    expect(lantern.achievable).toBe(false);
    expect(lantern.recovery).toBe('undo');

    // Recovery: undo the premature delivery, redeploy the bridge, fetch the lantern.
    expect(engine.undo().ok).toBe(true);
    const recoveryPlan: PftAction[] = [
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'middle' },
      { type: 'deploy', courierId: C, pieceId: 'bridge-1', siteId: 'socket-west-middle' },
      { type: 'travel', courierId: C, path: ['west'] },
      { type: 'pickup', courierId: C, itemId: 'lantern' },
      { type: 'travel', courierId: C, path: ['middle'] },
      { type: 'drop', courierId: C, itemId: 'lantern' },
      { type: 'pack', courierId: C, pieceId: 'bridge-1' },
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: C, itemId: 'bridge-1', recipientId: 'museum' },
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'middle' },
      { type: 'pickup', courierId: C, itemId: 'lantern' },
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: C, itemId: 'lantern', recipientId: 'orchard' },
    ];
    for (let i = 0; i < recoveryPlan.length; i++) {
      const res = engine.commit(engine.propose('test', `rec-${i}`, recoveryPlan[i]!));
      expect(res.ok).toBe(true);
    }
    const accepted = engine.acceptResult();
    expect(accepted.accepted).toBe(true);
    expect(engine.currentState.completed).toBe(true);
  });

  it('packing the bridge early is recoverable through compatible redeployment (PFT-C / §IV.5.5)', () => {
    const engine = new PftEngine();
    engine.begin(LEVEL, SEED);
    const res1 = engine.commit(
      engine.propose('test', 'pack-early', { type: 'pack', courierId: C, pieceId: 'bridge-1' }),
    );
    expect(res1.ok).toBe(true);
    const strand = (res1.events ?? []).find(
      (e) => e.type === 'order.stranded' && e.entityId === 'order-lantern',
    );
    expect(strand?.data?.['recovery']).toBe('redeploy');
    expect(strand?.data?.['recoverable']).toBe(true);

    const res2 = engine.commit(
      engine.propose('test', 'redeploy', {
        type: 'deploy',
        courierId: C,
        pieceId: 'bridge-1',
        siteId: 'socket-west-middle',
      }),
    );
    expect(res2.ok).toBe(true);
    expect(
      (res2.events ?? []).some(
        (e) => e.type === 'order.unstranded' && e.entityId === 'order-lantern',
      ),
    ).toBe(true);

    // Finish via trace A's remainder.
    const rest: PftAction[] = [
      { type: 'travel', courierId: C, path: ['west'] },
      { type: 'pickup', courierId: C, itemId: 'lantern' },
      { type: 'travel', courierId: C, path: ['middle'] },
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: C, itemId: 'lantern', recipientId: 'orchard' },
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'middle' },
      { type: 'pack', courierId: C, pieceId: 'bridge-1' },
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: C, itemId: 'bridge-1', recipientId: 'museum' },
    ];
    for (let i = 0; i < rest.length; i++) {
      expect(engine.commit(engine.propose('test', `r-${i}`, rest[i]!)).ok).toBe(true);
    }
    expect(engine.currentState.completed).toBe(true);
  });

  it('pack-without-deliver fails with the stranded explanation', () => {
    // The courier packs the bridge and carries it to East without delivering it;
    // the plan ends with the lantern stranded on West and the museum order open.
    const plan: PftAction[] = [
      { type: 'pack', courierId: C, pieceId: 'bridge-1' },
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
    ];
    const res = simulate(LEVEL, plan, SEED);
    expect(res.success).toBe(false);
    expect(res.finalState.completed).toBe(false);
    expect(res.finalState.fulfilled['order-bridge']).toBe(false);

    const lantern = res.orderStatuses.find((s) => s.orderId === 'order-lantern')!;
    expect(lantern.achievable).toBe(false);
    expect(res.explanation).toContain('order-lantern');
    expect(res.explanation).toContain('lantern');
    expect(res.explanation).toContain('west');
    expect(res.evaluation.success).toBe(false);
  });

  it('rejects a ferry capacity violation: one courier + one parcel only (PFT-004)', () => {
    const engine = new PftEngine();
    engine.begin(LEVEL, SEED);
    const steps: PftAction[] = [
      { type: 'travel', courierId: C, path: ['west'] },
      { type: 'pickup', courierId: C, itemId: 'lantern' },
      { type: 'travel', courierId: C, path: ['middle'] },
      { type: 'load_ferry', courierId: C, ferryId: F, itemId: 'lantern' },
      { type: 'pack', courierId: C, pieceId: 'bridge-1' },
    ];
    for (let i = 0; i < steps.length; i++) {
      expect(engine.commit(engine.propose('test', `cap-${i}`, steps[i]!)).ok).toBe(true);
    }
    // Lantern in the hold + packed bridge carried aboard = 2 parcels > capacity 1.
    const ride: PftAction = { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' };
    const v = engine.validateAction(LEVEL, engine.currentState, ride);
    expect(v.ok).toBe(false);
    expect(v.reason).toContain('capacity');
    const res = engine.commit(engine.propose('test', 'cap-ride', ride));
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('capacity');
  });

  it('deterministic replay is identical across runs and replays (§IV.5.1)', () => {
    const r1 = simulate(LEVEL, TRACE_A, SEED);
    const r2 = simulate(LEVEL, TRACE_A, SEED);
    expect(r1.finalHash).toBe(r2.finalHash);
    expect(r1.events.map((e) => `${e.beat}:${e.type}:${e.entityId ?? ''}`)).toEqual(
      r2.events.map((e) => `${e.beat}:${e.type}:${e.entityId ?? ''}`),
    );

    // A versioned Replay re-committed through the engine reproduces the same hash.
    const engine = new PftEngine();
    engine.begin(LEVEL, SEED);
    for (let i = 0; i < TRACE_A.length; i++) {
      expect(engine.commit(engine.propose('test', `a-${i}`, TRACE_A[i]!)).ok).toBe(true);
    }
    const replay = engine.makeReplay();
    const rerun = new PftEngine().replayRun(LEVEL, replay);
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });

  it('serialize/restore is stable mid-plan (§I.3.3)', () => {
    const engine = new PftEngine();
    engine.begin(LEVEL, SEED);
    for (let i = 0; i < 5; i++) {
      expect(engine.commit(engine.propose('test', `s-${i}`, TRACE_A[i]!)).ok).toBe(true);
    }
    const blob = engine.makeSave();
    const blob2 = engine.serialize(LEVEL, engine.restore(LEVEL, blob));
    expect(blob2).toBe(blob); // round-trip is byte-stable

    const restored = new PftEngine();
    restored.loadSave(LEVEL, blob);
    expect(restored.canonicalHash(LEVEL, restored.currentState)).toBe(
      engine.canonicalHash(LEVEL, engine.currentState),
    );
    for (let i = 5; i < TRACE_A.length; i++) {
      expect(restored.commit(restored.propose('test', `s-${i}`, TRACE_A[i]!)).ok).toBe(true);
    }
    const uninterrupted = simulate(LEVEL, TRACE_A, SEED);
    expect(restored.canonicalHash(LEVEL, restored.currentState)).toBe(uninterrupted.finalHash);
    expect(restored.currentState.completed).toBe(true);
  });
});

describe('PFT invariants (PFT-F / §IV.5.5)', () => {
  it('a delivered bridge leaves no ghost route to West (PFT-003)', () => {
    const engine = new PftEngine();
    engine.begin(LEVEL, SEED);
    const steps: PftAction[] = [
      { type: 'pack', courierId: C, pieceId: 'bridge-1' },
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: C, itemId: 'bridge-1', recipientId: 'museum' },
    ];
    for (let i = 0; i < steps.length; i++) {
      expect(engine.commit(engine.propose('test', `g-${i}`, steps[i]!)).ok).toBe(true);
    }
    const legal = engine.getLegalActions(LEVEL, engine.currentState);
    expect(
      legal.some((a) => a.type === 'travel' && a.path.includes('west')),
    ).toBe(false);
    const evaln = engine.evaluate(LEVEL, engine.currentState);
    expect(
      evaln.observations.find((o) => o.predicateId === 'invariant:no-ghost-routes')?.passed,
    ).toBe(true);
    expect(evaln.allObservationsPass).toBe(true); // conservation + single-state hold
  });

  it('delivering the lantern alone does not win; courier left on Middle does not win', () => {
    const lanternOnly: PftAction[] = TRACE_A.slice(0, 5);
    const res = simulate(LEVEL, lanternOnly, SEED);
    expect(res.success).toBe(false);
    expect(res.finalState.fulfilled['order-lantern']).toBe(true);
    expect(res.finalState.fulfilled['order-bridge']).toBe(false);

    // Deliver both items but ride back to Middle: extraction is not satisfied.
    const backToMiddle: PftAction[] = [
      ...TRACE_A,
      { type: 'ride_ferry', courierId: C, ferryId: F, to: 'middle' },
    ];
    const res2 = simulate(LEVEL, backToMiddle, SEED);
    expect(res2.finalState.fulfilled['order-bridge']).toBe(true);
    expect(res2.finalState.fulfilled['order-courier']).toBe(false);
    expect(res2.success).toBe(false);
  });

  it('repeating a committed command id is idempotent; stale revisions are rejected (§3.4/§IV.5.1)', () => {
    const engine = new PftEngine();
    engine.begin(LEVEL, SEED);
    const p = engine.propose('test', 'dup-1', { type: 'travel', courierId: C, path: ['west'] });
    const r1 = engine.commit(p);
    const r2 = engine.commit(p); // duplicate — must not apply twice
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r2.committed?.revision).toBe(r1.committed?.revision);
    expect(engine.currentState.couriers[C]?.at).toBe('west');
    expect(engine.currentState.beat).toBe(1); // applied exactly once

    const stale = engine.propose('test', 'stale-1', { type: 'wait', courierId: C });
    stale.baseRevision = 99;
    const rs = engine.commit(stale);
    expect(rs.ok).toBe(false);
    expect(rs.reason).toContain('stale');
  });

  it('packing from the wrong side is rejected: the handle is on Middle (PFT-005)', () => {
    const engine = new PftEngine();
    engine.begin(LEVEL, SEED);
    expect(
      engine.commit(engine.propose('t', 'w1', { type: 'travel', courierId: C, path: ['west'] })).ok,
    ).toBe(true);
    const res = engine.commit(
      engine.propose('t', 'w2', { type: 'pack', courierId: C, pieceId: 'bridge-1' }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('handling endpoint');
  });
});
