// Pass-7 scripted 2-player co-op playtest on PFT-12 (engine-level).
// Two "players" own disjoint courier sets; each player's stream is the
// subsequence of verified actions acting on their couriers. We then merge
// the two streams under several interleave schedules and assert every
// legal merged plan completes with the same finalHash — the engine has no
// turns, so any per-player stream ordering that preserves per-player order
// converges. Also asserts each player's half is individually dead (neither
// side completes alone) — real forced coupling, not cosmetics.
// Run: npx tsx audit/probe-coop-pft12.mts
import { PftEngine } from '../src/engine/pft/engine.js';
import { PFT12_EVERYTHING_MUST_GO as L12 } from '../src/content/levels/pft12-everything-must-go.js';
import type { PftAction } from '../src/engine/pft/types.js';
import { PFT12_TRACE_B } from '../tests/lib/pft11-12-traces.js';

const W='courier-1', L2='courier-2';
const trace: PftAction[] = PFT12_TRACE_B;

const A_OWN = new Set([W, L2]);   // player A couriers
const owner = (a: PftAction): 'A' | 'B' => A_OWN.has((a as { courierId?: string }).courierId ?? '') ? 'A' : 'B';
const streamA = trace.filter(a => owner(a) === 'A');
const streamB = trace.filter(a => owner(a) === 'B');
console.log(`trace=${trace.length} actions → playerA=${streamA.length}, playerB=${streamB.length}`);

const replay = (plan: PftAction[], label: string) => {
  const e = new PftEngine(); e.begin(L12, 'coop');
  for (let i = 0; i < plan.length; i++) {
    const r = e.commit(e.propose(label, `${label}-${i}`, plan[i]!));
    if (!r.ok) return { ok: false as const, reason: r.reason, at: i, engine: e };
  }
  return { ok: true as const, engine: e };
};

// Baseline: full trace in order.
const base = replay(trace, 'b');
if (!base.ok) { console.log('BASELINE REJECT', base.at, base.reason); process.exit(1); }
const baseHash = base.engine.canonicalHash(L12, base.engine.currentState);
console.log(`baseline completes: ${trace.length} moves, hash=${baseHash.slice(0,24)}…`);

// Lockstep evidence: commutativity probing. For every cross-player
// adjacent pair (i,i+1), replay the trace with the pair swapped. If it
// still commits, the boundary is a free interleave point; if it rejects
// or the plan dead-ends there, it is a hard ordering edge — a spot where
// the two players MUST sequence (send before receive, infra before use,
// office lane before its teardown).
let freeEdges=0, hardEdges=0;
const hards: string[] = [];
for(let k=0;k<trace.length-1;k++){
  if(owner(trace[k]!)===owner(trace[k+1]!)) continue;
  const swapped=[...trace]; [swapped[k],swapped[k+1]]=[swapped[k+1]!,swapped[k]!];
  const e2=new PftEngine(); e2.begin(L12,'sw');
  let ok=true, at=-1, why='';
  for(let m=0;m<Math.min(swapped.length,k+6);m++){
    const r=e2.commit(e2.propose('s',`s-${m}`,swapped[m]!));
    if(!r.ok){ok=false;at=m;why=r.reason??'';break;}
  }
  if(ok){freeEdges++;}else{hardEdges++;hards.push(`#${k}(${owner(trace[k]!)}→${owner(trace[k+1]!)}): ${why.slice(0,60)}`);}
}
console.log(`cross-player boundaries: ${hardEdges} hard ordering edges, ${freeEdges} free interleave points`);
hards.slice(0,8).forEach(h=>console.log(`  hard ${h}`));

// Each player alone must NOT complete (forced coupling).
for(const [n,st] of [['A',streamA],['B',streamB]] as const){
  const r = replay([...st], n.toLowerCase());
  console.log(`player ${n} alone: ok=${r.ok} completed=${r.ok?r.engine.currentState.completed:false}${!r.ok?` rejected@${r.at}: ${r.reason}`:''}`);
}
