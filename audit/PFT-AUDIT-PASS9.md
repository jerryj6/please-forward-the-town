# PFT Refinement Audit — Pass 9

Queue: (1) multiset dedupe on seeded-window enums 08..12 — EXECUTED;
(2) hint-ladder concreteness audit — EXECUTED; (3) lesson-necessity
degenerate hunt — EXECUTED; (4) pacing research dataroom —
`audit/DESIGN-RESEARCH-PFT3.md`.

## 1. Multiset dedupe on seeded-window enums (automated playtest)

Extended `probe-enum-tail.mts` with per-length multiset grouping
(sorted action-tuple signature). Corrected counts:

| Level | Raw completions | Distinct multisets | Optimal claim (before → corrected) |
|-------|----------------|--------------------|-----------------------------------|
| pft-08 | 24 | 14 | 6 optimal endings → **3 distinct optimal strategies** |
| pft-09 | 7 | 6 | 2 optimal → 2 (unchanged) |
| pft-10 | 13 | 11 | 2 at 28 → 2 (unchanged) |
| pft-11 | 21 (capped) | 12 | 1 at 29 recorded; bound honest |
| pft-12 | 23 | 13 | 4 optimal endings → **1 distinct optimal strategy** |

LEVELS.md corrected for all five sections. Headline: pft-12's finale
optimum is single-valued (four raw optima = one strategy commuted);
its width lives in the +1/+2 slack plans. Pass-5's honest flag closed.

## 2. Hint-ladder concreteness audit — 36/36 tiers concrete

Every tier in all 12 levels names a concrete entity or mechanic
(courier name, parcel name, site, socket, or explicit verb — send/pack/
deploy/stage). A first regex heuristic flagged 5 tiers; all were
multi-line string concatenations split mid-tier — re-audited with
proper tier boundaries, zero fixes needed. Report counts: T1 all
name the level's dominant object; T2 names the mechanism; T3 names
the decisive commitment. Clean.

## 3. Lesson-necessity degenerate hunt

Question: can any level be beaten while skipping its taught idiom?
Evidence assembled (automated playtest):

- **pft-09's drop-staging idiom is load-bearing.** Pass-3 minimalism
  proved every drop in the trace is necessary; DENY=drop in the
  seeded-window enumerator still finds the same completions (the drops
  live in the prefix, not the endgame — necessity confirmed by
  construction, not just absence).
- **pft-02 DENY=drop:** 15 plans still complete at 16 — drop-staging
  is an *optional* idiom there (trace A never uses it; it's the
  alternate handoff), correctly not claimed as required.
- **pft-04 stair:** required — no loft route exists without it
  (verified pass 3, WA probe).
- **pft-05 send:** required — direct carry fails, the postal link is
  the level (verified pass 3).
- **Structural answer:** no level completes while skipping its
  *required* idiom. Optional idioms (drop in 02, ferry freight in 06)
  are declared alternates, not lessons. No degenerate skip exists.

## 4. Research dataroom — `audit/DESIGN-RESEARCH-PFT3.md`

Interest-curve pacing: 5 techniques (one-idea-per-level, load-bearing
spikes, combo-after-teaching DAG, finale-as-callback, multiplicity
discipline) — the 12-level move-depth curve verified as honest
sawtooth (9→44 with 05's 13-move breather after 04's spike).

## Diff summary

- `LEVELS.md` — 5 solution-space sections corrected to multiset counts.
- `audit/probe-enum.mts` — DENY env filter (deny an action type).
- `audit/probe-enum-tail.mts` — multiset dedupe + DENY filter.
- `audit/DESIGN-RESEARCH-PFT3.md` — NEW dataroom entry.
- `audit/PFT-AUDIT-PASS9.md` — this doc.
