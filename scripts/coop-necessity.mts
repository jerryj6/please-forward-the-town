// CoopNote necessity probe — verifies the coop claims the engine can prove.
// For every winning trace on PFT-01..12 (extracted from the unit tests),
// replay the trace minus one courier's entire action stream and assert the
// plan does NOT complete (rejection or incomplete). If a courier's stream
// can be deleted without consequence, that courier was filler — the coopNote
// is a lie. Actions are attributed by courierId (every PftAction carries one).
// Run: npx tsx scripts/coop-necessity.mts   (upstream: npm run check:content2)
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

// Resolve traces from the consolidated winning-traces registry (the same
// tables the unit tests prove), keyed by their declared `name`.
const traceByConst = new Map<string, PftAction[]>();
for (const list of Object.values(WINNING_TRACES)) {
  for (const t of list) traceByConst.set(t.name, [...t.actions]);
}

interface Spec { id: string; level: PftLevel; traces: string[] }
const SPECS: Spec[] = [
  { id: 'pft-01', level: L01, traces: ['TRACE_A'] },
  { id: 'pft-02', level: L02, traces: ['PFT02_TRACE_A', 'PFT02_TRACE_B'] },
  { id: 'pft-03', level: L03, traces: ['PFT03_TRACE'] },
  { id: 'pft-04', level: L04, traces: ['PFT04_TRACE_A', 'PFT04_TRACE_B'] },
  { id: 'pft-05', level: L05, traces: ['PFT05_TRACE_A', 'PFT05_TRACE_B'] },
  { id: 'pft-06', level: L06, traces: ['PFT06_TRACE_A', 'PFT06_TRACE_B'] },
  { id: 'pft-07', level: L07, traces: ['PFT07_TRACE'] },
  { id: 'pft-08', level: L08, traces: ['PFT08_TRACE'] },
  { id: 'pft-09', level: L09, traces: ['PFT09_TRACE'] },
  { id: 'pft-10', level: L10, traces: ['PFT10_TRACE_A', 'PFT10_TRACE_B', 'PFT10_TRACE_C'] },
  { id: 'pft-11', level: L11, traces: ['PFT11_TRACE'] },
  { id: 'pft-12', level: L12, traces: ['PFT12_TRACE_A', 'PFT12_TRACE_B'] },
];

const replay = (level: PftLevel, seq: PftAction[]) => {
  const engine = new PftEngine();
  engine.begin(level, 'cn');
  seq.forEach((a, i) => {
    const r = engine.commit(engine.propose('cn', `cn-${i}`, a));
    if (!r.ok) return; // stop at first rejection
  });
  return engine;
};

let pass = 0, fail = 0;
for (const spec of SPECS) {
  for (const tname of spec.traces) {
    const trace = traceByConst.get(tname);
    if (!trace) { console.log(`FAIL ${spec.id} ${tname}: trace not found in tests`); fail++; continue; }
    const couriers = [...new Set(trace.map(a => a.courierId))].sort();
    for (const c of couriers) {
      const minus = trace.filter(a => a.courierId !== c);
      const e = replay(spec.level, minus);
      const complete = e.currentState.completed === true;
      const who = `${spec.id}/${tname}/-${c}`;
      if (!complete) {
        pass++;
        console.log(`PASS ${who} → ${e.currentState.completed ? 'completed' : 'not completed'}`);
      } else {
        fail++;
        console.log(`FAIL ${who} → level completed without ${c}; courier was filler`);
      }
    }
  }
}
console.log(`coop-necessity: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
