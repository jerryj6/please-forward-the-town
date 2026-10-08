// Automated-playtest probe (pass 4): bounded state-space enumeration for
// PFT-02..07. DFS over committable actions with state dedup (key = play
// state minus beat/seed/completed), depth bound = par + SLACK, and a hard
// explored-state cap — the bound is reported honestly per level.
// 'wait' actions are skipped: they only burn depth without changing state.
// Run: npx tsx audit/probe-enum.mts
import { PftEngine, walkGraph } from '../src/engine/pft/engine.js';
import type { PftAction, PftLevel, PftPlayState } from '../src/engine/pft/types.js';
import { PFT01_LAST_CROSSING as L01 } from '../src/content/levels/pft01-last-crossing.js';
import { PFT08_NO_ONE_LEFT_ON_WEST as L08 } from '../src/content/levels/pft08-no-one-left-on-west.js';
import { PFT09_THREE_USEFUL_PARCELS as L09 } from '../src/content/levels/pft09-three-useful-parcels.js';
import { PFT10_THE_DETOUR_DIVIDEND as L10 } from '../src/content/levels/pft10-the-detour-dividend.js';
import { PFT11_MAIL_THE_POST_OFFICE as L11 } from '../src/content/levels/pft11-mail-the-post-office.js';
import { PFT12_EVERYTHING_MUST_GO as L12 } from '../src/content/levels/pft12-everything-must-go.js';
import { PFT02_TWO_PARCELS_ONE_BOAT as L02 } from '../src/content/levels/pft02-two-parcels-one-boat.js';
import { PFT03_A_BRIDGE_WITH_TWO_ADDRESSES as L03 } from '../src/content/levels/pft03-a-bridge-with-two-addresses.js';
import { PFT04_THE_UPSTAIRS_ADDRESS as L04 } from '../src/content/levels/pft04-the-upstairs-address.js';
import { PFT05_RETURN_TO_SENDER as L05 } from '../src/content/levels/pft05-return-to-sender.js';
import { PFT06_THE_FERRYS_LAST_FARE as L06 } from '../src/content/levels/pft06-the-ferrys-last-fare.js';
import { PFT07_THE_MOVING_ADDRESS as L07 } from '../src/content/levels/pft07-the-moving-address.js';

const SLACK = Number(process.env.SLACK ?? 4); // explore plans up to par+SLACK
const MAX_STATES = Number(process.env.MAX_STATES ?? 1_500_000);
const MAX_TIME_MS = Number(process.env.MAX_MS ?? 120_000);
const NOPRUNE = process.env.NOPRUNE === '1';

const stateKey = (s: PftPlayState): string =>
  JSON.stringify({
    c: s.couriers,
    p: s.parcels,
    pi: s.pieces,
    f: s.ferries,
    fu: s.fulfilled,
  });

/** Shortest hop-paths from `from` over the live walk graph. */
const shortestPaths = (
  level: PftLevel,
  state: PftPlayState,
  from: string,
): Map<string, string[]> => {
  const g = walkGraph(level, state);
  const prev = new Map<string, string | null>([[from, null]]);
  const q = [from];
  while (q.length) {
    const n = q.shift()!;
    for (const m of g.get(n) ?? []) {
      if (!prev.has(m)) {
        prev.set(m, n);
        q.push(m);
      }
    }
  }
  const paths = new Map<string, string[]>();
  for (const [node] of prev) {
    if (node === from) continue;
    const path: string[] = [];
    let cur: string | null = node;
    while (cur !== null && cur !== from) {
      path.unshift(cur);
      cur = prev.get(cur)!;
    }
    paths.set(node, path);
  }
  return paths;
};

