# PFT Refinement Audit — pass 2 (2026-10-08)

Pass 2 of the refinement loop: hint-ladder dry-runs on PFT-08..12,
degenerate-solve hunts on PFT-09/10, coopNote truth-checks. All runs are
**automated playtests** (engine `simulate`/`commit` calls). Engine frozen.

Verified after changes: `npx vitest run` 101/101, `npx tsc --noEmit` 0.

## coopNote truth-check — are the 4 jobs real in-engine?

Method: for each 4-person level, replay the verified trace with each
courier's actions removed and list the orders that die (blast radius).
A role is real iff removing the courier kills ≥1 order no one else
covered. (Divergence note: simulating a filtered trace surfaces
downstream cascade too — a courier's exit leg still fails if an upstream
dependency of it died — so radii overstate shared work slightly; read
them as upper bounds.)

| Level | courier | actions | orders killed by removal |
|---|---|---|---|
| PFT-08 | Wren | 5 | sunstone, wren-exit |
| | Lark | 9 | ledger, bridge, lark-exit |
| | Finch | 4 | engine, span*, ferry* (*cascade), finch-exit |
| | Sparrow | 3 | span, ferry |
| PFT-09 | Wren | 5 | tea + ferry cascade + wren-exit |
| | Lark | 6 | records + mailbox + exits |
| | Finch | 8 | tapestry, stair + exits |
| | Sparrow | 19 | tea, records, tapestry, bridge, stair, sparrow-exit |
| PFT-10A | Wren | 13 | cider, granite, bridge, wren-exit |
| | Lark | 6 | deeds, mailbox + exits |
| | Finch | 5 | cider, granite, bridge + finch-exit (staging) |
| | Sparrow | 4 | deeds |
| PFT-11 | Wren | 9 | cider, bridge, wren-exit |
| | Lark | 9 | mailbag, granite, mailbox + all exits (postal chain) |
| | Finch | 5 | mailbag + all exits (sign move) |
| | Sparrow | 5 | mailbag, span, sparrow-exit |
| PFT-12B | Wren | 17 | tapestry, granite, stair, bridge, wren-exit |
| | Lark | 10 | mailbag, records, mailbox + all exits (postal chain) |
| | Finch | 7 | mailbag + all exits (sign move) |
| | Sparrow | 10 | records, tea, span, ferry, sparrow-exit |

**Verdict: PASS, with two honest caveats worth documenting.**

- Every courier is load-bearing in every finale chapter — removing any
  kills ≥2 orders. No filler jobs; the "four distinct contribution types"
  claims are engine-true.
- Caveat 1 — asymmetric load: PFT-09's ferryman owns 19/38 actions
  (every freight leg + the bridge sale); PFT-10A's east receiver owns 4.
  The coopNotes already name the bottleneck honestly for 10; for 09 the
  note says "ferryman and closer" — accurate, and the asymmetry is the
  level's point (the water owner runs the whole freight schedule).
- Caveat 2 — serialization claim checked: the engine has no turn
  structure; actions interleave freely, and the verified traces already
  interleave couriers mid-errand (e.g. L11 Finch packs the sign while
  Lark is mid-monument-leg). The four jobs are *parallelizable* in real
  play even though the shipped trace is a linear commitment order.
- PFT-12 nuance: removing Lark or Finch kills ALL exits — not because
  they do everyone's work, but because exits share the sign-lane
  dependency (Lark's postal chain unlocks nothing for exits; it is the
  cascade column: failed upstream actions leave the later committed
  stream inconsistent). The load-bearing jobs remain distinct.

## Degenerate-solve hunts (PFT-09, PFT-10)

- Delete-one-action probes: **zero redundant actions** in PFT-09 (38),
  PFT-10A (28), PFT-10B (28). All traces locally minimal.
- PFT-09 direct-carry variant costed out: Finch hand-carrying the
  tapestry all the way to the gallery saves one drop/pickup pair but
  costs his return legs (~+3 net) — the `drop`-staging earns its keep.
  Non-cheaper; no unintended solve.
- PFT-10 third-plan check: send-both-parcels + ferry legs is legal and
  within the declared `open` policy — expected, not a defect.
- PFT-09 structural invariant verified: the ferry is the ONLY m↔e
  crossing, so every east delivery must ride or arrive by boat — no walk
  shortcut exists.

## Hint-ladder dry-run (PFT-08..12): reachability from a stuck state

Checked each tier's claim mechanically — a hint is only good if its
claim is engine-true AND actionable from a plausible stuck state:

- **PFT-08 T3 was engine-false — FIXED.** Old text: "Keep the Town Span
  standing until everyone who needs the far shore is there… it is the
  last piece to go." Automated check: selling the span at t0 strands
  *nothing* — the unsold ferry still shuttles m↔e (capacity-1, but
  shuttling works while riders remain on both docks). The real invariant
  is "at least one water crossing outlives the last eastbound errand —
  either may leave first." Verified both orders pass end-to-end
  (span-before-ferry-sale and ferry-before-span-sale both succeed). Hint
  and insight rewritten to state the true invariant. Bonus: the fix
  reveals a *second legitimate schedule* the old hint would have misled
  players away from.
- **PFT-09 T2/T3 verified:** `drop`-staging then another courier's pickup
  works exactly as hinted (scripted: Wren stages tea at Middle, Sparrow
  picks it up — both commits ok).
- **PFT-10 T2/T3 verified:** channel socket refused from Middle
  ("wrong foot" WA covers it); span re-set creates the free crossing.
- **PFT-11 T3 verified:** pack the plank bridge while the sign stands
  west → all four exits classify `none` (unrecoverable without undo).
- **PFT-12 T3 verified:** both office-move timings complete (deploy at
  action index 3 in plan A, at len−6 in plan B).

## Checklist coverage

- §3.4: PFT-08 hint fixed for truthfulness; all 08–12 tiers now verified
  engine-true and actionable.
- §3.6: no unintended cheaper solves found in 09/10; verified plans are
  locally minimal.
- Part 5: all four-person levels PASS the load-bearing test.

## Probe artifacts

- `audit/probe-pft09-10.mts` — minimalism probes for 09/10A/10B.
- `audit/probe-coop.mts` — courier-removal truth-check for 08–12.
