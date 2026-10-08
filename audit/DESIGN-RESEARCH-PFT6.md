# Design Research Dataroom 6 — The Departure Constraint

Seeded sources: Mini Metro's pacing (Dinosaur Polo Club — throughput
as a tightening clock), train-scheduling puzzle design (departure
timetables as forced commitments), and how those map to PFT's
deliverable economy — couriers are vehicles, parcels are passengers,
exits are stations.

## 1. Every asset is a departure you must schedule

- **Source:** Mini Metro's pressure comes from finite vehicles serving
  growing demand — each train is a scheduled departure, and the
  player's job is ordering them. Difficulty = how tight the schedule
  gets before failure.
- **PFT application:** couriers ARE departures — each exit order is a
  vehicle that must reach its station (the gate/office) before
  teardown. PFT-08 is pure Mini Metro: 4 couriers, 2 crossings, one
  sale — a throughput problem on shared finite infrastructure. The
  DENY sweep proves the scheduling is load-bearing: remove pack and
  the extraction never completes.

## 2. The "last train" is a commitment device

- **Source:** timetable design uses last-train deadlines to make
  ordering non-trivial — anything that misses it is lost. A shared
  last-departure is the pacing primitive.
- **PFT application:** PFT-06's `hand_over_ferry` is literally the
  last-train constraint: every boat job must complete before the
  signature, and the strand is `recovery='none'`. Same shape in
  pft-11/12 (office deploy timing), pft-01 (last crossing before
  teardown). One commitment device, five pacing variations — that's
  Mini Metro's depth recipe: same clock, different map.

## 3. Bottlenecks are more legible than failures

- **Source:** Mini Metro players read congestion visually before the
  fail state — you can see the packed station coming. Legible
  pressure enables strategy; invisible pressure enables only retry.
- **PFT application:** PFT's version of the packed station is the
  strand/recovery vocabulary — `redeploy`/`undo`/`none` tells the
  player WHICH schedule went wrong and how deep. The capacity probes
  this pass confirm the rejection strings name the bottleneck
  ("capacity 1 exceeded: 2 parcels would be aboard") — the pressure
  is readable at the commit that creates it.

## 4. Slack is the player's budget, not the designer's debt

- **Source:** timetable puzzles give slack minutes so recovery is
  possible — tight schedules should allow imperfect play, not demand
  perfect play.
- **PFT application:** move-par spread IS the slack budget. Enumeration
  gives the real numbers: pft-07 offers 20–24 (4 moves of slack);
  pft-12 offers 44–46 (2). The post-accept probe shows even a sealed
  board doesn't punish a stray wait — the budget is honest about
  what's recoverable. Levels are beatable inside their slack; optima
  are the mastery claims.

## 5. Deliverables compete for infrastructure, not attention

- **Source:** Mini Metro's genius is that passengers (deliverables)
  don't need micromanagement — the infrastructure decision IS the
  play. Complexity lives in edges, not entities.
- **PFT application:** PFT parcels never act; all agency lives in
  couriers + infrastructure (bridges/signs/ferry/posts). Every order
  reduces to "is the edge alive when the courier needs it" — the
  parcelGraph strand analysis implements exactly that question.
  Deliverable-economy design validated: the audit's DENY table is a
  list of infrastructure verbs, never entity micromanagement.
