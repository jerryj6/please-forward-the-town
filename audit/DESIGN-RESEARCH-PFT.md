# Design Research Dataroom — Logistics/Scheduling Puzzle Design (PFT)

Seeded sources (real, cited): RPS interviews with Alan Hazelden on Cosmic
Express + playtesting (rockpapershotgun.com, 2017); Matt Rix's GDC 2012
"Trainyard: A Level Design Post-Mortem" deck (struct.ca); Spooky Express
retrospective podcast (Draknek team, 2025); Mini Metro design
commentary. Extracted techniques, each mapped onto PFT-01..12 mechanics.

## 1. One taught idea per level; combos count as NEW ideas (Rix + Draknek)

- **Source:** Rix macro/micro split — the campaign IS the curriculum;
  macro = what gets taught when, micro = the individual puzzle. Draknek
  retro: "two lessons that felt really similar are completely different
  ideas that need its own puzzle… smaller puzzles that focus on very
  small ideas and are not repeated."
- **PFT application:** the escalation cards already isolate one mechanic
  per chapter (juggling → redeploy → capacity → postal →
  handover-ordering → mountedOn → shared spine → dependency cycle →
  strategy tradeoff → movable address → compose-everything). The
  technique's sharp edge: *combinations* deserve their own level.
  PFT-09's apparent cycle is exactly a "combo lesson" — staging +
  use-as-tool + carry-out order taught as one new idea, not three old
  ones. Keep the discipline: never let a level teach two new things.

## 2. Finite shared infrastructure IS the puzzle (Mini Metro / Cosmic Express)

- **Source:** Mini Metro's whole decision surface is a budget of lines,
  trains, carriages, tunnels — each week's pick is irreversible-ish.
  Cosmic Express: ONE track must serve every passenger; the constraint
  is the shared resource, not the graph size.
- **PFT application:** our version is *capacity + sockets + teardown*:
  one ferry of capacity 1, each socket accepting one piece, every
  bridge both route and cargo. The scarce thing isn't moves — it's
  which infrastructure survives longest (the PFT-08 invariant: at least
  one water crossing outlives the last eastbound errand). This is the
  highest-value framing for future level work: design around a single
  bottlenecked shared resource, not more nodes.

## 3. Legible failure beats soft failure (Hazelden playtesting)

- **Source:** Hazelden on sorting difficulty curves by playtest
  frustration — the distinction is between *legible* frustration (you
  see why the state broke) and *mysterious* frustration (silent dead
  ends). Sort hard levels by which kind of stuck they produce.
- **PFT application:** this is literally what the engine's
  `order.stranded` + `recovery` classes + "no open order"/"handled
  from" rejections give us — every failure names its mechanism. The
  pass-6 card-vs-engine validator (33/33) exists precisely to keep the
  named reasons honest. Criterion for any future WA/hint: if a player
  would ask "why did that fail," the answer must already be in the
  rejection text or strand reason.

## 4. Practice right after teaching; reward ANY solve (Rix)

- **Source:** Rix — introduce an element, then immediately make the
  player use it; treat no-timer/no-score design so ANY solution counts,
  with extras for elegance rather than gates.
- **PFT application:** par/`lateMoves` is mastery-only, never a gate —
  matches. The "practice" half maps to our right-reason wrongApproaches:
  each WA is a designed failure that teaches the mechanic by showing
  its absence. The par-beat find (PFT-10 plan C at 27 under par 28) is
  the elegance-reward channel — curated as a documented alternate
  rather than a defect.

## 5. Discovery > hoops (Hazelden level feel)

- **Source:** RPS on Hazelden's level craft — levels should feel like
  exploring a ruleset's depth, "not a designer's tortuous hoops."
- **PFT application:** open-policy levels with enumerated optimal
  families (PFT-08's 6 optimal endings, PFT-12's 4) are the concrete
  shape of this: the player discovers a schedule, not THE schedule.
  Enumeration data is the evidence a level is a discovery-space, not a
  single-route hoop — worth keeping in LEVELS.md as a quality signal.
