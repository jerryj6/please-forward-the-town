# Design Research Dataroom 10 — Puzzle Fairness / Signposted Solvability

Seeded sources: Baba Is You (rule visibility as fairness), Pipe Push
Paradise (minimum-viable demonstration), Patrick's Parabox (nested
abstraction with readable bounds). How "search space feels fair" — the
player believes a solution exists because the game signposts it —
applied to PFT's hint tiers.

## 1. Fairness = the rule set is fully visible

- **Source:** Baba Is You — every rule in play is on screen as
  manipulable tiles; "unfair" is impossible because nothing is hidden.
- **PFT spec input:** hint tier 0 should render the active constraint
  set, not a solution step: sites, orders, piece states, capacity
  numbers. A "what's true on this board" panel — all already in
  `analyzeOrders` output — proves solvability by showing the player
  everything the engine knows.

## 2. Show the smallest witness, not the answer

- **Source:** Pipe Push Paradise levels signal solvability by making
  the required idiom demonstrable on a tiny sub-board.
- **PFT spec input:** hint tiers should escalate as *witnesses*:
  tier 1 = name the load-bearing verb the DENY table proves is
  required ("a stair must be deployed"), tier 2 = the entity pair it
  must involve, tier 3 = a verified one-commit prefix (from the
  enumerated plan space — real plans, not hints the engine can't
  back). Each tier is provable against the enumerator.

## 3. Bound the search space visibly

- **Source:** Patrick's Parabox — players relax when they can see the
  walls of the problem; boundedness is itself the fairness signal.
- **PFT spec input:** show plan-space shape as a fairness cue:
  "18 plans ≤ par+4, minimum 17" (the byLen/distinctByLen tables).
  A player told the optimum is 17 stops fearing a 9-move solution they
  missed. This is honest data we already compute.

## 4. Difficulty must be A/B-verifiable

- **Source:** postmortems across all three titles stress that
  difficulty claims must survive replays — a level is only "fair-hard"
  if the verifier confirms no degenerate shortcut.
- **PFT spec input:** the hinted tier should carry its own
  certificate: coopNotes + DENY results + the missing-rung facts
  (01/03/09 have no even-slack rungs) are the audit trail. Fairness
  isn't asserted, it's shown.

## 5. The superseded marker is a fairness surface

- **Source:** fairness includes post-verdict honesty — the game must
  not pretend a stale verdict is live.
- **PFT spec input:** superseded-verdict marking (already landed)
  belongs in the fairness spec: any accepted commit after `completed`
  marks the verdict superseded rather than silently mutating.
