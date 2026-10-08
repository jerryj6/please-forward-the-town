// Automated-playtest probe (pass 3): minimalism (delete-one-action) for
// PFT-02..07 verified traces, plus level-specific degenerate-solve hunts.
// Run: npx tsx audit/probe-pft02-07.mts
import { simulate } from '../src/engine/pft/sim.js';
import type { PftAction } from '../src/engine/pft/types.js';
import { PFT02_TWO_PARCELS_ONE_BOAT as L02 } from '../src/content/levels/pft02-two-parcels-one-boat.js';
import { PFT03_A_BRIDGE_WITH_TWO_ADDRESSES as L03 } from '../src/content/levels/pft03-a-bridge-with-two-addresses.js';
import { PFT04_THE_UPSTAIRS_ADDRESS as L04 } from '../src/content/levels/pft04-the-upstairs-address.js';
import { PFT05_RETURN_TO_SENDER as L05 } from '../src/content/levels/pft05-return-to-sender.js';
import { PFT06_THE_FERRYS_LAST_FARE as L06 } from '../src/content/levels/pft06-the-ferrys-last-fare.js';
import { PFT07_THE_MOVING_ADDRESS as L07 } from '../src/content/levels/pft07-the-moving-address.js';
import { WINNING_TRACES } from '../tests/lib/winning-traces.js';

const body = (n: string): PftAction[] => {
  for (const list of Object.values(WINNING_TRACES)) {
    const t = list.find((x) => x.name === n);
    if (t) return t.actions as PftAction[];
  }
  throw new Error(`no winning trace named ${n}`);
};

const cases: [string, ReturnType<typeof body>, typeof L02][] = [
  ['PFT-02A', body('PFT02_TRACE_A'), L02],
  ['PFT-02B', body('PFT02_TRACE_B'), L02],
  ['PFT-03', body('PFT03_TRACE'), L03],
  ['PFT-04A', body('PFT04_TRACE_A'), L04],
  ['PFT-04B', body('PFT04_TRACE_B'), L04],
  ['PFT-05A', body('PFT05_TRACE_A'), L05],
  ['PFT-05B', body('PFT05_TRACE_B'), L05],
  ['PFT-06A', body('PFT06_TRACE_A'), L06],
  ['PFT-06B', body('PFT06_TRACE_B'), L06],
  ['PFT-07', body('PFT07_TRACE'), L07],
];

for (const [name, trace, level] of cases) {
  const base = simulate(level, trace, 's');
  if (!base.success) {
    console.log(`${name}: BASELINE FAIL len=${trace.length} — investigate!`);
    continue;
  }
  const redundant: number[] = [];
  for (let i = 0; i < trace.length; i++) {
    if (simulate(level, trace.filter((_, j) => j !== i), 's').success) redundant.push(i);
  }
  console.log(`${name}: len=${trace.length} redundant=[${redundant.join(',')}]`);
}
