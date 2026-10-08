/**
 * PFT-08/09/10 acceptance tests (master §II PFT-D chapter-3
 * "interdependence", §IV.5.2/5.5): four couriers, shared finite routes,
 * tools-before-obligations dependency order, two-network-plan strategies.
 *
 * Per level: verified winning trace(s) pass end-to-end; every designed wrong
 * approach fails for the asserted reason; determinism — same seed, same
 * canonical hash; the untouched start does not win.
 */

import { describe, expect, it } from 'vitest';
import { PftEngine, analyzeOrderStatuses } from '../../src/engine/pft/engine.js';
import { simulate } from '../../src/engine/pft/sim.js';
import { PFT08_NO_ONE_LEFT_ON_WEST } from '../../src/content/levels/pft08-no-one-left-on-west.js';
import { PFT09_THREE_USEFUL_PARCELS } from '../../src/content/levels/pft09-three-useful-parcels.js';
import { PFT10_THE_DETOUR_DIVIDEND } from '../../src/content/levels/pft10-the-detour-dividend.js';
import type { PftAction, PftLevel } from '../../src/engine/pft/types.js';
import type { GameEvent } from '../../src/engine/contracts.js';

const SEED = 'pft08-10-test-seed';

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

const W = 'courier-1';
const L = 'courier-2';
const F3 = 'courier-3';
const S = 'courier-4';
const F = 'ferry-1';

// ---------------------------------------------------------------------------
// PFT-08 No One Left on West — four couriers, all extract past the water
// ---------------------------------------------------------------------------

const L08 = PFT08_NO_ONE_LEFT_ON_WEST;

/** Verified trace — Upland, Market, ferry freight, then the paperwork (21 moves). */
const PFT08_TRACE: PftAction[] = [
  { type: 'travel', courierId: W, path: ['west', 'north'] },
  { type: 'pickup', courierId: W, itemId: 'sunstone' },
  { type: 'travel', courierId: W, path: ['west', 'middle'] },
  { type: 'travel', courierId: W, path: ['east'] }, // walks the Town Span
  { type: 'deliver', courierId: W, itemId: 'sunstone', recipientId: 'archives' },
  { type: 'travel', courierId: L, path: ['west'] },
  { type: 'pickup', courierId: L, itemId: 'ledger' },
  { type: 'travel', courierId: L, path: ['middle', 'east', 'slip'] },
  { type: 'deliver', courierId: L, itemId: 'ledger', recipientId: 'annex' },
  { type: 'travel', courierId: L, path: ['east', 'middle'] },
  { type: 'pack', courierId: L, pieceId: 'bridge-1' },
  { type: 'travel', courierId: L, path: ['east'] }, // carries the plank over the span
  { type: 'deliver', courierId: L, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'travel', courierId: L, path: ['slip'] },
  { type: 'pickup', courierId: F3, itemId: 'engine' },
  { type: 'ride_ferry', courierId: F3, ferryId: F, to: 'east' },
  { type: 'travel', courierId: F3, path: ['slip'] },
  { type: 'deliver', courierId: F3, itemId: 'engine', recipientId: 'drydock' },
  { type: 'hand_over_ferry', courierId: S, ferryId: F, recipientId: 'harbor-master' },
  { type: 'pack', courierId: S, pieceId: 'bridge-2' }, // span lifted at its East foot
  { type: 'deliver', courierId: S, itemId: 'bridge-2', recipientId: 'foundry' },
];

