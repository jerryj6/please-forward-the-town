/**
 * PFT-05/06/07 acceptance tests (master §II PFT-D chapter-2 "composition",
 * §IV.5.2/5.5): postal links vs courier routes, ferry hand-over, moving
 * address sign.
 *
 * Per level: verified winning trace(s) pass end-to-end; every designed wrong
 * approach fails for the asserted reason; determinism — same seed, same
 * canonical hash; the untouched start does not win.
 */

import { describe, expect, it } from 'vitest';
import { PftEngine, analyzeOrderStatuses } from '../../src/engine/pft/engine.js';
import { simulate } from '../../src/engine/pft/sim.js';
import { PFT05_RETURN_TO_SENDER } from '../../src/content/levels/pft05-return-to-sender.js';
import { PFT06_THE_FERRYS_LAST_FARE } from '../../src/content/levels/pft06-the-ferrys-last-fare.js';
import { PFT07_THE_MOVING_ADDRESS } from '../../src/content/levels/pft07-the-moving-address.js';
import type { PftAction, PftLevel } from '../../src/engine/pft/types.js';
import type { GameEvent } from '../../src/engine/contracts.js';

const SEED = 'pft05-07-test-seed';

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

// ---------------------------------------------------------------------------
// PFT-05 Return to Sender — cargo-only postal link vs courier routes (PFT-008)
// ---------------------------------------------------------------------------

const L05 = PFT05_RETURN_TO_SENDER;
const W5 = 'courier-1';
const L5 = 'courier-2';
const F = 'ferry-1';

/** Trace A — Lark mails + decommissions; Wren receives (13 moves). */
const PFT05_TRACE_A: PftAction[] = [
  { type: 'travel', courierId: L5, path: ['west'] },
  { type: 'pickup', courierId: L5, itemId: 'registry' },
  { type: 'travel', courierId: L5, path: ['north'] },
  { type: 'drop', courierId: L5, itemId: 'registry' }, // stage on the post
  { type: 'send', courierId: L5, linkId: 'link-north-east', parcelId: 'registry' },
  { type: 'pack', courierId: L5, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L5, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L5, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'pack', courierId: L5, pieceId: 'bridge-1' },
  { type: 'deliver', courierId: L5, itemId: 'bridge-1', recipientId: 'depot' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'pickup', courierId: W5, itemId: 'registry' },
  { type: 'deliver', courierId: W5, itemId: 'registry', recipientId: 'archives' },
];

/** Trace B — North handoff: Lark mails, Wren makes the second Upstream run (15 moves). */
const PFT05_TRACE_B: PftAction[] = [
  { type: 'travel', courierId: L5, path: ['west'] },
  { type: 'pickup', courierId: L5, itemId: 'registry' },
  { type: 'travel', courierId: L5, path: ['north'] },
  { type: 'drop', courierId: L5, itemId: 'registry' },
  { type: 'send', courierId: L5, linkId: 'link-north-east', parcelId: 'registry' },
  { type: 'travel', courierId: L5, path: ['west', 'middle'] },
  { type: 'travel', courierId: W5, path: ['west', 'north'] },
  { type: 'pack', courierId: W5, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: W5, path: ['west', 'middle'] },
  { type: 'deliver', courierId: W5, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'pack', courierId: L5, pieceId: 'bridge-1' },
  { type: 'deliver', courierId: L5, itemId: 'bridge-1', recipientId: 'depot' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'pickup', courierId: W5, itemId: 'registry' },
  { type: 'deliver', courierId: W5, itemId: 'registry', recipientId: 'archives' },
];

