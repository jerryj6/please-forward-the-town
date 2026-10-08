// Pass-5 bounded enumeration for PFT-08..12: SEEDED-WINDOW variant.
// Full DFS enumeration is intractable on four-courier levels (pft-08 caps at
// 800k explored before the first completion). Honest bound instead: replay
// the verified trace's prefix, then enumerate the final-WINDOW action space
// — how many distinct ways does the last stretch of the plan complete?
// Run: npx tsx audit/probe-enum-tail.mts [pft-08|...]
import { PftEngine, walkGraph } from '../src/engine/pft/engine.js';
import type { PftAction, PftLevel, PftPlayState } from '../src/engine/pft/types.js';
import { PFT08_NO_ONE_LEFT_ON_WEST as L08 } from '../src/content/levels/pft08-no-one-left-on-west.js';
import { PFT09_THREE_USEFUL_PARCELS as L09 } from '../src/content/levels/pft09-three-useful-parcels.js';
import { PFT10_THE_DETOUR_DIVIDEND as L10 } from '../src/content/levels/pft10-the-detour-dividend.js';
import { PFT11_MAIL_THE_POST_OFFICE as L11 } from '../src/content/levels/pft11-mail-the-post-office.js';
import { PFT12_EVERYTHING_MUST_GO as L12 } from '../src/content/levels/pft12-everything-must-go.js';
import { WINNING_TRACES } from '../tests/lib/winning-traces.js';

const WINDOW = Number(process.env.WINDOW ?? 8);
const MAX_STATES = Number(process.env.MAX_STATES ?? 1_000_000);
const MAX_MS = Number(process.env.MAX_MS ?? 90_000);
const DENY = new Set((process.env.DENY ?? '').split(',').filter(Boolean));

const body = (n: string): PftAction[] => {
  for (const list of Object.values(WINNING_TRACES)) {
    const t = list.find((x) => x.name === n);
    if (t) return t.actions as PftAction[];
  }
  throw new Error(`no winning trace named ${n}`);
};

const key = (s: PftPlayState): string =>
  JSON.stringify({ c: s.couriers, p: s.parcels, pi: s.pieces, f: s.ferries, fu: s.fulfilled });

const shortest = (st: PftPlayState, from: string, level: PftLevel) => {
  const g = walkGraph(level, st);
  const prev = new Map<string, string | null>([[from, null]]);
  const q = [from];
  while (q.length) {
    const n = q.shift()!;
    for (const m of g.get(n) ?? []) if (!prev.has(m)) { prev.set(m, n); q.push(m); }
  }
  const out = new Map<string, string[]>();
  for (const [n] of prev) {
    if (n === from) continue;
    const p: string[] = [];
    let c: string | null = n;
    while (c && c !== from) { p.unshift(c); c = prev.get(c)!; }
    out.set(n, p);
  }
  return out;
};

const cand = (level: PftLevel, st: PftPlayState): PftAction[] => {
  const A: PftAction[] = [];
  for (const c of level.couriers) {
    const cs = st.couriers[c.id]!;
    for (const [, p] of shortest(st, cs.at, level)) A.push({ type: 'travel', courierId: c.id, path: p });
    for (const pr of level.parcels) {
      const l = st.parcels[pr.id]!.location;
      if (l.type === 'node' && l.nodeId === cs.at) A.push({ type: 'pickup', courierId: c.id, itemId: pr.id });
    }
    for (const pr of level.pieces) {
      const ps = st.pieces[pr.id]!;
      if (ps.status === 'packed' && ps.location.type === 'node' && ps.location.nodeId === cs.at)
        A.push({ type: 'pickup', courierId: c.id, itemId: pr.id });
    }
    for (const i of cs.cargo) A.push({ type: 'drop', courierId: c.id, itemId: i });
    for (const f of level.ferries) {
      const fs = st.ferries[f.id]!;
      if (fs.handedOver || fs.at !== cs.at) continue;
      for (const i of cs.cargo) A.push({ type: 'load_ferry', courierId: c.id, ferryId: f.id, itemId: i });
      for (const pr of level.parcels) {
        const l = st.parcels[pr.id]!.location;
        if (l.type === 'node' && l.nodeId === cs.at) A.push({ type: 'load_ferry', courierId: c.id, ferryId: f.id, itemId: pr.id });
      }
      for (const pr of level.pieces) {
        const ps = st.pieces[pr.id]!;
        if (ps.status === 'packed' && ps.location.type === 'node' && ps.location.nodeId === cs.at)
          A.push({ type: 'load_ferry', courierId: c.id, ferryId: f.id, itemId: pr.id });
      }
      for (const i of fs.cargo) A.push({ type: 'unload_ferry', courierId: c.id, ferryId: f.id, itemId: i });
      const o = f.docks[0] === cs.at ? f.docks[1] : f.docks[0];
      A.push({ type: 'ride_ferry', courierId: c.id, ferryId: f.id, to: o });
      if (f.handlingNode === cs.at && !fs.cargo.length)
        for (const r of level.recipients) if (r.node === cs.at)
          A.push({ type: 'hand_over_ferry', courierId: c.id, ferryId: f.id, recipientId: r.id });
    }
    for (const pr of level.pieces) {
      const ps = st.pieces[pr.id]!;
      if (ps.status === 'deployed' && pr.handlingNodes.includes(cs.at))
        A.push({ type: 'pack', courierId: c.id, pieceId: pr.id });
      if (ps.status === 'packed') {
        const acc = (ps.location.type === 'courier' && ps.location.courierId === c.id) ||
          (ps.location.type === 'node' && ps.location.nodeId === cs.at);
        if (acc) for (const site of level.sites)
          if (site.handlingNode === cs.at && site.accepts.includes(pr.kind))
            A.push({ type: 'deploy', courierId: c.id, pieceId: pr.id, siteId: site.id });
      }
    }
    for (const i of cs.cargo)
      for (const r of level.recipients)
        if (r.node === cs.at) A.push({ type: 'deliver', courierId: c.id, itemId: i, recipientId: r.id });
    for (const lk of level.postalLinks) {
      if (lk.from !== cs.at) continue;
      for (const pr of level.parcels) {
        const l = st.parcels[pr.id]!.location;
        if (l.type === 'node' && l.nodeId === lk.from)
          A.push({ type: 'send', courierId: c.id, linkId: lk.id, parcelId: pr.id });
      }
    }
  }
  return A;
};

