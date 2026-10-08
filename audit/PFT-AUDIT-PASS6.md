# PFT Refinement Audit — Pass 6

Pass-6 queue: (1) card-vs-engine honesty validator mirroring RBM's
`scripts/card-vs-engine.ts`; (2) scripted 2-player co-op browser playtest
(scope check); (3) remaining bible sweeps. Engine frozen; all results
labeled automated playtest.

## 1. Card-vs-engine validator — SHIPPED

`scripts/card-vs-engine.mts`: table-driven replay of **every carded
wrongApproach across PFT-01..12** (33 probes). Each case replays a
purpose-built action sequence through the frozen engine and asserts the
named mechanism:

- `reject` — action refused and the reason matches the promised
  mechanism (`no open order`, `handled from`, capacity, `link inactive`,
  occupied).
- `strand` — `order.stranded` event fires on the named order with the
  promised recovery class, OR (for orders unachievable since t0, where no
  transition fires) the final `analyzeOrders` status shows
  `achievable:false` with the promised recovery.
- `incomplete` — the early-exit legibility claim (level stays incomplete
  when only the exit fulfills).

**Result: 33 pass / 0 fail.** Wire upstream as
`"check:content": "tsx scripts/card-vs-engine.mts"` in package.json
(package.json intentionally NOT in this tarball per scope rules).

**One card wording fix applied** — pft-09's first wrongApproach claimed
"the tea and the runner's exit strand together". Engine truth (verified
via the validator): packing the bridge strands the staircase, mailbox,
and the runner's exit; the carried tea still reads `achievable` because
`parcelGraph` counts ferry edges as parcel-traversable regardless of who
can carry them there — the same over-approximation flagged in the
PFT-05..07 report. Rewrote the WA to name the real stranding set and
document the parcel-readability caveat. This is exactly the drift class
the validator exists to catch.

Probe-authoring notes for whoever extends this to new levels (all in the
script header): `travel.path` lists hops AFTER the courier's current
node (leading-node paths fail `no active connection`); `pack` auto-loads
the piece into the courier's cargo (a following `pickup` hits capacity);
bridge handles are Middle-side in the early levels; stranded events fire
only on achievable→unachievable transitions.

## 2. Co-op browser playtest — upstream-bound, documented skip

`src/client` and the session/room layer are not in this tree (levels +
engine + tests + docs only). What the engine-side evidence already shows,
verified in earlier passes:

- No turn structure or courier locks: all four verified traces (incl.
  PFT-12's two plans) interleave courier actions mid-errand and commit.
- Courier-removal probes (pass 2) confirm every courier is load-bearing
  on the 4-person levels — the parallelization surface is real, not
  cosmetic.
- The engine is deterministic under a shared action stream — lockstep
  convergence is a client/room-layer property, testable only where the
  client lives.

Recommend a two-context Playwright room test on the upstream client; the
interleaved verified traces (PFT-08..12) are ready-made scripted
baseline plans for it.

## 3. Bible sweeps — closed

Parts 1–14 now covered across passes 1–6 (3/5/8/9 + 4/12/13 in earlier
passes; 6/7/14 client-side N/A). No new gaps.

## Diff summary

- NEW `scripts/card-vs-engine.mts` — the validator (33 probes).
- `src/content/levels/pft09-three-useful-parcels.ts` — WA wording now
  matches engine-verified stranding set + parcelGraph caveat.
- `audit/PFT-AUDIT-PASS6.md` — this doc.

`npx vitest run` 102/102 green; `npx tsc --noEmit` exit 0;
`npx tsx scripts/card-vs-engine.mts` exit 0.
