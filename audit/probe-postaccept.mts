// Post-accept mutability probe (automated playtest): on a COMPLETED pft-12
// board, does the engine keep accepting commits and mutating state — folding
// the delivered board post-verdict — or does completion seal it? RBM's tree
// found this class upstream; here we check PFT honestly and report both the
// accept/reject surface and whether late commits mutate canonical state.
// Run: npx tsx audit/probe-postaccept.mts
import { PftEngine } from '../src/engine/pft/engine.js';
import type { PftAction } from '../src/engine/pft/types.js';
import { PFT12_EVERYTHING_MUST_GO as L12 } from '../src/content/levels/pft12-everything-must-go.js';
import { PFT12_TRACE_B } from '../tests/lib/pft11-12-traces.js';

const W = 'courier-1', F3 = 'courier-3', S = 'courier-4', F = 'ferry-1';
const B: PftAction[] = PFT12_TRACE_B;

const e = new PftEngine(); e.begin(L12, 'pa');
B.forEach((a, i) => {
  const r = e.commit(e.propose('pa', `pa-${i}`, a));
  if (!r.ok) throw new Error(`trace rejected at ${i}: ${r.reason}`);
});
console.log(`completed=${e.currentState.completed} hash=${e.canonicalHash(L12, e.currentState).slice(0, 12)}`);

// Post-completion candidate commands — legal-if-live actions against whatever
// is still on the board.
const attempts: [string, PftAction][] = [
  ['travel east-exit→east', { type: 'travel', courierId: F3, path: ['east'] }],
  ['pack sign-1 again', { type: 'pack', courierId: F3, pieceId: 'sign-1' }],
  ['pickup nothing', { type: 'pickup', courierId: F3, itemId: 'tea' }],
  ['ride_ferry m→e', { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' }],
  ['deliver phantom', { type: 'deliver', courierId: W, itemId: 'granite', recipientId: 'museum' }],
  ['wait', { type: 'wait', courierId: S }],
];
let accepted = 0, mutated = 0;
for (const [label, a] of attempts) {
  const before = e.canonicalHash(L12, e.currentState);
  const r = e.commit(e.propose('pa', `post-${label}`, a));
  const after = e.canonicalHash(L12, e.currentState);
  if (r.ok) {
    accepted++;
    const chg = before !== after;
    mutated = mutated + (chg ? 1 : 0);
    console.log(`ACCEPT ${label} — completed=${e.currentState.completed} hashChanged=${chg}`);
  } else {
    console.log(`reject ${label} — "${r.reason}"`);
  }
}
console.log(`post-accept: ${accepted} accepted, ${mutated} state mutations on completed board`);
console.log(e.currentState.completed ? 'verdict: completed flag survives post-accept commits' : 'verdict: completed flag CLEARED by post-accept commits');
