// Card-vs-engine honesty validator (mirrors RBM's scripts/card-vs-engine.ts):
// for every carded wrongApproach on PFT-01..12, replay a purpose-built probe
// and assert the named failure mechanism actually occurs in the FROZEN engine
// — a rejected action carries the promised reason, a strand carries the
// promised recovery class, an obsolete recipient carries "no open order".
// Stranded events fire only on achievable→unachievable transitions, so a
// strand check falls back to the final order status when no event fired.
// Run: npx tsx scripts/card-vs-engine.mts   (upstream: npm run check:content)
import { PftEngine, analyzeOrders } from '../src/engine/pft/engine.js';
import type { PftAction, PftLevel, PftPlayState } from '../src/engine/pft/types.js';
import { PFT01_LAST_CROSSING as L01 } from '../src/content/levels/pft01-last-crossing.js';
import { PFT02_TWO_PARCELS_ONE_BOAT as L02 } from '../src/content/levels/pft02-two-parcels-one-boat.js';
import { PFT03_A_BRIDGE_WITH_TWO_ADDRESSES as L03 } from '../src/content/levels/pft03-a-bridge-with-two-addresses.js';
import { PFT04_THE_UPSTAIRS_ADDRESS as L04 } from '../src/content/levels/pft04-the-upstairs-address.js';
import { PFT05_RETURN_TO_SENDER as L05 } from '../src/content/levels/pft05-return-to-sender.js';
import { PFT06_THE_FERRYS_LAST_FARE as L06 } from '../src/content/levels/pft06-the-ferrys-last-fare.js';
import { PFT07_THE_MOVING_ADDRESS as L07 } from '../src/content/levels/pft07-the-moving-address.js';
import { PFT08_NO_ONE_LEFT_ON_WEST as L08 } from '../src/content/levels/pft08-no-one-left-on-west.js';
import { PFT09_THREE_USEFUL_PARCELS as L09 } from '../src/content/levels/pft09-three-useful-parcels.js';
import { PFT10_THE_DETOUR_DIVIDEND as L10 } from '../src/content/levels/pft10-the-detour-dividend.js';
import { PFT11_MAIL_THE_POST_OFFICE as L11 } from '../src/content/levels/pft11-mail-the-post-office.js';
import { PFT12_EVERYTHING_MUST_GO as L12 } from '../src/content/levels/pft12-everything-must-go.js';

const W = 'courier-1', L2 = 'courier-2', F3 = 'courier-3', S = 'courier-4', F = 'ferry-1';

type Check =
  | { kind: 'reject'; match: RegExp }
  | { kind: 'strand'; order: string; recovery?: string }
  | { kind: 'incomplete' };

interface WaCase { wa: string; seq: PftAction[]; checks: Check[] }
interface LevelCases { id: string; level: PftLevel; cases: WaCase[] }

const run = (level: PftLevel, seq: PftAction[]) => {
  const engine = new PftEngine();
  engine.begin(level, 'cv');
  const events: { type: string; entityId?: string; data?: Record<string, unknown> }[] = [];
  let rejectAt = -1, reason = '';
  seq.forEach((a, i) => {
    if (rejectAt >= 0) return;
    const r = engine.commit(engine.propose('cv', `cv-${i}`, a));
    events.push(...(r.events ?? []));
    if (!r.ok) { rejectAt = i; reason = r.reason ?? 'rejected'; }
  });
  return { events, rejectAt, reason, state: engine.currentState as PftPlayState, level };
};

const t = (c: string, path: string[]): PftAction => ({ type: 'travel', courierId: c, path });