describe('PFT-05 Return to Sender — acceptance (PFT-D, PFT-008)', () => {
  it('trace A passes: the registry crosses by mail, the courier walks home by land', () => {
    const res = simulate(L05, PFT05_TRACE_A, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of [
      'order-registry',
      'order-mailbox',
      'order-bridge',
      'order-wren-exit',
      'order-lark-exit',
    ]) {
      expect(res.finalState.fulfilled[o]).toBe(true);
    }
    expect(res.stats.moves).toBe(13);
    expect(res.stats.lateMoves).toBe(0);
    const sent = res.events.find((e) => e.type === 'parcel.sent');
    expect(sent?.entityId).toBe('registry');
    expect(sent?.data?.['linkId']).toBe('link-north-east');
    // The parcel teleported; Lark never rode — her way home is all land.
    const larkRides = res.committed.filter(
      (c) =>
        (c.action as PftAction).type === 'ride_ferry' &&
        (c.action as { courierId: string }).courierId === L5,
    );
    expect(larkRides).toHaveLength(0);
  });

  it('trace B passes: a second Upstream run fetches the mailbox (different staging)', () => {
    const res = simulate(L05, PFT05_TRACE_B, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    // Distinct signature: Wren packs the mailbox — a second courier crosses
    // the bridge on a second Upstream run.
    const mailboxPack = res.events.find(
      (e) => e.type === 'piece.packed' && e.entityId === 'mailbox-1',
    );
    expect(mailboxPack?.data?.['courierId']).toBe(W5);
    expect(res.stats.moves).toBe(15);
    expect(res.stats.lateMoves).toBe(2);
  });

  it('wa: mail moves cargo, not couriers — pack the bridge while Lark is Upstream', () => {
    const plan: PftAction[] = [
      ...PFT05_TRACE_A.slice(0, 5), // mailed; Lark still on Upstream Landing
      { type: 'pack', courierId: W5, pieceId: 'bridge-1' },
      { type: 'deliver', courierId: W5, itemId: 'bridge-1', recipientId: 'depot' },
    ];
    const { engine, events } = run(L05, plan);
    const larkStrand = strands(events, 'order-lark-exit');
    expect(larkStrand.length).toBeGreaterThanOrEqual(2);
    expect(larkStrand[0]?.data?.['recovery']).toBe('redeploy');
    expect(larkStrand[larkStrand.length - 1]?.data?.['recovery']).toBe('undo');

    // The exact lesson: the mailed parcel's order still reads achievable —
    // the postal link covers cargo even with the courier's route gone.
    const statuses = analyzeOrderStatuses(L05, engine.currentState);
    expect(statuses.find((s) => s.orderId === 'order-lark-exit')!.achievable).toBe(false);
    expect(statuses.find((s) => s.orderId === 'order-registry')!.achievable).toBe(true);
    expect(engine.currentState.completed).toBe(false);

    // Recovery: undo the depot hand-in, redeploy the bridge, Lark walks home.
    expect(engine.undo().ok).toBe(true); // undo deliver
    expect(engine.undo().ok).toBe(true); // undo pack
    const larkHome = engine.commit(
      engine.propose('t', 'home', { type: 'travel', courierId: L5, path: ['west', 'middle'] }),
    );
    expect(larkHome.ok).toBe(true);
    expect(engine.currentState.couriers[L5]?.at).toBe('middle');
  });

  it('wa: a courier cannot take the mail route — no travel edge north->east', () => {
    const res = simulate(
      L05,
      [
        { type: 'travel', courierId: L5, path: ['west', 'north'] },
        { type: 'travel', courierId: L5, path: ['east'] },
      ],
      SEED,
    );
    expect(res.success).toBe(false);
    expect(res.rejectedAt).toBe(1);
    expect(res.rejectionReason).toContain('no active connection');
  });

  it('wa: send needs a staged parcel — a carried parcel is refused', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L5, path: ['west'] },
      { type: 'pickup', courierId: L5, itemId: 'registry' },
      { type: 'travel', courierId: L5, path: ['north'] },
      { type: 'send', courierId: L5, linkId: 'link-north-east', parcelId: 'registry' },
    ];
    const { failedAt, reason } = run(L05, plan);
    expect(failedAt).toBe(3);
    expect(reason).toContain('not staged at north');
  });

  it('wa: a packed post kills the link — send refused while the mailbox is cargo', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L5, path: ['west', 'north'] },
      { type: 'pack', courierId: L5, pieceId: 'mailbox-1' },
      { type: 'send', courierId: L5, linkId: 'link-north-east', parcelId: 'registry' },
    ];
    const { failedAt, reason } = run(L05, plan);
    expect(failedAt).toBe(2);
    expect(reason).toContain('link inactive');
  });

  it('wa: only parcels travel postal links — a packed piece is refused', () => {
    const engine = new PftEngine();
    engine.begin(L05, SEED);
    expect(
      engine.commit(
        engine.propose('t', 'walk', { type: 'travel', courierId: L5, path: ['west', 'north'] }),
      ).ok,
    ).toBe(true);
    const res = engine.commit(
      engine.propose('t', 'send-piece', {
        type: 'send',
        courierId: L5,
        linkId: 'link-north-east',
        parcelId: 'mailbox-1',
      }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('only parcels travel postal links');
  });

  it('wa: the skiff is a foot ferry — freight aboard is refused (PFT-004)', () => {
    const engine = new PftEngine();
    engine.begin(L05, SEED);
    expect(
      engine.commit(engine.propose('t', 'p', { type: 'pack', courierId: W5, pieceId: 'bridge-1' }))
        .ok,
    ).toBe(true);
    const res = engine.commit(
      engine.propose('t', 'r', { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('parcel capacity 0');
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L05, [], SEED).success).toBe(false);
    const r1 = simulate(L05, PFT05_TRACE_A, SEED);
    const r2 = simulate(L05, PFT05_TRACE_A, SEED);
    expect(r1.finalHash).toBe(r2.finalHash);
    const engine = new PftEngine();
    engine.begin(L05, SEED);
    for (let i = 0; i < PFT05_TRACE_A.length; i++) {
      expect(engine.commit(engine.propose('t', `d-${i}`, PFT05_TRACE_A[i]!)).ok).toBe(true);
    }
    const rerun = new PftEngine().replayRun(L05, engine.makeReplay());
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });
});

// ---------------------------------------------------------------------------
// PFT-06 The Ferry's Last Fare — deliverable service, hand-over is last
// ---------------------------------------------------------------------------

const L06 = PFT06_THE_FERRYS_LAST_FARE;

/** Trace A — Lark sails each parcel herself, walks home; Wren ships the bridge, signs the boat (17). */
const PFT06_TRACE_A: PftAction[] = [
  { type: 'travel', courierId: L5, path: ['west', 'north'] },
  { type: 'pickup', courierId: L5, itemId: 'crate' },
  { type: 'travel', courierId: L5, path: ['west', 'middle'] },
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: L5, itemId: 'crate', recipientId: 'boathouse' },
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: L5, path: ['west'] },
  { type: 'pickup', courierId: L5, itemId: 'piano' },
  { type: 'travel', courierId: L5, path: ['middle'] },
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: L5, itemId: 'piano', recipientId: 'conservatory' },
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: L5, path: ['west'] }, // home by land
  { type: 'pack', courierId: W5, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W5, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'hand_over_ferry', courierId: W5, ferryId: F, recipientId: 'harbor-master' },
];

