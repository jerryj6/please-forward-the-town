// Undo byte-exactness sweep — all 12 levels (automated playtest).
// Per level: apply the first winning trace, undo to depth 0, re-apply one
// commit at a time asserting canonicalHash equals a fresh engine replayed
// to the same prefix. Then at mid-trace: commit a divergent no-op (wait),
// undo it, continue the trace — assert no phantom state (hash still equals
// fresh replay). Journal = committed action stream; hash = canonical state.
// Run: npx tsx audit/probe-undo-all.mts
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

const freshHash = (level: PftLevel, trace: PftAction[], n: number) => {
  const e = new PftEngine(); e.begin(level, 'u');
  for (let i = 0; i < n; i++) e.commit(e.propose('u', `f-${i}`, trace[i]!));
  return e.canonicalHash(level, e.currentState);
};

const jobs: [string, PftLevel, string][] = [
  ['pft-01', L01, 'TRACE_A'], ['pft-02', L02, 'PFT02_TRACE_A'], ['pft-03', L03, 'PFT03_TRACE'],
  ['pft-04', L04, 'PFT04_TRACE_A'], ['pft-05', L05, 'PFT05_TRACE_A'], ['pft-06', L06, 'PFT06_TRACE_A'],
  ['pft-07', L07, 'PFT07_TRACE'], ['pft-08', L08, 'PFT08_TRACE'], ['pft-09', L09, 'PFT09_TRACE'],
  ['pft-10', L10, 'PFT10_TRACE_A'], ['pft-11', L11, 'PFT11_TRACE'], ['pft-12', L12, 'PFT12_TRACE_A'],
];

let totalPass = 0, totalFail = 0;
console.log('level | prefix-checks | undo→0 ok | diverge ok');
for (const [name, level, tname] of jobs) {
  const trace = traceByConst.get(tname)!;
  const e = new PftEngine(); e.begin(level, 'u');
  trace.forEach((a, i) => { const r = e.commit(e.propose('u', `a-${i}`, a)); if (!r.ok) throw new Error(`${name}@${i}: ${r.reason}`); });
  // undo to 0
  for (let i = 0; i < trace.length; i++) e.undo();
  const t0ok = e.canonicalHash(level, e.currentState) === freshHash(level, trace, 0);
  // re-apply all, checking hash at every prefix
  let prefixOk = 0;
  for (let i = 0; i < trace.length; i++) {
    e.commit(e.propose('u', `r-${i}`, trace[i]!));
    if (e.canonicalHash(level, e.currentState) === freshHash(level, trace, i + 1)) prefixOk++;
  }
  // diverge: undo 1, commit a wait for the first courier, undo, re-apply
  e.undo();
  const mid = trace.length - 1;
  const courier = trace[0]!.courierId;
  e.commit(e.propose('u', 'diverge', { type: 'wait', courierId: courier }));
  e.undo();
  e.commit(e.propose('u', `r-${mid}`, trace[mid]!));
  const divergeOk = e.canonicalHash(level, e.currentState) === freshHash(level, trace, trace.length);
  const ok = t0ok && prefixOk === trace.length && divergeOk;
  if (ok) totalPass++; else totalFail++;
  console.log(`${name} | ${prefixOk}/${trace.length} | ${t0ok} | ${divergeOk}`);
}
console.log(`probe-undo-all: ${totalPass} levels pass, ${totalFail} fail`);
process.exit(totalFail ? 1 : 0);
