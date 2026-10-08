# PFT Refinement Audit — pass 4 (2026-10-08)

Pass 4: bounded state-space enumeration on PFT-02..07 (the PFT equivalent of
TRS's irreducible-solution count) + remaining bible-part sweeps. All runs are
**automated playtests**. Engine frozen. `npx vitest run` 102/102,
`npx tsc --noEmit` 0.

## 1. Bounded move-graph enumeration (`audit/probe-enum.mts`)

PFT's action space is too large for full enumeration — honest bound:
**DFS over committable actions, depth bound = par+4, state dedup by physical
key, hard cap 1.5–3M explored states**. `wait` actions skipped (burn depth,
change nothing). Each travel candidate is one shortest-hop path per
destination; everything else is enumerated per preconditions and validated by
the frozen engine itself.

### Enumerator bug found and fixed (honest tooling note)

First runs produced exactly one solution per length — suspicious. Cause:
**the completed terminal state shares one dedup key regardless of plan**, so
it passed through the min-depth visited prune and only the first-arriving
(shallowest) plan to each ending was recorded. Fixed by recording completions
before the prune. Post-fix counts are *distinct canonical plan
representatives* (dedup still collapses interleavings that reach the same
state at equal-or-greater depth) — i.e., distinct strategies/schedules, not
the raw number of action streams. Counted that way:

| level | bound | explored | capped | plans found | optimal (min) | optima count |
|---|---|---|---|---|---|---|
| pft-02 | 20 (par+4) | 187,988 | no | 17 | 16 | 1 |
| pft-03 | 21 (par+4) | 10,856 | no | 8 | 17 | 1 |
| pft-04 | 20 (par+2) | 1,268,156 | no | 9 | 18 | 2 |
| pft-05 | 17 (par+4) | 64,879 | no | 18 | 13 | 3 |
| pft-06 | 21 (par+4) | 258,834 | no | 20 | 17 | 2 |
| pft-07 | 24 (par+4) | 386,326 | no | 16 | 20 | 2 |

pft-04 at par+4 (bound 22) hit the 3M-state/180s caps — **intractable at that
bound, documented honestly**; par+2 completed cleanly (107s). Its bound-22
capped run found only 20+ movers.

### Findings

- **No under-par degenerate solves.** Every level's enumerated minimum equals
  the verified par trace. The pars are honest optima everywhere enumeration
  completed.
- **PFT-05 has THREE optimal 13-move plans** — two are interleavings, but one
  is a genuine role-swap: the bridge can be packed and sold by EITHER courier
  (Wren sells bridge + rides east for the registry, Lark signs the mailbox
  last). Curated in LEVELS.md.
- **PFT-03 has no 18-move plan** — a real gap in the length ladder (17 then
  19+). Not a defect; documented.
- **PFT-04's second strategy verified by enumeration too**: the bound-20 run
  contains the hoist plan (deploy at socket-middle-loft) — the
  B-strategy representative survived the fix.
- Most non-optimal plans are scheduling variants (split-travel paddings,
  harmless pack/deploy no-op pairs, interleavings) — expected texture, not
  curated individually.
- **Curated into LEVELS.md**: a "Solution space (bounded enumeration)" line
  per PFT-02..07 with the bound, plan count, and any structural note.

## 2. Bible sweep — remaining parts (recorded PASS/gaps)

**Part 1 (player psychology):**
- §1.5 mastery loops: `par` + `lateMoves` = exact mastery feedback, never
  failure; every failure verdict blameable to a step index + per-order
  reason — **PASS**.
- §1.6 loss aversion: full checkpoint undo + recovery classes
  (redeploy/undo/none) keep stakes low and legible — **PASS**.
- §1.7 aha: `insight` on every card names the designed aha; hint ladders
  stop short of rosters — **PASS** (fixed in pass 1).
- §1.3 difficulty curve: campaign escalates 1→2→4 couriers and adds verbs
  monotonically — **PASS by design**.

**Part 2 (level design):**
- §2.1 topology/critical path: spines documented per level; enumeration now
  *confirms* the critical path — unique optima on 3 of 6 levels, bounded
  alternates elsewhere — **PASS**. Bottlenecks were built-in at paper stage
  (ferry capacity, single stair, handover gate) — **PASS**.
- §2.x "≥2 open nodes": PFT's choice space is plan-space, not map-space;
  the enumerations show real branch-merge width (8–20 plans/level) —
  **PARTIAL/structurally different, documented**.
- §2.10 length/density: 13–44 moves, escalation legible — **PASS**.

**Part 10 (content production):**
- §10.1 levels-as-data: all 12 defs are declarative `PftLevel` objects;
  frozen engine; one uniform harness verifies all (vitest + golden traces +
  now probe-enum) — **PASS, this is the architecture the bible prescribes**.

**Part 11 (production/shipping):**
- §11.1 MSI: core loop (route→pack→ferry→deliver) and the differentiator
  (untimed optimization, mastery-only lateness) intact through all 12
  levels — **PASS**.

## Probe artifacts

- `audit/probe-enum.mts` — the bounded enumerator (env-tunable
  SLACK/MAX_STATES/MAX_MS/DUMP/NOPRUNE; `npx tsx audit/probe-enum.mts [pft-0N]`).
