# PFT Refinement Audit — Pass 10

Queue: (1) difficulty vectors — EXECUTED, LEVELS.md appendix added;
(2) DENY-window necessity sweep — EXECUTED; (3) card-vs-engine
expressibility extension for coopNotes — EXECUTED as
`scripts/coop-necessity.mts` (52/52); (4) research dataroom —
`audit/DESIGN-RESEARCH-PFT4.md`.

## 1. Difficulty vectors (automated playtest)

LEVELS.md appendix ranks all 12 levels on min length / plans /
distinct multisets / optimal strategies / DENY-fragility. Findings:

- **Ramp is sawtooth, not monotone** — min lengths 9→44 with two
  honest inversions (pft-05's 13-move breather after pft-04's 18;
  pft-09's 38-move spike before the 28/28/44 finale). Flagged as
  designed, matching dataroom-3's interest-curve analysis.
- **Optimal-strategy count is independent of min length** — pft-12's
  finale optimum is single-valued; pft-05 (the smallest level) holds
  the widest optimal family.
- **Two more optimal claims shrank under multiset dedupe:** pft-07's
  "two optimal 20s" → **1 distinct strategy** (verified at bound 20:
  2 plans, 1 multiset); pft-04's two optimal-18s stand (both found in
  earlier runs) but the full multiset run capped at 1.5M states with
  the second 18 unreached — flagged honestly in the appendix.

## 2. DENY-window necessity sweep

Full-enum DENY on 01–07 (par+4 bound) — every headline verb is
structurally required, ZERO completions without it:

| Level | Denied verb | Completions |
|-------|------------|-------------|
| pft-01 | pack | 0 |
| pft-02 | ride_ferry | 0 (drop optional: 15) |
| pft-03 | deploy | 0 |
| pft-05 | send | 0 |
| pft-06 | ride_ferry | 0 |
| pft-07 | pack | 0 |

Seeded-window DENY on 08–12 (final-8 window only — honest bound):
pft-08 `pack` → 0 completions (load-bearing in the ENDGAME); pft-09
`drop`, pft-10/11/12 `send` → unchanged counts (those verbs live in
the mid-game prefix; endgame doesn't need them). pft-04 is the only
level with no deny-able verb — its stair starts deployed, so the
constraint is ordering, not a missing action.

## 3. CoopNote necessity probe — 52/52

`scripts/coop-necessity.mts`: extracts every winning trace from the
unit tests at runtime (per-file identifier resolution for the courier
consts), replays each trace minus one courier's stream, asserts
non-completion. **52 courier streams × 18 traces: all load-bearing.**
The coopNote expressibility question resolves affirmatively — the
'office work before teardown' coupling is enforced by the engine's
ordering dependencies (a courier's stream can't just be dropped, and
pass-7's commutativity probe showed where players must sequence).
Wire upstream as `npm run check:content2`.

## 4. Research dataroom — `audit/DESIGN-RESEARCH-PFT4.md`

Difficulty elasticity: 5 techniques (floor/optimum delta as mastery
budget, optional depth never gating, legible commitment points,
compounding curriculum, honest difficulty reporting) with enumeration
numbers as the quantified evidence.

## Diff summary

- `LEVELS.md` — difficulty-vector appendix; pft-04/07 optimal claims
  corrected/annotated.
- `audit/probe-enum.mts` — multiset dedupe per level + DENY filter.
- `audit/probe-enum-tail.mts` — multiset dedupe + distinctByLen + DENY.
- `scripts/coop-necessity.mts` — NEW: courier-removal validator.
- `audit/DESIGN-RESEARCH-PFT4.md` — NEW dataroom entry.
- `audit/PFT-AUDIT-PASS10.md` — this doc.

`npx vitest run` 102/102; `npx tsc --noEmit` 0; card-vs-engine 33/33;
coop-necessity 52/52.
