# PFT Refinement Audit — Pass 13

Queue: (1) superseded-verdict client patch — `src/client` upstream-only;
shape + engine contract shipped as `audit/PFT-SUPERSEDED-VERDICT.md`
for coordinator landing; (2) second-27 sibling documented in LEVELS.md;
(3) wait-leak sweep — EXECUTED, 12/12; (4) research dataroom —
`audit/DESIGN-RESEARCH-PFT7.md`.

## 1. Superseded-verdict (upstream-bound)

`audit/PFT-SUPERSEDED-VERDICT.md` carries the patch shape and the
engine contract the client consumes: `res.ok` on a commit issued while
`completed === true` → verdict superseded; `canonicalHash` changes on
every accepted post-completion commit; `completed` stays true (old
verdict on record, freshness invalidated). Co-op note included: mark
superseded on ANY player's accepted post-completion commit.

## 2. The second-27 sibling — documented

Diffing the two 27-move multisets: same first 18 actions (the postal
opening), divergent closing errand:
- **trace C**: Wren rides the granite east, delivers monument, returns
  middle, packs the bridge, sails east, sells it.
- **sibling**: Sparrow takes the closing errand — returns middle,
  packs the bridge, sails east, sells it, sails home — while Wren's
  granite leg ends east with NO return sail.
Same economy (27), different billing: the east receiver doubles as
closer. Documented in LEVELS.md.

## 3. Wait-leak sweep — all 12 levels (automated playtest)

`audit/probe-waitsweep.mts`: replayed each level's first winning trace
to completion, probed `wait` — **12/12 accept + mutate canonical
hash** (`completed` stays true). Engine-wide leak, not level-specific;
the superseded-verdict flag is the right shared-policy fix since the
mutation surface is `wait` alone (all structural commands reject
cleanly on sealed boards — pass 12).

## 4. Research dataroom — `audit/DESIGN-RESEARCH-PFT7.md`

Traffic-as-emergent-villain (Mini Motorways entropy pacing): 5
techniques (player-authored villain, queues at shared edges,
controllable entropy, peak-then-resolve pacing, readable congestion
source in the verdict).

## Diff summary

- `LEVELS.md` — second-27 sibling documented (Sparrow-as-closer).
- `audit/probe-waitsweep.mts` — NEW: 12-level wait-leak sweep.
- `audit/probe-enum-tail.mts` — DUMP=1 exemplar dumps per multiset.
- `audit/PFT-SUPERSEDED-VERDICT.md` — NEW: client patch shape + contract.
- `audit/DESIGN-RESEARCH-PFT7.md` — NEW dataroom entry.
- `audit/PFT-AUDIT-PASS13.md` — this doc.

`npx vitest run` 102/102; `npx tsc --noEmit` 0; card-vs-engine 33/33;
coop-necessity 52/52; probe-undo 11/11; probe-capacity 8/8.
