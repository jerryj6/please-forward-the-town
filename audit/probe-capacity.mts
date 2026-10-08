// Ferry-capacity edge probes (automated playtest): at-max occupancy rejection
// paths on pft-06 and pft-08 — honest failures verified against the frozen
// engine, complementing the enum results (which never see a rejection).
// Cases: second parcel into a capacity-1 hold; riding while hold is full;
// riding with a carried parcel when a parcel is already aboard (courier+1);
// unload semantics at the far shore.
// Run: npx tsx audit/probe-capacity.mts
import { PftEngine } from '../src/engine/pft/engine.js';
import type { PftAction, PftLevel } from '../src/engine/pft/types.js';
import { PFT06_THE_FERRYS_LAST_FARE as L06 } from '../src/content/levels/pft06-the-ferrys-last-fare.js';
import { PFT08_NO_ONE_LEFT_ON_WEST as L08 } from '../src/content/levels/pft08-no-one-left-on-west.js';

const W = 'courier-1', L2 = 'courier-2', F3 = 'courier-3', S = 'courier-4', F = 'ferry-1';
const t = (c: string, path: string[]): PftAction => ({ type: 'travel', courierId: c, path });

const setup = (level: PftLevel, seq: PftAction[]) => {
  const e = new PftEngine(); e.begin(level, 'cap');
  for (let i = 0; i < seq.length; i++) {
    const r = e.commit(e.propose('cap', `cap-${i}`, seq[i]!));
    if (!r.ok) throw new Error(`setup commit ${i} rejected: ${r.reason}`);
  }
  return e;
};
let pass = 0, fail = 0;
const expectReject = (label: string, e: PftEngine, a: PftAction, match: RegExp) => {
  const r = e.commit(e.propose('cap', `x-${label}`, a));
  if (!r.ok && match.test(r.reason ?? '')) { pass++; console.log(`PASS ${label} → "${r.reason}"`); }
  else { fail++; console.log(`FAIL ${label} → ok=${r.ok} reason="${r.reason}"`); if (r.ok) e.undo(); }
};
const expectOk = (label: string, e: PftEngine, a: PftAction) => {
  const r = e.commit(e.propose('cap', `x-${label}`, a));
  if (r.ok) { pass++; console.log(`PASS ${label} (accepted)`); }
  else { fail++; console.log(`FAIL ${label} rejected: ${r.reason}`); }
};

// --- pft-06: capacity-1 hold ---
// Wren fetches tea + piano to Middle; load one, attempt the second → reject.
{
  const e = setup(L06, [
    t(W, ['west']), t(W, ['north']), { type: 'pickup', courierId: W, itemId: 'crate' },
    t(W, ['west', 'middle']), { type: 'load_ferry', courierId: W, ferryId: F, itemId: 'crate' },
    t(W, ['west']), { type: 'pickup', courierId: W, itemId: 'piano' },
    t(W, ['middle']),
  ]);
  expectReject('pft-06: second parcel into capacity-1 hold', e,
    { type: 'load_ferry', courierId: W, ferryId: F, itemId: 'piano' }, /capacit|hold|aboard|full/i);
  // riding with the carried piano while tea is aboard → courier+1parcel cap
  expectReject('pft-06: ride carrying piano while tea is aboard', e,
    { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, /capacit|parcel|aboard|capacity/i);
  // unload the tea at east is legal later — first ride empty-handed? W carries piano still.
  expectReject('pft-06: ride while still carrying (hold occupied)', e,
    { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, /capacit|parcel|aboard|capacity/i);
}

// --- pft-08: same hold on the extraction boat ---
{
  // Lark packs bridge? capacity case: two parcels to the same shore-bound hold.
  // Find a parcel pair near middle: 'records' at north, 'ledger' at west? Use
  // level data dynamically — pick any two parcels staged at middle.
  const e = setup(L08, [
    t(W, ['west']), { type: 'pickup', courierId: W, itemId: 'ledger' },
    t(W, ['middle']), { type: 'load_ferry', courierId: W, ferryId: F, itemId: 'ledger' },
    t(W, ['west']), t(W, ['north']), { type: 'pickup', courierId: W, itemId: 'sunstone' },
    t(W, ['west', 'middle']),
  ]);
  expectReject('pft-08: second parcel into capacity-1 hold', e,
    { type: 'load_ferry', courierId: W, ferryId: F, itemId: 'sunstone' }, /capacit|hold|aboard|full/i);
  expectReject('pft-08: ride carrying sunstone while ledger is aboard', e,
    { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }, /capacit|parcel|aboard|capacity/i);
  // drop the sunstone, ride alone — should accept (courier rides, freight stays)
  expectOk('pft-08: drop sunstone to free hands', e,
    { type: 'drop', courierId: W, itemId: 'sunstone' });
  expectOk('pft-08: ride with freight aboard, courier empty-handed', e,
    { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' });
}

// --- pft-06 courier+parcel edge: unload exists only at the far side ---
{
  const e = setup(L06, [
    t(W, ['west']), t(W, ['north']), { type: 'pickup', courierId: W, itemId: 'crate' },
    t(W, ['west', 'middle']), { type: 'load_ferry', courierId: W, ferryId: F, itemId: 'crate' },
    { type: 'ride_ferry', courierId: L2, ferryId: F, to: 'east' },
  ]);
  // Wren rides alone while tea is in hold — legal; now unloading to 'middle'
  // from east should be rejected (boat is at east, unload puts item at east).
  expectOk('pft-06: unload crate at east (correct shore)', e,
    { type: 'unload_ferry', courierId: L2, ferryId: F, itemId: 'crate' });
}

console.log(`probe-capacity: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
