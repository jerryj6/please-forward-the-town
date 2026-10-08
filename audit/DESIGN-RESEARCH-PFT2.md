# Design Research Dataroom 2 — Readable-Failure / Debuggable-Sim Design

Seeded sources: Zachtronics design philosophy (Zach Barth's talks/postmortems
on SpaceChem, Opus Magnum, TIS-100 — "the machine you built IS the puzzle"),
visual debugging practice in open-ended sim games, and the strand/recovery
vocabulary PFT already uses. Concrete techniques mapped to PFT.

## 1. The player's artifact is the debugging surface (SpaceChem)

- **Source:** SpaceChem's central loop — you build a program/machine, run
  it, watch it fail at a specific point, and the *failure location is the
  lesson*. Zachtronics never hides why a solution broke: the sim replays
  to the collision/bond error and stops there visibly.
- **PFT application:** the engine already gives us
  `rejectedAt`/`rejectionReason` with the exact plan index and
  `order.stranded` transitions at the commit that made something
  unreachable. The technique: failure should always land on THE action
  that broke the plan — our validator enforces this at the content layer
  (every WA names its mechanism). Anything the client renders (verdict
  line, per-order reason) should preserve "broke here, because X."

## 2. Failure taxonomy the player can quote (strand classes)

- **Source:** debuggable-sim games converge on a small vocabulary of
  failure kinds a player can name back ("my reactor stalled" vs "it
  exploded"). The taxonomy turns a dead end into a diagnosis.
- **PFT application:** our three recovery classes ARE the taxonomy —
  `redeploy` (fixable, put the piece back), `undo` (only rollback helps),
  `none` (permanent). That's a player-quotable vocabulary: "the sign is
  redeploy-fixable, the sold ferry is undo-only." The honest
  recommendation this pass: keep the classes in the strand reason text —
  they already render ("recoverable: redeploy the still-owned piece at a
  compatible socket"), which is exactly SpaceChem-grade feedback.

## 3. Show the counterfactual, not just the refusal

- **Source:** Zachtronics debug views highlight WHAT would have worked
  (the missing bond, the occupied socket) rather than a bare error;
  Opus Magnum's arm conflicts name the colliding parts.
- **PFT application:** the engine's strand reasons already carry the
  counterfactual — "Courier Lark (at middle) cannot reach North Dock —
  recoverable: redeploy the still-owned piece at a compatible socket."
  That is the right level: which entity, where it stands, what's missing,
  and the recovery path. The one gap worth noting upstream: a WA like
  "capacity" refuses with "2 parcels would be aboard" — legible, but a
  future client could render the hold contents (what IS aboard) to make
  the counterfactual visual. Content-side the vocabulary is complete.

## 4. Determinism as a debug feature (seed → same hash)

- **Source:** a debuggable sim must be perfectly reproducible —
  Zachtronics' machines replay identically, so a failure is always
  re-inspectable at the same step.
- **PFT application:** `canonicalHash` + seeded determinism gives this
  free — same seed, same plan, same state hash. The pass-4/5
  enumerators and pass-6 validator all depend on it; every playtest
  artifact in this repo (verified traces, WA probes, coop splits) is
  reproducible byte-for-byte. Determinism is our regression harness AND
  our debugging affordance.

## 5. Ship the audit trail as product (postmortem-worthy logs)

- **Source:** the lesson from Zachtronics postmortems is that transparent
  failure data (what players attempted, where they died) is both design
  signal and portfolio artifact.
- **PFT application:** our per-pass audit docs + LEVELS.md solution-space
  sections are this — the multiset-dedup correction this pass (pft-06's
  "two optima" were one) is exactly the kind of honest finding the audit
  trail exists to hold.