describe('PFT-08 No One Left on West — acceptance (PFT-D)', () => {
  it('verified trace passes: every job done, all four couriers off West', () => {
    const res = simulate(L08, PFT08_TRACE, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of L08.orders) expect(res.finalState.fulfilled[o.id]).toBe(true);
    expect(res.stats.moves).toBe(21);
    expect(res.stats.lateMoves).toBe(0);
    // Nobody rides except Finch; three couriers cross on foot over the span.
    const rides = res.committed.filter((c) => (c.action as PftAction).type === 'ride_ferry');
    expect(rides).toHaveLength(1);
    const sold = res.events.find((e) => e.type === 'ferry.handed_over');
    expect(sold?.data?.['recipientId']).toBe('harbor-master');
    expect(res.events.filter((e) => e.type === 'order.stranded')).toHaveLength(0);
  });

  it('wa: pack the plank bridge under the runners — several orders strand', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: W, path: ['west', 'north'] },
      { type: 'pickup', courierId: W, itemId: 'sunstone' },
      { type: 'travel', courierId: W, path: ['west'] }, // Wren on the bank
      { type: 'pack', courierId: L, pieceId: 'bridge-1' }, // Lark lifts it at Middle
      { type: 'travel', courierId: L, path: ['east'] },
      { type: 'deliver', courierId: L, itemId: 'bridge-1', recipientId: 'museum' },
      // The Town Span could still be re-set West — recovery stays 'redeploy'
      // until EVERY compatible piece is consumed.
      { type: 'pack', courierId: S, pieceId: 'bridge-2' },
      { type: 'deliver', courierId: S, itemId: 'bridge-2', recipientId: 'foundry' },
    ];
    const { engine, events, failedAt } = run(L08, plan);
    expect(failedAt).toBe(-1);
    // Three strands at once: the fetched parcel, the waiting parcel, the courier.
    for (const oid of ['order-sunstone', 'order-ledger', 'order-wren-exit']) {
      const s = strands(events, oid);
      expect(s.length).toBeGreaterThanOrEqual(2);
      expect(s[0]?.data?.['recovery']).toBe('redeploy');
      expect(s[s.length - 1]?.data?.['recovery']).toBe('undo');
    }
    const st = analyzeOrderStatuses(L08, engine.currentState);
    expect(st.find((s) => s.orderId === 'order-wren-exit')!.achievable).toBe(false);
    // Recovery: undo the five infrastructure commits (two packs, two
    // deliveries, Lark's crossing) and the plank bridge stands again.
    for (let i = 0; i < 5; i++) expect(engine.undo().ok).toBe(true);
    const home = engine.commit(
      engine.propose('t', 'home', { type: 'travel', courierId: W, path: ['middle'] }),
    );
    expect(home.ok).toBe(true);
    expect(engine.currentState.couriers[W]?.at).toBe('middle');
  });

  it('wa: ferry sold AND span lifted — Middle has no water route at all', () => {
    const plan: PftAction[] = [
      { type: 'pickup', courierId: F3, itemId: 'engine' },
      { type: 'ride_ferry', courierId: F3, ferryId: F, to: 'east' },
      { type: 'hand_over_ferry', courierId: S, ferryId: F, recipientId: 'harbor-master' },
      { type: 'pack', courierId: S, pieceId: 'bridge-2' },
      { type: 'deliver', courierId: S, itemId: 'bridge-2', recipientId: 'foundry' },
    ];
    const { engine, events, failedAt } = run(L08, plan);
    expect(failedAt).toBe(-1);
    // The hand-over alone strands nothing (the span still carries) — the
    // pack is what severs Middle from East. Couriers there only need the
    // channel crossing: the plank bridge could be re-set on it, so their
    // exits stay 'redeploy'-recoverable.
    for (const oid of ['order-lark-exit', 'order-wren-exit']) {
      const s = strands(events, oid);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s.every((x) => x.data?.['recovery'] === 'redeploy')).toBe(true);
    }
    // Parcels parked on the far bank need BOTH crossings — only undoing the
    // delivered span restores the whole chain.
    for (const oid of ['order-sunstone', 'order-ledger']) {
      const s = strands(events, oid);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s[s.length - 1]?.data?.['recovery']).toBe('undo');
    }
    const st = analyzeOrderStatuses(L08, engine.currentState);
    expect(st.find((s) => s.orderId === 'order-lark-exit')!.achievable).toBe(false);
    // Undo the foundry hand-in and the pack — the span stands again.
    expect(engine.undo().ok).toBe(true);
    expect(engine.undo().ok).toBe(true);
    const again = analyzeOrderStatuses(L08, engine.currentState);
    expect(again.find((s) => s.orderId === 'order-lark-exit')!.achievable).toBe(true);
  });

  it('wa: the hold must ride in empty for the sale', () => {
    const plan: PftAction[] = [
      { type: 'load_ferry', courierId: F3, ferryId: F, itemId: 'engine' },
      { type: 'ride_ferry', courierId: F3, ferryId: F, to: 'east' },
      { type: 'hand_over_ferry', courierId: S, ferryId: F, recipientId: 'harbor-master' },
    ];
    const { failedAt, reason } = run(L08, plan);
    expect(failedAt).toBe(2);
    expect(reason).toContain('hold must be empty');
  });

  it('wa: shore-side handling is at East — signing over from Middle is refused', () => {
    const { failedAt, reason } = run(L08, [
      { type: 'hand_over_ferry', courierId: W, ferryId: F, recipientId: 'harbor-master' },
    ]);
    expect(failedAt).toBe(0);
    expect(reason).toContain('shore-side handling is at east');
  });

  it('wa: the sold boat stops sailing — riding after hand-over is refused', () => {
    const plan: PftAction[] = [
      { type: 'ride_ferry', courierId: F3, ferryId: F, to: 'east' },
      { type: 'hand_over_ferry', courierId: S, ferryId: F, recipientId: 'harbor-master' },
      { type: 'ride_ferry', courierId: F3, ferryId: F, to: 'middle' },
    ];
    const { failedAt, reason } = run(L08, plan);
    expect(failedAt).toBe(2);
    expect(reason).toContain('handed over');
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L08, [], SEED).success).toBe(false);
    const r1 = simulate(L08, PFT08_TRACE, SEED);
    const r2 = simulate(L08, PFT08_TRACE, SEED);
    expect(r1.finalHash).toBe(r2.finalHash);
    const engine = new PftEngine();
    engine.begin(L08, SEED);
    for (let i = 0; i < PFT08_TRACE.length; i++) {
      expect(engine.commit(engine.propose('t', `d-${i}`, PFT08_TRACE[i]!)).ok).toBe(true);
    }
    const rerun = new PftEngine().replayRun(L08, engine.makeReplay());
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });
});