/** Trace B — dockside staging: Lark loads the hold / stages the dock; Wren shuttles (22 moves). */
const PFT06_TRACE_B: PftAction[] = [
  { type: 'travel', courierId: L5, path: ['west', 'north'] },
  { type: 'pickup', courierId: L5, itemId: 'crate' },
  { type: 'travel', courierId: L5, path: ['west', 'middle'] },
  { type: 'load_ferry', courierId: L5, ferryId: F, itemId: 'crate' }, // crate waits in the hold
  { type: 'travel', courierId: L5, path: ['west'] },
  { type: 'pickup', courierId: L5, itemId: 'piano' },
  { type: 'travel', courierId: L5, path: ['middle'] },
  { type: 'drop', courierId: L5, itemId: 'piano' }, // staged on the dock
  { type: 'travel', courierId: L5, path: ['west'] }, // home by land
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' }, // hold rides across
  { type: 'unload_ferry', courierId: W5, ferryId: F, itemId: 'crate' },
  { type: 'pickup', courierId: W5, itemId: 'crate' },
  { type: 'deliver', courierId: W5, itemId: 'crate', recipientId: 'boathouse' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: W5, itemId: 'piano' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W5, itemId: 'piano', recipientId: 'conservatory' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W5, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W5, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'hand_over_ferry', courierId: W5, ferryId: F, recipientId: 'harbor-master' },
];