/** Enumerate candidate actions plausibly committable from state. Engine validates. */
const candidates = (level: PftLevel, s: PftPlayState): PftAction[] => {
  const acts: PftAction[] = [];
  for (const c of level.couriers) {
    const cs = s.couriers[c.id]!;
    // travel to every reachable node (one canonical shortest path each)
    for (const [node, path] of shortestPaths(level, s, cs.at)) {
      acts.push({ type: 'travel', courierId: c.id, path });
    }
    // pickup: staged parcels + packed pieces at this node
    for (const p of level.parcels) {
      const loc = s.parcels[p.id]!.location;
      if (loc.type === 'node' && loc.nodeId === cs.at)
        acts.push({ type: 'pickup', courierId: c.id, itemId: p.id });
    }
    for (const p of level.pieces) {
      const ps = s.pieces[p.id]!;
      if (ps.status === 'packed' && ps.location.type === 'node' && ps.location.nodeId === cs.at)
        acts.push({ type: 'pickup', courierId: c.id, itemId: p.id });
    }
    // drop each carried item
    for (const item of cs.cargo) acts.push({ type: 'drop', courierId: c.id, itemId: item });
    // ferry ops at the ferry's current dock
    for (const f of level.ferries) {
      const fs = s.ferries[f.id]!;
      if (fs.handedOver || fs.at !== cs.at) continue;
      for (const item of cs.cargo)
        acts.push({ type: 'load_ferry', courierId: c.id, ferryId: f.id, itemId: item });
      for (const p of level.parcels) {
        const loc = s.parcels[p.id]!.location;
        if (loc.type === 'node' && loc.nodeId === cs.at)
          acts.push({ type: 'load_ferry', courierId: c.id, ferryId: f.id, itemId: p.id });
      }
      for (const p of level.pieces) {
        const ps = s.pieces[p.id]!;
        if (ps.status === 'packed' && ps.location.type === 'node' && ps.location.nodeId === cs.at)
          acts.push({ type: 'load_ferry', courierId: c.id, ferryId: f.id, itemId: p.id });
      }
      for (const item of fs.cargo)
        acts.push({ type: 'unload_ferry', courierId: c.id, ferryId: f.id, itemId: item });
      const other = f.docks[0] === cs.at ? f.docks[1] : f.docks[0];
      acts.push({ type: 'ride_ferry', courierId: c.id, ferryId: f.id, to: other });
      if (f.handlingNode === cs.at && fs.cargo.length === 0) {
        for (const r of level.recipients) {
          if (r.node === cs.at)
            acts.push({ type: 'hand_over_ferry', courierId: c.id, ferryId: f.id, recipientId: r.id });
        }
      }
    }
    // pack deployed pieces at a handling endpoint
    for (const p of level.pieces) {
      const ps = s.pieces[p.id]!;
      if (ps.status === 'deployed' && p.handlingNodes.includes(cs.at))
        acts.push({ type: 'pack', courierId: c.id, pieceId: p.id });
    }
    // deploy accessible packed pieces at sockets handled here
    for (const p of level.pieces) {
      const ps = s.pieces[p.id]!;
      if (ps.status !== 'packed') continue;
      const accessible =
        (ps.location.type === 'courier' && ps.location.courierId === c.id) ||
        (ps.location.type === 'node' && ps.location.nodeId === cs.at);
      if (!accessible) continue;
      for (const site of level.sites) {
        if (site.handlingNode === cs.at && site.accepts.includes(p.kind))
          acts.push({ type: 'deploy', courierId: c.id, pieceId: p.id, siteId: site.id });
      }
    }
    // deliver carried items to recipients here
    for (const item of cs.cargo) {
      for (const r of level.recipients) {
        if (r.node === cs.at)
          acts.push({ type: 'deliver', courierId: c.id, itemId: item, recipientId: r.id });
      }
    }
    // send staged parcels down links originating here
    for (const link of level.postalLinks) {
      if (link.from !== cs.at) continue;
      for (const p of level.parcels) {
        const loc = s.parcels[p.id]!.location;
        if (loc.type === 'node' && loc.nodeId === link.from)
          acts.push({ type: 'send', courierId: c.id, linkId: link.id, parcelId: p.id });
      }
    }
  }
  return acts;
};

const sig = (plan: PftAction[]): string =>
  plan.map((a) => a.type[0]).join('');

interface Found {
  len: number;
  seq: string;
  counts: Record<string, number>;
  hasMidDeploy?: boolean;
}

