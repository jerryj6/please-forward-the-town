# PFT Refinement Audit — Pass 12

Queue: (1) pft-10 floor check around TRACE_C; (2) post-accept
mutability probe; (3) ferry-capacity edge probes; (4) research
dataroom — `audit/DESIGN-RESEARCH-PFT6.md`.

## 1. Is 27 the floor on pft-10? (automated playtest)

Seeded-window results around PFT10_TRACE_C (27 moves, window=8,
complete exhaust — NOT capped):
- bound 26: **0 completions** — proven within the window
- bound 27: 2 completions → **2 distinct multisets** — trace C plus a
  SECOND 27-move economy in the same family
- window=12 bound 26: capped at 1M states, 0 completions (inconclusive,
  honest bound)

Verdict: 27 is the proven floor of the C-family endgame; a different
prefix strategy below 27 can't be ruled out (full DFS intractable on
4-courier level — documented bound, same as pft-08/11). Bonus finding:
a second distinct 27-move multiset exists in the C window — the
documented-alternate family is wider than curated; worth a LEVELS.md
line (added below).

## 2. Post-accept mutability — one open path (open finding)

`audit/probe-postaccept.mts` on completed pft-12: every structural
command rejects cleanly post-verdict (travel "no active connection",
pack "marked handling endpoint", pickup "not staged", ride "handed
over", deliver "not carried"). **But `wait` is ACCEPTED and mutates
state** — canonical hash changes, `completed` flag survives. A sealed
board still records no-op commits to the journal. RBM-class finding
documented honestly for your shared-policy call: if the three games
should seal post-verdict, `wait` is PFT's only leak; otherwise it's
harmless (completed stays true, verdict data intact).

## 3. Ferry-capacity edge probes — 8/8 (automated playtest)

`audit/probe-capacity.mts`, DENY-free honest failures:
- "ferry parcel capacity 1 reached" on second `load_ferry` (06, 08)
- "capacity 1 exceeded: 2 parcels would be aboard" on riding while
  carrying with freight in hold (06, 08)
- Positive cases confirm the economy stays open: drop → empty-handed
  ride with freight aboard is legal; unload at the correct shore is
  legal.
Rejection strings name the bottleneck (count + entity) — consistent
with the readable-failure vocabulary.

## 4. Research dataroom — `audit/DESIGN-RESEARCH-PFT6.md`

The departure constraint (Mini Metro / train-scheduling pacing):
5 techniques (assets-as-departures, last-train commitment device,
legible bottlenecks, slack-as-budget, infrastructure-over-entities)
mapped to PFT's deliverable economy.

## Diff summary

- `audit/probe-enum-tail.mts` — TRACE/SLACK env overrides.
- `audit/probe-undo.mts` — 11/11 (from pass 11, still green).
- `audit/probe-postaccept.mts` — NEW: post-accept mutability probe.
- `audit/probe-capacity.mts` — NEW: capacity edge probes (8/8).
- `LEVELS.md` — pft-10 section: second 27-multiset noted.
- `audit/DESIGN-RESEARCH-PFT6.md` — NEW dataroom entry.
- `audit/PFT-AUDIT-PASS12.md` — this doc.

`npx vitest run` 102/102; `npx tsc --noEmit` 0; card-vs-engine 33/33;
coop-necessity 52/52; probe-undo 11/11; probe-capacity 8/8.