describe("PFT-06 The Ferry's Last Fare — acceptance (PFT-D)", () => {
  it('trace A passes: last fare sails in, signs over, and the crew is home', () => {
    const res = simulate(L06, PFT06_TRACE_A, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of [
      'order-piano',
      'order-crate',
      'order-bridge',
      'order-ferry',
      'order-wren-exit',
      'order-lark-exit',
    ]) {
      expect(res.finalState.fulfilled[o]).toBe(true);
    }
    expect(res.stats.moves).toBe(17);
    expect(res.stats.lateMoves).toBe(0);
    const handover = res.events.find((e) => e.type === 'ferry.handed_over');
    expect(handover?.data?.['recipientId']).toBe('harbor-master');
    expect(res.events.filter((e) => e.type === 'order.stranded')).toHaveLength(0);
  });

  it('trace B passes: hold-staging + dock staging — a different strategy signature', () => {
    const res = simulate(L06, PFT06_TRACE_B, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    // Distinct signature: load_ferry/unload_ferry/drop all occur, and Lark
    // never rides in B (she stages, then walks home).
    for (const t of ['load_ferry', 'unload_ferry', 'drop']) {
      expect(
        res.committed.filter((c) => (c.action as PftAction).type === t).length,
      ).toBeGreaterThanOrEqual(1);
    }
    const larkRides = res.committed.filter(
      (c) =>
        (c.action as PftAction).type === 'ride_ferry' &&
        (c.action as { courierId: string }).courierId === L5,
    );
    expect(larkRides).toHaveLength(0);
    expect(res.stats.moves).toBe(22);
    expect(res.stats.lateMoves).toBe(5);
  });

  it('wa: sign the boat early — every East job strands with NO recovery', () => {
    const plan: PftAction[] = [
      ...PFT06_TRACE_A.slice(0, 5), // only the crate landed; ferry at East, Lark aboard-side
      { type: 'hand_over_ferry', courierId: L5, ferryId: F, recipientId: 'harbor-master' },
    ];
    const { engine, events } = run(L06, plan);
    // piano (still on West) and bridge (owed to the museum) both die: no piece
    // hypothesis restores a service edge — recovery is 'none' (undo only).
    for (const oid of ['order-piano', 'order-bridge']) {
      const s = strands(events, oid);
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s[s.length - 1]?.data?.['recovery']).toBe('none');
    }
    const statuses = analyzeOrderStatuses(L06, engine.currentState);
    expect(statuses.find((s) => s.orderId === 'order-piano')!.achievable).toBe(false);
    expect(statuses.find((s) => s.orderId === 'order-piano')!.recovery).toBe('none');
    // Lark's own exit dies with it — she is stranded on the far quay: the
    // service she just signed away was her only way home to the West gate.
    expect(statuses.find((s) => s.orderId === 'order-lark-exit')!.achievable).toBe(false);
    expect(statuses.find((s) => s.orderId === 'order-lark-exit')!.recovery).toBe('none');
    expect(engine.currentState.completed).toBe(false);

    // The sold boat refuses passengers.
    const ride = engine.commit(
      engine.propose('t', 'late-ride', {
        type: 'ride_ferry',
        courierId: L5,
        ferryId: F,
        to: 'middle',
      }),
    );
    expect(ride.ok).toBe(false);
    expect(ride.reason).toContain('handed over');
  });

  it('wa: the hold must ride in empty for the sale', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L5, path: ['west', 'north'] },
      { type: 'pickup', courierId: L5, itemId: 'crate' },
      { type: 'travel', courierId: L5, path: ['west', 'middle'] },
      { type: 'load_ferry', courierId: L5, ferryId: F, itemId: 'crate' },
      { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'east' },
      { type: 'hand_over_ferry', courierId: L5, ferryId: F, recipientId: 'harbor-master' },
    ];
    const { failedAt, reason } = run(L06, plan);
    expect(failedAt).toBe(5);
    expect(reason).toContain('hold must be empty');
  });

  it('wa: shore-side handling is at East — signing over from Middle is refused', () => {
    const engine = new PftEngine();
    engine.begin(L06, SEED);
    const res = engine.commit(
      engine.propose('t', 'mid-handover', {
        type: 'hand_over_ferry',
        courierId: W5,
        ferryId: F,
        recipientId: 'harbor-master',
      }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('shore-side handling is at east');
  });

  it('wa: the museum did not buy the boat — no open order', () => {
    const { engine } = run(L06, PFT06_TRACE_A.slice(0, 5)); // Lark at East quay, ferry at East
    const res = engine.commit(
      engine.propose('t', 'wrong-rcpt', {
        type: 'hand_over_ferry',
        courierId: L5,
        ferryId: F,
        recipientId: 'museum',
      }),
    );
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('no open order');
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L06, [], SEED).success).toBe(false);
    const r1 = simulate(L06, PFT06_TRACE_A, SEED);
    const r2 = simulate(L06, PFT06_TRACE_A, SEED);
    expect(r1.finalHash).toBe(r2.finalHash);
    const engine = new PftEngine();
    engine.begin(L06, SEED);
    for (let i = 0; i < PFT06_TRACE_A.length; i++) {
      expect(engine.commit(engine.propose('t', `d-${i}`, PFT06_TRACE_A[i]!)).ok).toBe(true);
    }
    const rerun = new PftEngine().replayRun(L06, engine.makeReplay());
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });
});