const enumerate = (level: PftLevel) => {
  const bound = (level.par ?? 20) + SLACK;
  const engine = new PftEngine();
  engine.begin(level, 'enum');
  const visited = new Map<string, number>();
  const solutions: Found[] = [];
  const seqs = new Set<string>();
  let explored = 0,
    pruned = 0,
    capped = false,
    sawMiddleHoistDeploy = false;
  const t0 = Date.now();

  // Progress-first ordering: commits that change contracts or cargo structure
  // before positional travel, so DFS reaches solutions before wandering.
  const order = (a: PftAction): number =>
    a.type === 'deliver' || a.type === 'hand_over_ferry' ? 0
    : a.type === 'send' ? 1
    : a.type === 'pack' || a.type === 'deploy' ? 2
    : a.type === 'load_ferry' || a.type === 'unload_ferry' || a.type === 'ride_ferry' ? 3
    : a.type === 'pickup' || a.type === 'drop' ? 4
    : 5;

  const rec = (plan: PftAction[]): void => {
    if (capped) return;
    if (explored >= MAX_STATES || Date.now() - t0 > MAX_TIME_MS) {
      capped = true;
      return;
    }
    const s = engine.currentState;
    if (s.completed) {
      const seq = JSON.stringify(plan);
      if (!seqs.has(seq)) {
        seqs.add(seq);
        const counts: Record<string, number> = {};
        for (const a of plan) counts[a.type] = (counts[a.type] ?? 0) + 1;
        const hasMidDeploy = plan.some(
          (a) => a.type === 'deploy' && 'siteId' in a && a.siteId === 'socket-middle-loft',
        );
        solutions.push({ len: plan.length, seq, counts, hasMidDeploy });
      }
      return; // dead end past completion anyway
    }
    if (plan.length >= bound) return;
    for (const a of candidates(level, s).sort((x, y) => order(x) - order(y))) {
      const res = engine.commit(engine.propose('e', `e-${explored}`, a));
      if (!res.ok) continue;
      if (a.type === 'deploy' && 'siteId' in a && a.siteId === 'socket-middle-loft')
        sawMiddleHoistDeploy = true;
      explored++;
      // Completed states share one terminal key regardless of plan — record
      // BEFORE the visited prune so distinct plans to the same ending survive.
      if (engine.currentState.completed) {
        const seq = JSON.stringify([...plan, a]);
        if (!seqs.has(seq)) {
          seqs.add(seq);
          const counts: Record<string, number> = {};
          for (const x of [...plan, a]) counts[x.type] = (counts[x.type] ?? 0) + 1;
          solutions.push({ len: plan.length + 1, seq, counts });
        }
        engine.undo();
        continue;
      }
      const key = stateKey(engine.currentState);
      const prevDepth = visited.get(key);
      if (!NOPRUNE && prevDepth !== undefined && prevDepth <= plan.length + 1) {
        pruned++;
        engine.undo();
        continue;
      }
      if (prevDepth === undefined || plan.length + 1 < prevDepth)
        visited.set(key, plan.length + 1);
      plan.push(a);
      rec(plan);
      plan.pop();
      engine.undo();
      if (capped) return;
    }
  };
  rec([]);
  return { bound, explored, pruned, capped, solutions, ms: Date.now() - t0, sawMidDeploy: sawMiddleHoistDeploy };
};

const levels: [string, PftLevel][] = [
  ['pft-08', L08],
  ['pft-09', L09],
  ['pft-10', L10],
  ['pft-11', L11],
  ['pft-12', L12],
  ['pft-01', L01],
  ['pft-02', L02],
  ['pft-03', L03],
  ['pft-04', L04],
  ['pft-05', L05],
  ['pft-06', L06],
  ['pft-07', L07],
];

const only = process.argv[2];
for (const [name, level] of levels) {
  if (only && name !== only) continue;
  const r = enumerate(level);
  const byLen = new Map<number, number>();
  for (const s of r.solutions) byLen.set(s.len, (byLen.get(s.len) ?? 0) + 1);
  const minLen = Math.min(...r.solutions.map((s) => s.len), Infinity);
  console.log(
    `${name}: bound=${r.bound} explored=${r.explored} pruned=${r.pruned} ` +
      `capped=${r.capped} ms=${r.ms} solutions=${r.solutions.length} ` +
      `sawMidDeploy=${(r as { sawMidDeploy?: boolean }).sawMidDeploy} ` +
      `byLen=${JSON.stringify(Object.fromEntries([...byLen].sort((a, b) => a[0] - b[0])))} ` +
      `minLen=${minLen}`,
  );
  if (process.env.DUMP === '1') {
    for (const s of r.solutions.sort((a, b) => a.len - b.len)) {
      console.log(`--- ${name} len=${s.len} midDeploy=${s.hasMidDeploy} counts=${JSON.stringify(s.counts)}`);
      console.log(s.seq);
    }
  }
}
