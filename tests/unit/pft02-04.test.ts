/**
 * PFT-02/03/04 acceptance tests (master §II PFT-D, §IV.5.2/5.5, PFT-F).
 *
 * Per level: the verified winning trace(s) pass end-to-end; every designed
 * wrong approach fails for the asserted reason (stranded courier vs missing
 * cargo vs capacity vs legality rejection); determinism — same seed, same
 * canonical hash; the untouched start does not win.
 */

import { describe, expect, it } from 'vitest';
import { PftEngine, analyzeOrderStatuses } from '../../src/engine/pft/engine.js';
import { simulate } from '../../src/engine/pft/sim.js';
import { PFT02_TWO_PARCELS_ONE_BOAT } from '../../src/content/levels/pft02-two-parcels-one-boat.js';
import { PFT03_A_BRIDGE_WITH_TWO_ADDRESSES } from '../../src/content/levels/pft03-a-bridge-with-two-addresses.js';
import { PFT04_THE_UPSTAIRS_ADDRESS } from '../../src/content/levels/pft04-the-upstairs-address.js';
import type { PftAction, PftLevel } from '../../src/engine/pft/types.js';
import type { GameEvent } from '../../src/engine/contracts.js';

const SEED = 'pft02-04-test-seed';

/** Commit a plan through a live session, collecting every emitted event. */
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

const strandedEvents = (events: GameEvent[], orderId: string) =>
  events.filter((e) => e.type === 'order.stranded' && e.entityId === orderId);

// ---------------------------------------------------------------------------
// PFT-02 Two Parcels, One Boat
// ---------------------------------------------------------------------------

const L02 = PFT02_TWO_PARCELS_ONE_BOAT;
const W = 'courier-1';
const L = 'courier-2';
const F = 'ferry-1';

/** Trace A — Lark ferries the crate herself; Wren sells the bridge last (16 moves). */
const PFT02_TRACE_A: PftAction[] = [
  { type: 'travel', courierId: W, path: ['west'] },
  { type: 'pickup', courierId: W, itemId: 'lantern' },
  { type: 'travel', courierId: W, path: ['middle'] },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'lantern', recipientId: 'orchard' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'pickup', courierId: L, itemId: 'crate' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'ride_ferry', courierId: L, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: L, itemId: 'crate', recipientId: 'greenhouse' },
  { type: 'ride_ferry', courierId: L, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // Lark home
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
];

/** Trace B — Middle handoff: Lark stages the crate, Wren ships both parcels (18 moves). */
const PFT02_TRACE_B: PftAction[] = [
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'pickup', courierId: L, itemId: 'crate' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'drop', courierId: L, itemId: 'crate' }, // the handoff: staged on Middle
  { type: 'travel', courierId: W, path: ['west'] },
  { type: 'pickup', courierId: W, itemId: 'lantern' },
  { type: 'travel', courierId: W, path: ['middle'] },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // Lark home
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'lantern', recipientId: 'orchard' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: W, itemId: 'crate' }, // Wren takes the staged crate
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'crate', recipientId: 'greenhouse' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
];

