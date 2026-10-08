# PFT Refinement Audit — Pass 11

Queue: cross-check fix + (1) undo-fidelity, (2) pft-04 ordering
denial, (3) TRACE_C coverage, (4) research dataroom.

## Cross-check: PFT10_TRACE_C ships verbatim

`tests/unit/pft08-10.test.ts` is in this tarball unchanged — it
contains `const PFT10_TRACE_C` (lines ~488–515, 27 actions: 2 sends,
5 ride_ferry, 0 deploys) and its acceptance block "plan C passes:
both parcels down the wire — 27 moves, one under par" (~line 563).
Coordinator note: upstream count for coop-necessity before C lands is
44 (16 traces); after C lands it becomes 52/52, matching my tree.

## 1. Undo-fidelity probe — 11/11 (automated playtest)

`audit/probe-undo.mts` on pft-12 plan B: canonicalHash checkpoints at
depths 5/12/20/30 match fresh replays exactly; undo 1/3/7 commits →
each hash equals the fresh replay at that depth; re-applying the
undone actions returns byte-identical state; a DIVERGENT continuation
(undo to the shared 2-action prefix, replay plan A's steps) matches
fresh A replay; full rewind = fresh t0. `engine.undo()` is exact, not
approximate — the undo lab is sound for A/B exploration.

Probe gotcha documented: `canonicalHash` is seed-sensitive — fresh
engines must share the seed ('u') for hash comparison.

## 2. pft-04 ordering-denial hunt — no single-commitment denial exists

FIRST env added to probe-enum (force an opening commitment, then
enumerate). Forcing `pack stair-1` as the opening move — the level's
signature "wrong" commitment — still yields **3 completions at bound
20** (two over optimum), all via `sawMidDeploy` (redeploying the
stair at the middle hoist). Honest finding: pft-04's bad opening is a
+2 price, not a death — which IS the `redeploy` recovery class
working as designed. The loft lesson can't be "denied" because the
stair is recoverable infrastructure, not a one-way door. No other
deny-able verb exists (stair starts deployed → DENY=deploy vacuous).

## 3. TRACE_C coop-necessity coverage

Already covered: coop-necessity ran 52/52 including TRACE_C's four
courier streams — all load-bearing.

## 4. Research dataroom — `audit/DESIGN-RESEARCH-PFT5.md`

Action-economy design: 5 techniques (multiset-as-economy, under-par
discoveries as achievements, redundant-moves vs wrong-verbs, cheapest
plan teaches deepest lesson, undo-as-economy-lab) grounded in this
pass's data.

## Diff summary

- `tests/unit/pft08-10.test.ts` — unchanged; ships PFT10_TRACE_C.
- `audit/probe-enum.mts` — FIRST env (forced opening commitment).
- `audit/probe-undo.mts` — NEW: undo-fidelity validator (11/11).
- `LEVELS.md` — unchanged this pass (appendix stands).
- `audit/DESIGN-RESEARCH-PFT5.md` — NEW dataroom entry.
- `audit/PFT-AUDIT-PASS11.md` — this doc.

`npx vitest run` 102/102; `npx tsc --noEmit` 0; card-vs-engine 33/33;
coop-necessity 52/52; probe-undo 11/11.
