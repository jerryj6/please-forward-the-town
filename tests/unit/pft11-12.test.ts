/**
 * PFT-11/12 acceptance tests (master §II PFT-D finale block, §IV.5.2/5.5;
 * bible §3.4/3.5/3.6): the extraction destination moves (mountedOn post-
 * office sign), and the finale moves the whole town — every infrastructure
 * category used as a tool before it ships, two strategically distinct
 * complete plans for PFT-12.
 *
 * Per level: verified winning trace(s) pass end-to-end; every designed wrong
 * approach fails for the asserted reason; determinism — same seed, same
 * canonical hash + replay equality; the untouched start does not win.
 */

import { describe, expect, it } from 'vitest';
import { PftEngine, analyzeOrderStatuses } from '../../src/engine/pft/engine.js';
import { simulate } from '../../src/engine/pft/sim.js';
import { PFT11_MAIL_THE_POST_OFFICE } from '../../src/content/levels/pft11-mail-the-post-office.js';
import { PFT12_EVERYTHING_MUST_GO } from '../../src/content/levels/pft12-everything-must-go.js';
import type { PftAction, PftLevel } from '../../src/engine/pft/types.js';
import type { GameEvent } from '../../src/engine/contracts.js';
import { PFT11_TRACE, PFT12_TRACE_A, PFT12_TRACE_B } from '../lib/pft11-12-traces.js';

const SEED = 'pft11-12-test-seed';

function run(level: PftLevel, plan: PftAction[], seed = SEED) {
  const engine = new PftEngine();
  engine.begin(level, seed);
  const events: GameEvent[] = [];
  for (let i = 0; i < plan.length; i++) {
    const res = engine.commit(engine.propose('test', `p-${i}`, plan[i]!));
    if (!res.ok) return { engine, events, failedAt: i, reason: res.reason ?? 'rejected' };
    events.push(...(res.events ?? []));
  }
  return { engine, events, failedAt: -1, reason: '' };
}

const strands = (events: GameEvent[], orderId: string) =>
  events.filter((e) => e.type === 'order.stranded' && e.entityId === orderId);
const unstrands = (events: GameEvent[], orderId: string) =>
  events.filter((e) => e.type === 'order.unstranded' && e.entityId === orderId);

const W = 'courier-1';
const L = 'courier-2';
const F3 = 'courier-3';
const F = 'ferry-1';

// ---------------------------------------------------------------------------
// PFT-11 Mail the Post Office — the extraction destination itself moves
// ---------------------------------------------------------------------------

const L11 = PFT11_MAIL_THE_POST_OFFICE;

/**
 * Verified trace (28 moves): Lark mails + files the mailbox + monument leg;
 * Finch moves the sign West -> Slip; Wren runs the cider then the plank
 * bridge; Sparrow sells the span and hands the mailbag to the postmaster
 * at the moved office — everyone steps into the office lane together.
 */