describe('PFT-02 Two Parcels, One Boat — acceptance (PFT-D)', () => {
  it('trace A passes: Lark delivers the crate, walks home, Wren sells the bridge last', () => {
    const res = simulate(L02, PFT02_TRACE_A, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of ['order-lantern', 'order-crate', 'order-bridge', 'order-wren-exit', 'order-lark-exit']) {
      expect(res.finalState.fulfilled[o]).toBe(true);
    }
    expect(res.stats.moves).toBe(16);
    expect(res.stats.lateMoves).toBe(0);
  });

  it('trace B passes: staged-cargo handoff — a different resource-assignment signature', () => {
    const res = simulate(L02, PFT02_TRACE_B, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    // Signature difference: the crate crosses via drop/pickup staging, and Lark
    // never rides the ferry in B (she walks home before the shipping run).
    expect(res.committed.filter((c) => (c.action as PftAction).type === 'drop')).toHaveLength(1);
    const larkRides = res.committed.filter(
      (c) => (c.action as PftAction).type === 'ride_ferry' && (c.action as { courierId: string }).courierId === L,
    );
    expect(larkRides).toHaveLength(0);
    expect(res.stats.lateMoves).toBe(2); // 18 moves, par 16
  });

  it('wa: sell the bridge while Lark still needs it — stranded courier, undo-only', () => {
    // Lark rides east to deliver the crate; the bridge ships while her North dock
    // exit still needs it. Lark can come back across the ferry, but Middle alone
    // never reaches North — the packed bridge is the whole way home.
    const plan: PftAction[] = [
      ...PFT02_TRACE_A.slice(0, 11), // lantern delivered; Lark delivered the crate to East
      { type: 'pack', courierId: W, pieceId: 'bridge-1' }, // strand: 'redeploy'
      { type: 'ride_ferry', courierId: L, ferryId: F, to: 'middle' }, // home shore, still stuck
      { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' }, // 'undo'
    ];
    const { engine, events, failedAt } = run(L02, plan);
    expect(failedAt).toBe(-1);

    const strands = strandedEvents(events, 'order-lark-exit');
    expect(strands.length).toBeGreaterThanOrEqual(2);
    expect(strands[0]?.data?.['recovery']).toBe('redeploy'); // packed, still owned
    expect(strands[strands.length - 1]?.data?.['recovery']).toBe('undo'); // handed over

    const lark = analyzeOrderStatuses(L02, engine.currentState).find(
      (s) => s.orderId === 'order-lark-exit',
    )!;
    expect(lark.achievable).toBe(false);
    expect(lark.recovery).toBe('undo');
    expect(engine.currentState.fulfilled['order-lark-exit']).toBe(false);
    expect(engine.currentState.completed).toBe(false);

    // The supported recovery: undo the handover and the ride, redeploy the
    // bridge, send Lark home, then sell it again.
    expect(engine.undo().ok).toBe(true); // undo deliver
    expect(engine.undo().ok).toBe(true); // undo the ferry ride — bridge carried on Middle
    const larkHome: PftAction[] = [
      { type: 'deploy', courierId: W, pieceId: 'bridge-1', siteId: 'socket-west-middle' },
      { type: 'travel', courierId: L, path: ['west', 'north'] },
      { type: 'pack', courierId: W, pieceId: 'bridge-1' },
      { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
    ];
    for (let i = 0; i < larkHome.length; i++) {
      expect(engine.commit(engine.propose('t', `lh-${i}`, larkHome[i]!)).ok).toBe(true);
    }
    expect(engine.acceptResult().accepted).toBe(true);
  });

  it('wa: bridge sold before the orchard work is done — missing cargo, undo-only', () => {
    const plan: PftAction[] = [
      ...PFT02_TRACE_A.slice(0, 6), // only the lantern ferried; crate still on North
      { type: 'pack', courierId: W, pieceId: 'bridge-1' },
      { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
    ];
    const { engine, events } = run(L02, plan);
    const strands = strandedEvents(events, 'order-crate');
    expect(strands.length).toBeGreaterThanOrEqual(2);
    expect(strands[0]?.data?.['recovery']).toBe('redeploy');
    expect(strands[strands.length - 1]?.data?.['recovery']).toBe('undo');

    const crate = analyzeOrderStatuses(L02, engine.currentState).find(
      (s) => s.orderId === 'order-crate',
    )!;
    expect(crate.achievable).toBe(false);
    expect(crate.recovery).toBe('undo');
  });

  it('wa: both parcels cannot share one boat — capacity rejection (PFT-004)', () => {
    const engine = new PftEngine();
    engine.begin(L02, SEED);
    const steps: PftAction[] = [
      { type: 'travel', courierId: W, path: ['west'] },
      { type: 'pickup', courierId: W, itemId: 'lantern' },
      { type: 'travel', courierId: W, path: ['middle'] },
      { type: 'load_ferry', courierId: W, ferryId: F, itemId: 'lantern' }, // hold: lantern
      { type: 'travel', courierId: L, path: ['west', 'north'] },
      { type: 'pickup', courierId: L, itemId: 'crate' },
      { type: 'travel', courierId: L, path: ['west', 'middle'] }, // Lark carries the crate
    ];
    for (let i = 0; i < steps.length; i++) {
      expect(engine.commit(engine.propose('t', `c-${i}`, steps[i]!)).ok).toBe(true);
    }
    // hold (1) + Lark's carried crate (1) = 2 parcels aboard > capacity 1.
    const ride: PftAction = { type: 'ride_ferry', courierId: L, ferryId: F, to: 'east' };
    const v = engine.validateAction(L02, engine.currentState, ride);
    expect(v.ok).toBe(false);
    expect(v.reason).toContain('capacity');
    expect(v.reason).toContain('2');
    const res = engine.commit(engine.propose('t', 'ride', ride));
    expect(res.ok).toBe(false);
  });

  it('wa: the lantern has no order at the greenhouse — identity rejection', () => {
    const engine = new PftEngine();
    engine.begin(L02, SEED);
    const steps: PftAction[] = [
      { type: 'travel', courierId: W, path: ['west'] },
      { type: 'pickup', courierId: W, itemId: 'lantern' },
      { type: 'travel', courierId: W, path: ['middle'] },
      { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
    ];
    for (let i = 0; i < steps.length; i++) {
      expect(engine.commit(engine.propose('t', `i-${i}`, steps[i]!)).ok).toBe(true);
    }
    const res = engine.commit(
      engine.propose('t', 'wrong-rcpt', {
        type: 'deliver',
        courierId: W,
        itemId: 'lantern',
        recipientId: 'greenhouse',
      }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('no open order');
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L02, [], SEED).success).toBe(false);
    const r1 = simulate(L02, PFT02_TRACE_A, SEED);
    const r2 = simulate(L02, PFT02_TRACE_A, SEED);
    expect(r1.finalHash).toBe(r2.finalHash);
    const engine = new PftEngine();
    engine.begin(L02, SEED);
    for (let i = 0; i < PFT02_TRACE_A.length; i++) {
      expect(engine.commit(engine.propose('t', `d-${i}`, PFT02_TRACE_A[i]!)).ok).toBe(true);
    }
    const rerun = new PftEngine().replayRun(L02, engine.makeReplay());
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });
});

// ---------------------------------------------------------------------------
// PFT-03 A Bridge With Two Addresses
// ---------------------------------------------------------------------------

const L03 = PFT03_A_BRIDGE_WITH_TWO_ADDRESSES;
const C3 = 'courier-1';

/** Verified trace — bridge serves the West creek, is re-set on the North creek, then sold. */
const PFT03_TRACE: PftAction[] = [
  { type: 'travel', courierId: C3, path: ['west'] },
  { type: 'pickup', courierId: C3, itemId: 'lantern' },
  { type: 'travel', courierId: C3, path: ['middle'] },
  { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C3, itemId: 'lantern', recipientId: 'orchard' },
  { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: C3, pieceId: 'bridge-1' }, // lift off the West creek
  { type: 'deploy', courierId: C3, pieceId: 'bridge-1', siteId: 'socket-north-middle' },
  { type: 'travel', courierId: C3, path: ['north'] },
  { type: 'pickup', courierId: C3, itemId: 'crate' },
  { type: 'travel', courierId: C3, path: ['middle'] },
  { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C3, itemId: 'crate', recipientId: 'boathouse' },
  { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: C3, pieceId: 'bridge-1' }, // lift off the North creek
  { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C3, itemId: 'bridge-1', recipientId: 'museum' },
];

describe('PFT-03 A Bridge With Two Addresses — acceptance (PFT-D)', () => {
  it('verified trace passes: one bridge, two creeks, then the museum', () => {
    const res = simulate(L03, PFT03_TRACE, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of ['order-lantern', 'order-crate', 'order-bridge', 'order-wren-exit']) {
      expect(res.finalState.fulfilled[o]).toBe(true);
    }
    expect(res.stats.moves).toBe(17);
    expect(res.stats.lateMoves).toBe(0);
    // The lesson shows in the event log: two packings and one redeployment.
    expect(res.events.filter((e) => e.type === 'piece.packed')).toHaveLength(2);
    const deploy = res.events.find((e) => e.type === 'piece.deployed');
    expect(deploy?.data?.['siteId']).toBe('socket-north-middle');
  });

  it('independent proof of every handling point (PFT-D)', () => {
    const engine = new PftEngine();
    engine.begin(L03, SEED);
    // At start: pack from Middle off the West socket is legal; deploy at North is not
    // (the piece is not packed cargo yet).
    const initial = engine.getLegalActions(L03, engine.currentState);
    expect(initial).toContainEqual({ type: 'pack', courierId: C3, pieceId: 'bridge-1' });
    expect(initial).not.toContainEqual({
      type: 'deploy',
      courierId: C3,
      pieceId: 'bridge-1',
      siteId: 'socket-north-middle',
    });

    const prefix: PftAction[] = PFT03_TRACE.slice(0, 7); // fetch lantern, ferry it out, pack
    for (let i = 0; i < prefix.length; i++) {
      expect(engine.commit(engine.propose('t', `h-${i}`, prefix[i]!)).ok).toBe(true);
    }
    // After the first pack: deployment onto the North socket is a legal offer.
    const afterPack = engine.getLegalActions(L03, engine.currentState);
    expect(afterPack).toContainEqual({
      type: 'deploy',
      courierId: C3,
      pieceId: 'bridge-1',
      siteId: 'socket-north-middle',
    });
    // ... and redeploying at the West socket is also legal (it is a free socket).
    expect(afterPack).toContainEqual({
      type: 'deploy',
      courierId: C3,
      pieceId: 'bridge-1',
      siteId: 'socket-west-middle',
    });

    expect(
      engine.commit(
        engine.propose('t', 'h-deploy', {
          type: 'deploy',
          courierId: C3,
          pieceId: 'bridge-1',
          siteId: 'socket-north-middle',
        }),
      ).ok,
    ).toBe(true);
    // Deployed at North: a second pack from Middle is legal — the third handling point.
    const afterDeploy = engine.getLegalActions(L03, engine.currentState);
    expect(afterDeploy).toContainEqual({ type: 'pack', courierId: C3, pieceId: 'bridge-1' });
  });

  it('wa: museum before the North fetch — missing cargo, undo-only', () => {
    const plan: PftAction[] = [
      ...PFT03_TRACE.slice(0, 6), // lantern delivered; back on Middle
      { type: 'pack', courierId: C3, pieceId: 'bridge-1' },
      { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: C3, itemId: 'bridge-1', recipientId: 'museum' },
    ];
    const { engine, events } = run(L03, plan);

    // The crate starts unreachable (North has no other way in): once the only
    // bridge is delivered, recovery degrades from redeploy to undo-only.
    const crateStrands = strandedEvents(events, 'order-crate');
    expect(crateStrands.length).toBeGreaterThanOrEqual(1);
    expect(crateStrands[crateStrands.length - 1]?.data?.['recovery']).toBe('undo');
    const crate = analyzeOrderStatuses(L03, engine.currentState).find(
      (s) => s.orderId === 'order-crate',
    )!;
    expect(crate.achievable).toBe(false);
    expect(crate.recovery).toBe('undo');
  });

  it('wa: packing from the far bank is refused — the handle is on Middle (PFT-005)', () => {
    const engine = new PftEngine();
    engine.begin(L03, SEED);
    const steps: PftAction[] = PFT03_TRACE.slice(0, 9); // through the North crossing
    for (let i = 0; i < steps.length; i++) {
      expect(engine.commit(engine.propose('t', `w-${i}`, steps[i]!)).ok).toBe(true);
    }
    expect(engine.currentState.couriers[C3]?.at).toBe('north');
    const res = engine.commit(
      engine.propose('t', 'far-pack', { type: 'pack', courierId: C3, pieceId: 'bridge-1' }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('handling endpoint');
  });

  it('wa: North is open water until the second deployment — no connection', () => {
    const res = simulate(
      L03,
      [{ type: 'travel', courierId: C3, path: ['north'] }],
      SEED,
    );
    expect(res.success).toBe(false);
    expect(res.rejectedAt).toBe(0);
    expect(res.rejectionReason).toContain('no active connection');
  });

  it('wa: an early pack strands the lantern — recoverable by redeploying (PFT-C)', () => {
    const engine = new PftEngine();
    engine.begin(L03, SEED);
    const res = engine.commit(
      engine.propose('t', 'pack-early', { type: 'pack', courierId: C3, pieceId: 'bridge-1' }),
    );
    expect(res.ok).toBe(true);
    const strand = (res.events ?? []).find(
      (e) => e.type === 'order.stranded' && e.entityId === 'order-lantern',
    );
    expect(strand?.data?.['recovery']).toBe('redeploy');
    const res2 = engine.commit(
      engine.propose('t', 'redeploy-west', {
        type: 'deploy',
        courierId: C3,
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
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L03, [], SEED).success).toBe(false);
    const r1 = simulate(L03, PFT03_TRACE, SEED);
    const r2 = simulate(L03, PFT03_TRACE, SEED);
    expect(r1.finalHash).toBe(r2.finalHash);
    const engine = new PftEngine();
    engine.begin(L03, SEED);
    for (let i = 0; i < PFT03_TRACE.length; i++) {
      expect(engine.commit(engine.propose('t', `d-${i}`, PFT03_TRACE[i]!)).ok).toBe(true);
    }
    const rerun = new PftEngine().replayRun(L03, engine.makeReplay());
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });
});

// ---------------------------------------------------------------------------
// PFT-04 The Upstairs Address
// ---------------------------------------------------------------------------

const L04 = PFT04_THE_UPSTAIRS_ADDRESS;
const W4 = 'courier-1';
const L4 = 'courier-2';

/** Trace A — the stair stays at the West cliff foot (18 moves). */
const PFT04_TRACE_A: PftAction[] = [
  { type: 'pickup', courierId: L4, itemId: 'books' },
  { type: 'travel', courierId: L4, path: ['west', 'loft'] },
  { type: 'deliver', courierId: L4, itemId: 'books', recipientId: 'loft-tenant' },
  { type: 'travel', courierId: W4, path: ['west', 'loft'] },
  { type: 'pickup', courierId: W4, itemId: 'gramophone' },
  { type: 'travel', courierId: W4, path: ['west', 'middle'] },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'gramophone', recipientId: 'music-hall' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: W4, path: ['west'] },
  { type: 'pack', courierId: W4, pieceId: 'stair-1' },
  { type: 'travel', courierId: W4, path: ['middle'] },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'stair-1', recipientId: 'promenade' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W4, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'bridge-1', recipientId: 'museum' },
];

/** Trace B — the stair is re-set on the Middle hoist first (21 moves). */
const PFT04_TRACE_B: PftAction[] = [
  { type: 'travel', courierId: W4, path: ['west'] },
  { type: 'pack', courierId: W4, pieceId: 'stair-1' }, // lift it off the cliff foot
  { type: 'travel', courierId: W4, path: ['middle'] },
  { type: 'deploy', courierId: W4, pieceId: 'stair-1', siteId: 'socket-middle-loft' },
  { type: 'pickup', courierId: L4, itemId: 'books' },
  { type: 'travel', courierId: L4, path: ['loft'] }, // straight up the hoist
  { type: 'deliver', courierId: L4, itemId: 'books', recipientId: 'loft-tenant' },
  { type: 'travel', courierId: W4, path: ['loft'] },
  { type: 'pickup', courierId: W4, itemId: 'gramophone' },
  { type: 'travel', courierId: W4, path: ['middle'] },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'gramophone', recipientId: 'music-hall' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W4, pieceId: 'stair-1' }, // pack from the hoist's Middle end
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'stair-1', recipientId: 'promenade' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W4, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'bridge-1', recipientId: 'museum' },
];

describe('PFT-04 The Upstairs Address — acceptance (PFT-D)', () => {
  it('trace A passes: cliff stair serves the Loft; pieces ship after the upstairs work', () => {
    const res = simulate(L04, PFT04_TRACE_A, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of [
      'order-books',
      'order-gramophone',
      'order-stair',
      'order-bridge',
      'order-wren-exit',
      'order-lark-exit',
    ]) {
      expect(res.finalState.fulfilled[o]).toBe(true);
    }
    expect(res.stats.moves).toBe(18);
    expect(res.stats.lateMoves).toBe(0);
    // The right plan strands nothing on the way.
    expect(res.events.filter((e) => e.type === 'order.stranded')).toHaveLength(0);
    // Lark's extraction never needs the removed stair: she ends on the Loft,
    // Wren leaves by the ferry line.
    expect(res.finalState.couriers[L4]?.at).toBe('loft');
    expect(res.finalState.couriers[W4]?.at).toBe('east');
  });

  it('trace B passes: the stair is redeployed to the Middle hoist — a second strategy', () => {
    const res = simulate(L04, PFT04_TRACE_B, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    // Different infrastructure commitment: the Loft is served from
    // socket-middle-loft, not socket-west-loft.
    const deploy = res.events.find((e) => e.type === 'piece.deployed');
    expect(deploy?.entityId).toBe('stair-1');
    expect(deploy?.data?.['siteId']).toBe('socket-middle-loft');
    expect(res.stats.moves).toBe(20);
    expect(res.stats.lateMoves).toBe(2);
  });

  it('wa: sell the stairway while the gramophone is aloft — missing cargo, undo-only', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: W4, path: ['west'] },
      { type: 'pack', courierId: W4, pieceId: 'stair-1' },
      { type: 'travel', courierId: W4, path: ['middle'] },
      { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
      { type: 'deliver', courierId: W4, itemId: 'stair-1', recipientId: 'promenade' },
    ];
    const { engine, events, failedAt } = run(L04, plan);
    expect(failedAt).toBe(-1);
    expect(engine.currentState.completed).toBe(false);

    // Packing strands three orders recoverably; the handover makes them undo-only.
    for (const oid of ['order-gramophone', 'order-books', 'order-lark-exit']) {
      const strands = strandedEvents(events, oid);
      expect(strands.length).toBeGreaterThanOrEqual(1);
      expect(strands[0]?.data?.['recovery']).toBe('redeploy');
      expect(strands[strands.length - 1]?.data?.['recovery']).toBe('undo');
    }
    const gramophone = analyzeOrderStatuses(L04, engine.currentState).find(
      (s) => s.orderId === 'order-gramophone',
    )!;
    expect(gramophone.achievable).toBe(false);
    expect(gramophone.recovery).toBe('undo');
    expect(engine.currentState.fulfilled['order-gramophone']).toBe(false);
  });

  it('wa: no climbing once the stair is packed — no active connection', () => {
    const engine = new PftEngine();
    engine.begin(L04, SEED);
    const steps: PftAction[] = [
      { type: 'travel', courierId: W4, path: ['west'] },
      { type: 'pack', courierId: W4, pieceId: 'stair-1' },
    ];
    for (let i = 0; i < steps.length; i++) {
      expect(engine.commit(engine.propose('t', `n-${i}`, steps[i]!)).ok).toBe(true);
    }
    const res = engine.commit(
      engine.propose('t', 'climb', { type: 'travel', courierId: W4, path: ['loft'] }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('no active connection');
  });

  it('wa: the stair cannot be packed from the top landing (PFT-005)', () => {
    const engine = new PftEngine();
    engine.begin(L04, SEED);
    expect(
      engine.commit(
        engine.propose('t', 'up', { type: 'travel', courierId: W4, path: ['west', 'loft'] }),
      ).ok,
    ).toBe(true);
    const res = engine.commit(
      engine.propose('t', 'top-pack', { type: 'pack', courierId: W4, pieceId: 'stair-1' }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('handling endpoint');
  });

  it('wa: a stair does not span flat water — declared heights rule (PFT-009)', () => {
    const engine = new PftEngine();
    engine.begin(L04, SEED);
    const steps: PftAction[] = [
      { type: 'travel', courierId: W4, path: ['west'] },
      { type: 'pack', courierId: W4, pieceId: 'stair-1' },
      { type: 'travel', courierId: W4, path: ['middle'] },
      { type: 'drop', courierId: W4, itemId: 'stair-1' },
      { type: 'pack', courierId: W4, pieceId: 'bridge-1' }, // free the flat frame
    ];
    for (let i = 0; i < steps.length; i++) {
      expect(engine.commit(engine.propose('t', `f-${i}`, steps[i]!)).ok).toBe(true);
    }
    const res = engine.commit(
      engine.propose('t', 'flat-stair', {
        type: 'deploy',
        courierId: W4,
        pieceId: 'stair-1',
        siteId: 'socket-west-middle',
      }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('differing declared heights');
  });

  it('wa: the cliff socket refuses a bridge — kind mismatch (PFT-007)', () => {
    const engine = new PftEngine();
    engine.begin(L04, SEED);
    expect(
      engine.commit(
        engine.propose('t', 'bp', { type: 'pack', courierId: W4, pieceId: 'bridge-1' }),
      ).ok,
    ).toBe(true);
    const res = engine.commit(
      engine.propose('t', 'bridge-up', {
        type: 'deploy',
        courierId: W4,
        pieceId: 'bridge-1',
        siteId: 'socket-west-loft',
      }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('does not accept');
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L04, [], SEED).success).toBe(false);
    const r1 = simulate(L04, PFT04_TRACE_A, SEED);
    const r2 = simulate(L04, PFT04_TRACE_A, SEED);
    expect(r1.finalHash).toBe(r2.finalHash);
    const engine = new PftEngine();
    engine.begin(L04, SEED);
    for (let i = 0; i < PFT04_TRACE_A.length; i++) {
      expect(engine.commit(engine.propose('t', `d-${i}`, PFT04_TRACE_A[i]!)).ok).toBe(true);
    }
    const rerun = new PftEngine().replayRun(L04, engine.makeReplay());
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });
});
