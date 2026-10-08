// Save/restore byte-exactness probe — all 12 levels (automated playtest).
// Per level: apply the first half of a winning trace, serialize() →
// restore() into a fresh engine → finish the trace → assert canonicalHash
// equals the uninterrupted run and the board completes. Also verify the
// restore-from-restore chain (double round-trip mid-board).
// Run: npx tsx audit/probe-save.mts
import { PftEngine } from '../src/engine/pft/engine.js';
import type { PftAction, PftLevel } from '../src/engine/pft/types.js';
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

import { WINNING_TRACES } from '../tests/lib/winning-traces.js';
const traceByConst = new Map<string, PftAction[]>();
for (const list of Object.values(WINNING_TRACES)) {
  for (const t of list) traceByConst.set(t.name, t.actions as PftAction[]);
}

const jobs: [string, PftLevel, string][] = [
  ['pft-01', L01, 'TRACE_A'], ['pft-02', L02, 'PFT02_TRACE_A'], ['pft-03', L03, 'PFT03_TRACE'],
  ['pft-04', L04, 'PFT04_TRACE_A'], ['pft-05', L05, 'PFT05_TRACE_A'], ['pft-06', L06, 'PFT06_TRACE_A'],
  ['pft-07', L07, 'PFT07_TRACE'], ['pft-08', L08, 'PFT08_TRACE'], ['pft-09', L09, 'PFT09_TRACE'],
  ['pft-10', L10, 'PFT10_TRACE_A'], ['pft-11', L11, 'PFT11_TRACE'], ['pft-12', L12, 'PFT12_TRACE_A'],
];

let pass = 0, fail = 0;
for (const [name, level, tname] of jobs) {
  const trace = traceByConst.get(tname)!;
  const mid = Math.floor(trace.length / 2);
  // uninterrupted baseline
  const ref = new PftEngine(); ref.begin(level, 'u');
  trace.forEach((a, i) => ref.commit(ref.propose('u', `b-${i}`, a)));
  const refHash = ref.canonicalHash(level, ref.currentState);
  // round-trip: play to mid, serialize, restore into fresh, finish
  const e1 = new PftEngine(); e1.begin(level, 'u');
  trace.slice(0, mid).forEach((a, i) => e1.commit(e1.propose('u', `m-${i}`, a)));
  const blob = e1.serialize(level, e1.currentState);
  const e2 = new PftEngine(); e2.begin(level, 'u');
  const restored = e2.restore(level, blob);
  (e2 as unknown as { state: typeof restored }).state = restored;
  // second round-trip at the same point
  const blob2 = e2.serialize(level, restored);
  const e3 = new PftEngine(); e3.begin(level, 'u');
  (e3 as unknown as { state: unknown }).state = e3.restore(level, blob2);
  trace.slice(mid).forEach((a, i) => e3.commit(e3.propose('u', `t-${i}`, a)));
  const ok = e3.canonicalHash(level, e3.currentState) === refHash &&
             e3.currentState.completed === true;
  if (ok) pass++; else fail++;
  console.log(`${name}: mid=${mid} double-restore→finish hashMatch=${ok} completed=${e3.currentState.completed}`);
}
console.log(`probe-save: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
