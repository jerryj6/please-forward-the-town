# Design Research Dataroom 4 — "Easy to Learn, Hard to Master" Quantified

Seeded sources: difficulty-elasticity analysis in automation games
(Factorio/Satisfactory scaling curves, Zachtronics histograms),
Balatro's ante structure (exponential requirement growth on a fixed
kit), and classic "seconds-to-teach / hours-to-master" design
postmortems. Concrete techniques mapped to PFT.

## 1. Skill ceiling lives in the delta between floor and optimum

- **Source:** automation-game postmortems measure difficulty as the
  ratio of "first win effort" to "best known efficiency" — the spread
  IS the mastery budget. Balatro's antes grow exponentially so a
  passable build always trails the required output.
- **PFT application:** our measurable budget is par spread per level.
  Enumeration gives real numbers: e.g. pft-07 spans 20–24 moves
  (20% slack), pft-12 spans 44–46 (4.5%). A level with a narrow band
  (pft-03: optimum or +3) is mastery-tight; wide-band levels (pft-08:
  21–23, full ladder populated) are forgiving entry points. The
  curriculum alternates them — sawtooth confirmed by enumeration.

## 2. Optional depth over required depth (mastery that never gates)

- **Source:** Zachtronics' histogram philosophy — the win is always
  reachable; the histogram invites self-improvement without
  withholding progress.
- **PFT application:** `par` is exactly the optional-depth mechanism —
  completing at 24 on pft-07 is a win; the 20-move optimum is a
  mastery claim, never a gate. `lateMoves` records over-par play
  honestly rather than failing it. Verified contract: no level
  requires its optimum (all completed plans count).

## 3. Difficulty you can see: legible commitment points

- **Source:** elasticity analyses find players accept difficulty when
  the hard choice is VISIBLE ahead of time — Balatro shows the boss
  blind; automation games show the cost curve.
- **PFT application:** PFT's hard commitments are legible objects, not
  hidden math — the sign (movable address), the bridge (teardown), the
  ferry (service deadline). Every wrongApproach names a visible
  commitment made wrongly. The DENY-fragility sweep proves it
  quantitatively: removing each level's headline verb yields ZERO
  completions — the taught mechanism is legible AND load-bearing.

## 4. Skill transfer across levels (compounding curriculum)

- **Source:** "hard to master" works when mastery is cumulative — each
  level's skill persists into the next (automation game tech trees
  explicitly chain; puzzle campaigns do it implicitly).
- **PFT application:** the coop-necessity + DENY data shows PFT's
  skills compound: postal (05) reappears load-bearing in 10/11/12's
  sends; movable infrastructure (07) is the finale's core; teardown
  ordering (03) is required in every 4-courier level. The difficulty
  vector appendix in LEVELS.md is the empirical record.

## 5. Honest difficulty reporting

- **Source:** elasticity writeups that lie about difficulty get found
  out by the playerbase — transparent systems (Balatro's exact ante
  numbers) build trust.
- **PFT application:** our multiset-corrected counts ARE the honest
  numbers — where marketing-speak said "6 optimal endings" the truth
  is 3 strategies; where "4 optimal finales" the truth is 1. LEVELS.md
  now reports strategy counts, not plan counts — difficulty claims a
  player can verify against the sim.
