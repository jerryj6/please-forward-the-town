# PFT Refinement Audit — Pass 7

Queue: (1) pull latest tree / skip client App.tsx — no tarball attached,
tree untouched (client is upstream-only; nothing to overwrite);
(2) enumerate pft-01 + deeper pft-04; (3) scripted 2-player co-op
playtest on pft-12; (4) WA probe audit — already covered by the pass-6
validator (33/33), no inexpressible probes found; (5) design-research
dataroom entry.

## 1. Enumeration extensions (automated playtest)

- **pft-01** (first enumeration): bound 13 (par+4), complete — **5 plans:
  unique 9-move optimum**, 2×11, 1×12, 1×13, and **nothing at 10** —
  another genuine rung gap, matching pft-03 (missing 18) and pft-09
  (missing 39). Even-numbered slack pattern holds across the campaign.
- **pft-04** (par+4 retry, previously capped): bound 22 now completes at
  1.6M explored / 139s — **19 plans, still exactly two optimal
  18-move plans**, variants at 19–22. No under-par degenerate and no
  rung gap. LEVELS.md updated (earlier note had par+4 marked
  intractable).

## 2. Scripted 2-player co-op playtest on pft-12 (engine-level)

`audit/probe-coop-pft12.mts`. Client/room layer is upstream-only, so the
probe runs the two-player model at the action layer: player A owns
couriers 1–2, player B owns couriers 3–4; each player's stream is their
subsequence of the verified 44-move trace B.

Findings (honest, all verified):
- **Baseline completes**: 44 moves, canonical hash recorded.
- **Every one of the 7 cross-player adjacent boundaries commutes** —
  swapping adjacent A/B actions never breaks legality. The plan is
  locally interleave-friendly.
- **A work-conserving merge dead-ends** — letting player B race ahead
  packs the office sign early, killing the office-old lane player A
  still needs. Co-op is not "split by courier and go"; the real
  dependency is long-range (office work BEFORE sign teardown), exactly
  what the level's coopNote claims ("teardown order is the team
  question"). Verified rather than asserted.
- **Neither half completes alone**: player A stalls at
  `slip -> office-new` (no office), player B stalls at send/staging —
  forced coupling confirmed on the par trace.

Browser/lockstep UI evidence remains upstream-bound (no client in this
tree); the probe above is the engine-level equivalent — convergence and
coupling measured against the frozen engine, no fabricated playtests.

## 3. WA probe audit

Already shipped pass 6 (`scripts/card-vs-engine.mts`, 33/33 pass).
Re-verified this pass — no carded wrongApproach was found that the
validator can't express.

## 4. Design research dataroom

`audit/DESIGN-RESEARCH-PFT.md` — 5 techniques mapped to PFT mechanics
from cited sources (Rix GDC-2012 level-design postmortem; Hazelden RPS
interviews + Draknek retrospective; Mini Metro's shared-finite-resource
shape): one-idea-per-level incl. combo lessons; finite shared
infrastructure as the puzzle; legible failure as the quality bar;
practice-after-teaching + any-solve acceptance; discovery-space over
hoops (enumeration width as the evidence).

## Diff summary

- `audit/probe-enum.mts` — pft-01 registered in the level table.
- `audit/probe-coop-pft12.mts` — NEW co-op playtest probe.
- `audit/DESIGN-RESEARCH-PFT.md` — NEW dataroom entry.
- `LEVELS.md` — pft-04 solution-space updated to the completed bound-22
  run.
- `audit/PFT-AUDIT-PASS7.md` — this doc.

`npx vitest run` 102/102; `npx tsc --noEmit` 0; probes exit cleanly.
