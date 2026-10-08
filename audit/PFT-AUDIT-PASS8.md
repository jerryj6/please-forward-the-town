# PFT Refinement Audit — Pass 8

Queue: (1) browser-level 2-player co-op playtest — upstream-bound (no
`src/client`/ws server in this tree; engine-level evidence landed in
pass 7: `probe-coop-pft12.mts` — all 7 adjacent boundaries commute, both
halves dead alone, work-conserving merge dead-ends on the office-lane
dependency); (2) degenerate/padding audit — EXECUTED below; (3)
a11y/keyboard probe — upstream-bound (client-side, nothing to drive
against; not fabricated); (4) readable-failure research dataroom —
`audit/DESIGN-RESEARCH-PFT2.md`.

## Degenerate/padding audit (automated playtest)

Question: do the pass-4/5 plan counts include *cost-free padding* —
plans that inflate the count with no-op-ish or commuted moves but no
strategic difference (TRS's RepositionProp analog)?

Method: dumped every enumerated plan (DUMP=1) on pft-01/02/05/06 and
grouped by the **sorted action multiset** (type+ids, order-free). Two
plans sharing a multiset are the same actions in different commute
order — cosmetic, not strategic.

| Level | Plans | Distinct multisets | Cosmetic extras |
|-------|-------|--------------------|-----------------|
| pft-01 | 5  | 5  | 0 — clean |
| pft-02 | 17 | 17 | 0 — clean |
| pft-05 | 18 | 12 | 6 commute-reorders |
| pft-06 | 20 | 15 | 5 commute-reorders |

**Consequence for optima claims (corrected in LEVELS.md):**
- pft-05: 3 optimal 13-plans → **2 distinct optimal strategies** (the
  role-swap survives — different courierIds → different multiset; the
  third is a reorder). LEVELS.md now says "two distinct optimal
  13-move strategies."
- pft-06: 2 optimal 17-plans → **1 strategic optimum** — they are a
  commute-reorder pair. The dock-staged strategy verifies separately at
  22 (trace B), so the level still has two verified plans — just not
  two optimal ones. LEVELS.md corrected.

**Verdict:** PFT has a *small* commute-inflation slice (11 cosmetic
plans across 60 enumerated), not a systemic padding hole — the
no-real-op classification holds: every padded plan is a same-length
reorder, never a longer no-op'd variant (the enumerator's per-destination
shortest-path + `wait` exclusion keeps pointless moves out). No card
changes needed beyond the two optima corrections; the role-swap and
multi-strategy claims still stand where they were real.

Note: seeded-window counts on pft-08..12 (pass 5) were not multiset-
deduped — their "optimal family" sizes may include the same cosmetic
slice. Flagged honestly rather than re-verified: the seeded-window probe
would need DUMP to confirm exact multiset counts.

## Browser co-op + a11y (upstream-bound, documented)

Both require `src/client` + the room server — not in this tree, same
boundary as passes 5–7. What exists engine-side for whoever runs them
upstream: the 44-move courier-split co-op trace (probe-coop-pft12),
all-verified traces for driver baselines, and the strand/recovery
reason vocabulary the UI must render. Recommend against a tab-order fix
without the client — nothing to verify against.

## Research dataroom — `audit/DESIGN-RESEARCH-PFT2.md`

5 techniques (SpaceChem failure-location debugging, failure taxonomy,
counterfactual feedback, determinism-as-debugging, audit trail as
product) mapped onto the engine's rejectedAt/stranded/recovery
affordances.

## Diff summary

- `LEVELS.md` — pft-05/pft-06 solution-space corrected to distinct
  multiset counts.
- `audit/DESIGN-RESEARCH-PFT2.md` — NEW dataroom entry.
- `audit/PFT-AUDIT-PASS8.md` — this doc.

`npx vitest run` 102/102; `npx tsc --noEmit` 0; card-vs-engine 33/33.