describe('PFT-11 Mail the Post Office — acceptance (PFT-D)', () => {
  it('verified trace: 28 moves, all orders fulfilled, level completed', () => {
    const res = simulate(L11, PFT11_TRACE, SEED);
    expect(res.success).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of L11.orders) expect(res.finalState.fulfilled[o.id]).toBe(true);
    expect(res.stats.moves).toBe(28);
    expect(res.stats.lateMoves).toBe(0);
    // The mailbag really did travel partway by wire.
    const sent = res.events.find((e) => e.type === 'parcel.sent');
    expect(sent?.entityId).toBe('mailbag');
  });

  it('the office is nowhere while the sign rides in a satchel', () => {
    // At level start the new office lane has no edge, so the exit orders
    // were never achievable — the pack (index 9) does not re-strand them.
    // The state read is what matters: while the sign is packed, every exit
    // is unachievable and stays 'redeploy' — the carried sign could still
    // be stood on the new post.
    const { engine, failedAt } = run(L11, PFT11_TRACE.slice(0, 10));
    expect(failedAt).toBe(-1);
    const st = analyzeOrderStatuses(L11, engine.currentState);
    for (const o of st) {
      if (o.orderId.endsWith('-exit') || o.orderId === 'order-mailbag') {
        expect(o.achievable).toBe(false);
        expect(o.recovery).toBe('redeploy');
      }
    }
  });

  it('unstrands the exits the moment the sign stands on the new post', () => {
    const { events, failedAt } = run(L11, PFT11_TRACE.slice(0, 12));
    expect(failedAt).toBe(-1);
    for (const oid of [
      'order-wren-exit',
      'order-lark-exit',
      'order-finch-exit',
      'order-sparrow-exit',
      'order-mailbag',
    ]) {
      expect(unstrands(events, oid).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('wa: you cannot mail the post office — send carries parcels only', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L, path: ['west', 'north'] },
      // the title joke: the sign will not go down the wire
      { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'sign-1' },
    ];
    const { failedAt, reason } = run(L11, plan);
    expect(failedAt).toBe(1);
    expect(reason).toContain('only parcels travel postal links');
  });

  it('wa: moving day underfoot — the sign will not pack under an occupant', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: F3, path: ['west', 'office-old'] }, // lane is live
      { type: 'travel', courierId: W, path: ['west'] },
      { type: 'pack', courierId: W, pieceId: 'sign-1' }, // Finch still on the lane
    ];
    const { engine, failedAt, reason } = run(L11, plan);
    expect(failedAt).toBe(2);
    expect(reason).toContain('cannot pack');
    expect(reason).toContain('is on Post Office sign');
    // Finch steps off; now the lift is legal.
    const back = engine.commit(
      engine.propose('t', 'back', { type: 'travel', courierId: F3, path: ['west'] }),
    );
    expect(back.ok).toBe(true);
    const lift = engine.commit(
      engine.propose('t', 'lift', { type: 'pack', courierId: W, pieceId: 'sign-1' }),
    );
    expect(lift.ok).toBe(true);
  });

  it('wa: the dead address — the mailbag refuses the old office', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L, path: ['west', 'north'] },
      { type: 'pickup', courierId: L, itemId: 'mailbag' },
      { type: 'travel', courierId: L, path: ['west', 'office-old'] },
      { type: 'deliver', courierId: L, itemId: 'mailbag', recipientId: 'postmaster-old' },
    ];
    const { failedAt, reason } = run(L11, plan);
    expect(failedAt).toBe(3);
    expect(reason).toContain('no open order');
  });

  it('wa: office closed — no route to the office while the sign is packed', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: F3, path: ['west'] },
      { type: 'pack', courierId: F3, pieceId: 'sign-1' },
      { type: 'travel', courierId: W, path: ['east', 'slip', 'office-new'] },
    ];
    const { failedAt, reason } = run(L11, plan);
    expect(failedAt).toBe(2);
    expect(reason).toContain('no active connection slip -> office-new');
  });

  it('wa: teardown before the move — a lifted bridge strands the office', () => {
    // The unsellable ferry keeps Middle->East alive, but West only ever
    // has the plank bridge: pack it while the sign still stands on the old
    // post and the sign is unreachable — the office can never move, so
    // every exit classifies 'none' (no single restore recreates it).
    const plan: PftAction[] = [
      { type: 'pack', courierId: W, pieceId: 'bridge-1' },
    ];
    const { engine, events, failedAt } = run(L11, plan);
    expect(failedAt).toBe(-1);
    for (const oid of [
      'order-wren-exit',
      'order-lark-exit',
      'order-finch-exit',
      'order-sparrow-exit',
    ]) {
      const s = strands(events, oid);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s[s.length - 1]?.data?.['recovery']).toBe('none');
    }
    // The cider, by contrast, is merely redeploy-recoverable — the carried
    // bridge could be re-set on its own socket.
    const s = strands(events, 'order-cider');
    expect(s[s.length - 1]?.data?.['recovery']).toBe('redeploy');
    const st = analyzeOrderStatuses(L11, engine.currentState);
    expect(st.find((x) => x.orderId === 'order-wren-exit')!.recovery).toBe('none');
    // Undo the lift — the bridge stands again, the exits re-read
    // 'redeploy' (the sign could still be fetched and moved).
    expect(engine.undo().ok).toBe(true);
    const again = analyzeOrderStatuses(L11, engine.currentState);
    expect(again.find((x) => x.orderId === 'order-wren-exit')!.recovery).toBe('redeploy');
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L11, [], SEED).success).toBe(false);
    const r1 = simulate(L11, PFT11_TRACE, SEED);
    const r2 = simulate(L11, PFT11_TRACE, SEED);
    expect(r1.finalHash).toBe(r2.finalHash);
    const engine = new PftEngine();
    engine.begin(L11, SEED);
    for (let i = 0; i < PFT11_TRACE.length; i++) {
      expect(engine.commit(engine.propose('t', `d-${i}`, PFT11_TRACE[i]!)).ok).toBe(true);
    }
    const rerun = new PftEngine().replayRun(L11, engine.makeReplay());
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });
});

// ---------------------------------------------------------------------------
// PFT-12 Everything Must Go — the finale: the whole town moves
// ---------------------------------------------------------------------------

const L12 = PFT12_EVERYTHING_MUST_GO;

/**
 * Plan A — "Office first" (44 moves): the sign stands on the new post
 * before any cargo moves; one ferry freight leg (tea in the hold); the
 * mailbag carried by hand; teardown after all west work is done.
 */

/**
 * Plan B — "Close the office last" (42 moves): both parcels go down the
 * wire; Finch carries the packed sign east on the ferry's last sail and
 * keeps it in his satchel through the teardown; the office opens only when
 * every order is settled.
 */

