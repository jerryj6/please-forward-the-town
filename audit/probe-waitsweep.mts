// Wait-leak sweep (automated playtest): replay the first winning trace of
// every level to completion, then probe post-completion `wait` — accepted?
// mutates canonical hash? clears completed? Reports per level so the
// superseded-verdict policy knows where the leak lives.
// Run: npx tsx audit/probe-waitsweep.mts
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
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

// Same trace-extraction idiom as coop-necessity.
const litVals = (raw: string): string[] => {
  const out: string[] = [];
  for (const m of raw.matchAll(/'([^']+)'|"([^"]+)"/g)) out.push(m[1] ?? m[2] ?? '');
  return out;
};
const traceByConst = new Map<string, PftAction[]>();
for (const f of readdirSync(new URL('../tests/unit', import.meta.url).pathname)) {
  if (!f.endsWith('.ts')) continue;
  const src = readFileSync(join(new URL('../tests/unit', import.meta.url).pathname, f), 'utf8');
  const idents = new Map<string, string>();
  for (const m of src.matchAll(/const (\w+)\s*=\s*'([^']+)'/g)) idents.set(m[1]!, m[2]!);
  for (const m of src.matchAll(/const (\w+):\s*PftAction\[\]\s*=\s*\[(.*?)\];/gs)) {
    const actions: PftAction[] = [];
    for (const objM of m[2]!.matchAll(/\{\s*type:\s*['"](\w+)['"][^}]*\}/g)) {
      const a: Record<string, unknown> = { type: /type:\s*'(\w+)'/.exec(objM[0])![1] };
      for (const kv of objM[0].matchAll(/(\w+):\s*(?:'([^']*)'|"([^"]*)"|\[([^\]]*)\]|(\w+))/g)) {
        const [, k, s1, s2, arr, ident] = kv;
        if (!k || k === 'type') continue;
        if (arr !== undefined) a[k] = litVals(arr).map(v => idents.get(v) ?? v);
        else if (s1 ?? s2) a[k] = s1 ?? s2;
        else if (ident) a[k] = idents.get(ident) ?? ident;
      }
      actions.push(a as unknown as PftAction);
    }
    traceByConst.set(m[1]!, actions);
  }
}

const jobs: [string, PftLevel, string][] = [
  ['pft-01', L01, 'TRACE_A'], ['pft-02', L02, 'PFT02_TRACE_A'], ['pft-03', L03, 'PFT03_TRACE'],
  ['pft-04', L04, 'PFT04_TRACE_A'], ['pft-05', L05, 'PFT05_TRACE_A'], ['pft-06', L06, 'PFT06_TRACE_A'],
  ['pft-07', L07, 'PFT07_TRACE'], ['pft-08', L08, 'PFT08_TRACE'], ['pft-09', L09, 'PFT09_TRACE'],
  ['pft-10', L10, 'PFT10_TRACE_A'], ['pft-11', L11, 'PFT11_TRACE'], ['pft-12', L12, 'PFT12_TRACE_B'],
];

let leaked = 0, sealed = 0;
for (const [name, level, tname] of jobs) {
  const trace = traceByConst.get(tname)!;
  const e = new PftEngine(); e.begin(level, 'ws');
  trace.forEach((a, i) => { const r = e.commit(e.propose('ws', `ws-${i}`, a)); if (!r.ok) throw new Error(`${name} rejected ${i}`); });
  const courier = trace[trace.length - 1]!.courierId;
  const h0 = e.canonicalHash(level, e.currentState);
  const r = e.commit(e.propose('ws', 'post-wait', { type: 'wait', courierId: courier }));
  const changed = e.canonicalHash(level, e.currentState) !== h0;
  if (r.ok) {
    leaked++;
    console.log(`${name}: wait ACCEPTED post-completion — hashChanged=${changed} completed=${e.currentState.completed}`);
  } else {
    sealed++;
    console.log(`${name}: wait rejected — "${r.reason}"`);
  }
}
console.log(`wait-leak sweep: ${leaked} levels accept wait post-completion, ${sealed} reject`);
