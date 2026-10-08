# PFT Refinement Audit — pass 1 (2026-10-08)

Refinement-agent audit over committed PFT-01..12. Scripted runs below are
**automated playtests** (engine `simulate`/`commit` calls), not human
playtest sessions. Engine untouched; all changes are card/content-side.

Verified after every edit: `npx vitest run` 101/101 green,
`npx tsc --noEmit` exit 0.

## Automated playtest results

### PFT-12 "Everything Must Go" — minimalism + shortcuts

- Delete-one-action probe on both verified plans: **zero redundant
  actions** — plan A (46) and plan B (44) are locally minimal; every move
  is load-bearing.
- `canonicalHash` includes the move counter: equal-length plans hash-equal
  only coincidentally. "Same destination" for unequal-length plans must be
  asserted field-by-field (courier.at, piece.status, fulfilled) — now
  documented in the test.
- Shortcut attempts all resolve to the verified plans: carrying the
  mailbag by hand ≈ +5 moves vs the wire (send earns its keep); ferrying
  the packed sign ≈ +3 vs carrying it; skipping the stair is impossible
  (tapestry is at the loft); exits at `office-new` make the sign move
  mandatory.
- Plan A finishes at par+2 (lateMoves=2) — plan B is the tighter route;
  asserted in tests as honest difficulty signal, not a defect.

### PFT-11 "Mail the Post Office" — minimalism + shortcuts

- Delete-one-action probe: **zero redundant actions** in the 28-move trace.
- Mail-the-granite shortcut fails for a structural reason: the receiver
  would need `cargoCapacity ≥ 2` (mailbag + granite both land at East).
- Strand semantics probe (automated): the exit orders were never
  achievable at t0 (new office lane edgeless), so sign-pack emits no
  `order.stranded` — strand events fire only on achievable→unachievable
  transitions. `order.unstranded` fires correctly on deploy. Asserted by
  state read, not event count.
- The unsellable ferry (no `handlingNode`) keeps its dock edge live
  forever, so a second crossing can never strand couriers — the
  "pack the span early" wrong approach does not strand in this level and
  was redesigned to the plank bridge (which does: exits classify `none`
  while the sign is marooned, `redeploy` once undo restores the bridge).

### PFT-01 "The Last Crossing" — card contract gap (fixed)

- **Finding:** PFT-01 shipped with no `PFT01_CARD` at all — no hints, no
  wrongApproaches, no solution policy. The biggest onboarding gap per
  bible §9.7 ("first failure is safe and informative").
- **Fixed:** authored `PFT01_CARD` — hybrid solutionPolicy (verified 9-
  and 11-move traces already in pft01.test.ts), naiveApproach (lift the
  bridge first), insight (bridge is cargo AND the only way back), 3
  right-reason wrong approaches (pack-first redeploy→undo, early exit is a
  live predicate, wrong-recipient "no open order"), canonical T1/T2/T3
  hints.
- Bonus facts verified: `load_ferry` accepts pieces as freight (the
  bridge CAN ride the hold — legal, just not cheaper); the stale-looking
  "trace B commits 11" comment is correct (11-move drop-staging route).

### coopNote audit (bible Part 5) — PFT-08..12

Read each coopNote against its verified trace, not just the prose:

- **PFT-08**: note ↔ trace match (Wren Upland fetch / Lark market+plank /
  Finch ferry freight / Sparrow paperwork; coupling = shared spine).
- **PFT-09**: match (Lark postal / Finch climber / Wren market staging /
  Sparrow ferryman+closer; coupling = staging handoffs).
- **PFT-10**: match, and honestly names that the bottleneck role differs
  per plan (ferryman in A, span-setter in B).
- **PFT-11/12**: match; forced coupling is sequencing (teardown order is
  a team decision), per bible's requirement.
- No filler jobs found; all four-person levels name 4 real distinct
  contribution types. PASS.

### Hint-ladder audit (bible §3.4) — PFT-02..10 (fixed)

- **Finding:** every pre-bible card's tier-3 hint was a full move-by-move
  roster (e.g. PFT-08: "Wren: north fetch, span, archives, done. Lark:
  ledger to the annex…") — the explicit anti-pattern in the canonical
  ladder (T3 = first decisive commitment, stops short of the solution).
- **Fixed:** all nine cards retiered — T1 relationship / T2 tool or
  mechanism / T3 the level's decisive commitment without a roster. Spot
  re-tiering where new T3 collided with existing T2 (PFT-10 T2 rewritten
  to the pack/deploy/send mechanism).
- **Finding:** cards 02–10 had no `solutionPolicy`, `naiveApproach`, or
  `insight` fields at all. **Fixed:** added to all nine, classified per
  verified solution space (hybrid vs open; move counts noted).

## Checklist coverage notes (for the delivery report)

- §3.4 hint ladders: fixed for 01..12 (PFT-11/12 already conformed).
- §3.5 wrong-approach legibility: all entries evidence-named; zero dead
  failures on any card's critical path.
- §3.6 solution policy: now declared on every card (01..12).
- Part 5 coop: verified notes ↔ traces on 08..12.
- Part 9 onboarding: PFT-01 card authored (FTUE "first failure safe and
  informative" now satisfiable); §9.9's prescribed teach atom
  (pickup→load→ride→unload→deliver) is covered across 01→02 (02 teaches
  the freight ritual) — divergence from the bible's literal ordering
  noted, judged benign: same atoms, one level later.
- Multi-solution tolerance: 04, 06, 10, 12 ship ≥2 verified plans;
  01–03, 05, 07–09, 11 verified schedules within a fixed spine.

## Scripted probe artifacts

- `audit/probe-pft11.mts`, `audit/probe-pft12.mts` — automated-playtest
  harnesses (trace minimalism + shortcut batteries). Re-runnable:
  `npx tsx audit/probe-pft12.mts`.