describe('PFT-12 Everything Must Go — acceptance (PFT-D)', () => {
  it('verified plan A "office first": all orders fulfilled', () => {
    const res = simulate(L12, PFT12_TRACE_A, SEED);
    expect(res.success).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of L12.orders) expect(res.finalState.fulfilled[o.id]).toBe(true);
    expect(res.stats.moves).toBe(PFT12_TRACE_A.length);
    // Plan A is the slightly longer strategy — honestly over par by 2.
    expect(res.stats.lateMoves).toBe(2);
    // signature: the ferry did a freight leg (load + unload committed)
    const types = res.committed.map((c) => (c.action as PftAction).type);
    expect(types.filter((t) => t === 'send')).toHaveLength(1);
    expect(types.filter((t) => t === 'load_ferry')).toHaveLength(1);
    expect(types.filter((t) => t === 'unload_ferry')).toHaveLength(1);
    // the office stood from the start: sign deploy is action index 3
    const deployIdx = res.committed.findIndex(
      (c) => (c.action as PftAction).type === 'deploy',
    );
    expect(deployIdx).toBe(3);
  });

  it('verified plan B "close the office last": all orders fulfilled', () => {
    const res = simulate(L12, PFT12_TRACE_B, SEED);
    expect(res.success).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of L12.orders) expect(res.finalState.fulfilled[o.id]).toBe(true);
    expect(res.stats.moves).toBe(PFT12_TRACE_B.length);
    expect(res.stats.lateMoves).toBe(0);
    const types = res.committed.map((c) => (c.action as PftAction).type);
    expect(types.filter((t) => t === 'send')).toHaveLength(2);
    expect(types.filter((t) => t === 'load_ferry')).toHaveLength(0);
    // the office opens as the last act: sign deploy near the end
    const deployIdx = res.committed.findIndex(
      (c) => (c.action as PftAction).type === 'deploy',
    );
    expect(deployIdx).toBe(res.committed.length - 6);
  });

  it('the two plans are genuinely distinct strategies — not permutations', () => {
    const a = simulate(L12, PFT12_TRACE_A, SEED);
    const b = simulate(L12, PFT12_TRACE_B, SEED);
    expect(a.success && b.success).toBe(true);
    // Different commitment signatures: mail-vs-hand for the mailbag
    // (1 vs 2 sends), freight leg vs none (load/unload), and the office
    // move committed at opposite ends of the run.
    const sig = (res: typeof a) =>
      res.committed.map((c) => (c.action as PftAction).type).join(',');
    expect(sig(a)).not.toBe(sig(b));
    const aTypes = a.committed.map((c) => (c.action as PftAction).type);
    const bTypes = b.committed.map((c) => (c.action as PftAction).type);
    expect(aTypes.filter((t) => t === 'send').length).toBe(1);
    expect(bTypes.filter((t) => t === 'send').length).toBe(2);
    expect(aTypes.filter((t) => t === 'load_ferry').length).toBe(1);
    expect(bTypes.filter((t) => t === 'load_ferry').length).toBe(0);
    const aDeploy = aTypes.findIndex((t) => t === 'deploy');
    const bDeploy = bTypes.findIndex((t) => t === 'deploy');
    expect(aDeploy).toBeLessThan(5);
    expect(bDeploy).toBeGreaterThan(bTypes.length - 10);
    // Same destination, different path — the final states agree modulo
    // the move counter (46 vs 44, which the canonical hash rightly sees).
    for (const id of Object.keys(a.finalState.couriers)) {
      expect(b.finalState.couriers[id]?.at).toBe(a.finalState.couriers[id]?.at);
      expect(a.finalState.couriers[id]?.at).toBe('office-new');
    }
    for (const id of Object.keys(a.finalState.pieces)) {
      expect(b.finalState.pieces[id]?.status).toBe(a.finalState.pieces[id]?.status);
    }
    for (const o of L12.orders) {
      expect(a.finalState.fulfilled[o.id]).toBe(true);
      expect(b.finalState.fulfilled[o.id]).toBe(true);
    }
  });

  it('wa: teardown before the move — a sold bridge strands the office move', () => {
    // Pack + sell the plank bridge while the sign still stands on the old
    // post: nothing can reach West to fetch it — no single-piece restore
    // can move the office. Classifier: 'none' — the strongest failure.
    const plan: PftAction[] = [
      { type: 'pack', courierId: W, pieceId: 'bridge-1' },
      { type: 'travel', courierId: W, path: ['east'] },
      { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
    ];
    const { engine, events, failedAt } = run(L12, plan);
    expect(failedAt).toBe(-1);
    // The exits and the mailbag classify 'none' — no single restore can
    // move the office once the sign is marooned. West-side cargo orders
    // read 'redeploy' instead: the carried bridge can be re-set.
    for (const oid of [
      'order-wren-exit',
      'order-finch-exit',
      'order-sparrow-exit',
      'order-mailbag',
    ]) {
      const s = strands(events, oid);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s[s.length - 1]?.data?.['recovery']).toBe('none');
    }
    for (const oid of ['order-tea', 'order-tapestry', 'order-records']) {
      const s = strands(events, oid);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s[s.length - 1]?.data?.['recovery']).toBe('redeploy');
    }
    const st = analyzeOrderStatuses(L12, engine.currentState);
    for (const o of st) {
      if (o.orderId.endsWith('-exit')) expect(o.recovery).toBe('none');
    }
    // And in actual play: nobody can reach West — the sign is marooned.
    const reach = engine.commit(
      engine.propose('t', 'reach', { type: 'travel', courierId: W, path: ['middle', 'west'] }),
    );
    expect(reach.ok).toBe(false);
  });

  it('wa: you cannot mail the post office — send carries parcels only', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L, path: ['west', 'north'] },
      { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'sign-1' },
    ];
    const { failedAt, reason } = run(L12, plan);
    expect(failedAt).toBe(1);
    expect(reason).toContain('only parcels travel postal links');
  });

  it('wa: the dead address — the mailbag refuses the old office', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L, path: ['west', 'north'] },
      { type: 'pickup', courierId: L, itemId: 'mailbag' },
      { type: 'travel', courierId: L, path: ['west', 'office-old'] },
      { type: 'deliver', courierId: L, itemId: 'mailbag', recipientId: 'postmaster-old' },
    ];
    const { failedAt, reason } = run(L12, plan);
    expect(failedAt).toBe(3);
    expect(reason).toContain('no open order');
  });

  it('wa: the old lane does not count — clocking out there finishes nothing', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: F3, path: ['west', 'office-old'] },
    ];
    const { engine, failedAt } = run(L12, plan);
    expect(failedAt).toBe(-1);
    expect(engine.currentState.fulfilled['order-finch-exit']).toBe(false);
  });

  it('wa: sold boat, full hold — the harbor-master refuses a loaded ferry', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: F3, path: ['west'] },
      { type: 'pickup', courierId: F3, itemId: 'tea' },
      { type: 'travel', courierId: F3, path: ['middle'] },
      { type: 'load_ferry', courierId: F3, ferryId: F, itemId: 'tea' },
      { type: 'ride_ferry', courierId: F3, ferryId: F, to: 'east' },
      { type: 'hand_over_ferry', courierId: F3, ferryId: F, recipientId: 'harbor-master' },
    ];
    const { engine, failedAt, reason } = run(L12, plan);
    expect(failedAt).toBe(5);
    expect(reason).toContain('ferry hold must be empty');
    // Unload, then the signature is legal.
    const un = engine.commit(
      engine.propose('t', 'un', { type: 'unload_ferry', courierId: F3, ferryId: F, itemId: 'tea' }),
    );
    expect(un.ok).toBe(true);
    const sign = engine.commit(
      engine.propose('t', 'sign', {
        type: 'hand_over_ferry',
        courierId: F3,
        ferryId: F,
        recipientId: 'harbor-master',
      }),
    );
    expect(sign.ok).toBe(true);
  });

  it('wa: occupied structure — the sign will not pack under an occupant', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: F3, path: ['west', 'office-old'] },
      { type: 'travel', courierId: W, path: ['west'] },
      { type: 'pack', courierId: W, pieceId: 'sign-1' },
    ];
    const { engine, failedAt, reason } = run(L12, plan);
    expect(failedAt).toBe(2);
    expect(reason).toContain('cannot pack');
    const back = engine.commit(
      engine.propose('t', 'back', { type: 'travel', courierId: F3, path: ['west'] }),
    );
    expect(back.ok).toBe(true);
    const lift = engine.commit(
      engine.propose('t', 'lift', { type: 'pack', courierId: W, pieceId: 'sign-1' }),
    );
    expect(lift.ok).toBe(true);
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L12, [], SEED).success).toBe(false);
    const r1 = simulate(L12, PFT12_TRACE_A, SEED);
    const r2 = simulate(L12, PFT12_TRACE_B, SEED);
    expect(simulate(L12, PFT12_TRACE_A, SEED).finalHash).toBe(r1.finalHash);
    expect(simulate(L12, PFT12_TRACE_B, SEED).finalHash).toBe(r2.finalHash);
    const engine = new PftEngine();
    engine.begin(L12, SEED);
    for (let i = 0; i < PFT12_TRACE_A.length; i++) {
      expect(engine.commit(engine.propose('t', `d-${i}`, PFT12_TRACE_A[i]!)).ok).toBe(true);
    }
    const rerun = new PftEngine().replayRun(L12, engine.makeReplay());
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });
});
