# PFT Refinement Audit — Pass 14

Queue: (1) superseded-semantics spec test — EXECUTED, 5 new vitest
cases (107/107); (2) SLACK=-1 floor tightening — EXECUTED, full table;
(3) reconnect/resume parity — documented (room layer upstream-only);
(4) research dataroom — `audit/DESIGN-RESEARCH-PFT8.md`.

## 1. Superseded-verdict spec test — 5 cases

`tests/unit/superseded.test.ts` asserts the engine-side contract the
upstream banner relies on, self-contained (inline pft-01 trace):
- post-completion `wait` is ACCEPTED (the leak)
- accepted post-completion commits change canonicalHash
- `completed` stays true — stale verdict, not revoked
- structural commands still reject on a sealed board
- wait accepted pre-completion too (L12 spot-check)

The client's superseded rule (`completed-once && later accepted
commit`) maps 1:1 onto these invariants.

## 2. Floor-tightening sweep — all five windows proven (automated playtest)

SLACK=-1 (bound = trace−1) on every seeded-window job, NO caps:

| Level | Seed len | Bound | Completions | Verdict |
|-------|----------|-------|-------------|---------|
| pft-08 | 21 | 20 | 0 | floor proven in window |
| pft-09 | 38 | 37 | 0 | floor proven in window |
| pft-10 | 28 (A) | 27 | 0 | floor proven in A-window (C=27 is global-seen optimum) |
| pft-11 | 28 | 27 | 0 | floor proven in window |
| pft-12 | 44 (B) | 43 | 0 | floor proven in window |

Every documented optimum is the floor of its own endgame window.
Different-prefix strategies below par remain unproven-by-construction
(full DFS intractable on 4-courier levels) — the honest bound stands:
pft-10's C=27 beats the A-seeded window's floor but sits outside it.

## 3. Reconnect/resume parity — upstream-bound report

No roomClient/ws server in this tree. What the engine-side contract
already gives a resume implementation:
- `propose(actorId, actionId, action)` tags every commit with actor
  identity + `baseRevision` for optimistic concurrency — the journal
  IS the resume token source: replaying the journal reconstructs
  state byte-for-byte (probe-undo verified hash determinism 11/11).
- What a TRS-style localStorage half needs client-side: actorId +
  last-applied revision + seed. Missing half on the pft client can't
  be verified from here — flagged for your wiring pass; the engine
  side has no gap.

## 4. Research dataroom — `audit/DESIGN-RESEARCH-PFT8.md`

Polish-as-lie-detector (Berbank Green juiciness taxonomy): 5 surfaces
ranked — strand-transition rendering, recovery-class badges, the
superseded verdict (just fixed upstream), the undo afford, and
multiset-honest plan counts on any leaderboard surface.

## Diff summary

- `tests/unit/superseded.test.ts` — NEW: 5 spec cases.
- `audit/probe-enum-tail.mts` — SLACK/TRACE overrides (from pass 12),
  DUMP=1.
- `audit/DESIGN-RESEARCH-PFT8.md` — NEW dataroom entry.
- `audit/PFT-AUDIT-PASS14.md` — this doc.

`npx vitest run` 107/107; `npx tsc --noEmit` 0; card-vs-engine 33/33;
coop-necessity 52/52; probe-undo 11/11; probe-capacity 8/8.