// ---------------------------------------------------------------------------
// PFT-07 The Moving Address — a sign binds the recipient's live address
// ---------------------------------------------------------------------------

const L07 = PFT07_THE_MOVING_ADDRESS;

/** Verified trace — Lark relocates the sign; Wren delivers to the now-valid lane (20 moves). */
const PFT07_TRACE: PftAction[] = [
  { type: 'travel', courierId: L5, path: ['west'] },
  { type: 'pack', courierId: L5, pieceId: 'sign-1' }, // the old address goes dark
  { type: 'travel', courierId: L5, path: ['middle'] },
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'east' },
  { type: 'deploy', courierId: L5, pieceId: 'sign-1', siteId: 'signpost-new' }, // the new address stands
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: L5, path: ['west'] }, // home through the West gate
  { type: 'travel', courierId: W5, path: ['west', 'north'] },
  { type: 'pickup', courierId: W5, itemId: 'tea' },
  { type: 'travel', courierId: W5, path: ['west', 'middle'] },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'travel', courierId: W5, path: ['new-lot'] }, // up the new lane
  { type: 'deliver', courierId: W5, itemId: 'tea', recipientId: 'greene-new' },
  { type: 'travel', courierId: W5, path: ['east'] },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W5, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W5, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'pack', courierId: W5, pieceId: 'sign-1' }, // new lane retired, sign is cargo again
  { type: 'deliver', courierId: W5, itemId: 'sign-1', recipientId: 'registry' },
];