// ---------------------------------------------------------------------------
// PFT-09 Three Useful Parcels — tools before obligations, dependency order
// ---------------------------------------------------------------------------

const L09 = PFT09_THREE_USEFUL_PARCELS;

/** Verified trace — postal run, stair fetch, market fetch, four ferry legs (38 moves). */
const PFT09_TRACE: PftAction[] = [
  // Lark — the postal leg.
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'records' },
  { type: 'pack', courierId: L, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // home at the North post
  // Finch — the stair leg.
  { type: 'travel', courierId: F3, path: ['west', 'loft'] },
  { type: 'pickup', courierId: F3, itemId: 'tapestry' },
  { type: 'travel', courierId: F3, path: ['west', 'middle'] },
  { type: 'drop', courierId: F3, itemId: 'tapestry' }, // staged for the boat
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pack', courierId: F3, pieceId: 'stair-1' }, // loft empty — legal
  { type: 'travel', courierId: F3, path: ['middle'] },
  { type: 'drop', courierId: F3, itemId: 'stair-1' },
  // Wren — the market leg.
  { type: 'travel', courierId: W, path: ['west'] },
  { type: 'pickup', courierId: W, itemId: 'tea' },
  { type: 'travel', courierId: W, path: ['middle'] },
  { type: 'drop', courierId: W, itemId: 'tea' },
  { type: 'travel', courierId: W, path: ['west'] }, // home at the West gate
  // Sparrow — the ferryman and closer.
  { type: 'pickup', courierId: S, itemId: 'tea' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: S, itemId: 'tea', recipientId: 'conservatory' },
  { type: 'pickup', courierId: S, itemId: 'records' },
  { type: 'deliver', courierId: S, itemId: 'records', recipientId: 'archives' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: S, itemId: 'tapestry' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'travel', courierId: S, path: ['slip'] },
  { type: 'deliver', courierId: S, itemId: 'tapestry', recipientId: 'gallery' },
  { type: 'travel', courierId: S, path: ['east'] },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: S, itemId: 'stair-1' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: S, itemId: 'stair-1', recipientId: 'observatory' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: S, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: S, itemId: 'bridge-1', recipientId: 'museum' },
];

