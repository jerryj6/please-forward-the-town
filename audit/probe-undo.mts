// Undo-fidelity probe (automated playtest): engine.undo() must restore the
// exact pre-commit state, not just look similar. For pft-12's two divergent
// plans: replay a shared prefix, take canonicalHash checkpoints, undo k
// commits, and assert the hash at each checkpoint equals a FRESH engine's
// replay of the same prefix — plus one divergent-continuation check (undo to
// depth d, replay plan A's tail; hash must equal fresh-replay of A-prefix+A-tail).
// Run: npx tsx audit/probe-undo.mts
import { readFileSync } from 'node:fs';
import { PftEngine } from '../src/engine/pft/engine.js';
import type { PftAction } from '../src/engine/pft/types.js';
import { PFT12_EVERYTHING_MUST_GO as L12 } from '../src/content/levels/pft12-everything-must-go.js';

const W = 'courier-1', L2 = 'courier-2', F3 = 'courier-3', S = 'courier-4', F = 'ferry-1';
const load = (p: string): PftAction[] =>
  // eslint-disable-next-line no-eval -- /tmp trace dumps are TS literal bodies
  eval(`[${readFileSync(p, 'utf8').replace(/courierId: L\b/g, 'courierId: L2')}]`) as PftAction[];
const A = load('/tmp/PFT12_TRACE_A.json');
const B = load('/tmp/PFT12_TRACE_B.json');

const apply = (e: PftEngine, seq: PftAction[], from: number, n: number) => {
  for (let i = from; i < from + n && i < seq.length; i++) {
    const r = e.commit(e.propose('u', `u-${i}`, seq[i]!));
    if (!r.ok) throw new Error(`commit ${i} rejected: ${r.reason}`);
  }
};
const freshHash = (seq: PftAction[], n: number) => {
  const e = new PftEngine(); e.begin(L12, 'u'); apply(e, seq, 0, n);
  return e.canonicalHash(L12, e.currentState);
};

let pass = 0, fail = 0;
const ck = (ok: boolean, label: string) => {
  if (ok) { pass++; console.log(`PASS ${label}`); }
  else { fail++; console.log(`FAIL ${label}`); }
};

// 1. Hash checkpoints along plan B's prefix; undo back to each; re-assert.
const e = new PftEngine(); e.begin(L12, 'u');
const checkpoints = [5, 12, 20, 30];
for (const d of checkpoints) {
  apply(e, B, d === 5 ? 0 : checkpoints[checkpoints.indexOf(d) - 1], d - (checkpoints[checkpoints.indexOf(d) - 1] ?? 0));
  const live = e.canonicalHash(L12, e.currentState);
  ck(live === freshHash(B, d), `checkpoint depth ${d}: live hash == fresh replay`);
}

// 2. Undo k commits from depth 30 and re-check against fresh 30-k replay.
let depth = 30;
for (const k of [1, 3, 7]) {
  for (let i = 0; i < k; i++) e.undo();
  depth -= k;
  ck(e.canonicalHash(L12, e.currentState) === freshHash(B, depth),
     `undo ${k} from ${depth + k} → depth ${depth} matches fresh replay`);
}

// 3. Re-apply the undone actions in order; hash must equal fresh replay again.
const undone = 30 - depth;
apply(e, B, depth, undone);
depth = 30;
ck(e.canonicalHash(L12, e.currentState) === freshHash(B, 30),
   `re-applied ${undone} commits → depth 30 matches fresh replay`);

// 4. Divergent continuation: undo to depth 6, replay plan A from its step 6,
//    compare to a fresh engine replaying A entirely (A/B share their first
//    6 actions? verify directly — if not shared, diverge from the nearest
//    common state we CAN reach: undo to 0 and apply A).
const shared = (() => { let i = 0; while (i < Math.min(A.length, B.length) && JSON.stringify(A[i]) === JSON.stringify(B[i])) i++; return i; })();
console.log(`plans share a ${shared}-action prefix`);
while (depth > shared) { e.undo(); depth--; }
const atDiverge = e.canonicalHash(L12, e.currentState);
ck(atDiverge === freshHash(A, shared), `undo to shared prefix depth ${shared} matches fresh A replay`);
apply(e, A, shared, 8);
ck(e.canonicalHash(L12, e.currentState) === freshHash(A, shared + 8),
   `divergent continuation A[${shared}..${shared + 8}] matches fresh A replay`);

// 5. Full undo to t0 → hash equals a just-begun engine.
while (depth > 0) { e.undo(); depth--; }
for (let i = 0; i < shared + 8; i++) e.undo();
const e0 = new PftEngine(); e0.begin(L12, 'u');
ck(e.canonicalHash(L12, e.currentState) === e0.canonicalHash(L12, e0.currentState),
   'full undo → identical to fresh t0');

console.log(`probe-undo: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