const LEVELS: LevelCases[] = [
  { id: 'pft-01', level: L01, cases: [
    { wa: 'lift bridge before fetch → lantern stranded, redeploy-recoverable',
      seq: [{ type: 'pack', courierId: W, pieceId: 'bridge-1' }],
      checks: [{ kind: 'strand', order: 'order-lantern', recovery: 'redeploy' }] },
    { wa: 'clock out early → exit fulfills but level stays incomplete',
      seq: [{ type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, t(W, ['east-exit'])],
      checks: [{ kind: 'incomplete' }] },
  ]},
  { id: 'pft-02', level: L02, cases: [
    { wa: 'pack bridge while Lark needs it → her north-dock exit strands (redeploy)',
      seq: [{ type: 'pack', courierId: W, pieceId: 'bridge-1' }],
      checks: [{ kind: 'strand', order: 'order-lark-exit' }] },
    { wa: 'sell the bridge → lark exit + crate strand undo-only',
      seq: [{ type: 'pack', courierId: W, pieceId: 'bridge-1' }, { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' }],
      checks: [{ kind: 'strand', order: 'order-lark-exit', recovery: 'undo' }, { kind: 'strand', order: 'order-crate', recovery: 'undo' }] },
    { wa: 'two parcels aboard a capacity-1 boat → ride refused',
      seq: [t(W, ['west']), { type: 'pickup', courierId: W, itemId: 'lantern' }, t(W, ['middle']), { type: 'load_ferry', courierId: W, ferryId: F, itemId: 'lantern' }, t(W, ['west']), t(W, ['north']), { type: 'pickup', courierId: W, itemId: 'crate' }, t(W, ['west']), t(W, ['middle']), { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }],
      checks: [{ kind: 'reject', match: /capacit|parcel/i }] },
  ]},
  { id: 'pft-03', level: L03, cases: [
    { wa: 'sell bridge before North fetch → boathouse order strands undo-only',
      seq: [{ type: 'pack', courierId: W, pieceId: 'bridge-1' }, { type: 'pickup', courierId: W, itemId: 'bridge-1' }, { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' }],
      checks: [{ kind: 'strand', order: 'order-crate' }] },
    { wa: 'pack the bridge from the far bank → handling-endpoint refusal',
      seq: [t(W, ['west']), { type: 'pack', courierId: W, pieceId: 'bridge-1' }],
      checks: [{ kind: 'reject', match: /handling endpoint|cannot pack/i }] },
    { wa: 'walk north with no bridge set → no connection',
      seq: [{ type: 'pack', courierId: W, pieceId: 'bridge-1' }, t(W, ['west', 'north'])],
      checks: [{ kind: 'reject', match: /no active connection/i }] },
  ]},
  { id: 'pft-04', level: L04, cases: [
    { wa: 'sell stair while gramophone aloft → music-hall order strands',
      seq: [t(W, ['west']), { type: 'pack', courierId: W, pieceId: 'stair-1' }, { type: 'pickup', courierId: W, itemId: 'stair-1' }, t(W, ['middle']), { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, { type: 'deliver', courierId: W, itemId: 'stair-1', recipientId: 'music-hall' }],
      checks: [{ kind: 'strand', order: 'order-gramophone' }] },
    { wa: 'pack stair from the loft → handling-endpoint refusal',
      seq: [t(L2, ['west']), t(L2, ['loft']), { type: 'pack', courierId: L2, pieceId: 'stair-1' }],
      checks: [{ kind: 'reject', match: /handling endpoint|cannot pack/i }] },
    { wa: 'climb after the stair is packed → no edge',
      seq: [t(W, ['west']), { type: 'pack', courierId: W, pieceId: 'stair-1' }, { type: 'travel', courierId: W, path: ['loft'] }],
      checks: [{ kind: 'reject', match: /no active connection|cannot/i }] },
  ]},
  { id: 'pft-05', level: L05, cases: [
    { wa: 'Lark stranded past packed bridge → links move cargo only; exit strands',
      seq: [t(L2, ['west']), t(L2, ['north']), { type: 'pack', courierId: W, pieceId: 'bridge-1' }],
      checks: [{ kind: 'strand', order: 'order-lark-exit' }] },
    { wa: 'send after mailbox packed → link dead',
      seq: [t(W, ['west']), { type: 'pickup', courierId: W, itemId: 'registry' }, t(W, ['north']), { type: 'drop', courierId: W, itemId: 'registry' }, { type: 'pack', courierId: W, pieceId: 'mailbox-1' }, { type: 'send', courierId: W, linkId: 'link-north-east', parcelId: 'registry' }],
      checks: [{ kind: 'reject', match: /not deployed|inactive|link|parcel/i }] },
  ]},
  { id: 'pft-06', level: L06, cases: [
    { wa: 'sign ferry over early → east orders strand recovery none',
      seq: [{ type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, { type: 'hand_over_ferry', courierId: W, ferryId: F, recipientId: 'harbor-master' }],
      checks: [{ kind: 'strand', order: 'order-piano', recovery: 'none' }] },
    { wa: 'hand over with cargo in hold → refused',
      seq: [t(W, ['west']), { type: 'pickup', courierId: W, itemId: 'piano' }, t(W, ['middle']), { type: 'load_ferry', courierId: W, ferryId: F, itemId: 'piano' }, { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, { type: 'hand_over_ferry', courierId: W, ferryId: F, recipientId: 'harbor-master' }],
      checks: [{ kind: 'reject', match: /empty|hold|cargo/i }] },
    { wa: 'offer the boat to the wrong recipient → refused',
      seq: [{ type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, { type: 'hand_over_ferry', courierId: W, ferryId: F, recipientId: 'museum' }],
      checks: [{ kind: 'reject', match: /no open order|recipient|cannot/i }] },
  ]},
  { id: 'pft-07', level: L07, cases: [
    { wa: 'tea handed in at the obsolete lot → no open order',
      seq: [t(W, ['west']), t(W, ['north']), { type: 'pickup', courierId: W, itemId: 'tea' }, t(W, ['west']), t(W, ['old-lot']), { type: 'deliver', courierId: W, itemId: 'tea', recipientId: 'greene-old' }],
      checks: [{ kind: 'reject', match: /no open order/i }] },
    { wa: 'lift sign before tea ships → delivery strands (redeploy-recoverable)',
      seq: [t(W, ['west']), { type: 'pack', courierId: W, pieceId: 'sign-1' }],
      checks: [{ kind: 'strand', order: 'order-tea' }] },
    { wa: 'lift sign with a courier on the lot → occupied refusal',
      seq: [t(L2, ['west', 'old-lot']), t(W, ['west']), { type: 'pack', courierId: W, pieceId: 'sign-1' }],
      checks: [{ kind: 'reject', match: /cannot pack|occup/i }] },
  ]},
  { id: 'pft-08', level: L08, cases: [
    { wa: 'pack plank bridge with Wren west → his exit + ledger strand',
      seq: [t(W, ['west']), { type: 'pickup', courierId: W, itemId: 'ledger' }, { type: 'pack', courierId: L2, pieceId: 'bridge-1' }],
      checks: [{ kind: 'strand', order: 'order-wren-exit' }, { kind: 'strand', order: 'order-ledger' }] },
    { wa: 'hand over ferry + lift span with Lark at Middle → slip exit strands',
      seq: [{ type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, { type: 'hand_over_ferry', courierId: W, ferryId: F, recipientId: 'harbor-master' }, { type: 'pack', courierId: S, pieceId: 'bridge-2' }],
      checks: [{ kind: 'strand', order: 'order-lark-exit' }] },
    { wa: 'sign ferry over with engine in the hold → refused',
      seq: [{ type: 'load_ferry', courierId: W, ferryId: F, itemId: 'engine' }, { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, { type: 'hand_over_ferry', courierId: W, ferryId: F, recipientId: 'harbor-master' }],
      checks: [{ kind: 'reject', match: /empty|hold|cargo/i }] },
  ]},
  { id: 'pft-09', level: L09, cases: [
    { wa: 'pack plank bridge while loft runner west → tea + exit strand',
      seq: [t(W, ['west']), { type: 'pickup', courierId: W, itemId: 'tea' }, { type: 'pack', courierId: F3, pieceId: 'bridge-1' }],
      checks: [{ kind: 'strand', order: 'order-stair' }, { kind: 'strand', order: 'order-mailbox' }, { kind: 'strand', order: 'order-lark-exit' }] },
    { wa: 'pack staircase with someone on the loft → occupied refusal',
      seq: [t(F3, ['west']), t(F3, ['loft']), t(W, ['west']), { type: 'pack', courierId: W, pieceId: 'stair-1' }],
      checks: [{ kind: 'reject', match: /cannot pack|occup/i }] },
    { wa: 'send after mailbox packed → link inactive',
      seq: [t(L2, ['west']), t(L2, ['north']), { type: 'pack', courierId: L2, pieceId: 'mailbox-1' }, { type: 'send', courierId: L2, linkId: 'link-north-east', parcelId: 'records' }],
      checks: [{ kind: 'reject', match: /not deployed|inactive|link/i }] },
  ]},
  { id: 'pft-10', level: L10, cases: [
    { wa: 'pack west bridge with Wren on the bank → his exit strands',
      seq: [t(W, ['west']), { type: 'pack', courierId: F3, pieceId: 'bridge-1' }],
      checks: [{ kind: 'strand', order: 'order-wren-exit' }] },
    { wa: 'deploy the span from Middle → wrong foot; handled from East',
      seq: [{ type: 'pack', courierId: W, pieceId: 'bridge-1' }, { type: 'deploy', courierId: W, pieceId: 'bridge-1', siteId: 'socket-town-span' }],
      checks: [{ kind: 'reject', match: /handled from|handling endpoint|cannot deploy/i }] },
    { wa: 'pack relay mailbox → the post goes silent',
      seq: [t(L2, ['west']), t(L2, ['north']), { type: 'pack', courierId: L2, pieceId: 'mailbox-1' }, { type: 'send', courierId: L2, linkId: 'link-north-east', parcelId: 'cider' }],
      checks: [{ kind: 'reject', match: /not deployed|inactive|link|parcel/i }] },
  ]},
  { id: 'pft-11', level: L11, cases: [
    { wa: 'send the sign down the wire → pieces refused on links',
      seq: [t(F3, ['west']), { type: 'pack', courierId: F3, pieceId: 'sign-1' }, t(F3, ['north']), { type: 'drop', courierId: F3, itemId: 'sign-1' }, { type: 'send', courierId: F3, linkId: 'link-north-east', parcelId: 'sign-1' } as PftAction],
      checks: [{ kind: 'reject', match: /parcel|piece|sign|link/i }] },
    { wa: 'pack sign with a courier on the office lane → occupied refusal',
      seq: [t(W, ['west', 'office-old']), t(F3, ['west']), { type: 'pack', courierId: F3, pieceId: 'sign-1' }],
      checks: [{ kind: 'reject', match: /cannot pack|occup/i }] },
    { wa: 'mailbag at the old office → no open order',
      seq: [t(W, ['west']), t(W, ['north']), { type: 'pickup', courierId: W, itemId: 'mailbag' }, t(W, ['west']), t(W, ['office-old']), { type: 'deliver', courierId: W, itemId: 'mailbag', recipientId: 'postmaster-old' }],
      checks: [{ kind: 'reject', match: /no open order|cannot/i }] },
  ]},
  { id: 'pft-12', level: L12, cases: [
    { wa: 'send the sign down the wire → refused',
      seq: [t(F3, ['west']), { type: 'pack', courierId: F3, pieceId: 'sign-1' }, t(F3, ['north']), { type: 'drop', courierId: F3, itemId: 'sign-1' }, { type: 'send', courierId: F3, linkId: 'link-north-east', parcelId: 'sign-1' } as PftAction],
      checks: [{ kind: 'reject', match: /parcel|piece|sign|link/i }] },
    { wa: 'pack plank bridge while west work remains → stair order strands',
      seq: [{ type: 'pack', courierId: F3, pieceId: 'bridge-1' }],
      checks: [{ kind: 'strand', order: 'order-stair' }] },
  ]},
];

let pass = 0, fail = 0;
for (const { id, level, cases } of LEVELS) {
  for (const c of cases) {
    const res = run(level, c.seq);
    const problems: string[] = [];
    for (const chk of c.checks) {
      if (chk.kind === 'reject') {
        if (res.rejectAt < 0 || !chk.match.test(res.reason))
          problems.push(`expected rejection ~${chk.match}, got ${res.rejectAt < 0 ? 'all committed' : `"${res.reason}" @${res.rejectAt}`}`);
      } else if (chk.kind === 'strand') {
        const evs = res.events.filter(e => e.type === 'order.stranded' && e.entityId === chk.order);
        const stRec = analyzeOrders(res.level, res.state).find(o => o.orderId === chk.order);
        const okEvent = evs.length > 0 && (!chk.recovery || evs.some(e => e.data?.['recovery'] === chk.recovery));
        const okState = !!stRec && stRec.achievable === false && (!chk.recovery || stRec.recovery === chk.recovery);
        if (!okEvent && !okState)
          problems.push(`expected strand ${chk.order}${chk.recovery ? ` (${chk.recovery})` : ''}; events=${JSON.stringify(res.events.filter(e => e.type === 'order.stranded').map(e => `${e.entityId}:${e.data?.['recovery']}`))} status=${JSON.stringify(stRec)}`);
      } else if (chk.kind === 'incomplete') {
        if (res.state.completed) problems.push('level completed but card says it should not');
      }
    }
    if (problems.length) { fail++; console.log(`FAIL ${id} :: ${c.wa}`); problems.forEach(p => console.log(`    ${p}`)); }
    else pass++;
  }
}
console.log(`\ncard-vs-engine: ${pass} pass, ${fail} fail (${pass + fail} wrong-approach probes across ${LEVELS.length} levels)`);
process.exit(fail ? 1 : 0);