describe('PFT-09 Three Useful Parcels — acceptance (PFT-D)', () => {
  it('verified trace passes: tools earn their keep before becoming cargo', () => {
    const res = simulate(L09, PFT09_TRACE, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of L09.orders) expect(res.finalState.fulfilled[o.id]).toBe(true);
    expect(res.stats.moves).toBe(38);
    expect(res.stats.lateMoves).toBe(0);
    // The records moved by wire, the stair became freight, no one stranded.
    const sent = res.events.find((e) => e.type === 'parcel.sent');
    expect(sent?.entityId).toBe('records');
    expect(
      res.committed.filter((c) => (c.action as PftAction).type === 'ride_ferry'),
    ).toHaveLength(7);
    expect(res.events.filter((e) => e.type === 'order.stranded')).toHaveLength(0);
  });

  it('wa: the apparent cycle — bridge sold while the stair-runner is still west', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L, path: ['west', 'north'] },
      { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'records' },
      { type: 'pack', courierId: L, pieceId: 'mailbox-1' }, // mail goes dead
      { type: 'travel', courierId: L, path: ['west', 'middle'] },
      { type: 'deliver', courierId: L, itemId: 'mailbox-1', recipientId: 'depot' },
      { type: 'travel', courierId: L, path: ['west', 'north'] },
      { type: 'travel', courierId: F3, path: ['west', 'loft'] },
      { type: 'pickup', courierId: F3, itemId: 'tapestry' },
      { type: 'travel', courierId: F3, path: ['west'] }, // Finch on the bank
      { type: 'pack', courierId: S, pieceId: 'bridge-1' },
      { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: S, itemId: 'bridge-1', recipientId: 'museum' },
    ];
    const { engine, events, failedAt } = run(L09, plan);
    expect(failedAt).toBe(-1);
    // Bridge gone + mail dead: the runner, the tea, and the tapestry all
    // strand together. Recovery stays 'redeploy' — the staircase is a
    // socket-compatible piece that could hypothetically be re-set on the
    // crossing (the hypothesis pass does not apply the PFT-009 height gate).
    for (const oid of ['order-finch-exit', 'order-tea', 'order-tapestry']) {
      const s = strands(events, oid);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s.every((x) => x.data?.['recovery'] === 'redeploy')).toBe(true);
    }
    const st = analyzeOrderStatuses(L09, engine.currentState);
    expect(st.find((s) => s.orderId === 'order-finch-exit')!.achievable).toBe(false);
    // The mailed records are already safe — the strand set spares them.
    expect(st.find((s) => s.orderId === 'order-records')!.achievable).toBe(true);
    expect(engine.currentState.completed).toBe(false);
    // Undo restores: un-deliver, un-ride, un-pack — the runner crosses again.
    for (let i = 0; i < 3; i++) expect(engine.undo().ok).toBe(true);
    const back = engine.commit(
      engine.propose('t', 'back', { type: 'travel', courierId: F3, path: ['middle'] }),
    );
    expect(back.ok).toBe(true);
  });

  it('wa: the staircase cannot be lifted under an occupant (PFT-006)', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: F3, path: ['west', 'loft'] }, // Finch aloft
      { type: 'travel', courierId: W, path: ['west'] },
      { type: 'pack', courierId: W, pieceId: 'stair-1' },
    ];
    const { failedAt, reason } = run(L09, plan);
    expect(failedAt).toBe(2);
    expect(reason).toContain('cannot pack');
    expect(reason).toContain('Courier Finch');
  });

  it('wa: nor under the cargo still resting on it', () => {
    const { failedAt, reason } = run(L09, [
      { type: 'travel', courierId: W, path: ['west'] },
      { type: 'pack', courierId: W, pieceId: 'stair-1' }, // tapestry still staged on the loft
    ]);
    expect(failedAt).toBe(1);
    expect(reason).toContain('cannot pack');
    expect(reason).toContain('Tapestry');
  });

  it('wa: pack the post, silence the wire — send refused once packed', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L, path: ['west', 'north'] },
      { type: 'pack', courierId: L, pieceId: 'mailbox-1' },
      { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'records' },
    ];
    const { failedAt, reason } = run(L09, plan);
    expect(failedAt).toBe(2);
    expect(reason).toContain('link inactive');
  });

  it('wa: the elm staircase refuses the flat span (PFT-009)', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: F3, path: ['west', 'loft'] },
      { type: 'pickup', courierId: F3, itemId: 'tapestry' },
      { type: 'travel', courierId: F3, path: ['west'] },
      { type: 'drop', courierId: F3, itemId: 'tapestry' },
      { type: 'pack', courierId: F3, pieceId: 'stair-1' },
      { type: 'travel', courierId: F3, path: ['middle'] }, // Finch home with the stair
      { type: 'pack', courierId: W, pieceId: 'bridge-1' }, // free the flat socket
      {
        type: 'deploy',
        courierId: F3,
        pieceId: 'stair-1',
        siteId: 'socket-west-middle',
      },
    ];
    const { failedAt, reason } = run(L09, plan);
    expect(failedAt).toBe(7);
    expect(reason).toContain('differing declared heights');
  });

  it('wa: the hold takes one parcel — a second is refused', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: W, path: ['west'] },
      { type: 'pickup', courierId: W, itemId: 'tea' },
      { type: 'travel', courierId: W, path: ['middle'] },
      { type: 'drop', courierId: W, itemId: 'tea' },
      { type: 'travel', courierId: F3, path: ['west', 'loft'] },
      { type: 'pickup', courierId: F3, itemId: 'tapestry' },
      { type: 'travel', courierId: F3, path: ['west', 'middle'] },
      { type: 'drop', courierId: F3, itemId: 'tapestry' },
      { type: 'load_ferry', courierId: S, ferryId: F, itemId: 'tea' },
      { type: 'load_ferry', courierId: S, ferryId: F, itemId: 'tapestry' },
    ];
    const { failedAt, reason } = run(L09, plan);
    expect(failedAt).toBe(9);
    expect(reason).toContain('parcel capacity 1');
  });

  it('wa: a carried parcel will not mail — it must be staged on the post', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: W, path: ['west'] },
      { type: 'pickup', courierId: W, itemId: 'tea' },
      { type: 'travel', courierId: W, path: ['north'] },
      { type: 'send', courierId: W, linkId: 'link-north-east', parcelId: 'tea' },
    ];
    const { failedAt, reason } = run(L09, plan);
    expect(failedAt).toBe(3);
    expect(reason).toContain('not staged at north');
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L09, [], SEED).success).toBe(false);
    const r1 = simulate(L09, PFT09_TRACE, SEED);
    const r2 = simulate(L09, PFT09_TRACE, SEED);
    expect(r1.finalHash).toBe(r2.finalHash);
    const engine = new PftEngine();
    engine.begin(L09, SEED);
    for (let i = 0; i < PFT09_TRACE.length; i++) {
      expect(engine.commit(engine.propose('t', `d-${i}`, PFT09_TRACE[i]!)).ok).toBe(true);
    }
    const rerun = new PftEngine().replayRun(L09, engine.makeReplay());
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });
});