const run = (name: string, level: PftLevel, traceName: string, slack: number) => {
  const trace = body(traceName);
  const cut = Math.max(0, trace.length - WINDOW);
  const engine = new PftEngine();
  engine.begin(level, 'enum');
  for (let i = 0; i < cut; i++) {
    const r = engine.commit(engine.propose('p', `p-${i}`, trace[i]!));
    if (!r.ok) { console.log(`${name}: PREFIX REJECT at ${i}: ${r.reason}`); return; }
  }
  const bound = trace.length + slack;
  const seen = new Map<string, number>();
  const sols: number[] = [];
  const seqs = new Set<string>();
  const msets = new Set<string>();
  const exemplars = new Map<string, PftAction[]>();
  let explored = 0, capped = false;
  const t0 = Date.now();
  const rec = (d: number, plan: PftAction[]): void => {
    if (capped) return;
    const st = engine.currentState;
    if (st.completed) {
      const seq = JSON.stringify(plan);
      if (!seqs.has(seq)) {
        seqs.add(seq); sols.push(d);
        msets.add(JSON.stringify([...plan].map(a => JSON.stringify(a)).sort()));
      }
      return;
    }
    if (d >= bound || explored >= MAX_STATES || Date.now() - t0 > MAX_MS) { if (d >= bound) {} else capped = true; return; }
    for (const a of cand(level, st)) {
      if (DENY.has(a.type)) continue;
      const r = engine.commit(engine.propose('e', `e-${explored}`, a));
      if (!r.ok) continue;
      explored++;
      if (engine.currentState.completed) {
        const seq = JSON.stringify([...plan, a]);
        if (!seqs.has(seq)) {
          seqs.add(seq); sols.push(d + 1);
          const msig = JSON.stringify([...plan, a].map(x => JSON.stringify(x)).sort());
          msets.add(msig);
          if (!exemplars.has(msig)) exemplars.set(msig, [...plan, a]);
        }
        engine.undo(); continue;
      }
      const k = key(engine.currentState);
      const pd = seen.get(k);
      if (pd !== undefined && pd <= d + 1) { engine.undo(); continue; }
      if (pd === undefined || d + 1 < pd) seen.set(k, d + 1);
      plan.push(a); rec(d + 1, plan); plan.pop();
      engine.undo();
    }
  };
  rec(cut, trace.slice(0, cut));
  if (process.env.DUMP === '1') {
    for (const [msig, plan] of exemplars) {
      console.log(`EXEMPLAR len=${plan.length} mset=${msig.slice(0, 80)}`);
    }
  }
  const byLen = new Map<number, number>();
  for (const d of sols) byLen.set(d, (byLen.get(d) ?? 0) + 1);
  const byLenSets = new Map<number, Set<string>>();
  for (const m of msets) {
    const n = (JSON.parse(m) as string[]).length;
    if (!byLenSets.has(n)) byLenSets.set(n, new Set());
    byLenSets.get(n)!.add(m);
  }
  const byLenDistinct = Object.fromEntries([...byLenSets].map(([k, v]) => [k, v.size]).sort((a, b) => a[0] - b[0]));
  console.log(`${name}: window=${WINDOW} bound=${bound} explored=${explored} capped=${capped} ` +
    `ms=${Date.now() - t0} completions=${sols.length} distinctMultisets=${msets.size} ` +
    `byLen=${JSON.stringify(Object.fromEntries([...byLen].sort((a, b) => a[0] - b[0])))} ` +
    `distinctByLen=${JSON.stringify(byLenDistinct)}`);
};

// Optional overrides: TRACE=<const-name> and SLACK=<n> override the job's
// trace seed and par slack, e.g. `TRACE=PFT10_TRACE_C SLACK=-1 npx tsx audit/probe-enum-tail.mts pft-10`.
const OV_TRACE = process.env.TRACE;
const OV_SLACK = process.env.SLACK !== undefined ? Number(process.env.SLACK) : undefined;
const jobs: Record<string, [PftLevel, string, number]> = {
  'pft-08': [L08, 'PFT08_TRACE', 2],
  'pft-09': [L09, 'PFT09_TRACE', 2],
  'pft-10': [L10, 'PFT10_TRACE_A', 2],
  'pft-11': [L11, 'PFT11_TRACE', 2],
  'pft-12': [L12, 'PFT12_TRACE_B', 2],
};
const only = process.argv[2];
for (const [n, [lv, tn, sl]] of Object.entries(jobs)) {
  if (only && n !== only) continue;
  run(n, lv, OV_TRACE ?? tn, OV_SLACK ?? sl);
}
