# PFT Refinement Audit — Pass 15

## 1. DENY-sweep completion — full verb coverage table (automated playtest)

Full-enum DENY (01–07, par+4) and window-enum DENY (08–12, final-8).
Every headline verb classified:

| Level | Verb | Completions w/o | Class |
|-------|------|-----------------|-------|
| pft-01 | pack | 0 | load-bearing |
| pft-02 | ride_ferry | 0 | load-bearing |
| pft-02 | drop | 15 | **tolerated** (alternate idiom) |
| pft-03 | deploy | 0 | load-bearing |
| pft-04 | deploy | (19) | vacuous — stair starts deployed; ordering is the constraint (FIRST=pack → +2) |
| pft-05 | send | 0 | load-bearing |
| pft-05 | pack | 0 | load-bearing |
| pft-05 | drop | 0 | load-bearing (staging required) |
| pft-06 | ride_ferry | 0 | load-bearing |
| pft-06 | hand_over_ferry | 0 | load-bearing (the sale IS an order) |
| pft-06 | load_ferry | 20 | **tolerated** (dock-staging alternate) |
| pft-07 | pack | 0 | load-bearing |
| pft-07 | deploy | 0 | load-bearing |
| pft-08 | pack | 0 (window) | load-bearing endgame |
| pft-08 | ride_ferry | 0 (window) | load-bearing endgame |
| pft-09 | drop | (prefix) | load-bearing mid-game |
| pft-09 | send | (window ok) | prefix verb — endgame tolerated |
| pft-10 | send | (prefix) | prefix verb |
| pft-10 | ride_ferry | 0 (window) | load-bearing endgame |
| pft-11 | send | (prefix) | prefix verb |
| pft-11 | pack | 0 (window) | load-bearing endgame |
| pft-11 | deploy | 33 (window) | prefix verb — endgame tolerated |
| pft-12 | send | (prefix) | prefix verb |
| pft-12 | pack | (window ok) | prefix verb |
| pft-12 | deploy | 0 (window) | load-bearing endgame (office deploy IS the finish) |

Reading: every level's taught mechanism is load-bearing somewhere;
tolerated verbs are exactly the declared alternates (pft-02 drop,
pft-06 dock-staging) — no undeclared redundancy. Window-DENY results
show WHERE verbs live: pft-12's deploy is load-bearing in the endgame
(the office opens last); sends/packs live in the mid-game prefix.

## 2. Undo byte-exactness — 12/12 levels, 281/281 prefix checks

`audit/probe-undo-all.mts`: per level, apply full trace → undo to
depth 0 (hash == fresh t0) → re-apply one commit at a time asserting
canonicalHash == fresh replay at EVERY prefix → then undo-1,
divergent `wait` commit, undo, re-apply — no phantom state.

| Level | Prefix checks | undo→0 | diverge |
|-------|---------------|--------|---------|
| all 12 | 281/281 | 12/12 | 12/12 |

The undo lab is verified everywhere — journal + canonical state are
byte-exact under rewind/replay/diverge.

## 3. Coop-note honesty — coverage already complete

coop-necessity's 52 checks ARE the per-4-courier-level coverage:
pft-08 ×4, pft-09 ×4, pft-10 ×12 (3 traces ×4), pft-11 ×4,
pft-12 ×8 (2 traces ×4) = 32 four-courier checks, every courier on
every trace load-bearing. Nothing missing to extend — count stands
at 52/52 including TRACE_C's four streams.

## 4. Research — `audit/DESIGN-RESEARCH-PFT9.md`

Logistics/cargo puzzle feel (Mini Metro, Monster's Expedition,
Cosmic Express, Railbound): 5 principles + 5 concrete spec inputs for
the TimelineView/inspector DEBT.md item (journal→timeline rows,
checkpoint pins w/ canonicalHash chips, orders board, fork-compare,
courier-lane filter).

## Commands + exit codes

- `npx vitest run` → 107 passed, exit 0
- `npx tsc --noEmit` → exit 0
- `npx tsx scripts/card-vs-engine.mts` → 33/33, exit 0
- `npx tsx scripts/coop-necessity.mts` → 52/52, exit 0
- `npx tsx audit/probe-undo-all.mts` → 12/12, exit 0
- `npx tsx audit/probe-capacity.mts` → 8/8, exit 0
- `npx tsx audit/probe-waitsweep.mts` → 12/12 leaks (documented), exit 0
- DENY runs: `audit/probe-enum.mts` / `probe-enum-tail.mts` per table

## Diff summary

- `audit/probe-enum.mts` — DENY + FIRST + multiset dedupe
- `audit/probe-enum-tail.mts` — DENY + TRACE/SLACK + multiset + DUMP
- `audit/probe-undo-all.mts` — NEW: 12-level undo sweep
- `audit/DESIGN-RESEARCH-PFT9.md` — NEW dataroom entry
- `audit/PFT-AUDIT-PASS15.md` — this doc