// ---------------------------------------------------------------------------
// PFT-10 The Detour Dividend — two workable network plans
// ---------------------------------------------------------------------------

const L10 = PFT10_THE_DETOUR_DIVIDEND;

/** Plan A — "Ferry freight": bridge anchored West; mail for deeds; ferry for the rest (28). */
const PFT10_TRACE_A: PftAction[] = [
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pickup', courierId: F3, itemId: 'cider' },
  { type: 'travel', courierId: F3, path: ['middle'] },
  { type: 'drop', courierId: F3, itemId: 'cider' },
  { type: 'travel', courierId: F3, path: ['west'] }, // West gate
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'deeds' },
  { type: 'pack', courierId: L, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // North post
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'pickup', courierId: S, itemId: 'deeds' },
  { type: 'deliver', courierId: S, itemId: 'deeds', recipientId: 'registry' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' }, // dock office
  { type: 'pickup', courierId: W, itemId: 'cider' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'cider', recipientId: 'tavern' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: W, itemId: 'granite' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'travel', courierId: W, path: ['slip'] },
  { type: 'deliver', courierId: W, itemId: 'granite', recipientId: 'monument' },
  { type: 'travel', courierId: W, path: ['east'] },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
];

/** Plan B — "The span pays": mail the west cargo, carry the bridge east, re-set it as the crossing (28). */
const PFT10_TRACE_B: PftAction[] = [
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pickup', courierId: F3, itemId: 'cider' },
  { type: 'travel', courierId: F3, path: ['north'] },
  { type: 'drop', courierId: F3, itemId: 'cider' },
  { type: 'send', courierId: F3, linkId: 'link-north-east', parcelId: 'cider' },
  { type: 'travel', courierId: F3, path: ['west'] }, // West gate
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'deeds' },
  { type: 'pack', courierId: L, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // North post
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deploy', courierId: W, pieceId: 'bridge-1', siteId: 'socket-town-span' },
  { type: 'travel', courierId: W, path: ['middle'] }, // walks the span it just set
  { type: 'pickup', courierId: W, itemId: 'granite' },
  { type: 'travel', courierId: W, path: ['east', 'slip'] },
  { type: 'deliver', courierId: W, itemId: 'granite', recipientId: 'monument' },
  { type: 'travel', courierId: W, path: ['east'] },
  { type: 'pickup', courierId: W, itemId: 'cider' },
  { type: 'deliver', courierId: W, itemId: 'cider', recipientId: 'tavern' },
  { type: 'travel', courierId: S, path: ['east'] }, // Sparrow walks the span too
  { type: 'pickup', courierId: S, itemId: 'deeds' },
  { type: 'deliver', courierId: S, itemId: 'deeds', recipientId: 'registry' },
  { type: 'travel', courierId: S, path: ['middle'] }, // back over it — dock office
  { type: 'pack', courierId: W, pieceId: 'bridge-1' }, // the span lifted at its East foot
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
];

