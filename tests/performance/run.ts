/**
 * tests/performance/run.ts — PFT campaign replay benchmark (gate G4).
 * Replays every registered winning trace for all levels through the
 * production sim (simulate), prints a per-level table, and exits non-zero
 * on a budget regression.
 *
 * Budget knobs (env):
 *   PFT_PERF_PER_LEVEL_MS   per-level mean limit   (default 500)
 *   PFT_PERF_TOTAL_MS       whole-campaign limit   (default 8000)
 *   PFT_PERF_REPS           repetitions per trace  (default 10)
 */
import { performance } from "node:perf_hooks";
import { LEVELS } from "../../src/content/levels/index.js";
import { WINNING_TRACES, replay } from "../lib/winning-traces.js";

const PER_LEVEL_MS = Number(process.env["PFT_PERF_PER_LEVEL_MS"] ?? 500);
const TOTAL_MS = Number(process.env["PFT_PERF_TOTAL_MS"] ?? 8000);
const REPS = Math.max(1, Number(process.env["PFT_PERF_REPS"] ?? 10));

const rows: { level: string; traces: number; meanMs: number; maxMs: number; solved: boolean }[] = [];
let grand = 0;
let failed = 0;

for (const { id, def } of LEVELS) {
  const traces = WINNING_TRACES[id] ?? [];
  const times: number[] = [];
  let allSolved = true;
  for (const trace of traces) {
    for (let r = 0; r < REPS; r++) {
      const t0 = performance.now();
      const res = replay(def, trace.actions);
      times.push(performance.now() - t0);
      if (!res.success) allSolved = false;
    }
  }
  const mean = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const max = times.length ? Math.max(...times) : 0;
  grand += times.reduce((a, b) => a + b, 0);
  rows.push({ level: id, traces: traces.length, meanMs: mean, maxMs: max, solved: allSolved });
}

console.log("\nPFT campaign replay benchmark");
console.log(`reps/trace=${REPS}  per-level budget=${PER_LEVEL_MS}ms  total budget=${TOTAL_MS}ms\n`);
console.log("level   traces   mean ms   max ms   solved");
console.log("-----   ------   -------   ------   ------");
for (const r of rows) {
  const flag = r.meanMs > PER_LEVEL_MS ? "  ← OVER" : "";
  console.log(
    `${r.level.padEnd(7)} ${String(r.traces).padEnd(8)} ${r.meanMs.toFixed(2).padStart(7)} ${r.maxMs.toFixed(2).padStart(10)}   ${r.solved ? "yes" : "NO"}${flag}`,
  );
  if (!r.solved || r.meanMs > PER_LEVEL_MS) failed++;
}
console.log(`\nTOTAL simulated time: ${grand.toFixed(2)}ms`);
if (grand > TOTAL_MS) failed++;
if (failed > 0) { console.error(`FAIL: ${failed} violation(s)`); process.exit(1); }
console.log("PASS: all levels under budget, all traces solve.");