describe('PFT-07 The Moving Address — acceptance (PFT-D, PFT-010)', () => {
  it('verified trace passes: the address moves, then the cargo follows it', () => {
    const res = simulate(L07, PFT07_TRACE, SEED);
    expect(res.success).toBe(true);
    expect(res.finalState.completed).toBe(true);
    expect(res.evaluation.allObservationsPass).toBe(true);
    for (const o of [
      'order-tea',
      'order-sign',
      'order-bridge',
      'order-wren-exit',
      'order-lark-exit',
    ]) {
      expect(res.finalState.fulfilled[o]).toBe(true);
    }
    expect(res.stats.moves).toBe(20);
    expect(res.stats.lateMoves).toBe(0);
    // The relocation shows in the log: deployed at the new post, packed twice.
    const deploy = res.events.find(
      (e) => e.type === 'piece.deployed' && e.entityId === 'sign-1',
    );
    expect(deploy?.data?.['siteId']).toBe('signpost-new');
    expect(
      res.events.filter((e) => e.type === 'piece.packed' && e.entityId === 'sign-1'),
    ).toHaveLength(2);
    expect(res.events.filter((e) => e.type === 'order.stranded')).toHaveLength(0);
  });

  it('wa: the old lot cannot satisfy — obsolete address rejected (PFT-010)', () => {
    // While the sign still stands at the old post the lane is reachable, and
    // the delivery still refuses — the order names the new address.
    const plan: PftAction[] = [
      { type: 'travel', courierId: W5, path: ['west', 'north'] },
      { type: 'pickup', courierId: W5, itemId: 'tea' },
      { type: 'travel', courierId: W5, path: ['west', 'old-lot'] }, // sign edge still live
      { type: 'deliver', courierId: W5, itemId: 'tea', recipientId: 'greene-old' },
    ];
    const { failedAt, reason } = run(L07, plan);
    expect(failedAt).toBe(3);
    expect(reason).toContain('no open order');
  });

  it('wa: while the sign is packed the address is nowhere — tea order strands', () => {
    const plan: PftAction[] = [
      ...PFT07_TRACE.slice(0, 7), // sign relocated; Lark home; ferry back at Middle
      { type: 'travel', courierId: W5, path: ['west', 'north'] },
      { type: 'pickup', courierId: W5, itemId: 'tea' },
      { type: 'travel', courierId: W5, path: ['west', 'middle'] },
      { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
      { type: 'drop', courierId: W5, itemId: 'tea' }, // tea waits on the quay — hands free
      { type: 'pack', courierId: W5, pieceId: 'sign-1' }, // lift the new post early
      { type: 'deliver', courierId: W5, itemId: 'sign-1', recipientId: 'registry' },
    ];
    const { engine, events } = run(L07, plan);
    const teaStrands = strands(events, 'order-tea');
    expect(teaStrands.length).toBeGreaterThanOrEqual(2);
    expect(teaStrands[0]?.data?.['recovery']).toBe('redeploy');
    expect(teaStrands[teaStrands.length - 1]?.data?.['recovery']).toBe('undo');
    const tea = analyzeOrderStatuses(L07, engine.currentState).find(
      (s) => s.orderId === 'order-tea',
    )!;
    expect(tea.achievable).toBe(false);
    expect(tea.recovery).toBe('undo');
    expect(engine.currentState.completed).toBe(false);
  });

  it('wa: the sign cannot be lifted under a courier on the lot (PFT-006)', () => {
    // Both couriers share the West bank: Lark walks out onto the Old Lot
    // (sign still on the old post), Wren tries to lift the sign beneath her.
    const plan: PftAction[] = [
      { type: 'travel', courierId: L5, path: ['west', 'old-lot'] }, // via the deployed sign edge
      { type: 'travel', courierId: W5, path: ['west'] },
      { type: 'pack', courierId: W5, pieceId: 'sign-1' },
    ];
    const { failedAt, reason } = run(L07, plan);
    expect(failedAt).toBe(2);
    expect(reason).toContain('cannot pack');
    expect(reason).toContain('Courier Lark');
  });

  it('wa: the sign is lifted from the street end, not from the lane it carries (PFT-005)', () => {
    const plan: PftAction[] = [
      { type: 'travel', courierId: L5, path: ['west', 'old-lot'] },
      { type: 'pack', courierId: L5, pieceId: 'sign-1' }, // standing on the lot, not the post side
    ];
    const { failedAt, reason } = run(L07, plan);
    expect(failedAt).toBe(1);
    expect(reason).toContain('handling endpoint');
  });

  it('wa: sockets reject the wrong kind — sign on water, bridge on a fence post', () => {
    const engine = new PftEngine();
    engine.begin(L07, SEED);
    // Sign onto the water socket first, while the bridge still stands so Lark
    // can reach Middle: lift at the old post, carry back, deploy attempt.
    const setup: PftAction[] = [
      { type: 'travel', courierId: L5, path: ['west'] },
      { type: 'pack', courierId: L5, pieceId: 'sign-1' },
      { type: 'travel', courierId: L5, path: ['middle'] },
    ];
    for (let i = 0; i < setup.length; i++) {
      expect(engine.commit(engine.propose('t', `s-${i}`, setup[i]!)).ok).toBe(true);
    }
    const signOnWater = engine.commit(
      engine.propose('t', 's-water', {
        type: 'deploy',
        courierId: L5,
        pieceId: 'sign-1',
        siteId: 'socket-west-middle',
      }),
    );
    expect(signOnWater.ok).toBe(false);
    expect(signOnWater.reason).toContain('does not accept sign');
    // Bridge onto the fence post: kind rejected before anything else matters.
    expect(
      engine.commit(engine.propose('t', 'pb', { type: 'pack', courierId: W5, pieceId: 'bridge-1' }))
        .ok,
    ).toBe(true);
    const bridgeOnPost = engine.commit(
      engine.propose('t', 'b-post', {
        type: 'deploy',
        courierId: W5,
        pieceId: 'bridge-1',
        siteId: 'signpost-new',
      }),
    );
    expect(bridgeOnPost.ok).toBe(false);
    expect(bridgeOnPost.reason).toContain('does not accept bridge');
  });

  it('untouched start does not win; determinism holds (§IV.5.1/5.2)', () => {
    expect(simulate(L07, [], SEED).success).toBe(false);
    const r1 = simulate(L07, PFT07_TRACE, SEED);
    const r2 = simulate(L07, PFT07_TRACE, SEED);
    expect(r1.finalHash).toBe(r2.finalHash);
    const engine = new PftEngine();
    engine.begin(L07, SEED);
    for (let i = 0; i < PFT07_TRACE.length; i++) {
      expect(engine.commit(engine.propose('t', `d-${i}`, PFT07_TRACE[i]!)).ok).toBe(true);
    }
    const rerun = new PftEngine().replayRun(L07, engine.makeReplay());
    expect(rerun.ok).toBe(true);
    expect(rerun.finalHash).toBe(r1.finalHash);
  });
});