describe('PFT-10 The Detour Dividend — acceptance (PFT-D, two network plans)', () => {
  it('plan A passes: ferry freight, bridge anchored on the west creek', () => {
    const res = simulate(L10, PFT10_TRACE_A, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of L10.orders) expect(res.finalState.fulfilled[o.id]).toBe(true);
    expect(res.stats.moves).toBe(28);
    // Signature: seven ferry legs, one send, never touches the channel socket.
    expect(
      res.committed.filter((c) => (c.action as PftAction).type === 'ride_ferry'),
    ).toHaveLength(7);
    expect(
      res.committed.filter((c) => (c.action as PftAction).type === 'send'),
    ).toHaveLength(1);
    expect(
      res.committed.filter(
        (c) =>
          (c.action as PftAction).type === 'deploy' &&
          (c.action as { siteId?: string }).siteId === 'socket-town-span',
      ),
    ).toHaveLength(0);
  });

  it('plan B passes: the span is the crossing — one ferry leg, two sends', () => {
    const res = simulate(L10, PFT10_TRACE_B, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of L10.orders) expect(res.finalState.fulfilled[o.id]).toBe(true);
    expect(res.stats.moves).toBe(28);
    // Signature: exactly one ferry leg (to set the span), two sends, one deploy.
    expect(
      res.committed.filter((c) => (c.action as PftAction).type === 'ride_ferry'),
    ).toHaveLength(1);
    expect(
      res.committed.filter((c) => (c.action as PftAction).type === 'send'),
    ).toHaveLength(2);
    const deploy = res.events.find((e) => e.type === 'piece.deployed');
    expect(deploy?.data?.['siteId']).toBe('socket-town-span');
    // The span is packed twice-in-one-night: west pack, east re-pack.
    expect(
      res.events.filter((e) => e.type === 'piece.packed' && e.entityId === 'bridge-1'),
    ).toHaveLength(2);
  });

  it('the two plans are not permutations — different deployment/commitment signatures', () => {
    const a = simulate(L10, PFT10_TRACE_A, SEED);
    const b = simulate(L10, PFT10_TRACE_B, SEED);
    // Both plans converge on the same final state by design (same orders,
    // same exits) — the signature difference is the ACTION stream, not the
    // destination.
    expect(
      a.committed.map((c) => (c.action as PftAction).type).join(','),
    ).not.toBe(b.committed.map((c) => (c.action as PftAction).type).join(','));
    const typeCount = (res: typeof a, t: string) =>
      res.committed.filter((c) => (c.action as PftAction).type === t).length;
    expect(typeCount(a, 'ride_ferry')).toBe(7);
    expect(typeCount(b, 'ride_ferry')).toBe(1);
    expect(typeCount(a, 'deploy')).toBe(0);
    expect(typeCount(b, 'deploy')).toBe(1);
    expect(typeCount(a, 'send')).toBe(1);
    expect(typeCount(b, 'send')).toBe(2);
  });

  it('wa: trap a runner — pack the west bridge while Wren is on the bank', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: W, path: ['west'] },
      { type: 'pack', courierId: S, pieceId: 'bridge-1' },
      { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: S, itemId: 'bridge-1', recipientId: 'museum' },
    ];
    const { events, failedAt } = run(L10, plan);
    expect(failedAt).toBe(-1);
    const s = strands(events, 'order-wren-exit');
    expect(s.length).toBeGreaterThanOrEqual(2);
    expect(s[0]?.data?.['recovery']).toBe('redeploy');
    expect(s[s.length - 1]?.data?.['recovery']).toBe('undo');
    // The mail still covers west cargo — parcels are not what strands.
    // (cider@west can still reach tavern via post + link.)
  });

  it('wa: the channel socket is handled from the East foot', () => {
    const plan: PftAction[] = [
      { type: 'pack', courierId: W, pieceId: 'bridge-1' },
      { type: 'deploy', courierId: W, pieceId: 'bridge-1', siteId: 'socket-town-span' },
    ];
    const { failedAt, reason } = run(L10, plan);
    expect(failedAt).toBe(1);
    expect(reason).toContain('handled from east');
  });

  it('wa: pack the post, silence the wire — send refused once packed', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L, path: ['west', 'north'] },
      { type: 'pack', courierId: L, pieceId: 'mailbox-1' },
      { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'deeds' },
    ];
    const { failedAt, reason } = run(L10, plan);
    expect(failedAt).toBe(2);
    expect(reason).toContain('link inactive');
  });

  it('wa: the post will not take a bridge — kind mismatch (PFT-007)', () => {
    const plan: PftAction[] = [
      { type: 'pack', courierId: W, pieceId: 'bridge-1' },
      { type: 'deploy', courierId: W, pieceId: 'bridge-1', siteId: 'socket-north-post' },
    ];
    const { failedAt, reason } = run(L10, plan);
    expect(failedAt).toBe(1);
    expect(reason).toContain('does not accept bridge');
  });

  it('wa: the hold takes one parcel — a second is refused', () => {
    const plan: PftAction[] = [
      { type: 'load_ferry', courierId: S, ferryId: F, itemId: 'granite' },
      { type: 'travel', courierId: W, path: ['west'] },
      { type: 'pickup', courierId: W, itemId: 'cider' },
      { type: 'travel', courierId: W, path: ['middle'] },
      { type: 'drop', courierId: W, itemId: 'cider' },
      { type: 'load_ferry', courierId: S, ferryId: F, itemId: 'cider' },
    ];
    const { failedAt, reason } = run(L10, plan);
    expect(failedAt).toBe(5);
    expect(reason).toContain('parcel capacity 1');
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L10, [], SEED).success).toBe(false);
    for (const plan of [PFT10_TRACE_A, PFT10_TRACE_B]) {
      const r1 = simulate(L10, plan, SEED);
      const r2 = simulate(L10, plan, SEED);
      expect(r1.finalHash).toBe(r2.finalHash);
      const engine = new PftEngine();
      engine.begin(L10, SEED);
      for (let i = 0; i < plan.length; i++) {
        expect(engine.commit(engine.propose('t', `d-${i}`, plan[i]!)).ok).toBe(true);
      }
      const rerun = new PftEngine().replayRun(L10, engine.makeReplay());
      expect(rerun.ok).toBe(true);
      expect(rerun.finalHash).toBe(r1.finalHash);
    }
  });
});
