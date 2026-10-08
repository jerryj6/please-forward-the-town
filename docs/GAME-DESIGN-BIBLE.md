# THE GAME DESIGN BIBLE

### A reference document for small teams building deterministic, content-driven games

**Version 1.0 — written for a production team shipping a three-game portfolio**

---

## How to use this document

This bible is organized as fourteen parts. Each part is self-contained: you can read Part 3 (Puzzle Design) without reading Part 2 (Level Design), though cross-references are given where a rule in one part depends on a concept in another. Every numbered section ends with an **Applied checklist** — a short list of concrete, testable rules. If you only have ten minutes, read the checklists.

The document is written for teams building **small, deterministic, authored games** — the class that includes most acclaimed browser and downloadable puzzle, stealth, logistics, and sandbox titles from small teams (Baba Is You, The Witness, Mini Metro, Cosmic Express, Untitled Goose Game). Where a rule depends on real-time action, networked play, or live-service economics, it is flagged as such.

## Fact discipline

Not everything in game design is equally settled. Throughout this document, claims are tagged:

- **[Conv]** — industry convention. Widely used, taught, and observed in shipped games; you can treat it as load-bearing.
- **[Contested]** — reasonable designers disagree, or the evidence is thin/mixed. We state the strongest version of each side.
- **[Rec]** — our recommendation for this team and this portfolio. A [Rec] always sits on top of the evidence given; it is a decision rule, not a fact.

When a claim is a recommendation, we say why. When it's contested, we say who disagrees and why. This discipline exists because design documents that blur "what the industry does," "what research says," and "what we decided" produce teams that argue about the wrong things.

## The three reference games

Throughout the bible, lessons are tied back to a three-game portfolio used as running examples. You do not need to know these games to use the document, but sections repeatedly return to them as concrete applications.

| Code | Working title | Genre shorthand | Core loop |
|---|---|---|---|
| **TRS** | *The Record Stands* | Sealed-observation causality puzzle | A fixed camera watches a small world run on a beat clock. Actors move one waypoint per beat; skid hazards, bells, toys, redirect junctions, and mechanism delays interact. The player places a bounded set of interventions, then runs the simulation to satisfy authored conditions (e.g., "bell rings exactly once in beats 4–5," "actor ends at the east dock"). |
| **RBM** | *Return by Midnight* | Timing/loan-scheduling heist | Each beat runs a fixed phase order — loans → crew → guards → returns → settle/evaluate. The player borrows property tokens (each with sensory tags like HEAVY, BRIGHT, NOISY), stages them onto pressure plates and through guard rays to keep doors open at the right beats, and must return every token home by midnight. Failure modes: a token unreturned, a guard ray tripped, a plate left unpressed at a bad beat. |
| **PFT** | *Please Forward the Town* | Logistics cargo puzzle | Couriers walk natural edges and deployed pieces between islands; parcels must be packed, carried, ferried, and delivered. A ferry holds a bounded parcel count and carries one rider at a time. Planning is untimed — score is a move count compared against an optional par, so "difficulty" is optimization pressure, not reflexes. |

These three are deliberately different stress-tests of the same discipline: **TRS** is about *causality over time in a world you watch but cannot touch mid-run*; **RBM** is about *scheduling shared resources against a hard deadline with reversible loans*; **PFT** is about *space and bandwidth optimization with free experimentation*. Most design problems you will face reduce to one of these three shapes, which is why they recur.

## A note on scope honesty

Every rule in this document is stated at the strength the evidence supports, no stronger. Where a famous rule ("games should be easy to learn, hard to master") is more slogan than mechanism, we say so and give the mechanism version. Where a number is a rule of thumb ("~2× loss aversion"), we mark it as a rule of thumb, not a constant. A production bible that overstates is worse than one that admits uncertainty — the reader must know which rules they can bend and which will break the game.

---

# PART 1 — PLAYER PSYCHOLOGY & SATISFACTION

Psychology chapters in design documents usually fail in one of two ways: they recite motivational theory with no path to a design decision, or they present dopamine-slot-machine tactics as universal law. This part is organized around decisions you actually make — how long a level should be, how much failure to allow, what the reward for solving is — and cites the theory only where it changes the decision.

## 1.1 Motivation models: what they actually predict

### Self-Determination Theory, operationalized

Self-Determination Theory (SDT; Deci & Ryan) remains the best-validated general framework for intrinsic motivation in games **[Conv]**. Its three needs translate into concrete design obligations:

- **Competence** — the player must experience growth in their own capability, not merely the game's numbers. A puzzle game satisfies competence when the player solves level 40 using an insight they could not have formed at level 10. Numbers going up is *progress display*, not competence; they correlate but are not the thing.
- **Autonomy** — the player must feel the solution was theirs. This is why heavy-handed tutorial text and single-solution puzzles both damage motivation: the first removes ownership of the process, the second removes ownership of the idea. Autonomy is protected by hint ladders (§3.4), multi-solution tolerance (§3.6), and undo systems that let the player own their mistakes.
- **Relatedness** — the player feels connected to others through play. In a single-player puzzle this survives via shared vocabulary ("did you get the ferry trick in 3-2?"), par scores that invite comparison, and spectator/shareable replays. Relatedness is the weakest of the three for solo puzzles and the cheapest to add in co-op (Part 5).

The useful prediction of SDT for puzzle design: **satisfaction scales with how much of the solution the player generated.** A hint that hands the player the last step produces relief; a hint that hands them the first relationship produces satisfaction. This is the entire justification for the three-tier hint ladder.

### Extrinsic rewards corrupt predictably

The overjustification effect — extrinsic rewards displacing intrinsic motivation — is real but narrower than the popular version **[Contested]**. Meta-analyses (Cerasoli, Nicklin & Ford, 2014) find tangible expected rewards reliably reduce intrinsic motivation for tasks that were already interesting, while verbal/praise rewards and unexpected rewards do not. Operational translation:

- Do **not** award coins/stars for completing a level the player would have enjoyed anyway and then spend them on progression — you convert play into work.
- Do use completion markers (a filled map node, a stamped card) as *acknowledgment*, not currency. Zachtronics games reward nothing but the histogram; Baba Is You rewards nothing but the next puzzle. Both are correct for their genre.
- Achievements are safest when they mark *mastery the player is proud of* (solve without hints, under par) and most dangerous when they mark *volume* (solve 50 levels).

### Bartle and beyond

Bartle's four types (Achiever, Explorer, Socializer, Killer) were derived from MUD player chat and are folklore, not measurement **[Contested]**. Quantic Foundry's factor work (Yee) is more defensible and yields actionable clusters — Challenge, Completion, Discovery, Story, Power, Competition — that differ enough between players to affect level ordering: a "Completion" player wants every optional flower; a "Challenge" player wants the hardest node reachable. Design implication that survives the uncertainty: **serve completionists with optional content that is visibly countable** (12 optional parcels, 40 extra stars) and **serve challenge-seekers with par scores and par-breakers**, because these two wants are cheap to provide simultaneously.

### Applied checklist

- [ ] Name which SDT need each major system feeds. If a system feeds none, it is decoration — cut or redesign.
- [ ] Verify the player generates ≥80% of each solution's substance; hint and tutorial systems must hand back ownership quickly.
- [ ] Never sell intrinsic activity back to the player as purchasable progression.
- [ ] Provide at least one countable completion target and at least one difficulty target per level (e.g., PFT's move-par, RBM's "no loans overdue" challenge line).
- [ ] When citing a motivation taxonomy to justify a decision, require it to name the decision it changes; otherwise it is mood music.

## 1.2 Flow theory: the channel is real, the metaphysics is not

### What Csikszentmihalyi actually gives you

Flow — the state of absorbed, self-forgetting engagement — requires three preconditions that are all designable **[Conv]**: (1) clear proximal goals, (2) immediate, unambiguous feedback, (3) a perceived balance between challenge and skill. The famous "channel diagram" (challenge on one axis, skill on the other, boredom below, anxiety above) is a teaching cartoon, but its operational content is real:

- **Clear proximal goal**: at every moment the player knows what they're trying to do next. This is a UI and level-design property, not a personality trait. TRS maintains it by showing the authored condition ("exactly one ring") in the panel; PFT maintains it with a visible undelivered-parcel list. If a playtester asks "wait, what am I doing again," the proximal goal failed.
- **Immediate feedback**: every action must produce a visible/world-readable consequence within ~100–200ms for real-time games **[Conv]**, and for turn-based/planning games, the consequence must be *predictable and confirmable* — in PFT the parcel visibly attaches to the courier; in RBM the loan enters the manifest the moment you commit it.
- **Challenge-skill match**: the game must present challenges near the edge of the player's current skill. Since skill grows, this is a *scheduling* problem (§1.3), which is why difficulty curves exist at all.

### Flow in puzzle games specifically

Puzzle games produce a variant state better described as **contemplative absorption** — long quiet stretches punctuated by insight **[Contested; our term]**. The classic channel misdiagnoses these games: a player staring motionless at The Witness for eight minutes is in flow by self-report but looks, to a metrics system, idle. Therefore:

- Instrument "engaged idle" separately from "stuck idle." Signals: inputs per minute near zero *but* camera still moving, frequent level-referral glances, low undo-spam. Stuck-idle signals: repeated identical failed actions, long pauses followed by menu visits.
- Never interrupt contemplation with unsolicited hints on a timer. Timed pop-up hints are the single highest-friction intervention in the genre **[Rec]**. Hint on request only; escalate detail by ladder.

### Entry and exit conditions

Flow is easier to break than to build. Common breakers, ranked by observed session-kill rate in small-team games **[Conv]**:

1. **Unforced waiting** — load screens, slow animations, unskippable replays. In deterministic puzzle games this includes *forced re-simulation*: if a TRS player has to watch a 30-beat run they already predicted to try one tweak at beat 28, offer beat-level scrubbing (jump to beat N with state restored). RBM/PFT timelines make this trivially cheap — a major reason the sealed-observation format works.
2. **Unreadable failure** — the run fails and the player cannot see why. Address by verdict screens that point at the violating entity and beat (§9.5).
3. **Skill discontinuity** — level N requires an insight never taught or hinted. Address by the skill-atom audit (§2.7).
4. **Extrinsic interruption** — ads, prompts, achievement pop-ups mid-thought.

### Applied checklist

- [ ] Every screen and state answers "what do I do next" without text lookup.
- [ ] Every committed action has an immediate, visible world consequence.
- [ ] Provide scrub/jump-to-beat in any deterministic re-simulation; never force full re-watch.
- [ ] No timed hint pop-ups; hints are pull, not push.
- [ ] Failure verdicts name the violating entity, location, and beat.
- [ ] Distinguish engaged-idle from stuck-idle in telemetry before tuning difficulty.

## 1.3 Difficulty curves: shapes and their consequences

A difficulty curve is a schedule of challenge over content order. The choice of curve is a product decision — it decides who finishes the game and how they feel at hour three.

### The four usable shapes

**Monotonic ramp.** Difficulty rises roughly linearly with level index. Honest and common in pure puzzle games (Stephen's Sausage Roll is near-monotonic and proud of it). Failure mode: it assumes uniform player growth; in reality players grow in steps, so a monotonic curve produces alternating boredom and brick-walling. Mitigate with optional side-content (below).

**Sawtooth.** Difficulty ratchets up within a world/mechanic, then drops at each new chapter as a new mechanic is introduced gently. This is the dominant convention in authored puzzle games **[Conv]** — The Witness's area structure is the canonical example. The drop is not mercy; it's *new-material teaching* where low difficulty buys attention for a new rule. The sawtooth's teeth should share an envelope: each chapter's peak can exceed the last chapter's peak, and each trough should sit above absolute beginner level.

**Plateau-and-spike.** Long flat stretches punctuated by hard gates (bosses, exams). Appropriate for action games; dangerous for puzzles, where a spike the player can't pass means *stopping*, not retrying-faster. If used, spikes must sit on optional content.

**Player-chosen (branching difficulty).** The level graph forks: a main path at moderate difficulty and marked hard branches (PFT pars, RBM no-overdue challenges, TRS "fewest interventions" variants). This is the single best fit for a small team's puzzle portfolio **[Rec]** because it converts your weakest asset — you cannot afford enough content for every skill level — into a feature: the same levels serve multiple bands.

### Perceived vs. actual difficulty

Players report difficulty by *feel*, which diverges systematically from solve-rate difficulty **[Conv]**:

- A puzzle that *looks* simple and fails feels harder than a puzzle that looks impossible and fails. Solution-space size is invisible; interaction complexity is visible. Manage perceived difficulty by managing visible complexity (pieces on screen, not state-space size).
- Difficulty felt in the *first ten seconds* (reading the board) predicts abandonment better than difficulty felt at minute five. Keep the legible surface simple even when the state space is vast — this is why PFT reads as a cute ferry game while hiding a genuinely hard optimization problem.
- Post-solution retrospect matters: solutions that feel "fair in hindsight" generate the recommendation-driving stories ("the answer was staring at me the whole time"). Unfairness-in-hindsight generates refund reviews. The verdict screen should always make the solved state *explainable* (§9.5).

### Difficulty numbers worth having

For a deterministic content game, track per level: median solve time, first-attempt success rate, hint-tier usage distribution, undo count, and abandonment point (quit-while-unsolved). Targets that work for a portfolio puzzle game **[Rec]**:

| Metric | Green | Yellow | Red |
|---|---|---|---|
| First-attempt solve (main path) | 55–80% | 30–55% | <30% |
| Median solve time (early) | 30–90s | 90–180s | >180s or <20s |
| Median solve time (late) | 2–6min | 6–12min | >12min |
| Hint usage (tier-3, the strong hint) | <10% | 10–25% | >25% |
| Quit-unsolved on main path | <8% | 8–15% | >15% |

These are calibration bands, not laws; an intentionally brutal flagship puzzle (a "final exam" node) can live in the red on purpose — but then it must be *branded* as such so the player opts in.

### Applied checklist

- [ ] Choose a curve shape per game before level 1 is built; document it on the level roadmap.
- [ ] Ratchet difficulty within chapters (sawtooth) or fork it (branches); never leave it unexamined.
- [ ] Keep visible complexity low at board-read time; hide difficulty in state space, not in clutter.
- [ ] Instrument the five metrics above per level; review against bands after every playtest cohort.
- [ ] Mark optional-brutal content visibly so players opt in rather than bounce.

## 1.4 Reward schedules and anticipation

### What schedules actually do

Operant conditioning schedules (fixed/variable, ratio/interval) describe when reinforcement lands relative to behavior. The honest state of the science: **variable-ratio schedules produce the highest sustained response rates and are the mechanism behind gambling-compulsion concerns** **[Conv]**. For an authored puzzle game the actionable content is different:

- **Your game is not a slot machine.** Authored puzzles deliver *information* rewards (insights), not extrinsic loops. The schedule question that matters is *frequency of wins*, not randomness of wins.
- **Win frequency shapes session feel.** In The Witness, "wins" (solved panels) come every 10–60 seconds early and every few minutes late; the curve of win-density is the sawtooth inverted. Design win density explicitly: early levels should produce frequent small wins, late levels fewer larger wins. A flat 4-minutes-per-level win rate throughout produces early-game boredom and late-game grind simultaneously.

### Anticipation outperforms reward

Reward-prediction neuroscience (Schultz's dopamine work) is usually summarized as "dopamine is about anticipation, not reward" — broadly right, with the caveat that the signal is *reward prediction error*, i.e., surprise relative to expectation **[Conv, simplified]**. Designable consequences:

- **The pre-commit moment is the strongest psychological moment in a deterministic puzzle.** In TRS the player places interventions, presses Run, and watches. The run is anticipation rendered as observation; the game earns its tension in the seconds between commit and verdict. Protect it: no interruptions mid-run, and the run should be watchable at a pace that builds rather than dumps the answer (real-time ticks, not instant-evaluate; scrub is for *after* the first watch).
- **Uncertainty needs a floor.** If outcomes feel random (the player can't tell *why* it worked), anticipation becomes anxiety. Deterministic, inspectable simulation is what turns gambling-uncertainty into thinking-uncertainty. This is a core argument for the DeterministicEngine pattern: replayable causality is the product.
- **Near-miss is a trap, not a tool.** Slot machines exploit near-miss ("almost won") to extend play; puzzle games generate near-misses naturally ("the parcel arrived one move late"). Natural near-misses are *informative* — they say "your plan is close" — and are good. Engineered fake near-misses (doctored odds) are manipulative and unnecessary in authored content. Keep near-misses honest: a one-beat-late arrival should be *one beat late*, not a scripted tease.

### Reward cadence rules

- Bank small wins early in a session; save the deep puzzle for when the player is warmed up — mirror session pacing (§1.8).
- End sessions on wins. The peak-end rule (memory ≈ peak + end, Kahneman) **[Conv]** means a player who quits after solving remembers the session fondly; one who quits mid-stuck remembers frustration. Provide "one more easy one" exits — a known-solvable quick level reachable from the map — so players can close on a peak.
- Never reward grinding. If a level can be solved by brute-force enumeration, players will do it and hate the game for letting them; redesign until the insight is the shortcut (§3.2).

### Applied checklist

- [ ] Chart win-density (solves/hour) across the level order; front-load frequency, taper by design.
- [ ] Make the commit→observe→verdict sequence uninterrupted and watchable at human pace.
- [ ] Simulation must be deterministic and inspectable; no hidden randomness in authored puzzles.
- [ ] Treat near-misses as information; verify each failure is diagnosable, never theatrical.
- [ ] Provide a known-easy "exit on a win" node reachable from every map/hub.
- [ ] Remove or redesign any level solvable by blind enumeration faster than by insight.


## 1.5 Mastery and competence loops

### What mastery is made of

Skill acquisition follows a rough progression — declarative ("I know the rule"), procedural ("I can execute the rule"), automated ("I don't think about the rule") — and the player's felt competence depends on which stage the *current content* engages **[Conv]**. Puzzle design's version: a mechanic feels dead when the player has automated it and the game still spends levels on it; it feels hostile when the game demands procedural fluency it never built.

Concrete consequence: **every mechanic has a teaching arc with three phases** — introduction (safe, scaffolded), elaboration (combined with prior mechanics), and exploitation (used as assumed vocabulary inside harder problems). Baba Is You runs this arc per word-class; Cosmic Express runs it per tile type. If a mechanic never reaches exploitation, it was a gimmick; if it reaches exploitation too early, it walls players off.

### The competence feedback loop

A working competence loop has four parts, and all four must exist:

1. **Attempt** — the player acts with a hypothesis.
2. **Outcome** — the world responds deterministically.
3. **Diagnosis** — the player can tell *which part* of the hypothesis was wrong.
4. **Revised attempt** — the next try is visibly different in a way the player chose.

Most failed puzzle games break at step 3. The failure state gives a verdict ("you lost") but no diagnosis ("the ferry left before the parcel was aboard because load_ferry happens before ride_ferry in the beat"). Diagnosis is a *display* problem more often than a systems problem: the simulation already knows what went wrong; the verdict screen must say it. RBM's phase-ordered beats (loans → crew → guards → returns → settle) exist precisely so a failing beat can be blamed to a phase — "your token was still out at the returns phase" is a diagnosis; "you failed" is not.

### Visible progress systems

Progress must be *felt*, not just counted. Effective mechanisms, cheapest first:

- **Map state changes** — nodes fill, paths open, the world visibly reflects completion. The Witness's laser beams are the genre benchmark: progress is environmental, physical, and legible from far away.
- **Skill vocabulary display** — PFT shows newly unlocked pieces entering the deploy palette; the palette itself is a progress bar.
- **Countdown stakes** — RBM's midnight clock makes "how much is left" visible in the fiction.
- **Par/challenge markers** — optional excellence displayed next to completion, so progress has two axes (did it / did it well).

Avoid progress systems that require the player to leave the game to check (external achievement lists with no in-world echo). An achievement the player can't see in-world doesn't drive competence; it drives a completionist tic at best.

### Competence vs. completion tension

A subtle, real conflict: completionists want to *finish everything*; challenge-seekers want to *earn something hard*. If optional content is easy, challenge-seekers feel the game has no teeth; if optional content is too hard, completionists feel robbed of a finishable game. Resolution **[Rec]**: keep main-path completion attainable by the median player (first-attempt rates per §1.3), and put genuinely brutal content behind clearly branded challenge nodes whose non-completion does not gate endings, epilogues, or counted progress. Baba Is You does exactly this with its late-game "!" levels.

### Applied checklist

- [ ] Map every mechanic through introduction → elaboration → exploitation; no mechanic skips a phase or stalls in one.
- [ ] Every failure verdict can be blamed to a specific entity/beat/phase — build the diagnosis display before building more levels.
- [ ] Progress is visible in-world without menus.
- [ ] Optional brutal content is opt-in branded and never gates endings or counted completion.
- [ ] Audit that late levels use early mechanics as vocabulary, not re-teach them.

## 1.6 Loss aversion, stakes, and the cost of failure

### The 2× rule and its limits

Loss aversion — losses loom roughly twice as large as equivalent gains — is one of the most replicated findings in behavioral economics **[Conv; the ~2× coefficient is a rule of thumb, estimates range 1.4–3×]**. Design consequences:

- **Framing identical outcomes as loss vs. gain changes felt stakes.** "Return all 4 tokens" feels different from "you may lose up to 4 tokens" even when mechanically identical. RBM's fiction — borrowed property that must come home — is a loss frame made literal: tokens you hold are *liabilities*, which is exactly why the game produces tension without any countdown clock ticking per beat.
- **Undo is a loss-aversion release valve.** Every undo that erases a mistake converts a loss event into a learning event. PFT's untimed planning with full undo is a deliberate choice to make experimentation free — appropriate when the challenge is optimization. TRS could not support mid-run undo without destroying its premise (observation), so it moves the safety net to *between runs*: tweaks are free, only the run is committed.
- **Do not stack loss frames.** A game that punishes failure with resource loss *and* progress loss *and* time loss triples felt stakes. Pick one primary cost; let the others be cosmetic.

### Stakes without punishment

Players want to feel stakes but hate being punished — these are separable **[Rec]**: stakes are *anticipated consequences*; punishment is *administered consequences*. A heist where failure means "the plan fails and you replan" has high stakes and zero punishment if replanning is cheap. Mechanisms for stakes-without-punishment:

- **Returnable loans** (RBM's whole premise): the token must come home — stakes live in the constraint, not the penalty.
- **Par targets** (PFT): you can always finish; the stake is *how well*.
- **Bounded interventions** (TRS): you may place only N devices — scarcity creates stakes about *where*, not fear of a game-over.

### Quit-worthy moments

Empirically, players abandon small-team games at predictable moments **[Conv]**:

- The first un-diagnosable failure ("I have no idea why that didn't work").
- Any wall that requires replaying >2 minutes of solved content.
- Difficulty spikes that arrive *immediately after* a new mechanic's tutorial ("the lesson had teeth").
- Discovering a large time investment was undone (lost progress, lost unlocks).

Each maps to a fixable design element: verdict quality (§9.5), checkpoint granularity (§2.11), sawtooth trough depth (§1.3), and save/undo discipline (Part 8). Audit the level roadmap against this list explicitly during production; mark any level that sits on two or more of these risks for early playtesting.

### Applied checklist

- [ ] Pick one primary failure cost per game; strip secondary costs to cosmetic.
- [ ] Provide cheap reversibility (undo, free replans, tweakable replays) appropriate to each game's premise.
- [ ] Frame stakes in constraints ("must return by midnight"), not punishments ("lose X on failure").
- [ ] Audit the roadmap for quit-worthy moments; playtest flagged levels first.

## 1.7 Engineering the "aha" moment

### What an aha is, mechanically

Insight is the sudden restructuring of a problem's representation — the moment the player stops seeing "a ferry and two islands" and starts seeing "a bandwidth bottleneck" **[Conv that insight exists as a phenomenon; mechanisms contested]**. For design purposes, an aha requires:

- **A problem the player has framed one way**, held long enough to own it.
- **A hidden reframe** that collapses the difficulty — the "key" the level is built around.
- **The player finds the reframe themselves** — told reframes produce "oh," not "aha."

The engineering part: ahas are not random. They can be *provisioned*. A level designed around a key insight is a level where (a) the naive approach demonstrably almost works, (b) the obstacle blocking it names the missing concept, and (c) the level geometry/mechanics make the reframe *findable* from what's on screen.

### The incubation budget

Insight often arrives after stepping away. This is measurable **[Conv — the incubation effect is replicated; optimal break length contested]**: breaks of minutes to hours improve insight rates on unsolved problems. Design consequences most teams miss:

- **Unsolved-but-browsable beats unsolved-and-locked.** If a stuck player can hop to another open level node, incubation happens while playing something else. Hard-gating on the stuck node kills the mechanism. This argues for a map that always offers ≥2 open nodes (§2.1 hub topology).
- **Sleep is a mechanic.** A player who fails a level at 11pm and solves it at breakfast is a satisfied customer, and the game did nothing — it just had to *let them leave gracefully*. Save-state granularity (quit anywhere, resume anywhere) is therefore an insight feature, not a convenience feature.
- **Never punish stepping away.** Energy systems and daily-gate mechanics that monetize impatience are the opposite of incubation design — and would be poison to this genre.

### The aha threshold

Not all insights should be equal difficulty. Calibrate by *distance of reframe*:

| Reframe type | Example | Expected "aha" intensity |
|---|---|---|
| Object re-purpose | The sign isn't a marker — it's a movable address (PFT-010 mountedOn pattern) | Medium |
| Resource reframe | The loan isn't a tool — it's the deadline (RBM token-as-liability) | High |
| Temporal reframe | The beat you fear isn't the beat that matters (guard-ray timing offsets) | High |
| Self-substitution | The "sacrificial skid" — an actor with no cargo as a bell-substitute (TRS idiom) | Very high (composition-level) |

The strongest ahas — the ones that generate word-of-mouth — are **idiom-level**: the player invents a technique the designer made possible but didn't name. Seeded idioms are worth more than seeded solutions: a player who discovers "sacrificial skid" tells friends about *their* discovery. Design for idiom headroom: systems rich enough to support named-player-discovered techniques (§4.3).

### Applied checklist

- [ ] Every puzzle level names its key insight; if you can't name it, the level has no aha — redesign or refile as skill-check.
- [ ] The naive approach almost works and its failure names the reframe.
- [ ] The map always offers ≥2 open nodes so incubation has somewhere to go.
- [ ] Save/resume is lossless at any point — incubation requires graceful exits.
- [ ] Systems contain at least one un-named idiom the designer knows works but never tells the player about.

## 1.8 Session pacing and the shape of a sitting

### Session-length design is a genre variable

Puzzle players segment differently than action players. For a browser-native puzzle portfolio the realistic session is 15–45 minutes, dominated by *problem sessions* (time inside one level), not rounds **[Rec for this genre]**. Design the session envelope:

- **Unit of progress = one level.** A player who solves one level feels a complete session. Target main-path median solve times (§1.3) so that one unit fits a coffee break.
- **Landmark per sitting.** Each session should produce at least one *named* memory — a new mechanic, a hard-won solve, a map unlock. If a 30-minute session can pass with no landmark, the content density is too uniform.
- **No stalemate traps.** A player 25 minutes into a stuck level has consumed the session's whole budget on frustration. Detect long stalls (telemetry §1.3 bands) and ensure the map always offers a cheaper open node — the "exit on a win" rule restated as session structure.

### Entry and exit ramps

**Entry ramp**: the first 60 seconds of a session should contain an effortless win or a clear continuation marker ("3 parcels left on Greywater"). Returning players re-enter through the map's visible state, not through a recap screen **[Rec]**.

**Exit ramp**: honor the peak-end rule (§1.4). Concretely: (a) after a hard solve, the map should present an easy open node before the player quits; (b) allow mid-level save even where the fiction resists (PFT: the planning state is serializable; TRS: interventions placed persist across app closes); (c) never dangle "one more thing" that turns out to be a wall — the last thing in a session must be completable.

### Multi-level arcs within a session

Sessions that feel best usually follow a three-beat internal arc **[Contested — observational, not experimental]**: warm-up solve (confidence), main effort (the level they came to beat), cool-down exploration (easy node or map fiddling). You cannot schedule sessions, but you can *arrange affordances*: a freshly solved hard node unlocks a visibly easier neighbor; the map displays an obvious next-easy option.

### Applied checklist

- [ ] One level = one satisfying session unit; median solve times match §1.3 bands.
- [ ] Sessions produce ≥1 named landmark (unlock, new mechanic, hard solve).
- [ ] Persistent state survives app close at any point, mid-level included.
- [ ] Post-hard-solve, an easier open node is visibly adjacent.
- [ ] Telemetry detects 20+ min stalls and flags the level for redesign review.

## 1.9 Churn: the taxonomy of quitting

Players stop playing for reasons that cluster into five causes. Each has a signature and a fix.

### Cause 1: Confusion (can't parse the situation)

Signature: short sessions, early abandonment, high variance in solve time. The player *never formed a model* of the rules. Fix at the teaching layer (Part 9), not the difficulty layer — confused players aren't failing, they're lost. Detection: very low action rate plus rapid menu/level-select exits.

### Cause 2: Boredom (no proximal pull)

Signature: long gaps between actions, slow camera/UI movement, quits at natural pauses rather than mid-struggle. The player understood the game and it didn't make them care. Fix: win-density and landmark pacing (§1.8); the proximal goal check (§1.2).

### Cause 3: Unfairness (model violated)

Signature: quits *immediately after* a failure; review language "cheap," "impossible," "how was I supposed to know." The player's model of the rules was violated — either a real inconsistency or an untaught rule. Fix: rule-legibility audit (§4.9); ensure every failure was *legally* derivable from shown mechanics.

### Cause 4: Completion (finished, not churned)

Signature: clean stop after map completion; long final session; positive reviews. This is success, not churn — don't treat "the player finished" as a retention problem. For a portfolio piece, *finishing happily* is the conversion event that sells the next game. Optimize for a satisfying final solve and a clear ending marker, not for endless retention.

### Cause 5: Life (session ended, never resumed)

Signature: abrupt exit mid-success, never returns. Not a design problem — most churn is this. Mitigation is purely technical: lossless save, fast re-entry, continuation marker. If re-entry costs 90 seconds of loading and menus, you convert benign interruptions into permanent exits.

### Measuring churn honestly

For a premium/portfolio game (no retention monetization), churn metrics are diagnostic, not KPIs **[Rec]**: use per-level abandonment and resume-rate-after-48h to find broken levels, not to maximize engagement time. A puzzle game optimized for session-length maximization has been optimized for the wrong thing.

### Applied checklist

- [ ] Classify every playtest quit into the five causes; fix confusion at teaching layer, unfairness at legibility layer.
- [ ] Treat completion as success; ship a satisfying final solve.
- [ ] Re-entry from a cold start to "playing" under 10 seconds; save lossless.
- [ ] Never read session length as a health metric for this genre.

---

## 1.10 Attention and cognitive load

### The attention budget is the scarcest resource

Working memory holds roughly 3–5 chunks for novel material (the classic "7±2" overstates for unfamiliar content) **[Conv; capacity estimates contested, 3–5 is the conservative modern band]**. A puzzle board that asks the player to track six interacting entities has exceeded the budget before difficulty even enters the question. Operational rules:

- **Count simultaneous novel entities, not total entities.** A TRS level with 8 actors where 6 move on never-changing routes asks the player to track 2 things. The "tracking load" = number of entities whose state the player must predict right now. Keep tracking load ≤4 at board-read; let total entity count be larger if most are static or cyclic.
- **Chunking is earned.** A player who has internalized "the ferry route" stops counting ferry+parcels as 3 objects; it's one chunk. Expertise = larger chunks, which is why late levels can show more entities at the same subjective load — the skill-atom audit (§2.7) must include which entities expert players have chunked.
- **External memory is design space.** Every annotation the game provides (parcels pinned on the map, loans listed in the manifest, ghost-trace previews) frees working memory for reasoning. PFT's move counter and RBM's manifest are cognitive prosthetics — treat the HUD as the player's second working memory, not decoration. Deterministic preview (simulate the plan before committing) is the strongest prosthetic a puzzle game can offer; it converts memory problems into observation problems.

### Load types and which to spend

Cognitive load theory separates load into intrinsic (the problem's real difficulty), extraneous (overhead from presentation), and germane (load spent building mental models) **[Conv as a framework; disputed measurement]**. The design translation:

- **Extraneous load is always waste.** Unclear iconography, ambiguous affordances, unmappable colors, noisy visuals — all cost working memory and teach nothing. Cut first (Part 6 readability rules exist for this reason).
- **Germane load is the product.** A puzzle's difficulty should live where the thinking is. A TRS level is hard because causality is hard to trace, never because the camera hid the bell.
- **Intrinsic load is tunable only via structure.** You cannot make a genuinely hard problem easy, but you can decompose it — a subgoal structure ("first get Wren off the island") converts one big intrinsic load into a sequence. Author explicit subgoals in LevelCard metadata (Part 10) so hint ladders can point at them.

### Applied checklist

- [ ] Tracking load (entities the player must predict simultaneously) ≤4 at board-read for early levels; scale with earned chunking.
- [ ] Every piece of information the player must juggle has an on-screen representation (manifests, counters, pinned markers).
- [ ] Preview/simulate-then-commit exists wherever memory errors, not reasoning errors, cause failure.
- [ ] Audit each level's difficulty: >70% should be intrinsic/germane; find and kill extraneous load.

## 1.11 Commitment, identity, and investment

### Investment mechanics done honestly

Endowment effect and IKEA effect — people value what they own and what they made — are robust **[Conv]**. Their ethical use in games:

- **Player-built solutions are remembered.** A solution the player assembled feels like theirs; this is the IKEA effect doing retention work. It argues for assembly-based mechanics (PFT deploys pieces, RBM stages tokens) over selection-based ones (pick option A/B/C) — the player who *placed* the bridge owns the plan.
- **Sunk cost is a trap.** "I've spent 40 minutes, I can't quit now" produces continued play and resentment. Designers exploit it at their reputation's risk. In a premium puzzle game, never stretch a level's tail to accumulate sunk investment — if a level's solve path is 10 minutes, don't pad preambles to make quitting "wasteful."
- **Named investment > anonymous investment.** Players invest in things they can point at: "my ferry route," "the trick I found." Support naming-level granularity — replays, sharable solution states, and level-select icons that display *the player's own solve path* rather than a generic icon where feasible.

### Identity and aspirational self-image

Players buy and persist in games that let them be someone — "the kind of person who solves these" **[Contested mechanism, consistent observation]**. Designable corollaries:

- **Genre purity signals identity.** A brutal puzzle game that compromises difficulty for approachability tells its audience "you're not who you thought." The Witness's refusal to explain itself is an identity promise. Decide the game's identity promise early (Part 11 pillar test) and measure every compromise against it.
- **Display of mastery should be legible to outsiders.** Pars, completion stamps, and replay links let players display competence socially — relatedness (§1.1) served by mastery artifacts.

### The first-session contract

The first session teaches the player what the game is, and the teaching is mostly implicit **[Conv]**. Whatever the first ten minutes reward is what the player believes the game wants: if early levels reward speed, later slowness feels like betrayal; if early levels reward exhaustive exploration, a later critical-path gate reads as rudeness. Author the contract deliberately:

- First session must contain: one real insight (however small), one visible system promise ("the bell rings at beat 4 — why?"), zero unforced waits.
- First session must not contain: monetization prompts, permission requests, unskippable story, a tutorial that prevents experimentation.

### Applied checklist

- [ ] Solutions are assembled, not selected — the player places/arranges rather than picks.
- [ ] No mechanic whose retention value is sunk-cost accumulation.
- [ ] Solution artifacts are named/point-at-able (own solve path, replay links).
- [ ] Write the first-session contract: what gets rewarded in minutes 1–10 defines the game.
- [ ] Audit every design compromise against the identity promise; log deviations.

## 1.12 Fairness, trust, and the player contract

### What "fair" means to players

Players' fairness judgments are not about difficulty — they're about *rule consistency* **[Conv]**. A brutal rule applied consistently is fair; a lenient rule applied inconsistently is unfair. The unfairness triggers that produce angry reviews:

1. **Hidden information that should have been visible** — a mechanic's effect first revealed by punishing its use. (Guard-ray timing that inverts "on release" must be shown on a safe first exposure, not discovered mid-heist.)
2. **Inconsistent physics/rules across levels** — a plate that counts props positionally in level 4 but not in level 9. Deterministic engines and frozen vocabularies (Part 10) prevent this structurally, which is a real argument for that architecture.
3. **Punishment for the tutorial's lessons** — the tutorial taught "ferries carry parcels," then a level punishes ferry use with an unstated rule.
4. **Score opacity** — par/settlement math the player can't reproduce. If PFT's move counter can't be hand-verified from the log, pars feel rigged even when they're not. Publish the accounting; determinism makes it free.

### Trust is cumulative and fragile

Every correct prediction the player makes builds trust in the simulation; every surprise that was *unfair* spends it **[Conv as design doctrine]**. A game that has banked trust can afford later ambiguity ("this level looks different on purpose — investigate"); a game that has spent trust gets its ambiguity read as bugs. Concretely: the engine's behavior must be *identical* between what the tutorial demonstrated and what the simulation does. Any engine-vs-presentation divergence (a displayed state the sim doesn't believe) is a trust leak; the sim→presentation separation (§4.6) makes divergence detectable in tests.

### The blame rule

When a run fails, the player asks "whose fault?" The design is healthy when the player answers "mine — I see it now" and unhealthy when they answer "the game's." Every failure verdict should pass the blame test: a skeptical player, shown the verdict and the relevant states, can hand-verify why. The verdict screen formats that proof (§9.5). When playtesters consistently blame the game for a given failure and the verdict can't convince them, the mechanic is the problem — fix the mechanic, not the messaging.

### Applied checklist

- [ ] No mechanic's negative side-effect debuts by punishing it; every inversion/inverse rule gets a safe first exposure.
- [ ] Scores, pars, and settlements are hand-verifiable from a visible log.
- [ ] Sim state and presented state provably equal (tested), never merely assumed.
- [ ] Every failure passes the blame test on a skeptical reread.
- [ ] Track "unfair" complaints per level; a level collecting them is redesigned, not defended.

## 1.13 Measurement: what to instrument and why

### The minimum useful telemetry

For a small team without a data pipeline, instrument only what changes decisions **[Rec]**:

| Signal | Decision it feeds |
|---|---|
| Per-level solve time distribution | Difficulty calibration (§1.3 bands) |
| First-attempt success rate | Tutorial adequacy, gate placement |
| Hint-tier usage per level | Hint ladder balance, insight scaffolding (§3.4) |
| Abandonment point (quit-unsolved vs. quit-solved) | Churn classification (§1.9) |
| Action entropy (repeated identical inputs) | Stuck-vs-contemplating distinction (§1.2) |
| Resume rate after >24h | Save/re-entry health |

Do not instrument: click-stream detail you will never aggregate, per-entity event streams without a hypothesis, funnels with no decision attached. Telemetry you don't act on is just risk surface.

### Ethics baseline

Premium/paid puzzle games have no business case for engagement-maximization telemetry; collect the minimum that improves the game, disclose it, and make it opt-outable **[Rec; note this is a normative stance, not industry standard — industry practice varies]**. For a student/portfolio project the honest posture is itself a marketing asset: "no tracking, no account, works offline" is a feature judges and players respond to.

### Applied checklist

- [ ] Every instrumented signal has a named decision it feeds.
- [ ] Tracking-load and stuck-idle detection implemented if session instrumentation exists at all.
- [ ] Telemetry disclosed; opt-out or local-only honored.
- [ ] Playtest reports must name the metric band a level violated before calling it "too hard."

---

*End of Part 1.*

## 1.14 The cognitive-bias catalog (usable list)

Biases are most useful to a designer as a checklist of "ways the player's judgment will bend." The following are replicated enough to design against **[Conv for existence; effect sizes vary]**.

| Bias | Mechanism | Design use | Abuse risk |
|---|---|---|---|
| Anchoring | First number seen warps later estimates | Par scores anchor "good"; set pars slightly generous so the anchor invites, not mocks | Pars set to top-1% times make the median player feel insulted |
| Endowment | Owned things feel more valuable | Assembled solutions, placed pieces, named routes (§1.11) | — |
| Peak–end | Memory ≈ peak + final moment | End sessions and levels on wins (§1.4, §1.8) | Manufacturing fake peaks the player didn't earn reads as hollow |
| Loss aversion | Losses ≈ 2× equivalent gains (rule of thumb) | Loan/return constraints create stakes (§1.6) | Stacked loss frames feel punitive |
| Zeigarnik | Unfinished tasks intrude on memory | Open map nodes, "3 parcels left" markers pull players back | Cliffhanger-everywhere design feels manipulative |
| IKEA effect | Builders overvalue their builds | Player-authored plans persist as artifacts | — |
| Goal-gradient | Effort rises near visible completion | "1 level left in chapter" markers; almost-full maps | Artificial goalposts (98% then a wall) |
| Availability | Recent vivid events feel probable | Post-failure, surface the *one* relevant replay beat so the fix feels close | — |
| Dunning–Kruger-adjacent confidence | Novices overestimate; experts underestimate | Difficulty self-labeling ("this node is hard") protects novices without insulting experts | — |
| Sunk cost | Past spend warps quit decisions | — (never exploit; §1.11) | High — do not use |

Two usage rules for the whole table. First, biases are *communication tools*, not extraction tools: every listed use either improves clarity (anchoring, availability), protects motivation (peak–end, goal-gradient), or names something to avoid doing to the player (sunk cost, weaponized Zeigarnik). Second, a bias used *against* the player's interest is detectable — players and reviewers now pattern-match dark patterns quickly, and a portfolio game lives on its reputation.

## 1.15 Difficulty as respect

A recurring confusion in this genre: players conflate "the game respects me" with "the game is kind to me." They are not the same **[Contested framing; our synthesis]**. Respect is operationalized as:

- **The game assumes the player can think.** It doesn't pre-solve, over-label, or narrate insights. The Witness trusting the player to infer the rule from six panels is respect; a tooltip stating the rule is not.
- **The game doesn't waste the player's time.** Re-simulation scrubbing, instant restarts, lossless saves — every mechanical wait removed is respect rendered as engineering.
- **The game tells the truth.** Deterministic simulation, reproducible scoring, and honest verdicts are respect rendered as correctness (§1.12).
- **The game holds a real standard.** Difficulty the player opted into, with honest branding, is respect for their appetite. Watered-down challenge "for accessibility" is a different feature — assist options (below) — not a replacement for the standard.

The opposite pattern — games that flatter ("Amazing!" for trivial acts), games that beg (daily-engagement nagging), games that lie (rubber-banding hidden from the player) — each reads as contempt once recognized, and players do recognize it.

**Assist and accessibility options** are not the enemy of standards; they are how a hard game serves more players without lying about what it is **[Rec]**: speed modifiers, extra undo granularity, optional subgoal markers, and hint ladders all lower the floor without moving the ceiling. Rule: assist features must be visible, optional, and never silently active; a player who used them should know they did.

## 1.16 Social psychology for a solo portfolio

Solo puzzle games still live in a social world — the player's friends, the store page, the competition judges. Three mechanisms worth engineering:

- **Shared vocabulary.** Levels with names players can reference ("the twin-ferry one"), mechanics with names players adopt ("skid," "loan," "par"), and idioms players coin ("sacrificial skid") all convert private play into discussable material. Author named things: a named mechanic is a conversation token; an unnamed one is invisible outside the game.
- **Comparable artifacts.** Pars, move counts, intervention counts, replays. The comparison must be *self-explanatory*: "11 moves, par 12" needs no context; an abstract score of 4,820 does.
- **Low-friction spectatorship.** Deterministic runs are watchable — a TRS run is literally a small film. Watchability is a design property to protect: legible staging, readable causality, runs of 20–90 seconds, a shareable end state. A puzzle whose solution is fun to *watch someone else discover* gets streamed; that is free marketing.

### Applied checklist (§1.14–1.16)

- [ ] Every bias in the design has a player-benefit justification; exploitation entries deleted.
- [ ] Respect test: no pre-solved insights, no mechanical waits, no hidden rubber-banding.
- [ ] Assist options are visible, optional, never silently on.
- [ ] ≥3 named discussable mechanics per game; ≥1 comparison artifact per level (par, count, trace).
- [ ] A full solve is watchable by a non-player in <90s and reads as a story.

## 1.17 Part 1 model card: psychology in one table

| Player need | Primary mechanism | Where engineered |
|---|---|---|
| Competence | Skill-atom curriculum, diagnosis-able failure | §2.7, §9.5 |
| Autonomy | Hint ladder, multi-solution tolerance, undo | §3.4, §3.6, Part 8 |
| Relatedness | Named idioms, comparable artifacts, spectatorship | §1.16, Part 5 |
| Anticipation | Commit→observe→verdict, deterministic sim | §1.4, §4.5 |
| Stakes | Constraints over punishments (loans, pars, bounded interventions) | §1.6 |
| Trust | Consistent rules, verifiable scoring, blame-tested verdicts | §1.12, §4.6 |
| Respect | Assumed intelligence, no wasted time, honest difficulty | §1.15 |

Print this table. When a design decision is contested in review, find which row it serves; if none, ask why it exists.


## 1.18 The psychology of watching: observation-game stakes

A sealed-observation game like TRS is psychologically distinct from direct-control games and worth its own analysis, because its central act — *watching a simulation you can no longer touch* — inverts normal agency.

### Commitment concentrates emotion

In a direct-control game, failure is diffuse: it happened across a hundred inputs, so no single moment owns it. In an observation game, the player's entire agency is compressed into the placement phase; the run itself is pure consequence **[Rec — analysis]**. This compression produces three effects:

- **Higher per-commit stakes.** Each Run press carries the weight of all planning. This is the anticipation mechanism of §1.4 concentrated: the commit is the bet, the run is the reveal. Poker players report the same shape of feeling — agency ends at the deal, then suspense does the work.
- **Prediction is the game.** The player's real action is mental simulation: "the skid at beat 3 pushes the bell ring to beat 4, which lands inside the window." A well-built observation game therefore invests disproportionately in *predictability tooling* — visible beat numbers, deterministic ordering, entity-state inspectors — because the player's joy is proportional to how confidently they can predict, then how precisely the sim confirms or surprises.
- **Surprise must be informative, not arbitrary.** When a run diverges from the player's prediction, that divergence IS the lesson — the single most valuable moment in the genre, because it locates a hole in the player's causal model. The verdict screen's job is to convert divergence into diagnosis: "you predicted the ring at beat 3; the marshal's skid pushed it to beat 4 — here is the offset." Games that waste divergence (instant FAIL without replay) throw away their core learning loop.

### The spectator self

Observation games make the player their own spectator. This creates a second design surface — **dramaturgy**. A run that resolves in a confusing visual order (three things happening off-camera simultaneously) deprives the player of the ability to *read their own plan's execution*. Staging rules for watchable runs (developed further in §6.3 on cameras):

- Simultaneous events should be rare, brief, and flagged (the HUD can mark "three things resolve this beat").
- The camera should already be where the interesting thing happens — authored cameraRegions exist precisely because the designer knows where causality concentrates.
- A run's *story* should be followable without pausing: cause → intermediate effect → verdict, in that visual order. When two causal chains race (two bells, one must ring first), the level should stage them so the deciding beat is visually singular.

### Rubber-necking and replays

Re-watching a failed run is not a chore — players voluntarily rewatch game-over footage in spectator-positive genres **[Contested magnitude, consistent direction]**. The rewatch is where learning happens, so rewatch tooling is learning tooling: scrub to beat, isolate an entity's timeline, show counterfactual markers ("if the bell had rung at beat 3, the condition would have passed"). Counterfactual display is a stretch feature but the strongest form of diagnosis an observation game can offer.

## 1.19 Reading playtesters: behavior vs. self-report

The single most reliable rule of playtest psychology: **watch what they do, not what they say** **[Conv]**. Self-reports are systematically biased — politeness ("it was fun" to the developer watching), attribution error ("I'm bad at this" for a broken level), and confabulation (inventing reasons for choices that were actually unconscious). Behavioral signals that out-predict self-report:

| Behavioral signal | What it usually means | Do not confuse with |
|---|---|---|
| Immediate retry after failure | Engaged; blame assigned to self | Compulsion — check if retries are joyful or grinding |
| Long pause, then menu exit | Confusion or resignation, not contemplation | Engaged idle — check camera movement (§1.2) |
| Repeated identical inputs | Stuck: model broken, trying to force it | Experimentation — varied inputs with intent |
| Skipping all text then asking questions | Text is unreadable, not unread | Impatience — though the fix is the same: show don't tell |
| "One more" after solving | Genuine pull | — |
| Laughter at own failure | Fair failure — the game taught something | Laughter of frustration — check tone, check if they retry |
| Calling someone over to watch | The strongest engagement signal a local game can produce | — |

Two protocol rules: **never ask "was it fun?"** (asks them to perform for you) — ask "what were you thinking when X happened" at a concrete moment; and **never explain during observation** — every time you say "oh, you do it by..." you've destroyed the data point measuring whether the game teaches itself.

### Applied checklist (§1.18–1.19)

- [ ] Commit phase is deliberate and bounded; the run is pure observation with no mid-run input.
- [ ] Prediction tooling ships: beat numbers, order-of-resolution display, entity inspectors.
- [ ] Every divergence from prediction produces a diagnosable verdict (replay + blame).
- [ ] Runs staged for watchability: ≤1 simultaneous causally-relevant event per beat where possible.
- [ ] Playtest protocol forbids explaining and "was it fun"; instrument the behavioral table above.

## 1.20 Retention without exploitation

Portfolio puzzle games need retention for a different reason than live-service games: a player who returns *finishes the game and recommends it*. The honest retention levers:

- **Unresolved state.** An open map node the player has seen but not solved is a Zeigarnik hook with content behind it — the opposite of a daily-reward hook, which is a hook with nothing behind it.
- **Difficulty that respects the player's trajectory.** Players return to games where they were last seen *growing*. A session that ended with a visible skill gain (new mechanic understood, hard node cracked) predicts return better than session length.
- **Artifacts worth re-showing.** Shareable replays, par-breakers, and named discoveries give returning players something to *do with* their progress socially.
- **The game stays where they left it.** Lossless save, instant resume, no re-onboarding. Retention lost to friction is the dumbest churn in the catalog (§1.9 cause 5).

What this genre must not borrow from live service: streaks (punish absence), energy (monetize patience), FOMO events (punish scheduling), notifications engineered as guilt. Each converts a portfolio piece into the thing its players chose it to escape **[Rec; normative stance]**.

## 1.21 Applied audit: the psychology model × the three games

Everything in Part 1 reduces to per-game decisions. Here is the audit worked end-to-end — the form every future mechanic proposal should fill out.

### TRS — The Record Stands

- **Competence**: progression is causal-model depth — from "bells ring when skids happen" to orchestrating redirect junctions so two routes share a waypoint exactly once. Skill atoms: predict one actor → predict interaction → invent idiom (sacrificial skid, rejoin detour).
- **Autonomy**: interventions are bounded but compositional; the hint ladder must point at *relationships* ("the ring and the skid are the same event") not placements ("put the toy at the arch").
- **Anticipation**: the commit→run gap is the emotional core. Protect it: no mid-run input, full-speed watch on first run, scrub only after verdict.
- **Stakes**: bounded intervention slots — the question is always *where*, never *whether*. No resource loss; failure cost is a re-watch + re-plan ≈ 60–90s.
- **Trust**: the sim is the contract. Any presentation/sim divergence (a shown position the engine doesn't believe) is a bug that spends trust. EventCount windows must be legible in the HUD, not just in the level data.
- **Churn risk profile**: confusion (causal models are hard to bootstrap) and unfairness (a hidden beat-ordering rule reading as a bug). Both fixed at teaching/verdict layers, not difficulty.

### RBM — Return by Midnight

- **Competence**: scheduling literacy — from "plates hold doors" to juggling loan due-beats against guard-ray phases. Skill atoms: place one loan → sequence phases → pre-position returns.
- **Autonomy**: the loan manifest is the player's own plan made visible; autonomy survives because loans are the player's choice of *which* token *when*, not a scripted sequence.
- **Anticipation**: distributed across the beat timeline — each phase boundary is a mini-reveal (did the plate stay pressed? did the ray stay open?). The tension peaks at `returns` — the phase whose name is the stakes.
- **Stakes**: loss framing done honestly — tokens are liabilities, midnight is the deadline, and failure is a replan, not a punishment. The sensory tags (HEAVY/BRIGHT/NOISY) create mini-loss frames: the useful token is also the traceable one.
- **Trust**: phase ordering is the entire fairness surface. If `settle` ordering ever surprises (a plate re-pressing from a settled drop registering next beat), the HUD must show the ordering, because a player cannot verify what they cannot see.
- **Churn risk profile**: unfairness via phase-order surprise; boredom if loans become bookkeeping. Keep manifests short (≤6 concurrent loans) and show the settle order inline.

### PFT — Please Forward the Town

- **Competence**: optimization literacy — from "deliver the parcels" to capacity budgeting (ferry slots, one-rider rule) and route topology (deployed pieces as graph edits). Skill atoms: single delivery → multi-parcel batching → graph surgery via deploy.
- **Autonomy**: maximal in the portfolio — untimed planning, full undo, free experimentation. Autonomy is why PFT can be the hardest game in the set while feeling the gentlest.
- **Anticipation**: inverted — there is no commit-reveal; anticipation lives in the par ("can I do it in 11?"). The emotional beat is the *last move under par*, not a simulation reveal.
- **Stakes**: par is the stake — finishable always, excellent sometimes. Par anchoring (§1.14) must be generous enough to invite.
- **Trust**: move accounting must be hand-verifiable ("why is that 12?") — the action log is the proof. Stranded-state analysis (`analyzeOrderStatuses`) exists to make dead-ends visible before they're felt.
- **Churn risk profile**: confusion (graph surgery is abstract) and boredom (untimed means no pressure). Counter: early levels small and legible; par creates self-imposed pressure.

### The audit form

For every proposed mechanic, in any of the three games:

1. Which row of the model card (§1.17) does it serve? If none, cut it.
2. Which churn cause does it risk? If ≥2, redesign or flag for early playtest.
3. Can a skeptical player hand-verify its outcome? If not, it's a trust leak.
4. Does the player generate the idea? If the mechanic delivers conclusions rather than problems, it serves none of the three.


## 1.22 The motivation matrix per game

Which motivational levers each game actually pulls **[Rec]**:

| Lever | TRS | RBM | PFT |
|---|---|---|---|
| Competence | Causal prediction | Schedule mastery | Route optimization |
| Autonomy | Intervention placement | Loan composition | Route choice |
| Relatedness | Shared replays | Heist fantasy | Co-op courier |
| Loss aversion | Missed windows (honest) | Overdue loans | Sub-par runs (soft) |
| Progress | Chapter map | Night completion | Island coverage |
| Mastery | Idiom discovery | Patrol exploitation | Under-par depth |

Design rule: each game's primary lever differs — TRS is anticipation/prediction, RBM is stakes/scheduling, PFT is autonomy/optimization. A motivation mechanic that works for one (e.g., streaks for PFT's cozy loop) can actively hurt another (streaks on TRS would poison the contemplative pace).

## 1.23 Difficulty communication

How the game tells players how hard it is **[Rec]**:

- **Named bands**: easy/medium/hard labels are the honest minimum; "normal/hard/expert" read more honestly than "easy/normal/hard" (nobody wants "easy").
- **Chapter pacing**: the sawtooth (§1.3) is the structure; the *labels* on chapters telegraph the ramp.
- **Par/goal visibility**: show the par before starting; the anchor shapes expectations.
- **Assist disclosure**: assist modes are labeled, not hidden; the game that silently adjusts is lying about the difficulty it claims.
- **Difficulty changes**: if difficulty differs by assist/mode, the *difference* is communicated ("hint-assisted runs don't count for leaderboards" is honest; silently different pars is not).

The mistake is difficulty-as-surprise: players discover a level is hard *after* committing time to it. Communicated difficulty lets players self-select, which is itself a satisfaction mechanism.

## 1.24 Honest retention ethics

The line between engagement and exploitation **[Rec, Contested]**:

**Ethical retention mechanics**:
- Open nodes the player *chose* to leave (Zeigarnik, honest use)
- Scheduled content that exists whether or not the player returns
- Mastery hooks: the "you can beat your par" tease
- Seasonal/cosmetic content: presence, not pressure

**Exploitation mechanics**:
- Streaks that punish a missed day
- Limited-time pressure that manufactures urgency
- Sunk-cost progress gates (resources you lose if you stop)
- Deliberately frictionless purchases during emotional peaks

The portfolio rule: retention serves *the player's* return, never the metric's. A mechanic exists because the game is better when played that way, not because the number goes up. If the honest answer to "why does this exist" is "so they come back", it's exploitation dressed as design.

## 1.25 The per-session ritual

How a session should be shaped, regardless of game **[Conv + Rec]**:

- **First 60s**: open on something the player already knows — a level-select with visible progress, or resuming mid-level; never a cold tutorial gate.
- **Minutes 1-10**: the warm-up — the last-played mechanic at below-peak difficulty; rebuild the mental model.
- **Minutes 10-25**: the work — the current challenge levels, the peak difficulty.
- **Minutes 25-40**: the consolidation — finishing the chapter, or a satisfying partial solve; the session's peak-end is designed (§1.8).
- **Exit**: a graceful leave — progress saved visibly, a clear "where you'll resume" marker; no hostage mechanics.

For mobile/browser specifically: sessions fragment. Every level should be completable in the 10-25min window; if a level runs longer, it needs checkpoints and resume — the session ritual is why §2.31's length budgets exist.

## 1.26 The churn taxonomy, complete

Player abandonment causes and their fixes **[Conv + Rec]**:

| Cause | Signature | Fix |
|---|---|---|
| Confusion | Stuck on a teaching level | Better scaffolding (§3.3) |
| Boredom | Solve rates high but engagement drops | More insight density (§1.7) |
| Unfairness | "That's not what I did" | Verdict transparency (§9.15) |
| Completion | Finished content | Honest ending; don't fake more |
| Friction | Load times, bugs, awkward UI | The craft disciplines (Part 6-8) |
| Social | Toxicity in co-op, loneliness in solo | Lobby UX (§5.28); the fiction fills the space |
| Life | External, untouchable | Graceful return rituals (§9.16) |

The game can only fix the first five. Churn measurement should split these — "lost 20% of players" is meaningless without knowing which bucket they fell into.

## 1.27 Psychology of the three games, deeper

**TRS** trades on **anticipation without anxiety**: the fixed camera + deterministic replay creates the purest "will it work" loop in games. The psychology risk is *helplessness* — if the player can't predict outcomes, the observation feels like watching, not playing. Mitigation: the predict-screen (the ghost overlay of predicted outcomes) converts observation into a testable hypothesis.

**RBM** trades on **time pressure without twitch**: the due-beats create genuine stakes but the action is planning, not reflexes. The psychology risk is *deadline anxiety* — too-tight windows feel punishing. Mitigation: the settle phase as the "exhale" beat; the player watches their plan resolve, and the resolution is the reward.

**PFT** trades on **competence through optimization**: solving is easy; solving *well* is the game. The psychology risk is *par anxiety* — the counter becoming a judge. Mitigation: par is generous and disclosed; "under par" is optional mastery, not required completion.

## 1.28 Applied checklist (supplement)

- [ ] Motivation matrix per game; primary lever differs and is named.
- [ ] Difficulty communicated: bands, par, assist disclosure.
- [ ] Retention mechanics audited against the ethics line.
- [ ] Session ritual designed: warm-up, work, consolidation, graceful exit.
- [ ] Churn taxonomy instrumented; causes separated in metrics.


# PART 2 — LEVEL DESIGN FUNDAMENTALS

Level design is the arrangement of space, obstacles, and information so that the player's time inside the level produces a designed experience. For puzzle games the "space" is often abstract — a graph of nodes, a beat timeline, a table of loans — but the same structures apply: there is a critical path, there are guidance systems pointing at it, there is pacing, and there is a teaching burden the layout must carry.

## 2.1 Critical path and level topology

### The vocabulary

Every level, however abstract, has a **topology**: the structure of choices between start and goal. Five topologies cover almost everything a small team ships **[Conv]**:

- **Linear**: one path, no branches. Maximum authorial control, minimum player agency. Correct for tutorials and deliberately tight puzzles; suffocating as an entire game's structure.
- **Branch-and-merge**: paths diverge and rejoin. Player chooses *approach*, author controls *content*. Cosmic Express levels are small branch-merges in solution space (many routes, one exit set).
- **Hub**: a central area with spokes; order of spokes chosen by player. The Witness's island is a hub at map scale. Hubs incubate stuckness (§1.7) — the stuck player has somewhere else to go — which is the single strongest structural argument for them.
- **Loop/circuit**: the path returns to an earlier region with new capability or knowledge. Metroidvania structure; in puzzle games, "return with a new verb" levels (a PFT island revisited with a new piece unlocked) are loops in miniature.
- **Open field / sandbox**: goal exists, route is free. Multi-solution puzzle levels are open fields in solution space even when the physical layout is tiny — topology applies to *decision* space, not just geometry.

The critical path is the sequence of states every solution must pass through. In a single-solution puzzle it is the whole solution; in a multi-solution puzzle it may be as small as "acquire the key insight." **Define the critical path before building anything else** — it determines where guidance must be absolute (on-path) and where slack is allowed (off-path).

### Topology at three scales

Topologies nest. A portfolio-level map is a topology (hub of chapters), a chapter is a topology (sawtooth sequence with optional branches), and a level is a topology (the puzzle's own structure). Match guidance strength to scale:

- **Map scale** (level select, world map): the critical path is "enough solved nodes to unlock next chapter." Guidance = unlock markers, open-node glow, countable progress.
- **Chapter scale**: critical path is the teaching arc (§1.5). Guidance = ordering, the forced first node of each mechanic.
- **Level scale**: critical path is the key insight plus its dependencies. Guidance = every affordance in the board.

### Concrete structure: the three games

- **TRS**: the level is a causal graph over beats. Critical path = the events that must occur (bell at beat 4, actor at east dock) and the minimal causal chain producing them. The map can safely be hub-structured because TRS's incubation-friendly format (a stuck player can try another observation) benefits maximally from ≥2 open nodes.
- **RBM**: the level is a scheduling problem. Critical path = which loans are essential and their due-beat ordering. Level topology in RBM is *temporal* — the "space" is the manifest timeline.
- **PFT**: the level is a logistics graph. Critical path = which parcels cross which bottleneck edges. Topology is literally graph topology — bottlenecks (single bridge, one ferry) ARE the critical path, which is why PFT levels should be designed bottleneck-first (§3.2 on bottleneck states).

### Applied checklist

- [ ] Critical path written down for every level before construction: the sequence of required states.
- [ ] Map offers ≥2 open nodes at all times (hub where possible).
- [ ] Guidance strength assigned per scale: map (weak), chapter (ordering), level (affordances).
- [ ] Bottleneck identification done at paper stage — the level is built around it, not discovered through it.

## 2.2 Guidance systems I: eyes, landmarks, and lines

### Lines of sight

The player's eye is steered by what they can see. Three mechanisms **[Conv]**:

- **Composed sightlines**: the camera/level geometry places the goal on-screen at decision points. In fixed-camera games (TRS) this is authored literally — cameraRegions exist so the causally decisive locations are always framed. In free-camera games, level geometry must create the sightline (corridors aimed at the goal, elevated vantages, doorways that frame).
- **Occlusion discipline**: what is hidden is as authored as what is shown. Hide *information* deliberately (the secret, the shortcut, the reveal); never hide *orientation* (the path itself) unless confusion is the designed obstacle — and in puzzle games it almost never should be. The player's problem should be hard because causality is hard, not because the bell is behind a wall.
- **Reveal sequencing**: order in which information becomes visible IS a teaching order. A new mechanic first visible from far away (read it), then at middle distance (predict it), then adjacent (interact with it) teaches spatially. Portal's test-chamber reveals are the genre benchmark: you see the destination portal surface long before you understand how to use it.

### Weenies and landmarks

Disney's term "weenie" — the visual magnet that pulls guests through a park — generalizes to **the landmark hierarchy** **[Conv]**:

- **Primary landmark**: visible from everywhere, orients the map (a castle, a lighthouse, the midnight clock tower). One per zone, unique, high-contrast silhouette.
- **Secondary landmarks**: visible within a region, mark subgoals (the bell tower, the ferry dock). Each region needs 1–2.
- **Tertiary cues**: repeated small markers that say "this way" (lit windows, worn paths, parcels that glow).

Rules for landmark design in small-team games:

1. **Landmarks must be mechanically legible.** A landmark that *does* something (the tower the game ends at) is worth three that merely decorate. In RBM, the clock face is both landmark and mechanic — midnight is visible.
2. **Unique silhouettes only.** Two similar towers destroy the orienting function — "the tall thing" becomes ambiguous. This is a silhouette-budget problem (§6.1) as much as a level problem.
3. **Never spend your landmark.** If the primary landmark is reachable in level 3 of 40, either the map is too small or the landmark promised too much. The Witness's mountain works because it's the *last* place you reach.

### Leading lines

Paths, edges, fences, cable runs, rivers, and shadows all function as lines that steer the eye **[Conv]**. In authored puzzle boards the equivalent is *edge language*: natural edges vs deployed pieces vs ferry routes should read differently (§6.4 kit language) so that the player's eye follows *traversability* automatically. When a player traces "where can the courier go?" visually before touching the controls, the leading lines are working.

### Applied checklist

- [ ] Every decision point has the goal or a reliable cue to it on-screen (fixed cameras: authored regions; free cameras: geometry sightlines).
- [ ] Occlusion hides information deliberately, never orientation.
- [ ] One primary landmark per zone with unique silhouette; mechanically meaningful where possible.
- [ ] New mechanics revealed far→mid→near before demand.
- [ ] Edge/traversal types visually distinct — routes readable without interaction.

## 2.3 Guidance systems II: affordances and signifiers

### Affordance vs. signifier

Norman's distinction is the most misused vocabulary in level design, so pin it down **[Conv]**:

- **Affordance**: what the object *allows* — the relationship between the entity and the player's verbs. A plate affords pressing; a deployable affords placing. Affordances are properties of the system, not the art.
- **Signifier**: what the object *communicates* about its affordance — the visual/audio cue. A plate that *looks* pressable (depressed center, mechanical rim) is a signifier.

Design failures are almost always signifier failures, not affordance failures. The plate affords pressing; if its signifier is a flat tile identical to the floor, players don't press it — the system was fine, the communication was broken. Fix order in debugging "players don't get it": (1) is the signifier legible? (2) is the affordance real? Fix signifiers first — it's the cheap layer.

### Signifier vocabulary

A game needs a *consistent* signifier language — the same affordance must always wear the same costume **[Conv]**:

| Affordance | Signifier family | Must never look like |
|---|---|---|
| Interactive (grabbable/pressable) | Mechanical detail, rim, handle, hover highlight | Static set dressing |
| Traversable | Connected-edge rendering, path texture | Blocking geometry |
| Dangerous/hostile | Warm hue accent, animated threat | Neutral furniture |
| Informational | Text/board frames, paper, chalk | — |
| Locked/gated | Locked physical detail (chain, seal) | Mere difficulty |

Consistency rules: (a) **one costume per affordance** — if plates sometimes glow and sometimes don't, players stop trusting glow; (b) **costumes must be learnable once** — teach each signifier in a safe context (Part 9) then hold it constant; (c) **the fiction may redress, the language may not** — a spooky-chapter plate can look haunted but must still be mechanically rimmed.

### The two-way contract

Affordances must be *honest*: if it looks interactive and isn't, that's a lie; if it is interactive and looks static, that's a secret the player can't be blamed for missing. Both leak trust (§1.12). Audit by **the screenshot test**: show a new player a screenshot and ask "what can you do here?" Every interactive thing they missed and every static thing they guessed is an audit finding.

### Applied checklist

- [ ] Written signifier table for the game; every affordance has exactly one costume.
- [ ] Screenshot test on every level archetype with a fresh player.
- [ ] Fiction-reskin never alters mechanical signifiers.
- [ ] Nothing interactive reads as set dressing; nothing decorative reads as interactive.

## 2.4 Gating and pacing

### Gate taxonomy

A gate controls when content is reached. Six types, in ascending order of player-felt friction **[Conv]**:

1. **Open**: no gate; player routes around freely. Incubation-friendly.
2. **Soft gate**: passable at cost — a hard puzzle you may attempt anytime, a long way around. The player's choice converts potential frustration into opted-in challenge.
3. **Choke**: must pass to proceed, but the requirement is *demonstrable* skill rather than possession — "show you can sequence two ferries." Felt as fair when the choke teaches (see below), unfair when it only tests.
4. **Gate**: requires a possession/achievement — "solve 8 nodes," "own the grapnel piece." Coarse but legible; use sparingly and countably (goal-gradient, §1.14).
5. **Lock**: requires a hidden or timed condition — "the door opens at midnight" (RBM's fiction-gate). Most dramatic; worst failure mode is the player not knowing why it's locked — always signpost the lock condition.
6. **Wall**: impassable at this visit; requires loop-return with new capability. Legible only if the game has established the loop idiom (Metroid's colored doors establish "you'll be back").

### The pacing equation

Pacing = alternation of tension and release at every scale **[Conv]**. Structure a level or chapter as: demand → effort → resolution → breathing room → next demand. The breathing room is not optional padding; it is where insight consolidates and the player collects the reward of competence (§1.5). Concrete pacing units in the portfolio:

- **TRS**: a run is a tension-release unit — placement (building tension), observation (peak), verdict (release). Two runs of the same level is two units; pacing is measured in *runs*, not minutes. Long forced simulations without verdict stalls tension past usefulness.
- **RBM**: each beat's settle phase is a micro-release; each loans/returns boundary is a macro-boundary. The pacing is written into the phase order — respect it: the resolution phase should feel like exhale, which means settle must be *legible* (the player sees the accounting).
- **PFT**: tension is self-generated against par; release is delivery. Batch-deliveries are compound releases — the game should let players *feel* a three-parcel ferry unload as a win beat (staging/audio, Parts 6–7).

### Pacing failure modes

- **Flatline**: uniform demand — the puzzle box with no resolution beats, 40 minutes of identical tension. Fix: inject resolution opportunities (subgoal stamps, partial progress markers, narrative beats).
- **Spike-stack**: multiple demands without release — a hard level following a hard level. Fix: sawtooth ordering (§1.3) and the post-hard-solve easy neighbor rule (§1.8).
- **False release**: "resolution" that is actually more demand — a cutscene that is secretly a tutorial quiz. Fix: releases must be genuinely cost-free.

### Applied checklist

- [ ] Every gate in the game is typed; hard gates countable and signposted.
- [ ] Each level's tension-release units identified in the LevelCard; no level goes >2 units without release.
- [ ] Post-peak release is cost-free — no hidden demands in resolution moments.
- [ ] Choke gates teach while they test; pure-skill exams confined to optional nodes.


## 2.5 Spatial readability

Readability is whether the player can parse the *state* of the level at a glance — where things are, what they are, what's about to matter. It is the level-design face of the visual hierarchy (Part 6 treats the rendering side; here the layout side).

### The read stack

Order of information the player must extract, by priority:

1. **Where am I and where is the goal** — orientation (landmarks, §2.2).
2. **What is the active problem** — the entity/beat/parcel that currently demands attention (staging, §1.18).
3. **What can I do** — affordances in view (§2.3).
4. **What changed** — deltas since last state (highlight on state change, never static clutter).
5. **Ambient context** — dressing, mood. Dead last; and the moment ambient context outshouts priorities 1–4, it is visual noise, not mood.

For puzzle boards the read stack compresses: the whole board is usually on one screen. The discipline then becomes **scan order** — where the eye lands first (highest contrast/motion), second, third. Author the scan order deliberately: the decisive entity should win the scan (brightest, centered, or moving); helpers second; dressing never competes.

### Density and the eye

Two density failure modes **[Conv]**:

- **Clutter density**: too many entities per screen area — the board becomes Where's-Waldo. Fix by removing entities, merging passive ones into background, or expanding the board (camera/zoom).
- **Sparse density**: too few cues — the player can't localize the problem because nothing differentiates regions. Fix with landmarks and regional color/value anchoring (a red-quarry region vs a green-dock region; see PFT island palette logic).

A useful rule of thumb for authored puzzle boards **[Rec]**: the number of *distinguishable regions* should stay ≤7 (Miller's upper bound used conservatively) and the number of *distinct interactive entity types* on one board ≤5. Beyond that, split the level or pre-chunk some entities into groups ("the two identical crates" as one visual unit).

### State vs. dressing separation

Everything that can change state during play should be visually segregable from everything that cannot **[Conv]**. Practically: interactive entities get the saturated palette and the animation budget; the environment gets desaturation and stillness. When state changes must read at distance (a door opening far away), give the change a dedicated channel — a sound, a light, a motion — not just a sprite swap (Part 7's event-sound mapping covers the audio half).

## 2.6 Interest curves at level scale

The Kirkup/Bates interest curve — alternating peaks and valleys, with peaks rising over time and the biggest peak late — is the standard model for action levels **[Conv]**. Puzzle levels need the translation, because puzzle "peaks" are insights, not explosions.

### The puzzle interest curve

A well-shaped authored puzzle level has a five-beat internal curve **[Rec]**:

1. **Orientation** (low): read the board, understand the goal. 5–20 seconds; keep it low-cost.
2. **Hook** (medium): notice the interesting structure — "two couriers, one ferry." This is the level's promise; stage it early and clearly.
3. **Struggle** (high, long): hypothesis-test cycles. The meat. Length controlled by difficulty calibration (§1.3).
4. **Insight** (peak): the reframe fires. Cannot be scheduled; can be provisioned (§1.7).
5. **Denouement** (release): execute the solved plan, verify, stamp. Short and sweet; the solved plan should take <60s to execute — a level whose solve is known but takes 4 minutes to perform is bookkeeping.

The execution-is-cheap rule matters most: **insight and execution should decouple**, with nearly all the level's time in struggle+insight. Levels that invert this — trivial insight, long execution — feel like chores (the "I get it, let me just do it" complaint). Exception: execution difficulty IS legitimate when execution is the skill being tested (multi-step logistics in PFT where par pressure makes sequencing the game).

### Across the chapter

Chapter-level curve: the sawtooth (§1.3) with an interest overlay — chapter peaks should coincide with the *largest insight*, which is usually not the last level but the *capstone* where prior mechanics combine. A chapter's final 2–3 levels should sequence as: combined-mechanic puzzle (peak) → hard-but-fair exam (second peak) → light palate cleanser into next chapter's hook (valley with a promise).

### Applied checklist

- [ ] Every LevelCard names its hook and its key insight; neither may be "it's just harder."
- [ ] Solved-plan execution time <60s unless execution is the tested skill.
- [ ] Chapter ends: combination puzzle → exam → cleanser, in that order.
- [ ] Scan order authored: decisive entity wins the eye first.

## 2.7 Skill atoms and skill chains

Danc's skill-atom model **[Conv as a design tool]** decomposes a game into atoms: **action → feedback → model → mastery**. Each atom is one learnable unit ("plate presses under load," "ferry carries one rider"), and atoms chain: later atoms assume earlier ones. The model gives three instruments every level roadmap needs:

- **The atom inventory**: a list of every learnable unit, in dependency order. Write it before level 1 — it IS the curriculum. Example slice for PFT: `walk edges` → `pickup/drop` → `ferry carries parcels` → `ferry holds N parcels` → `one rider per trip` → `deploy creates edges` → `parcel capacity budget` → `graph surgery`.
- **The assumption map**: for each level, list the atoms it *assumes* (must already be mastered) and the atoms it *teaches*. A level assuming an atom no earlier level taught is a discontinuity — the #1 cause of "impossible" walls in playtests.
- **The spacing check**: atoms recur. Spaced repetition (re-encountering an atom after other material intervenes) consolidates learning better than massed drilling **[Conv from learning science]**. Structure chapters so each new atom gets a massed introduction (2–3 levels) then spaced recurrences (appears in every later chapter as vocabulary).

### Atom granularity

Atoms should be sized at *the smallest unit the player can fail to know*. "The ferry moves parcels" is too big — it hides four atoms (capacity, rider rule, load/unload order, edge semantics). Author atoms at failure-granularity: whatever a playtester demonstrably didn't know is an atom the curriculum must name.

### Chains into the games

- **TRS**: `beat ticks` → `actors move 1 waypoint/beat` → `skid produces BellRing` → `EventCount windows` → `redirect swaps whole routes` → `toy parks and re-rings` (a nasty atom — a parked toy re-ringing every beat ≥4 is exactly the kind of hidden-state rule that needs a dedicated curriculum moment, TRS-06-style tight windows).
- **RBM**: `phases resolve in order` → `loans stage tokens` → `plates hold states` → `guards ray-scan` → `release inverts plate targets` → `due-beats in returns phase`. Note the phase-order atoms come first — the engine's resolution order IS the first curriculum.
- **PFT**: `couriers travel natural edges` → `pieces deploy to create edges` → `ferry carries parcels+rider` → `capacity counts` → `stranded recovery via redeploy` vs `deliver-early is undo-only` (a critical distinction atom — the difference between recoverable and irreversible states is exactly atom-sized and must be taught, not assumed).

### Applied checklist

- [ ] Atom inventory exists, at failure-granularity, in dependency order.
- [ ] Every level's assumed atoms ⊆ earlier levels' taught atoms; no discontinuities.
- [ ] Every atom gets massed intro (2–3 levels) + spaced recurrence.
- [ ] Hidden-state rules (re-rings, inversions, irreversibility) get dedicated teaching moments.

## 2.8 Teaching without tutorials

The strongest convention in modern puzzle design: **the level is the tutorial** **[Conv]**. Text-free teaching (The Witness, most of Baba Is You) is the aspirational form, but the method matters more than the absence of text.

### The teach-by-demonstration pattern

For each new atom, a teaching level follows this structure:

1. **Constrained introduction**: the level is impossible to fail in a way that doesn't demonstrate the atom. The Witness's first panel in each area can't be mis-solved into teaching the wrong rule — the space of wrong answers is pruned.
2. **Immediate consequence visible**: the atom's effect must be observable in the same view where the player caused it. (If the consequence happens off-camera, the teaching failed silently — a real argument for TRS's fixed camera: the designer controls what's visible when the lesson lands.)
3. **Variation within the level**: 2–3 presentations of the same atom in different skins, so the player abstracts the rule rather than memorizing one instance. The Witness's panel trees do exactly this: same rule, increasing surface variation.
4. **First free use**: a short follow-up section where the atom is used unsupervised but low-stakes — the "you've got it, now enjoy it" beat.

### Instructional text: when it's allowed

Text is legitimate for **[Rec]**: naming things ("this is a *loan*"), pointing at UI ("the manifest lists due-beats"), and stating the goal. Text is a smell when it explains *behavior* — if the rule needs a paragraph, either the demonstration failed or the rule is genuinely non-demonstrable (a phase-ordering table is legitimately textual — you can't demonstrate five phases without five beats). Rule: **demonstrate what's demonstrable; text only what's not.**

### Teaching order vs. difficulty order

Teaching wants easy-first; difficulty wants slow-ramp; they're mostly aligned but conflict at one point: the *first* teaching level of a mechanic should be trivially easy **even if the player is deep-game skilled** — because new mechanics reset chunking (§1.10). The sawtooth trough exists for this reason and is not a difficulty bug to smooth out.

### Applied checklist

- [ ] Every atom has a demonstration level whose failure space is pruned to teach the right rule.
- [ ] Each atom taught via ≥2–3 skin variations before free use.
- [ ] Text names/labels/goals only; never text-explains a demonstrable behavior.
- [ ] Mechanic introductions are trivially easy regardless of game depth.


## 2.9 Difficulty ramps inside and across levels

### Within a single level

A level's internal difficulty should itself be a ramp: the first subgoal teaches or recalls, the middle elaborates, the end combines. Even a "one insight" level has sub-structure — orientation, hypothesis space formation, testing. Design it so the *entry* is always cheap: a player should be able to make meaningful progress within the first minute (place an intervention that does something, even if wrong). A level where the first minute is all reading and no doing bleeds engagement at the exact moment the player is deciding whether the level is for them.

Early-interaction rules **[Rec]**:

- Any legal first action should produce visible feedback, not a dead button — PFT's first pickup, TRS's first placed intervention.
- The *obvious* first idea should almost work. Levels that punish the obvious idea hard teach players to distrust intuition; levels that let it get 70% there teach them to iterate (§3.5 wrong-approach design).
- Difficulty should rise from where the player's plan *ends*, not where the level starts — the last stretch can be brutal because the player has invested and learned.

### Across levels: the ramp shape

Already covered at curve scale (§1.3); the level-design translation is ordering rules:

- Never put two same-atom teaching levels adjacent — space them so the second is a *recall* test (spaced repetition §2.7).
- Never put a combinatorial spike (many interacting mechanics) immediately after a trough — one mechanic should anchor while others vary.
- Chapter peaks alternate cognitive *kind* where possible: a spatial puzzle after a scheduling puzzle after a deduction puzzle refreshes rather than compounds fatigue — the portfolio's three games themselves are this alternation at macro scale.

### Ramp verification

Before shipping a chapter, hand-verify the ramp: order levels by *required atoms + estimated solve time* and check for (a) monotonic atom-count growth (b) no solve-time cliffs >3× between adjacent main-path levels (c) at least one easy node within 2 levels of every hard node.

## 2.10 Level length and density calibration

### Length is a felt quantity, not a clock quantity

"How long is a level" is really three questions: how long to *understand* it, how long to *solve* it, how long to *execute* the solution. Their ratios define feel **[Rec]**:

| Ratio profile | Feels like | Appropriate for |
|---|---|---|
| Long understand / short solve / short execute | Elegant insight puzzle | TRS core levels, witness-style |
| Short understand / long solve / short execute | Rich problem box | RBM main path, PFT par levels |
| Short understand / short solve / long execute | Chore | Avoid, unless execution is the tested skill |
| Long everything | Boss/exam level | Branded capstones only, ≤1 per chapter |

### Concrete length budgets for the portfolio

- **TRS**: run length 20–40 beats (15–45s watch time); median planning time 1–5 min mid-game; total level session 2–8 min. Runs >60 beats tax attention without adding difficulty — split causal chains instead.
- **RBM**: manifest depth 3–8 loans; horizon ≤12 beats; median level session 4–10 min. Longer manifests convert scheduling into bookkeeping — cut tokens, not beats.
- **PFT**: 4–12 parcels, 3–6 islands, median session 3–8 min; par gaps of 1–3 moves between good and optimal create optimization depth without needing bigger boards.

### Density rules of thumb

- One *new* cognitive demand per level; combinational levels may reuse known demands freely.
- Board area should shrink to the minimum that fits the problem — unused space is noise the player must exclude. Cosmic Express boards are famously just-big-enough; sprawl would turn each puzzle into Where's-Waldo (§2.5).
- Redundant entities (3 identical crates where 1 suffices) exist only if redundancy is the lesson (e.g., indistinguishability is the trick).

## 2.11 Checkpointing and failure cost

Checkpointing is how a game answers: "when the player fails, what do they re-pay?" For deterministic puzzle games the answer should be: **almost nothing.**

### The re-payment table

| Cost paid on failure | Acceptable | Dangerous |
|---|---|---|
| Re-think the plan | Always — it's the game | — |
| Re-watch a run/scrub timeline | Bounded: scrub must exist | Forced full re-watch every attempt |
| Re-execute a solved plan (perform the moves again) | Never — insight ≠ execution | Any level forcing this |
| Re-solve earlier subgoals | Never — subgoals should persist | Roguelike-style resets in a planning game |
| Lose resources/progress | Only if the loss is the fiction (RBM overdue loan *is* the fail state — but the fail is a replan, not a wipe) | Currency loss on puzzle failure |

### Implementation patterns

- **State snapshots per decision boundary**: in turn/beat games, snapshot at every commit boundary so "undo to anywhere" is cheap — PFT's undo, RBM's manifest editing between runs.
- **Intervention persistence**: placed-but-not-run state survives app close (TRS placements persist); a run interrupted is not work lost.
- **Golden-trace replay**: the player's *own* best trace stored; resuming a level shows the last plan, not a blank board.

### The mid-level death problem

Classical level design asks "where do checkpoints go" — answer: before spikes, after teaching, never mid-animation. Puzzle equivalent: **never checkpoint *inside* an atomic operation** — a committed run plays out fully; you can't undo mid-beat, you cancel the run and re-plan. The commit boundary is the natural checkpoint; respect it or the game's atomicity promise breaks (the run stops being a clean unit of causality to reason about).

## 2.12 Applied audit: level-design model × the three games

| Dimension | TRS | RBM | PFT |
|---|---|---|---|
| Level space | Causal graph over beats | Loan manifest over phases | Logistics graph over islands |
| Critical path | Minimal causal chain to conditions | Essential loans + due ordering | Bottleneck crossings per parcel |
| Guidance | Camera regions, beat markers, condition text | Manifest rows, phase order, due-beats | Undelivered list, par, map topology |
| Interest curve | Place (tension) → run (peak) → verdict | Loans → … → returns (exhale) | Batch deliveries as win beats |
| Failure cost | Re-watch + re-plan ~60s | Replan manifest | Undo moves, free |
| Checkpoint | Commit boundary (atomic runs) | Between beats; manifest editable | Every move (full undo) |
| Teaching vehicle | Safe demonstration runs (toy strike visible) | Safe loan cycles | Tiny islands, one parcel |

The audit form's use: any new level pitch must fill its row of this table before entering production — where is the critical path, what does failure cost, how does it teach.


## 2.13 The level-design pattern catalog

Reusable level structures — patterns that recur across genres — collected here as named tools. Naming them matters: a pattern you can name is a pattern you can assign, review, and test **[Rec — catalog structure ours, patterns conventional]**.

### Space-form patterns

- **Funnel**: broad approach area narrowing into the challenge. Teaches "explore, then commit." PFT island chains naturally funnel — wide at hubs, narrow at bottlenecks.
- **Olympic rings**: several self-contained mini-problems feeding one exit. Each ring is independently solvable; order free. The Witness's marsh/trees areas work this way. Good for low-pressure elaboration phases.
- **Figure-eight**: two loops sharing a central chokepoint. Player must route through the shared node twice with different states — a topology that *is* the puzzle (a PFT two-creek-one-bridge level).
- **Onion**: nested shells where each layer peels to the next — outer problem's solution reveals the inner problem. Strong aha structure: solving "how do I reach the inner island" reframes the level.
- **Ratchet**: a sequence where each step changes state irreversibly in your favor — progress can't slide back. The player never loses ground; the difficulty lives entirely forward. Common in Sokoban-likes where each placed box is a small ratchet.
- **Mirror**: two halves that are near-identical with one asymmetry — the asymmetry IS the lesson (the one tile that differs). A whole mechanic can be taught by a single mirror level.
- **Threading**: a narrow viable path through a hostile field — stealth patterns, timing dodges. RBM's guard-ray gaps produce threading problems in time rather than space.

### Demand patterns

- **Double-use**: the same entity must serve two purposes (the bridge serves two creeks; the toy is both ringer and weight). A reliably generative pattern — take any solved entity and ask "what if it also had to..."
- **Symbiosis**: two actors' plans must interleave (courier A holds the door while courier B passes — TRS/RBM coordination atoms).
- **Forfeiture**: optimal play requires giving something up — a token that must be returned early, a parcel left behind deliberately. Creates the "wait, do less?" aha.
- **Timing sandwich**: an action must occur in a window between two events — tighter than the player first assumes. RBM's due-beats are literal timing sandwiches.
- **Knowledge gate**: passable only with information from elsewhere — pure puzzle structure, no physical gate at all. The Outer Wilds' entire progression model.

### Chapter-arc patterns

- **Thesis–antithesis–synthesis**: early chapter teaches A, mid chapter teaches B that contradicts A's intuition, late chapter levels require both. Baba Is You's rule-rewriting arc.
- **The crescendo**: each level adds one element to a growing combined system until the finale uses all of them — mechanical climax structure.
- **The tour**: chapters each spotlight one mechanic family; late game remixes all — simplest structure, and the right default for a first puzzle portfolio.

## 2.14 Environmental storytelling for puzzle games

Puzzle games tell stories through *states*, not cutscenes — and the states are cheaper and more durable **[Conv for the technique; magnitude of player uptake varies]**.

- **State storytelling**: the world shows evidence of prior events — a broken fence tells of past floods; an already-pressed plate implies past traffic. In TRS terms: the authored initial state is a story ("someone already armed this mechanism"). Players read these unconsciously; it costs almost nothing.
- **Spatial storytelling**: where things are tells why — the wealthier dock district vs. the postal outlier islands (PFT's fiction is already spatial class geography).
- **Progress storytelling**: the world reflects your changes — delivered parcels visibly arrive, returned tokens visibly home. Progress-as-environment (§1.5) is the strongest form: the map itself narrates.
- **Naming-as-story**: level and entity names are the cheapest lore surface that exists. "The Last Ferry," "Greywater," "Return by Midnight" — three words can carry a game's entire mood if consistent.

Rules: environment story must never be *required reading* for the puzzle (story you can skip, mechanics you can't); must never contradict the mechanical read (a "broken" bridge that works mechanically is a lie); and consistency beats depth — a small coherent world beats an elaborate inconsistent one.

## 2.15 Level authoring workflow

How a level should actually get built, in order **[Rec]**:

1. **Insight spec**: one sentence naming the key insight + the atom(s) exercised. If the level has no insight, it's a skill-check level — still legal, but labeled as such and rationed (≤25% of levels).
2. **Critical path sketch**: the required state sequence, on paper. For TRS: the beat-event chain. For RBM: the loan schedule. For PFT: the bottleneck crossings.
3. **Bottleneck/obstacle definition**: what blocks the naive approach; verify the block names the insight (§1.7).
4. **Grey-box build**: minimal geometry/data — no art. Solve it yourself; record your solve path and every wrong path tried.
5. **Failure-space audit**: enumerate plausible wrong approaches; tag each as *teaching failure* (leaves informative evidence) or *dead failure* (leaves nothing). Dead failures get redesigned or fenced (§3.5).
6. **Hint ladder draft**: write the 3-tier hints while the designer's own fresh struggle is in memory — hint ladders written months later are always too strong (§3.4).
7. **LevelCard completion**: metadata, winning traces, wrong approaches, par estimates (Part 10).
8. **Playtest slot**: fresh eyes before any polish; behavioral read per §1.19.
9. **Polish pass**: art/staging/audio only after the puzzle's logic is verified and its teaching role confirmed.

The discipline that saves the most rework: **never art-pass an unplayed level**. Art'd levels resist redesign — the team has invested in them — so they ship broken. Grey-box first is the cheapest quality insurance in all of level design.

## 2.16 Common level-design mistakes

The top recurring failures, each with its signature and fix **[Conv; ordering ours]**:

| # | Mistake | Signature | Fix |
|---|---|---|---|
| 1 | Solution-before-insight | Players execute the solution without ever having the insight, then call the level trivial | Ensure naive approach visibly fails; the insight must be *load-bearing* |
| 2 | Insight-without-execution | Insight is great but execution is a 5-minute chore | Cut execution to <60s (§2.6) |
| 3 | The unteachable atom | A level assumes an atom nothing taught | Assumption-map audit (§2.7) |
| 4 | Where's-Waldo board | Player can't find the problem, not that they can't solve it | Density audit; decisive entity wins scan order |
| 5 | One-true-path fragility | Level accepts exactly one move-ordering though conceptually many should work | Multi-solution tolerance or deliberate uniqueness branding (§3.6) |
| 6 | The checkpoint chasm | Failure repays minutes of solved work | Commit-boundary checkpoints, persisted subgoals |
| 7 | Dead-end silence | Player fails but gets no diagnostic information | Verdict must point at violating entity/beat/phase |
| 8 | Sprawl | Board 3× bigger than the problem | Shrink board to fit the critical path |
| 9 | Dressing-as-clue | Players read decorative elements as mechanical | Affordance audit, screenshot test (§2.3) |
| 10 | The betrayed contract | Late level punishes what early level rewarded | Consistency audit vs. signifier table (§2.3) |


## 2.17 Difficulty instruments: the knobs a level designer controls

"Make this level easier/harder" is not an instruction until you name the knob. The generic difficulty instruments, ordered by how much they disturb a level's identity **[Rec]**:

| Knob | Turns difficulty by | Identity cost |
|---|---|---|
| State-space size | Adding/removing entities, verbs, entities-per-decision | Low — the level is still "about" the same thing |
| Window tightness | Narrowing timing/EventCount tolerances | Low–medium — makes the same trick stricter, never sneakier |
| Hint ladder depth | More/fewer tiers, stronger/weaker hints | None — hints are assist layer (§3.4) |
| Subgoal decomposition | Splitting one insight into staged sub-insights | Medium — the single big aha becomes two smaller ones |
| Information presentation | Foregrounding the decisive clue vs. letting it sit among equals | Medium — staging changes what players notice first |
| Constraint budget | Fewer interventions/loan slots/moves allowed | High — changes what solutions exist; can break intent |
| Optional objective severity | Par tightness, extra conditions | None on main path — the scalpel of difficulty |
| Penalty framing | Loss vs. neutral failure presentation | None on mechanics; large on felt difficulty (§1.6) |

Rules: turn knobs top-down (exhaust cheap knobs before expensive ones); never tune difficulty by adding hidden information (that's not difficulty, it's cheating); and re-playtest after any knob that changes the critical path — state-space size and constraint budget change what *kind* of level it is.

### Per-game scalpel examples

- **TRS**: tighten an EventCount window (ring in beats 4–5 → only beat 4); reduce intervention slots; move the decisive location off the default camera center (information presentation, medium cost); add a second actor on the critical path (state-space).
- **RBM**: shorten due-beat slack (return by beat 9 → beat 8); add one more concurrent loan; tighten a guard-ray gap by one phase; raise the manifest's token variety (more sensory tags in play).
- **PFT**: add a parcel (capacity pressure); tighten par by 1; remove a natural edge so a deployable is mandatory (constraint budget — use carefully); relocate a mailbox socket farther from the ferry dock.

## 2.18 Map and hub design for a puzzle portfolio

The map is the meta-level: its topology decides session structure (§1.8), incubation options (§1.7), and pacing (§2.4). Rules for a three-game portfolio **[Rec]**:

- **Chapter clusters, not one line.** A linear 40-node chain serializes failure — one stuck node ends the game. Clustered chapters with 8–12 nodes each and 2–3 entries unlocked per cluster provide incubation space while keeping the curriculum ordered *within* clusters.
- **Unlock math**: open-node count should never drop below 2 and rarely exceed 6. Below 2 kills incubation; above ~6 produces choice paralysis and players who hop past hard nodes indefinitely (skipping feels free, growth stops).
- **Optional nodes visually segregated** so players learn "spoked nodes are extra" without text — a different node shape/port on the map, not a footnote.
- **The map itself is a readability exercise**: nodes readable at a glance (solved/unsolved/locked/perfected), region identity by palette, the next suggested node marked subtly (a soft glow, never an arrow labeled "DO THIS").

### Per-game map notes

- **TRS**: nodes are *records* (the fiction is an archive of observed events — a map literally styled as a case file or ledger fits); optional nodes = "variant conditions" on the same scene, re-using boards with different EventCount windows — cheap content multiplication with real difficulty differences.
- **RBM**: nodes are nights/jobs along a calendar to midnight — the map IS the deadline fiction; locked nodes can be time-gated in-fiction ("this job isn't until Thursday").
- **PFT**: nodes are islands/routes; optional nodes = extra deliveries on an island; the map is literally the logistics network — geography as menu.

## 2.19 Observation-locked levels vs. interactive levels

A structural distinction the portfolio straddles: in TRS the player acts *before* observing; in RBM the player plans beats *between* observations; in PFT the player interacts continuously. Each placement of the interaction boundary changes what the level design must do **[Rec — analysis]**:

- **Act-then-watch (TRS)**: the level must be fully legible *before* the first run — the player forms the whole plan from a static board plus the authored conditions. Implication: all decisive information must be inspectable pre-run (entity tooltips, beat tables, route previews); no fair TRS level may hide a decisive rule inside a run's animation.
- **Plan-then-commit-loops (RBM)**: the player iterates plan→partial-run→replan. Levels can afford slightly more hidden state because the loop reveals it — but each reveal must teach, and repeated reveals of the same hidden rule are waste.
- **Continuous interaction (PFT)**: state is always legible because the player is holding it; difficulty can live in lookahead depth rather than hidden structure. Implication: PFT can safely have the largest state spaces of the three.

The general rule: **the less interaction during resolution, the more legible the pre-resolution state must be.** Put differently — opacity budget ∝ interactivity. A game where you watch must let you see; a game where you act can let you discover.

### Applied checklist (§2.13–2.19)

- [ ] Every level tagged with its space-form and demand patterns; pattern reuse deliberate, not accidental.
- [ ] Environmental story consistent with mechanical truth; naming carries mood.
- [ ] The 9-step authoring workflow followed; no art pass before a played solve.
- [ ] Mistake table audited per level pre-review.
- [ ] Difficulty tuning uses the knob table top-down; constraint-budget changes get re-playtested.
- [ ] Map: clustered chapters, 2–6 open nodes, visually segregated optionals.
- [ ] Opacity budget matched to interactivity: fixed-observation levels are fully legible pre-run.


## 2.20 The beat sheet: planning a level before building it

A beat sheet is the level's one-page design contract — written before construction, kept beside it during review, and updated if the level drifts. It is the level-design equivalent of an interface contract: small, precise, and the first thing reviewed when something feels off **[Rec]**.

A complete beat sheet has eight fields:

1. **Insight**: the one-sentence reframe the level exists to teach or exercise ("the ferry can be handed to the other courier mid-route"). None = skill-check level, label it and move on.
2. **Atoms assumed / taught**: drawn from the inventory (§2.7). A level teaching more than one new atom is two levels fighting.
3. **Critical path**: the required state sequence — written as states, not moves ("parcel P aboard ferry F by move ~6"), because move-exact paths are a fragility smell (§3.6).
4. **Hook**: what makes this level visually or conceptually interesting at first glance (two couriers, one ferry; a bell that must *not* ring).
5. **Naive failure**: the obvious wrong approach and the informative failure it produces. If the naive approach *succeeds*, the level teaches nothing.
6. **Difficulty knobs**: which §2.17 instruments are set where, and how much headroom remains (a level already at max tightness has no tuning room left).
7. **Pacing shape**: tension–release units (§2.4); where the breathing room is.
8. **Verification**: the winning trace plus at least one expected-to-fail trace, runnable in CI (Part 10, §11.4).

The beat sheet is also the review instrument: a reviewer who disagrees with a level should be able to point at the field they disagree with. Levels argued about without beat sheets become taste fights; levels argued about with beat sheets become engineering.

## 2.21 Reading-order design for authored boards

For a single-screen puzzle board there is still a page-layout discipline — the player's first read of the board is a designed experience **[Rec]**:

- **First fixation should land on the goal or the decisive entity.** Highest salience (value contrast, motion, centrality) wins the first fixation in ~the first 200ms — this is a vision-science finding you get for free **[Conv]**. Audit: squint-test the board; if the first thing that pops is decorative, the staging is wrong.
- **Second fixation should find the mechanism.** After "what do I want," the eye asks "what do I have" — the intervention palette, the loanable tokens, the deployable pieces. Place the player's tools in the second-salience slot: adjacent to the goal but subordinate.
- **Count of salient objects ≤ 3.** Goal + tools + one wildcard (the twist, the threat). More than three salient objects and the board reads as noise — players report "busy" before they can say why.

Worked example (PFT): a board where the undelivered parcel glows softly (first fixation), the deployable bridge sits in the palette below (second), and the single ferry — one rider, N parcels — is mid-screen as the wildcard. The player reads "deliver, with these, using that" in under two seconds without a word of text.

## 2.22 The social level: designing for co-op and spectators

Even single-player puzzle levels have a social dimension — someone watching, someone suggesting, someone taking the controls next. Design levels to be *legible to a second brain* **[Rec]**:

- **Plan-state visibility**: the current plan (placed interventions, committed loans, routed parcels) must be visible to a spectator, not just to the player's memory — because real play in this genre is frequently collaborative in the room ("try the toy at the arch"). A spectator who can't see the plan can't play along, and the game's word-of-mouth dies with that moment.
- **Nameable states**: "I think the ferry should wait one move" — plan discussion requires shared vocabulary, which is another argument for named mechanics and visible counters (§1.16).
- **Discussion pauses**: nothing in the puzzle should decay during discussion. All three portfolio games satisfy this naturally (deterministic, untimed planning) — protect it: never add a real-time element to a discussion-friendly genre without a reason that survives review.
- **Handoff cleanliness**: where two players literally trade control, state must serialize and resume cleanly — the same requirement as save discipline, reused socially.


## 2.23 The exemplar level: the vertical-slice contract

Every game should produce exactly one **exemplar level** before mass production — the level that proves the game's identity in miniature and becomes the standard all later levels are measured against **[Conv in spirit; the "vertical slice" discipline applied to a single level]**.

An exemplar level must:

- **Contain the game's identity mechanic at full strength** — TRS's exemplar should make causality-over-time do something surprising (a rejoin detour that looks impossible until you see the shared waypoint); RBM's should make the loan manifest feel like a heist plan (two tokens, overlapping due-beats, one guard ray); PFT's should make capacity budgeting the whole problem (three parcels, two-slot ferry, one rider).
- **Hit median difficulty of the final game** — not the tutorial, not the capstone. The level a reviewer's gif would show.
- **Pass all audit tables in this part** — beat sheet complete, signifier-clean, <60s execution after insight, diagnosable failure states.
- **Be sized for iteration**: an exemplar is a hypothesis; you will rebuild it 3–5 times as playtests teach you what the game actually is. Budget for that.

Build order: exemplar level → playtest → fix → THEN mass-produce in blocks-of-3 (Part 10). Teams that mass-produce before validating the exemplar produce 40 levels of the same mistake.

## 2.24 Level length calibration data

Consolidated reference table — empirical bands that work for this genre, stated as calibration ranges to validate against playtests, not laws **[Rec]**:

| Property | TRS | RBM | PFT |
|---|---|---|---|
| Board read time (first parse) | 10–30s | 15–45s | 10–30s |
| Median time-to-first-action | <30s | <45s | <20s |
| Run/watch duration | 15–45s | per-beat commit, full run 30–90s | n/a (interactive) |
| Median level session (mid-game) | 3–8 min | 5–12 min | 4–10 min |
| Late-game capstone session | ≤20 min | ≤25 min | ≤20 min |
| Par gap (good→optimal) | 1 intervention | 1–2 loans | 1–3 moves |
| Entity count on board | ≤12 actors/props | ≤8 tokens, ≤4 guards | ≤12 parcels, ≤6 islands |
| Tracking load at read (§1.10) | ≤4 | ≤4 | ≤4 |

Violations to watch in telemetry: boards with read-time >60s are legibility problems; time-to-first-action >2min is engagement bleed; sessions >25min on a non-capstone level are walls.

## 2.25 When to break the rules

Every rule in this part has a legitimate exception, and the skill is recognizing which exception you're actually in **[Rec]**:

- Tutorials may violate agency norms (mandatory sequences) — because teaching is the product there.
- Capstone levels may violate length budgets — the finale earns sprawl if everything was learned earlier.
- Deliberately deceptive levels (the one level where the signifier lies, as a designed twist) may violate consistency — once, late, loudly enough that players discuss it rather than bounce on it.
- Legacy/risk levels (the notorious hard one) may violate difficulty bands — if branded opt-in.

The meta-rule: **you may break a rule when the break is the point, once, visibly.** Breaking rules invisibly or habitually isn't rule-breaking, it's noise. Log every intentional violation in the LevelCard; violations found in review that weren't logged are bugs, not design.


## 2.26 Wayfinding and navigation metrics

Even in abstract puzzle games, players navigate — through map menus, level graphs, solution spaces. Wayfinding metrics worth tracking **[Rec]**:

- **Time-to-entry**: seconds from map view to inside a level. Target <10s; >30s means the map is hiding its affordances (players can't tell what's clickable).
- **Wrong-node rate**: players entering a level they immediately exit. High rate = the map's preview (node icons, names) doesn't communicate what's inside; fix by node previews (a one-line hook or thumbnail state).
- **Backtrack frequency**: revisiting solved nodes is healthy (completionism); *re-entering* unsolved nodes repeatedly and quitting is the stuck-hop signature — the player's incubation engine stalling because all open nodes are hard for them.

Design the map so these metrics are diagnosable: every node needs a legible preview (name + icon + state), every region a palette identity, and the "next suggestion" subtle (soft glow) rather than coercive (arrow + text). A map that players enjoy browsing is itself content — The Witness's island invites wandering between panels as play, which converts commute time into engagement.

## 2.27 Accessibility in level design

Level-design accessibility beyond visual/motor (see §6.7 for rendering):

- **Sequencing accessibility**: players with different processing speeds need the game to never punish slow reading — all three portfolio games satisfy this structurally (deterministic, player-paced). Keep it: no timed reveals, no expiring UI.
- **Memory accessibility**: never require players to remember off-screen state — mirrors of the working-memory rule (§1.10) applied at map scale. If returning to a level requires remembering its rules, include a legend/inspector that re-surfaces them.
- **Spatial accessibility**: players with poor mental rotation struggle with orientation-dependent puzzles — prefer fixed cameras (TRS) or consistent orientation, mark cardinal directions if navigation matters, and never make rotation-as-puzzle the core mechanic unless that IS the game.
- **Color/shape redundancy**: level-critical distinctions must survive colorblindness (§6.7) — ferry routes, danger zones, and token tags need shape/label redundancy, not hue alone.
- **Assist without judgment**: subgoal markers and extra hints available by toggle, disclosed, never silently on (§1.15).

## 2.28 The level review protocol

Before any level ships, it passes a structured review — the same review for every level, so quality is a process, not an opinion **[Rec]**:

1. **Beat sheet check**: all 8 fields present; insight is one sentence; atoms map cleanly.
2. **Solo solve by a non-author**: someone who didn't build it solves it cold; their path is recorded and compared to the beat sheet's critical path. Divergence is data, not failure — but unexplained divergence ("I never saw the bell") is a staging finding.
3. **Wrong-approach audit**: the reviewer deliberately attempts the documented naive failures; each must produce its predicted informative failure state.
4. **Signifier audit**: the screenshot test (§2.3) — reviewer lists interactables from a still image; misses are findings.
5. **Pacing audit**: tension–release units named; any stretch >2 units without release flagged.
6. **Trust audit**: reviewer verifies the level teaches what it uses and uses what it teaches (§1.12 consistency).
7. **Accessibility pass**: §2.27 checklist.
8. **Verdict**: ship / fix-and-recheck / redesign. "Ship" requires all prior steps clean, not vibes.

Time-box: the review takes 20–40 min/level. A level that fails review twice gets redesigned at beat-sheet level — never patched a third time, because triple-patched levels are scar tissue: playable but never clean.


## 2.29 The pacing formula

Interest curves made computable **[Rec]**. Model a level as a sequence of tension-release units (TRUs):

- Each TRU = one demand-effort-resolution cycle with a tension value T (0-3: none/low/med/high).
- A level's pacing = the sequence of T values; shape matters more than sum.
- Rules: (a) never >2 consecutive high-T units without a release; (b) the peak T is at ~75% of the level; (c) the final unit's T returns to 0 (resolution) unless it's a cliffhanger level.
- A boring level's curve is flat; a frustrating level's curve is monotone-increasing; a good level's curve alternates.

**Worked example** (a mid-chapter TRS level): `T=[0(intro), 1(first placement), 2(cascade starts), 1(release: partial solve), 3(climax: the re-ring window), 0(resolve)]` — the classic rise-fall-rise shape.

The formula doesn't design the level; it *checks* it. A level whose T-sequence violates (a) or (b) gets redesigned before playtesting sees it.

## 2.30 Difficulty knobs, concretized

The per-game table of tunable difficulty parameters **[Rec]**:

| Game | Knob | Cheap effect | Expensive effect |
|---|---|---|---|
| TRS | Actor count | More to track | Larger state space |
| TRS | Intervention types | More tools | New mechanics to teach |
| TRS | Re-sim cost (limited rewinds) | Time pressure | Rage at cap |
| RBM | Patrol density | Fewer safe windows | Unfair lockouts |
| RBM | Due-beat spread | Tighter scheduling | Impossible overlap |
| RBM | Sensory-tag strictness | More constraints | More teaching |
| PFT | Island count | More routes | Visual clutter |
| PFT | Ferry capacity | Forced batching | Triviality if too loose |
| PFT | Par tightness | Score pressure | Punishing perfect runs |
| PFT | Pack requirement | Stranding risk | Teaching overhead |

Rule: tune the cheap knobs in level authoring; expensive knobs are chapter-boundary decisions (they change the game, not the level).

## 2.31 Level length, decided

How long a level should be, by game **[Conv + Rec]**:

- **Teaching levels**: 60-120s solve-time for median players; if it runs longer, it's testing, not teaching.
- **Standard levels**: 3-8min median; the tension-release cycle needs this room.
- **Capstone levels**: 10-20min; the peak of the interest curve earns its length.
- **Epic/marathon**: >20min only at chapter ends, and only with save-resume; long levels without checkpoints are homework.

For the portfolio: TRS levels are naturally short (a single re-sim is bounded); RBM levels are naturally medium (a full night is a session); PFT levels are the shortest (a route is one loop). The lengths differ by game *because the mechanics differ* — forcing uniform length across the portfolio is the mistake.

## 2.32 The spatial-readability audit

A mechanical check for board legibility **[Rec]**:

1. **The 3-second screenshot**: show the board for 3s; a fresh player should name the active problem. Fails = density or salience broken.
2. **The entity census**: count entities in view; >12 interactive = clutter zone, <3 = sparse zone; either needs justification.
3. **The read-stack check**: what does the eye hit first? Second? Third? Should match the designed scan order.
4. **The gray test**: desaturate; if the interactive layer doesn't pop from the world layer in value alone, the hue-dependence is a smell.
5. **The occlusion check**: is any load-bearing information ever off-screen? If yes, it's tracked mentally = memory load +1.

Run per-level before art polish; a readability problem discovered post-polish costs 10× to fix.

## 2.33 The chapter arc template

How levels sit inside a chapter **[Rec]**:

- **L1**: teach the chapter's new mechanic (one thing, in isolation, generous constraints).
- **L2**: test — the mechanic used under light pressure.
- **L3**: stretch — the mechanic interacts with a previous mechanic.
- **L4**: elaborate — a second angle on the mechanic (another interaction, another dimension).
- **L5**: challenge — near-capstone difficulty; the mechanic fully assumed.
- **L6**: capstone — combines chapter mechanics at peak difficulty; branded as the chapter's peak.

Six levels per chapter is the default block; a short chapter can cut L4. The pattern is teach→use→interact→vary→test→peak — each level knows its job.

## 2.34 The map-design table

How the level's topology maps to its puzzle family **[Rec]**:

| Family | Topology that serves it | Example |
|---|---|---|
| Sequencing | Linear with forced order | A corridor with ordered gates |
| Scheduling | Hub with contested edges | Rooms around a single corridor |
| Logistics | Graph with bottlenecks | Islands + ferry edges |
| Deduction | Looped with hidden edges | A circular route with a shortcut |
| State-manip | Branch-and-merge | Parallel paths converging |

The level's geometry *is* the puzzle's difficulty: a scheduling puzzle on a linear map is trivial; a sequencing puzzle on a hub is unfocused. Choose topology to serve the family, not the aesthetic.

## 2.35 Applied checklist (supplement)

- [ ] Pacing formula run per level; no >2 high-T consecutive units.
- [ ] Difficulty knobs cataloged per game; cheap vs. expensive classified.
- [ ] Level length justified per type; >20min requires checkpoints.
- [ ] Spatial-readability audit run before art polish.
- [ ] Chapter arc template applied; each level's role named.
- [ ] Map topology matched to puzzle family.


# PART 3 — PUZZLE DESIGN SPECIFICALLY

Puzzle design is the discipline this portfolio lives or dies by. Parts 1–2 gave general tools; this part is the craft: what a puzzle *is* mechanically, how its difficulty is built, how its hints are laddered, how its wrong approaches teach, and how to test it without fooling yourself.

## 3.1 The mechanics space: a working taxonomy

A puzzle's "mechanics space" is the kind of thinking it demands. Six families cover nearly everything in authored puzzle games **[Conv as taxonomy; boundaries fuzzy]**:

| Family | The player manipulates | Canonical examples | Portfolio home |
|---|---|---|---|
| **State manipulation** | Values/states of entities (switches, words, polarity) | Baba Is You, The Witness rule panels | TRS conditions, RBM plate states |
| **Sequencing** | Order of actions in time | most Sokoban-likes, Into the Breach | RBM phase scheduling, TRS beat timing |
| **Resource scheduling** | Allocation of limited resources over time | Mini Metro, Factorio-lite puzzles | RBM loans, PFT ferry capacity |
| **Spatial reasoning** | Geometry: packing, routing, fitting | Cosmic Express, Sokoban, Tetris-likes | PFT routes/sockets, TRS waypoint graphs |
| **Deduction** | Inference over constraints/evidence | The Return of the Obra Dinn, logic grids | TRS EventCount conditions read as deduction targets |
| **Physics/timing** | Continuous dynamics, rhythms | World of Goo, rhythm games | minimal — all three portfolio games are discrete |

Two practical uses:

1. **Design-by-cell**: a portfolio benefits from covering families deliberately — TRS covers sequencing+deduction, RBM covers scheduling+sequencing, PFT covers spatial+scheduling. A puzzle portfolio with three games living in the same cell is a portfolio with one game.
2. **Difficulty predictability**: families have characteristic difficulty drivers. State-manipulation difficulty lives in *interaction count* (how many rules interact); sequencing in *lookahead depth* (how far ahead consequences matter); scheduling in *constraint tightness* (slack in the schedule); spatial in *fit density* (how packed the board is); deduction in *evidence dispersion* (how scattered the clues are). Know your family, know your knobs (§2.17).

### The portfolio-specific mechanics

For each reference game, the mechanics space decomposes to named sub-mechanics:

- **TRS**: intervention *kinds* (place-skid, place-toy, set-delay, redirect-junction) × *targets* (which location/route/mechanism) × *timing* (delay values). The space is combinatorial over a small vocabulary — the designer's control is in what the authored conditions *require*.
- **RBM**: loans (which token, when, where staged) × token sensory tags (HEAVY/BRIGHT/NOISY interacting with guard rays/plates) × phase-order constraints. The scheduling problem is a resource-allocation-with-deadlines problem dressed as a heist.
- **PFT**: moves (travel/pickup/drop/load/ride/pack/deploy/deliver/send/hand_over_ferry/wait — 12-action vocabulary) over a graph that the player's deploys can edit. Capacity + topology + par = the design space.

Design consequence: each game's mechanics space is **closed and enumerable** — you can compute the full action vocabulary, which is what makes automated verification (golden traces, legality checks) possible and why these games can be verified at all.

## 3.2 State space and solution structure

### The state-space model

A deterministic puzzle is a directed graph: nodes are states, edges are actions. The puzzle's *character* lives in the graph's shape **[Conv as analysis frame]**:

- **Start region**: legal states reachable early. Should be wide (many legal moves) to invite experimentation but *not uniformly useful* — a board where every first move is equally good has no texture.
- **Bottleneck states**: states every solution must pass through. These are the level's skeleton. In TRS, the required BellRing is a bottleneck event; in PFT, "parcel P must cross edge E" is a bottleneck crossing. **Author bottlenecks deliberately** — a level with no bottleneck has no shape (many scattered solutions, no shared insight); a level that is *all* bottleneck is fragile and single-solution.
- **Solution region(s)**: the goal states. Diameter and count of solution regions determine multiplicity (§3.6).
- **Dead regions**: states from which no solution is reachable. Dead regions are unavoidable in rich systems; the design question is how the player *learns* they're in one — see stranding detection below.

### The key insight requirement

A good authored puzzle has a **key insight**: a single idea that collapses the difficulty once seen. Formalized: the insight is the smallest piece of information that converts the problem from "search a huge space" to "verify a small plan." Examples: "the sign is a movable address" (PFT-010), "the toy can substitute for the bell" (TRS), "return the noisy token *first*, before the quiet window" (RBM).

Tests for whether a level has a real insight:

- Can you state it in one sentence without mentioning controls? If it requires mechanical detail to express ("click the plate twice"), it's a trick, not an insight.
- Does knowing it make the level easy? An insight that doesn't collapse difficulty isn't the key.
- Does the naive approach fail *because* it lacks the insight? Then the insight is load-bearing.

Levels without key insights are **grind puzzles** (solvable by persistence) — legitimate as palate cleansers, toxic as the main course. Ratio discipline: ≥70% of levels should be insight-bearing **[Rec]**.

### Stranding and dead-state detection

A player in a dead region needs to learn it fast — every move spent in an unwinnable state is paid frustration. Solutions, in order of engineering cost:

1. **Cheap bounds** (do first): conservative detectors — a parcel past every remaining deadline, a loan token with no legal return path, an intervention budget already over-spent for the remaining conditions. These fire early and are always correct (they only fire when provably dead).
2. **Undirected hints**: "this position looks unsolvable — consider undo" offered after M moves with no progress marker. False-positive-safe if gated behind inactivity.
3. **Solver-verified analysis** (best, most expensive): run the engine's legality/reachability check — PFT's `analyzeOrderStatuses` is exactly this. If your engine can prove stranding, expose it; it's the highest-value analysis the UI can surface.

PFT's stranded states (pack-early stranded, hand_over_ferry kills the ferry edge) are a worked example: the engine knows the position is dead; the UI should say so *with the reason* ("this parcel can no longer reach its destination — the ferry route is gone"), because the dead-state's diagnosis is the lesson (§3.5).

### Applied checklist

- [ ] Every level's state graph has ≥1 authored bottleneck; none is all-bottleneck.
- [ ] Key insight stated for every level; grind levels ≤25% and marked.
- [ ] Dead-region detection exists at the cheapest correct tier; stranding verdicts include the reason.
- [ ] Naive approach demonstrably fails AND its failure names the insight.

## 3.3 Difficulty scaffolding inside a single puzzle

Difficulty in a puzzle is not uniform — it lives in specific places, and scaffolding means deciding where to *allow* struggle and where to *remove* it **[Rec]**:

### The four scaffolds

1. **Entry scaffold**: guarantee the first interaction is cheap and informative — an obviously-legal first move that reveals structure. Never gate the puzzle's opening behind the hard part.
2. **Decomposition scaffold**: if the puzzle is one big insight, author intermediate subgoals the player can notice independently — "notice the ferry only fits 2" before "notice the route must loop." Subgoals are the rungs of the insight ladder (distinct from the hint ladder — subgoals are in the level, hints are on request).
3. **Sandbox scaffold**: let wrong attempts be free (undo, reset, replan). The player's willingness to try speculative ideas is proportional to undo cheapness — PFT's free undo is why its players explore.
4. **Consolidation scaffold**: after the key insight fires, the rest of the solution should verify smoothly — no second hidden wall behind the first. A puzzle that ahas then bricks is two puzzles serially; it usually means two levels wanted to be one.

### Where difficulty should live

The defensible places: insight finding (the designed struggle), constraint juggling (the designed juggling act), and execution precision (only when execution is the tested skill). The indefensible places: UI fighting, hidden information, ambiguous rules, arbitrary trial-and-error across a large flat space. Audit every level: which side of the line does its difficulty live on?

### Applied checklist

- [ ] First interaction cheap and revealing; obvious first move legal and informative.
- [ ] Subgoal rungs authored for multi-stage puzzles.
- [ ] Undo/reset free; experimentation costs ≤ 5 seconds per attempt.
- [ ] No second hidden wall behind the key insight.


## 3.4 Hint ladder design

The hint ladder is the primary instrument for protecting autonomy (§1.1) while preventing stuck-quits (§1.9). The industry-observed failure mode is binary: no hints (walls) or full solutions (spoiled). The correct structure is a **graded ladder** **[Rec; generalizes the Hint System literature and games like The Return of the Obra Dinn's oblique confirmations]**.

### The canonical 3-tier ladder

| Tier | Reveals | Example (PFT ferry level) | Example (TRS) |
|---|---|---|---|
| **T1 — Relationship** | Which entities/events relate, no mechanics | "The parcel that must reach Greywater and the foot ferry are linked somehow." | "The bell ring and the marshal's skid are the same event." |
| **T2 — Tool** | Which verb/mechanism applies, not where/when | "`hand_over_ferry` exists — it changes who rides." | "A toy can produce a ring without a skid." |
| **T3 — Partial solution** | One concrete step, usually the *first* decisive one | "Send Wren east on the first move; the dock matters more than the parcel yet." | "The ring must happen at beat 4 — look at what could strike it then." |

Design rules for the ladder:

- **Each tier must be writable without the next.** If T1 gives away T3, the ladder is two tiers tall — common authoring mistake. Review hints in isolation: cover the lower tiers; the hint should still withhold.
- **Tier 3 never completes the solution.** It names the first decisive step or frames the key constraint — enough to restart thinking, not enough to finish. A hint that solves the level has converted the game into a walkthrough.
- **Hints are pull, never push** (§1.2). The ladder exists on request; no timer offers it.
- **Hint usage is telemetry, not shame.** Track which tiers get used per level (§1.13): levels where most players need T3 are under-taught or over-hard; levels where T1 suffices are healthy.
- **Costless hints with ego.** Don't gate hints behind penalties — the player who asked for a hint is the player the ladder exists to serve. Optional: an un-branded "solved with hints" marker in level metadata, for the player's own record — and make it opt-in, off by default, because a badge of dishonor is a small cruelty **[Rec]**.

### Hint authoring discipline

Hints are written at beat-sheet time (§2.20 field 6 adjacent work), not bolted on later — the author who just solved their own puzzle still remembers what was hard to see; three months later they only see the solution. For each tier, the litmus question:

- T1: does this hint name *which two things interact*? ("the ferry schedule and the quiet window")
- T2: does it name *which tool* without naming the use? ("redirect junctions affect entire routes, not single moves")
- T3: does it name *the first decisive commitment* without the rest? ("the first move is east, not the dock")

## 3.5 Wrong-approach design: failures that teach

A well-designed puzzle makes the *wrong* attempts productive — the failed plan leaves evidence that constrains the next plan **[Conv as aspiration; systematic methodology ours]**.

### The failure-taxonomy

Classify every plausible wrong approach into one of four bins at beat-sheet time (§2.20 field 5):

1. **Teaching failure**: the wrong attempt fails *informatively* — the failure reveals a constraint. Player tries to load 3 parcels on a 2-slot ferry; the third refuses with a visible capacity reason. The attempt purchased information. **Target: most wrong approaches live here.**
2. **Near-miss failure**: fails late and *visibly close* — "one move late." These are motivating (§1.4 honest near-miss) and self-diagnosing. **Target: the dominant late-stage failure type.**
3. **Dead failure**: fails without information — nothing visibly changed, or the state is dead but the game can't say so. The player learned nothing except that something didn't work. **Target: zero instances on the critical path.**
4. **Silent-success trap**: the wrong approach *appears* to work — e.g., a solution that satisfies the letter of a condition but violates a later one, discovered only at the end. A controlled dose of this is legitimate difficulty ("the elegant trap"); a level where the *main* path looks done at 80% but is secretly broken is a dead-end trap, the worst kind (§3.2).

### Failure evidence engineering

For each classified wrong approach, ask: what does the player *see* when it fails? Then engineer the evidence:

- **Make the violating entity identifiable.** "Ferry overloaded" → the third parcel should bounce/refuse with its own animation; not a generic "can't."
- **Make the violation's beat/phase explicit.** RBM failures should name the phase ("ray was open at guards phase, closed at returns"); TRS failures name the beat and the event.
- **Preserve the attempt's artifacts.** Don't auto-reset on failure; leave the dead plan on screen so the player can inspect *where* it died. Auto-reset is a diagnosis-killer: it clears the crime scene before the detective arrives.

### Wrong approaches as content

The best wrong approaches are worth *designing*, not just permitting — they are the level's pedagogy. When authoring: enumerate the 3–5 most likely wrong plans (you know them — they're the naive readings of your own board), and verify each produces a teaching or near-miss failure. If a likely wrong plan produces a dead failure, change the level, not the message.

### Applied checklist

- [ ] Hint ladder exists per level, 3 tiers, pull-only, T3 stops short of solution.
- [ ] Tiers authored at beat-sheet time and reviewed in isolation.
- [ ] Every plausible wrong approach classified; critical path has zero dead failures.
- [ ] Failure evidence names entity + beat/phase; the failed plan stays inspectable.
- [ ] Hint-usage telemetry feeds level redesign, not player guilt.

## 3.6 Solution uniqueness vs. multi-solution design

How many solutions should a level accept? The honest answer: it depends what the level is *for* **[Conv that both approaches ship; the decision framework is ours]**.

### The case for uniqueness

- The insight is the point — a level built around one trick is weakened if a brute-force path exists (players will brute-force and miss the lesson; §1.4's enumeration rule).
- Verification is cheaper — one golden trace, narrow test surface.
- The Witness, Stephen's Sausage Roll, most of Baba Is You: effectively unique solutions, and the tightness is the design.

### The case for multiplicity

- Player ownership (§1.1 autonomy) — found-your-own-way solutions feel personal.
- Robustness — a level accepting several plans survives edge-case blocking and produces "my solution vs yours" conversation (§1.16).
- Natural content — multi-solution levels *advertise* their richness; TRS-03's two solutions (toy-substitute vs. detour-trap) is the level's selling point.

### The decision rule

- **Uniqueness when**: the level exists to teach/prove a specific insight and alternatives would let players dodge it. Gate levels, capstones, tutorial exams.
- **Multiplicity when**: the level is elaboration/sandbox and the point is fluency with the vocabulary. The middle 60% of a chapter.
- **Hybrid (best default for this portfolio)**: a constrained core (the key insight is forced — the bottleneck is structural) with open periphery (many move-orders achieve it). The player must have the insight but can express it personally. PFT achieves this naturally: the bottleneck crossings are forced; the move sequences between them are free.

### Multiplicity requires machinery

A multi-solution claim needs proof: solvability tests should enumerate or at least exercise ≥2 intended distinct solutions where you claim them (golden-trace pairs, Part 10). A level *believed* multi-solution that secretly has one path is a discovered lie — worse than a declared-unique level. Also watch **degenerate solutions**: unintended trivial solutions (a walk-around that bypasses the puzzle) found by players. Degenerate solutions that shortcut the insight must be pruned at design time or patched — the level's own logic, not the players' cleverness, decides what counts.

### Applied checklist

- [ ] Every level declares its solution policy (unique / hybrid / open) on its LevelCard.
- [ ] Forced cores are structural (bottlenecks), not arbitrary (locked UI).
- [ ] Claimed multi-solutions have ≥2 verified golden traces.
- [ ] Degenerate-solution sweep performed before polish; shortcuts that skip the insight are blocked or owned as features.


## 3.7 Playtesting methodology for puzzles

Puzzle playtesting differs from general playtesting because the thing being tested is *a thought process*, not a skill execution **[Conv for think-aloud; methodology synthesis ours]**.

### The protocol

1. **Think-aloud with structure**: the tester narrates hypotheses continuously. You're not listening for opinions — you're mapping their *model*: which entities they believe interact, what they think the rules are, where they attribute failures.
2. **No-help rule**: the observer never explains (§1.19). A single "oh you just..." destroys the data for that atom forever — you can never un-know that the level didn't teach it.
3. **Time-boxed stalls**: let a tester stay stuck ~5 minutes past visible frustration, then offer a hint *one tier at a time* — the minimum-sufficient-tier tells you exactly how much scaffolding the level is missing. If T1 unstucks them, the level needed better staging; if T3 is required, the insight is under-supported.
4. **Post-solve probe**: after solving, ask "when did you figure it out?" and "what was the moment you knew?" The aha-timestamp vs. the solve-timestamp tells you whether execution outlasted insight (bad, §2.6) or tracked it.

### What to measure per session

- Time-to-first-action, hypothesis count before solve (how many distinct plans), dead-end count, hint tier required, aha-timestamp, solve-timestamp, execution-time-after-aha.
- **The "blame split"**: on every failure, does the tester blame self, game, or UI? Track the split per level — a level trending "game" is a trust leak regardless of solve rates.

### Cohort sizing for a small team

You can't afford lab-scale studies. The workable plan **[Rec]**: 5–8 testers per major playtest round, each covering 6–10 levels, rotating levels between testers so every level sees ≥3 fresh reads. Nielsen's diminishing-returns curve applies loosely — the first 3 readers find most staging problems; atoms and insights need more coverage (aim ≥5 per mechanic-teaching level). Recruit friends-of-friends who *like puzzles but don't know your games* — your Discord regulars have already been taught your vocabulary and will read as false positives.

### Fix-verify loop

Every playtest finding enters a queue: finding → hypothesis (what's broken) → fix → re-test with a *different* fresh player (never re-test a fix on the same player — they've been taught by the bug). A fix verified on the person who found the bug hasn't been verified.

## 3.8 Blind-spot detection

Blind spots are the specific enemies of puzzle design: things the player can't see because of where attention, presentation, or mental models leave gaps **[Rec — taxonomy ours]**:

- **Spatial blind spots**: entities outside the scan order or camera region. Detection: eye-tracking where available, else the "point at it" test — ask the tester to point at the relevant entity mid-plan; failure = staging problem.
- **Temporal blind spots**: events that happened during attention elsewhere — a bell that rang while the player watched the parcel load. Detection: replay tests — after a failed run, ask "what happened at beat 4?"; if they can't reconstruct it, the event was invisible. Fix: event markers on the timeline, or stagger simultaneous events (§1.18).
- **Mechanical blind spots**: verbs the player doesn't know exist — `hand_over_ferry` discovered only in a late level is a failed teaching arc. Detection: vocabulary audit — list the verbs used in playtester solutions vs. available; unused verbs are either untaught or useless, both findings.
- **Semantic blind spots**: misreadings of fiction — "the sign is decoration" when it's an address. Detection: free-recall test ("what is everything on this board for?"); mismatch between assigned and authored roles is the finding.
- **Self-model blind spots**: players who don't know what they don't know — "I've tried everything" when they've tried one thing five ways. Detection: hypothesis-count metric — low hypothesis diversity signals the player's model is too narrow; fix via T1 hints that widen the relationship space.

Blind spots found in playtest become design inputs: every discovered blind spot should either be engineered away (staging/teaching) or *weaponized* (a deliberate blind spot that becomes the level's insight — "the mechanic hiding in plain sight" is a legitimate trick when it's the point).

## 3.9 Puzzle UX: the interface around the thinking

The UI of a puzzle game serves cognition, not immersion **[Rec]**:

- **Reset cost ~0**: restarting a puzzle costs a tap; the prior plan stays visible (ghost/trace) so the player rebuilds rather than rediscovers. Any reset that wipes the plan's evidence is a diagnosis tax.
- **Annotated state**: the player should be able to mark entities ("this one must return first") — RBM's manifest is authored annotation; PFT could let players pin parcels to couriers. Externalizing intention into the UI frees working memory (§1.10).
- **Undo as a timeline**, not a stack: undo with a visible history (the beat scrubber) converts trial-and-error into *reversible search*, which is the difference between flailing and thinking.
- **Legible commitment boundary**: the player must always know whether an action is a draft (undoable, free) or a commitment (locked, consequential). PFT's propose→commit split is the explicit version; TRS's Run button is the implicit one. Ambiguous commitment boundaries produce accidental-catastrophe rage quits.
- **Ghost / preview**: wherever the rules allow, preview the consequence before committing — trajectory hints, "this deploy would connect A→B" edge previews. Preview converts memory problems into observation problems (§1.10) and is the single highest-value puzzle UX feature after undo.

### Applied checklist

- [ ] Think-aloud protocol with no-help rule; 5–8 testers per round, ≥3 reads per level.
- [ ] Hint-tier-minimum per stuck tester recorded; feeds level redesign.
- [ ] Failure-space audits classify all likely wrong approaches; dead failures near zero on critical path.
- [ ] Blind spots searched per category (spatial/temporal/mechanical/semantic/self-model).
- [ ] Reset ~free, undo timeline-based, preview where legal, commitment boundary legible.

## 3.10 Worked construction recipes for the portfolio

### TRS recipe — a causality puzzle in seven steps

1. Choose the **condition set** (the authored win): e.g., "bell rings exactly once in beats 4–5" + "actor ends at east dock." The conditions ARE the puzzle's statement.
2. Design the **default world**: actor routes, mechanisms, what happens with zero interventions — ideally the default run fails in a way that *shows* the structure (the bell rings at beat 2, too early).
3. Author the **intervention vocabulary** for this level: which of skid/toy/delay/redirect are available and how many slots.
4. Verify the **critical path**: enumerate which interventions can produce each required event (there should be ≥1 intended chain; know the alternatives).
5. Write the **wrong-approach set**: e.g., "player places toy at bell — parked toy re-rings every beat ≥4, breaking the exact-once window" is a textbook teaching failure that requires a *timing* insight to fix.
6. Set **windows**: EventCount windows tight enough to force the insight (a "once" window defeats parked-toy brute force) but loose enough to allow alternative solutions (toy vs. marshal skid).
7. Beat sheet + verification traces + hint ladder → review protocol (§2.28).

### RBM recipe — a scheduling heist

1. Choose the **required outcome**: property tokens placed/used to satisfy the heist (open doors at guard beats, satisfy plates at settle).
2. Build the **temporal skeleton**: the phase order across beats and the hard deadline (midnight = last beat); put the pinch points (ray crossings, due-beats) on the skeleton first — they ARE the puzzle's shape.
3. Populate **token candidates**: each loanable token's sensory tags create candidate/degenerate plan space — a NOISY token that trips a guard ray is a designed wrong-approach class.
4. Verify **feasibility + forcing**: at least one schedule exists; verify the naive schedule (greedy by due-beat) fails informatively.
5. Tune **slack**: loose slack = easy; the interesting region is slack of 1–2 beats on the critical loans.
6. Checks + verdict wording (phase-blame strings) + hints → review.

### PFT recipe — a logistics level

1. Draw the **graph**: islands, natural edges, deployable piece sockets. Identify the bottleneck edges (the bridge over the creek; the ferry).
2. Set **parcels and deadlines**: 4–12 parcels with destinations; destinations far from origins force the bottlenecks.
3. Choose **courier count + capacities**: courier count is a primary difficulty knob (more couriers = more planning, not more throughput — the ferry is one-rider); ferry parcelCapacity sets the batching problem.
4. Compute **par**: hand-solve once, then set par ~1–2 moves above your solve (pars should be generous anchors, §1.14); mark the par-approximation explicitly in metadata.
5. Author **stranded-state surfaces**: run `analyzeOrderStatuses` over plausible wrong branches; ensure stranding verdicts carry reasons.
6. Levels-as-data + move-accounting verification + hints → review.

### Applied checklist (§3.10)

- [ ] Each recipe executed stepwise; skipping steps is the known defect path (art-first, then puzzle).
- [ ] Conditions/requirements authored before world dressing.
- [ ] Slack values and windows recorded as LevelCard numbers, not vibes.


## 3.11 Difficulty models: where hardness lives

Hardness is not a scalar — it has addressable components, and they must be tuned separately **[Conv as analysis frame]**. The decomposable components:

| Component | What produces it | How to measure | Failure signature |
|---|---|---|---|
| **Search depth** | How many steps ahead must be mentally simulated | Moves-to-goal along optimal path | Players give up mid-plan ("too far ahead") |
| **Branching factor** | How many candidate actions per state | Legal actions at decision points | Players report choice paralysis or thrash |
| **Insight distance** | How far the key idea is from naive framing | Hint tier required, aha latency | Players never start thinking productively |
| **Working-memory load** | Entities/constraints to hold simultaneously | Tracking-load count (§1.10) | Players forget mid-plan, re-read board constantly |
| **Precision demand** | Tolerance for error (windows, pars) | Retry count from near-misses | Rage at 1-off failures |
| **Familiarity load** | Assumed vocabulary | Atom-assumption audit | "How was I supposed to know" |

A level's difficulty profile is a six-vector, not a number. Design intent per level: pick 1–2 components to be the difficulty home (usually insight-distance + one), keep the rest low. A level that's hard in four components simultaneously is a wall; one that's easy in all six is filler. The classic calibration failures: raising search depth when you meant insight distance (produces grind), raising precision demand when you meant search depth (produces rage), raising branching factor when you meant working-memory load (produces confusion).

### Per-family difficulty driver (from §3.1)

- State-manipulation: interaction count — number of rules that can interfere.
- Sequencing: lookahead depth + irreversibility presence.
- Scheduling: slack — total spare capacity on the binding constraint.
- Spatial: fit density — occupied fraction of capacity.
- Deduction: dispersion — how many places the evidence lives.

## 3.12 Common puzzle-design mistakes

| # | Mistake | Signature | Fix |
|---|---|---|---|
| 1 | The encyclopedia puzzle | Difficulty from knowing many rules, not thinking | Difficulty profile: cap familiarity-load, move difficulty to insight |
| 2 | Brute-force friendly | Enumeration beats insight (§1.4) | Add the insight-forcing bottleneck; make state space uncountable-in-practice |
| 3 | The trivia lock | Solution requires info outside the game | All needed info on-board or taught; semantic blind-spot audit |
| 4 | Red-herring overload | Decorative entities players waste hypotheses on | Dressing/signifier audit (§2.3); decoration can't read as clue |
| 5 | The two-lock | Two independent hard parts serially | Split into two levels; a puzzle is one insight |
| 6 | Dead-end roulette | Common wrong path lands in silent dead state | Stranding detection + informative failure evidence |
| 7 | Hint-short circuit | T1 hint effectively gives T3 | Tier isolation review |
| 8 | The author's puzzle | Designer blind to difficulty because they know the answer | Fresh-eyes solve requirement in review protocol (§2.28) |
| 9 | The precision trap | Difficulty from 1-move windows everywhere | Precision only where it's the tested skill |
| 10 | Insight starvation | No aha anywhere — all grind | Rebalance toward insight-bearing levels ≥70% |

## 3.13 The puzzle-design spiral: iterative methodology

How the pieces combine into a working loop **[Rec]**:

```
INSIGHT ──> CRITICAL PATH ──> GREY-BOX ──> FAILURE-SPACE ──> PLAYTEST ──> (loop)
     ^                                                              |
     └──────────── REDESIGN (if aha never fires or unfair) <─────────┘
```

- **Week-to-week unit**: the "block of 3" production rhythm (Part 10) — one teaching level, one elaboration level, one challenge level per mechanic family — fits this loop naturally.
- **Entry criterion for the loop**: a written insight + critical path. If you can't write them, you're building, not designing — stop and find the insight first.
- **Exit criterion**: a fresh player solves with a detectable aha (they can narrate the moment), plus the wrong-approach audit produces only teaching/near-miss failures.
- **Escape valve**: a level that survives two redesigns without the aha landing gets cut, not patched (§2.28's no-third-patch rule).

## 3.14 Puzzle fairness deep-dive

Beyond §1.12's general contract, puzzles have specific fairness obligations **[Rec]**:

- **Necessary information must be physically present.** The player can be asked to *combine* information; they cannot be asked to *bring* information the board doesn't contain. "You needed to try it to learn that" is only fair for cheap probes (§3.3 sandbox scaffold).
- **Rules must be uniform.** If `load_ferry` then `ride_ferry` orders matter, they matter identically in every level — engine-level consistency (the frozen vocabulary, Part 10) is fairness infrastructure.
- **Ambiguity tax goes to the game, not the player.** If a rule could be read two ways and the engine picks one, the UI should disambiguate *before* the player loses to the other reading — previews and tooltips exist for exactly this.
- **The designer owes a solution.** Every shipped puzzle must have at least one verified winning trace in the repo (Part 10). A puzzle the author can't solve is a guess, not a design; a puzzle whose only solutions were found by a solver and never by a human is a research artifact, not a level.


## 3.15 The deduction special case

Deduction puzzles — where the player infers hidden facts from evidence — deserve their own section because they invert normal puzzle structure: the *state space is epistemic* (what the player knows), not physical **[Conv]**:

- **Obra Dinn's lesson**: the puzzle is complete when the *information* is complete, not when moves are made. The player's real action is narrowing possibility space. Design implication: provide a place to *record* inference — the notebook, the manifest, the pinned relations — because deduction dies in working memory (§1.10).
- **Evidence must be enumerable.** The player must be able to verify they've found all the evidence, or trust that what they have suffices — TRS's authored conditions work because the condition set is *shown* ("exactly one ring in beats 4–5"), so the player knows the target without guessing at hidden requirements.
- **False-positive protection**: deduction interfaces must make hypotheses cheap to record and cheap to retract — a hypothesis that becomes a commitment is a deduction-killer.

TRS partially lives here: the player's real puzzle is often *reading the world state correctly* — which events can produce which conditions — before any intervention is placed. Levels that lean deductive should make their evidence layer immaculate (inspectors, event tables), because the puzzle IS the reading.

## 3.16 Self-reported difficulty instruments

Playtesters can't articulate difficulty well, but they can answer *shaped* questions **[Rec]**:

- "Where did you first feel stuck?" → localizes the wall (often pre-insight, often pre-tutorial).
- "What did you think would happen when you did X?" → exposes the model mismatch.
- "Was there a moment you almost quit?" → finds quit-worthy moments (§1.6).
- "Which level felt unfair, and what would have made it fair?" → surfaces trust leaks in the player's own vocabulary.
- "Which level would you describe to a friend?" → finds the landmark levels (§1.8) — the ones that carry the game's reputation.

Run these as written post-session questionnaires, not conversation — conversation lets you lead the witness.

## 3.17 Meta-puzzle and meta-structure

A meta-puzzle uses earlier levels' *results* as inputs — the last puzzle reads what you solved before **[Conv in puzzle-hunt design]**. For a portfolio, the useful versions:

- **Synthesis levels**: explicitly combine prior mechanics — the chapter capstone (§2.6). Cheap, reliable, satisfies "everything I learned matters."
- **Recurrence bosses**: a level that is structurally a remix — same board as an earlier level, different condition set (TRS re-uses scenes with altered EventCount windows; the player revisits a known world with new demands — a strong "wait, this again?" beat that turns familiarity into difficulty).
- **Portfolio-level echoes**: mechanics that rhyme across the three games — scheduling under deadline (RBM) and move-count optimization (PFT) share a *resource-budget* soul; observation (TRS) and preview (PFT) share a *predict-then-commit* soul. Design the rhyme deliberately and players will articulate your portfolio's thesis for you ("they're all games about thinking before acting").

## 3.18 Solver-side design verification

Where engines are deterministic and action spaces enumerable, use computation to check design properties **[Rec — this is what a DeterministicEngine makes possible]**:

- **Solvability**: at least one winning trace exists — CI-verified (golden traces, Part 10).
- **Reachability of failure states**: the designed wrong approaches produce their designed failure evidence — verified by scripted traces that walk the wrong path and assert the expected violation.
- **Uniqueness/multiplicity bounds**: bounded BFS/DFS over small levels can count solutions; for larger ones, sample-search with a depth cap finds whether degenerate shortcuts exist (a 5-move solution to a "complex" level is usually a degenerate find).
- **Hint-tier coverage**: for each tier, verify a synthetic "advised player" (one following the hint's directive) provably reaches further than a naive baseline — a hint that doesn't move the frontier is mis-tiered.

A solver that beats your puzzle *trivially* is telling you the puzzle is shallow; a solver that can't beat it at all (within generous compute) is telling you it may be unfair — both are findings. Human verification remains the arbiter: solvers find paths, humans judge insights.

### Applied checklist (§3.15–3.18)

- [ ] Deduction content has an inference-recording surface; evidence enumerable.
- [ ] Difficulty interviews run post-session in writing, on the shaped questions.
- [ ] At least one synthesis level per chapter; recurrence remixes used deliberately.
- [ ] CI verifies solvability + designed failure states; degenerate-solution sweep on suspicious levels.

## 3.19 Closing heuristics: the puzzle designer's ten rules

1. If you can't state the insight, there isn't one — and the level is a chore wearing a puzzle's clothes.
2. The naive approach should almost work; its failure is the teacher's salary.
3. Difficulty lives in 1–2 components per level; all six is a wall, none is filler.
4. Hints ladder relationships → tools → first-steps; never arrive at answers.
5. Wrong approaches are content: classify them, engineer their evidence.
6. Execution after insight costs <60s or becomes the stated test.
7. Dead regions must announce themselves with reasons.
8. Multiplicity is verified, not claimed; uniqueness is branded, not assumed.
9. The author's own solve proves nothing about the player's — fresh eyes or it isn't tested.
10. A puzzle is a promise: "thinking will work here." Every design decision either keeps or spends that trust.


## 3.20 Elegance: small vocabulary, deep space

The strongest shared aesthetic in the genre: **elegance = maximal consequence space over minimal vocabulary** **[Conv as aspiration; formulation ours]**. Baba Is You has ~dozen word types; The Witness has one verb (draw a line); Cosmic Express has one verb (lay track). In each, the vocabulary fits on a card and the possibility space is uncountable in practice.

Design implications:

- **Vocabulary growth is debt.** Every new verb/multiplied mechanic must pay for itself in *distinct puzzles enabled*, not just variety for its own sake. When proposing mechanic N+1, list the puzzles it enables that mechanic N can't reach — if the list is empty, cut it.
- **Depth audit**: for each existing verb, can you name three non-obvious interactions? A verb that interacts with nothing is decoration; a verb that interacts with everything is probably overloaded (one verb doing three jobs confuses the teaching arc — split it or accept the confusion deliberately).
- **The portfolio test**: TRS/RBM/PFT each has ~10–15 verbs/mechanics — small enough to enumerate, large enough to combine. The engines' enumerable action vocabularies are not just a verification convenience; they're an elegance metric you can literally count.

## 3.21 Accessibility of thought: different solvers

Players differ in problem-solving style, not just skill **[Contested typologies; practical observation]**. Styles seen in playtests:

- **Systematic**: enumerates possibilities in order; wants structure. Serve: clear state displays, deterministic sims, enumerable option lists.
- **Exploratory**: tries things to see what happens; wants cheap probes. Serve: free undo, preview, fast iteration.
- **Intuitive**: pattern-matches to insight quickly; wants minimal scaffolding. Serve: skip-able tutorials, optional text, no forced waits.
- **Collaborative**: thinks aloud, wants a second brain (the social solver, §2.22). Serve: spectator-legible state, discussion-friendly pacing.

Levels tuned only for one style exclude the rest. The cheap broad-coverage defaults: free undo + previews (exploratory), structured inspectors (systematic), optional-brevity text (intuitive), legible plan-state (collaborative). None of these costs the systematic player anything, which is why they're defaults rather than modes.

## 3.22 The anatomy of one solve, observed

Instrumented playtests reveal a characteristic solve anatomy for a healthy authored puzzle **[Rec — composite observation]**:

```
READ (5–30s) → HYPOTHESIZE → TEST → FAIL ×(1–5) → REFRAME → VERIFY → EXECUTE → DONE
```

Diagnostics by phase:

- **READ too long** (>60s): legibility problem — fix staging/density, not difficulty.
- **HYPOTHESIZE absent**: player starts testing with no plan — either the board doesn't afford planning (hidden structure) or the player doesn't trust plans (learned helplessness from unfair games). Fix info legibility; verify fairness history.
- **FAIL count 0**: trivially easy — fine for tutorials, finding for main-path.
- **FAIL count >6 without REFRAME**: the player is iterating within a dead model — the level's wrong-approaches aren't teaching (§3.5). The evidence isn't landing.
- **REFRAME absent**: insight never fired — check hint-ladder usage; if T3 required, the insight is under-supported.
- **EXECUTE > 90s**: chore tail — cut execution (§2.6).

Publish the anatomy diagram to the team: everyone should be able to classify where a stuck player is in it within 30 seconds of observation.

## 3.23 Cross-game puzzle grammar: the portfolio as curriculum

The three games teach complementary cognitive skills, and the portfolio is stronger for naming the curriculum **[Rec]**:

| Skill | TRS teaches | RBM teaches | PFT teaches |
|---|---|---|---|
| Temporal reasoning | Events resolve in beat order | Phases resolve in fixed order | Move order composes results |
| Causal reading | Trace events to interventions | Trace violations to phases | Trace costs to move choices |
| Resource budgeting | Bounded intervention slots | Loan due-beats vs. midnight | Ferry capacity + par moves |
| Reversibility management | Runs are atomic; planning is free | Loans must return | Undo is free, some states strand |
| Model-vs-world | Prediction vs. observation | Plan vs. settle | Intention vs. accounting |

A player who finishes the portfolio has practiced one deep skill — *thinking before acting* — in three dialects. That coherence is a portfolio asset: it lets the pitch say "three games, one discipline" (Part 12's positioning) and it lets level designs *share* pedagogical structures (the teach-test-stretch pattern, the 3-tier hint ladder, the diagnosis-first verdict) so engineering investments amortize across the portfolio rather than triplicating.

### Applied checklist (§3.19–3.23)

- [ ] Every verb has ≥3 named interactions or is flagged for merge/cut.
- [ ] The four solver styles each have a served affordance.
- [ ] Stuck-player phase diagnosis uses the solve-anatomy table.
- [ ] Portfolio-level curriculum documented; shared pedagogy structures reused across games.


## 3.24 Family deep dive: state-manipulation puzzles

State-manipulation puzzles — change values/states to satisfy conditions — share a skeleton: a set of entities, a set of state-changing levers, and target conditions **[Rec]**.

- **The levers must compose.** A switch that only flips itself is a chore; a lever that affects *several* states at once (a redirect junction swapping every matching actor's route — TRS's core trick) creates the interactions that make the family hard.
- **Condition authoring is the design surface.** In TRS the conditions (EventCount windows, EntityStateAtEnd targets) ARE the puzzle's content — the world is static until you demand events of it. Author conditions at three hardness bands: existence (something happens), window (in beats 4–5), exact (exactly once). Escalate through bands across the chapter, not within a level.
- **Hidden-state budget**: how much state is invisible-but-inferable (a mechanism armed but not yet struck). Some hidden state is necessary for deduction texture; too much converts reasoning into guessing. Rule of thumb: ≤2 simultaneously-hidden decisive states for main-path levels.

## 3.25 Family deep dive: scheduling puzzles

Scheduling puzzles — allocate limited resources against time — have a canonical difficulty source: **slack** **[Conv]**.

- **Slack = (available capacity) − (required demand) at the binding constraint.** RBM's binding constraint is manifest capacity × beats-till-midnight; PFT's is ferry capacity × route length. Tune slack on the binding constraint only — slack elsewhere is noise.
- **Overlapping windows create the interesting region.** When two loans' due-beats overlap, or two parcels want the same ferry trip, the schedule must *interleave* — interleaving is where scheduling puzzles get their depth. Design at least one forced overlap into every mid-game scheduling level; a level where tasks never contend is logistics-flavored busywork.
- **The deadline is the antagonist.** Midnight (RBM's horizon) is the perfect scheduling antagonist: absolute, legible, and in-fiction. Any scheduling puzzle benefits from a named horizon — undated pressure reads as arbitrary.
- **Pre-positioning is the mastery marker**: novices react (schedule when needed); experts pre-position (stage the token two beats early). Levels should visibly reward pre-positioning — the player who thinks ahead should see their plan survive the tight window, not scrape it.

## 3.26 Family deep dive: spatial/logistics puzzles

- **The map is the puzzle.** In PFT the graph IS the problem — bottlenecks, articulation points, leaf islands. Author the graph first, parcels second; a rich graph makes modest parcels interesting, a boring graph makes many parcels a commute.
- **Capacity creates subproblems.** Ferry capacity 2 with 5 parcels forces batching — the puzzle becomes trip-planning, a different problem than delivery. Vary capacities across levels to rotate the subproblem (capacity 0 foot-ferry → postal link becomes load-bearing, as in the PFT ch2 pattern).
- **Distance is a resource.** Every edge crossed is a move spent; par pressure turns geography into budget. Boards that make distance trivial (everything adjacent) lose the optimization layer entirely — keep at least one deliberately-far destination per mid-game level.
- **Deployables = player-authored graph edits.** PFT's pieces let the player change the map itself — the most satisfying spatial verb because the player literally builds their solution's geometry. Treat deployable placement as a first-class puzzle surface: sockets, heights, and connection rules are authored constraints (mountedOn gating, stair-rejects-equal-heights — the real engine traps worth a level apiece).

## 3.27 The puzzle editor workflow (human side)

Process discipline for a small team authoring ~40+ levels per game **[Rec]**:

- **Two-hat rule**: the level's *designer* (insight, critical path) and *builder* (data, geometry) can be the same person but never the same pass — design on paper first, build second. Merged passes produce levels that are "built what I could build" rather than "built what should exist."
- **Level sprints in blocks of 3** (Part 10 elaborates): one teaching + one elaboration + one challenge per mechanic family — the block is the smallest unit that produces a usable arc.
- **The 48-hour rule**: a level that can't be grey-boxed and self-solved within 48 hours of authoring effort has a scope problem — split or simplify. Big levels are almost always two levels wearing a trench coat.
- **Review triage**: not every level gets equal review — teaching levels and capstones get full protocol (§2.28); mid-pack elaboration levels get solo-solve + signifier audit. Concentrating review on load-bearing levels is the only affordable policy.


## 3.28 Decision quality and the "interesting decision" test

Sid Meier's formulation — "a good game is a series of interesting decisions" — is the most-cited and least-operationalized rule in design. For puzzle design, an interesting decision has three measurable properties **[Conv for the slogan; operationalization ours]**:

- **Both options are defensible**: if one option is strictly better, it's not a decision, it's arithmetic. PFT's "hand over the ferry mid-route vs. send the second courier around" is interesting precisely because both work under different constraints.
- **Consequences are legible but not trivial**: the player can predict outcomes but must think — TRS's "place the toy here vs. rely on the skid" is legible (both produce a ring) but differs in timing and side-effects (parked-toy re-rings).
- **The decision compounds**: early choices constrain later ones — RBM's "which token first" echoes through every later beat. Decisions that don't compound are isolated trivia.

Audit every designed decision point against the three properties; a level whose decision points are all arithmetic is a level whose difficulty lives in the wrong place (§3.11 — it should be insight or search depth, not option-elimination).

## 3.29 Part 3 model card

| Design object | Instrument | Verified by |
|---|---|---|
| Key insight | Named in beat sheet | Fresh-player aha narration |
| Critical path | Required state sequence | Golden trace in CI |
| Bottleneck | Structural forcing of the insight | Naive approach fails informatively |
| Hint ladder | T1/T2/T3 strings | Tier isolation + minimum-tier metric |
| Wrong approaches | Failure taxonomy | Scripted failure traces |
| Difficulty profile | 6-component vector | Playtest metrics vs. bands |
| Solution policy | unique/hybrid/open | Multi-trace verification when claimed |
| UX scaffolding | undo, preview, commit boundary | Reset-cost audit |


## 3.30 Worked example: a complete TRS level

An end-to-end level design for the sealed-observation causality puzzle, applying every part of this chapter **[Rec]**:

**Setup**: a room with one actor (a cat, Agent A), a path from entry E to exit X, one interactive object (a bell toy T parked mid-path), one RedirectJunction R, one skid-mark obstacle S between the junction and exit. Win condition: `EventCount(BellRing) >= 2`.

**The naive approach**: place R to route A directly past the toy T (bumping it rings the bell once), then to X. Result: `BellRing = 1` — fail. The player sees the bell ring, sees the counter at 1, sees the cat exit.

**The insight**: parked toys re-ring every beat ≥4 while the cat is elsewhere — so the cat must ring once and *stay on the board* for 3 more beats. Route A through a loop: bump T once, circle back via R, bump T again or wait out the re-ring timer.

**Critical path**: `[E → R(loop) → bump T (ring 1) → loop → arrive near T at beat ≥4 (ring 2) → X]`. Bottleneck: the second ring requires either a second bump or the parked re-ring — two legitimate solutions (the authored one and the discovered one), a hybrid-uniqueness level.

**Scaffolding**: T's re-ring rule was taught two levels ago ("toys remember being rung"); the level's signifiers are the timer UI on T (a visible countdown after first ring) and the loop geometry suggesting a return path.

**Hint ladder**:
- T1: "Look at the toy after it's been rung once." (relationship)
- T2: "Parked toys re-ring at beat 4." (tool)
- T3: "Route the cat through a loop, not to the exit." (first-step)

**Difficulty vector**: depth 3, branching 2.1, insight-distance 3, memory 2, precision 2, familiarity 4.

**Playtest prediction**: players who didn't internalize the re-ring rule will exhaust direct-route attempts; the T1 hint catches them. Players who know the rule solve in ~2min.

## 3.31 Worked example: a complete RBM level

The heist equivalent **[Rec]**:

**Setup**: manor with 2 rooms (Hall, Study), 2 loans (Vase HEAVY at Study, Candle BRIGHT at Hall), 2 guards (G1 patrols Hall→Study, G2 static at Hall), due beats 14/18, settle at 20. Win: all loans returned + no guard at a room containing a placed token at settle.

**The naive approach**: borrow both early, place both, return both near due. Fails: the HEAVY Vase slows the carrier below the patrol's cadence — placing it at Study is safe only during the patrol's Study-away phase, which closes before the carrier arrives if both loans are carried serially.

**The insight**: carry the HEAVY first (its window opens early), place it during G1's away-phase, then do the fast Candle run while the guard's attention is committed to the Study corridor.

**Critical path**: `[loan Vase → carry (slow) → place Study during patrol-away → loan Candle → place Hall → return both]`; the bottleneck is the patrol-phase-aligned placement.

**Hint ladder**:
- T1: "The heavy token changes when you can arrive." (relationship)
- T2: "Heavy first; the patrol won't wait." (tool)
- T3: "Loan the Vase at beat 0; it's in place by beat 6." (first-step)

**Difficulty vector**: depth 4, branching 2.8, insight-distance 3, memory 3, precision 3, familiarity 4.

## 3.32 Worked example: a complete PFT level

The logistics equivalent **[Rec]**:

**Setup**: 3 islands (A→B→C linear, ferry A↔B and B↔C), 2 parcels on A (one for B, one for C), one courier, pack station on A only, parcelCapacity 2, foot-ferry capacity 0 (parcels can't ride free). Win: both delivered; par 9.

**The naive approach**: pickup P1 → ferry → deliver at B → ferry back → pickup P2 → ferry → deliver at C → ferry back. Counts 11 moves — over par by 2.

**The insight**: pack P1 before loading (pack is free at A's station, saves a move on the far side) and batch: carry both parcels in one ferry ride — the capacity allows 2, the naive approach rides twice.

**Critical path**: `[pickup P1 → pack P1 → pickup P2 → load both → ride → unload at B → deliver P1 → ride onward → deliver P2]` = 9 moves.

**Hint ladder**:
- T1: "The ferry can carry more than one." (relationship)
- T2: "Batch the parcels; pack is free here." (tool)
- T3: "Pickup both before the first ride." (first-step)

**Difficulty vector**: depth 2, branching 1.8, insight-distance 2, memory 2, precision 1, familiarity 3.

## 3.33 The three levels compared

Same design machinery, different families **[Rec]**:

| | TRS | RBM | PFT |
|---|---|---|---|
| Difficulty lives in | Causal-graph structure | Temporal windows | Topological layout |
| Insight type | Reframe (wait = action) | Sequencing (order matters) | Batching (capacity as resource) |
| Bottleneck | Event timing | Patrol-phase alignment | Ferry ride count |
| Teaching | Re-ring rule from earlier chapter | Tag effects from earlier chapter | Capacity from level 1 |
| Failure evidence | Counter stops at 1 | Guard catches at beat N | Over-par count |

The level-design *process* is identical (setup → naive → insight → path → scaffold → hints → verify); the *content* differs by family. That's the whole argument of this chapter.

## 3.34 Applied checklist (supplement)

- [ ] Every level has a written naive-approach and the insight it fails without.
- [ ] Difficulty vector filled per level; components explain the chapter ordering.
- [ ] Hint ladders authored per level at design time.
- [ ] Verification: golden trace + scripted failures exist for every level.


# PART 4 — SYSTEMS DESIGN & MECHANICS

Systems design is the layer beneath content: the rules that decide what *can* happen, in what order, with what consequences. Content (Part 2–3) is made of systems; a flawed system produces flawed content at industrial scale. This part is written at the level of a small deterministic engine — which is what all three portfolio games run on.

## 4.1 Verbs and nouns: the vocabulary inventory

The vocabulary-inventory method **[Conv]**: a game is describable as a small set of **verbs** (things the player or world does) acting on **nouns** (entities with state). Write the inventory before writing any content — it is the system's public contract.

Example — PFT's real vocabulary (verbs): `travel, pickup, drop, load_ferry, unload_ferry, ride_ferry, pack, deploy, deliver, send, hand_over_ferry, wait`. Nouns: courier, parcel, island/site, edge (natural/deployed/ferry), socket, piece, mailbox, destination. Note two properties: (a) the list is *finite and enumerable* — every legal action can be enumerated by `getLegalActions`; (b) verbs and nouns are separable — `deploy` applies to sockets, `pickup` to parcels, `ride_ferry` to ferries; the matrix of (verb × noun) *is* the system's legality surface.

Three audit questions for any inventory:

1. **Coverage**: can the player reach every authored puzzle state with these verbs? (Solvability.) If a required state has no legal verb path, the vocabulary is incomplete — or the state is impossible and the level is broken.
2. **Purpose**: does every verb have ≥1 level where it's *necessary*? A verb that never matters is either a trap for playtesters (they'll try it and learn nothing) or missing content — decide which.
3. **Arity**: how many targets does each verb take? `pickup` (parcel) is unary; `deploy` (piece → socket) is binary. High-arity verbs multiply UI and mental cost — `hand_over_ferry` (courier → ferry → courier) is three-arity, which is why it needs explicit teaching.

## 4.2 Verb economy: few verbs, many combinations

The elegance principle restated mechanically (§3.20): **value = (combinations enabled) / (verbs required)** **[Rec]**. Every new verb must multiply the space, not add to it linearly.

- **Multiplicative evidence**: `deploy` doesn't just "place a piece" — it edits the graph (creates edges), which combines with every routing puzzle. That is multiplicative: one verb × the whole spatial space.
- **Additive evidence**: a `sprint` verb that just moves faster adds a dimension to nothing — one verb, one use, linear. Cut or fold into another verb.
- **Orthogonality**: verbs should differ along independent axes. `load_ferry` (bandwidth) and `ride_ferry` (location) are orthogonal — they share the ferry noun but different concerns. `pickup` and `pack` overlapping on "carry" would be non-orthogonal — in fact PFT's pack/deploy/deliver split is a worked example of orthogonality done right: pack = prepare for transport, deploy = install as infrastructure, deliver = complete the order; three phases of one lifecycle, three different verbs because the states have different legal contexts.

A verb-economy smell: **synonym verbs** (two verbs differing only cosmetically) and **collapsed verbs** (one verb secretly doing three context-dependent jobs — the "interact" button that means different things on different nouns is the standard smell). Synonyms confuse the player; collapsed verbs confuse the teaching arc AND hide state ("why did interact do X here?"). Prefer explicit verbs over smart ones in puzzle games — context-sensitivity is a convenience for action games and a fairness hazard for puzzles.

## 4.3 Emergence vs. scripted depth

### The emergence tiers

Not all emergence is equal. Classify system outputs **[Rec]**:

- **Tier 0 — scripted**: the designer authored the event directly (cutscenes, fixed sequences). Necessary for framing; worthless for puzzle depth.
- **Tier 1 — combinatorial**: outputs arising from rule interaction that the designer *anticipated* (toy re-rings parked at bell — known and designed for). The normal working zone.
- **Tier 2 — idiomatic**: outputs the rules support but the designer didn't name — player-discovered techniques (the "sacrificial skid": an actor with no cargo skidding harmlessly to serve as a bell-substitute). Idioms are where community and word-of-mouth come from (§1.7).
- **Tier 3 — degenerative**: rule-interactions that break intent (degenerate shortcuts, infinite loops, exploits). Emergence to *detect and prune*, not celebrate.

Designing for Tier 2 without inviting Tier 3 is the craft:

- **Keep rules simple and compositional** — idioms emerge from simple consistent rules (parked toy keeps re-ringing because "toy rings every beat after arming" is simple), not from exception-laden ones.
- **Bound the interaction surface** — combinatorial explosion control (§4.4) is what lets Tier 2 exist without Tier 3 swamping it.
- **Verify known idioms in tests** — when a playtester finds a legitimate idiom, write a golden trace for it; idioms are features once they're tested.

### Scripted vs. emergent as content strategy

For a small team: **author the constraints, emerge the solutions.** Scripted solutions are the most expensive content that exists (author writes every path); emergent solutions are content the players write for free. The portfolio's engines do this correctly by construction: they define legal actions and evaluation conditions; solutions are whatever legal action-sequences satisfy the conditions — authored constraints, emergent solutions.

## 4.4 Combinatorial explosion control

Every mechanic that can interact with every other mechanic scales as O(verbs × nouns × contexts). Unmanaged, this produces untestable state spaces and unpredictable teaching loads. Control mechanisms **[Conv]**:

- **Interaction matrices**: literally tabulate (verb × noun → effect). Sparse cells = orthogonality (good); dense cells = interaction richness (costly). Review the matrix for *surprising* filled cells — an unexpected (deploy × mailbox) interaction found in playtest is a design gap the matrix should have caught. For PFT: (ride_ferry × second courier) is famously a trap cell — the ferry ends at the far dock with ONE rider; the second courier needs a different exit. That's a filled cell the matrix reveals as an authored-level constraint (author a non-ferry exit for courier #2).
- **Veto rules**: explicit non-interactions — "toys are not actors" (the TRS double-move bug is what happens when a veto rule is violated: if toy ∈ actors, it moves 1 waypoint/beat AND strikes — two behaviors fused by a type error). Veto rules are cheap in design, expensive when missed in implementation. Write them down: "parcels cannot ride ferries' rider slot," "props can't trigger plates they don't rest on" — whatever your system's actual non-interactions are.
- **Context gating**: interactions that only exist in certain states (plates only matter during settle; `hand_over_ferry` only while aboard). Gates shrink the effective interaction space per beat — the phase ordering in RBM is context gating applied to time.
- **Arity limits**: cap how many entities one action touches (a redirect affects a whole route — that's high-arity, and it's why TRS levels budget their route vocabulary carefully).

### Explosion in the real engines

- TRS: interactions live in beat-space — (actor × waypoint × beat). Explosion control = small actor counts + authored routes + bounded intervention slots.
- RBM: interactions live in (token × phase × cell). Explosion control = manifest caps, ≤4 simultaneous guards, sensory-tag vocabulary small and fixed (HEAVY/BRIGHT/NOISY).
- PFT: interactions live in (entity × graph-position × move). Explosion control = small islands, ≤12 parcels, deploy sockets enumerated.

## 4.5 Resolution order determinism

Determinism is a *design* property before an engineering one **[Conv for this genre]**. The requirements:

- **Total ordering**: every concurrent event must resolve in a fixed, documented order. RBM's beat phases (loans → crew → guards → returns → settle/evaluate) exist precisely because "what happens first at a beat" must be defined. Undeclared orderings are fairness landmines (§3.14) — a plate that re-presses from a settled drop registering NEXT beat is only fair if the settle order is documented.
- **Tie-breaking rules**: when two actions compete (two couriers at one socket; two events at one beat), the tie-break must be (a) deterministic, (b) documented or visually evident, (c) never secretly random. Where tie-breaks are genuinely arbitrary, expose the order in the UI (entity processing order displayed) or restructure so ties can't be decisive.
- **Canonical serialization**: state hashes to a canonical form (`canonicalHash`) so replays and saves verify bit-exact — determinism is only as good as its ability to be *checked*, and hashing is the check. The DeterministicEngine contract (createInitialState/getLegalActions/validateAction/applyAction/canonicalHash/serialize/restore) is the minimal surface for verifiable determinism: given state + action, applyAction is pure; given state, canonicalHash is stable.
- **No wall-clock dependence**: simulation must not read real time; beats tick deterministically. (Presentation may animate; simulation may not sample it.)

### Player-facing determinism

Determinism also means *predictability to the player*: the same plan + same level = same outcome, reproducibly. That's the contract making observation puzzles possible at all (§1.18). Where the engine's actual order differs from the *legible* order (guards scan at their PREVIOUS post — a real engine trap where the scan position lags the patrol step by one beat), the divergence must be documented to *designers* (it's a content constraint: author patrols one beat early) even if invisible to players.

## 4.6 Simulation vs. presentation separation

The single highest-leverage architectural rule for this genre **[Conv]**: **the simulation runs without the renderer.**

- **Why**: (a) verification — golden traces and CI tests need sim-only execution, no pixels; (b) determinism — rendering can't perturb the sim if it can't reach it; (c) tooling — analysis like `analyzeOrderStatuses` and timeline scrubbing are pure-state operations; (d) honesty — if the sim can't see it, the player can't trust it (§1.12), so keeping the sim self-contained forces every rule into inspectable state.
- **The direction rule**: presentation reads sim state; sim never reads presentation. Animations sample state; they don't drive it. Violations produce the classic divergence bug — the screen shows the bell rang at beat 3 while the sim believes beat 4 — which is indistinguishable from engine unfairness to a player.
- **State completeness**: the sim state must contain *everything* the outcome depends on. A common leak: presented details the sim ignores (`restingOn` authored as a prop attribute — a real trap where "plate pressed by co-located prop" was false: restingOn was positional-agnostic, counting toward its authored plate wherever it stood). The audit question: is any game-relevant fact stored only in presentation? If yes, it's a sim-state gap.

## 4.7 Resource loops

Economic thinking applies even without currencies **[Conv — Machinations framework generalized]**. Model resources as nodes and flows:

- **Sources**: where spendable things enter (loanable tokens; intervention slots; ferries' trips).
- **Sinks**: where they exit (tokens returned; slots consumed; beats elapsed).
- **Pools**: where they're held (the manifest; placed interventions; aboard-the-ferry).
- **Converters**: transformations (a loan becomes a staged token becomes a returned token — three states, two conversions; a packed parcel becomes cargo becomes delivered).
- **Closed loops**: resources that must return to origin — RBM's loans are a literal closed loop: tokens leave home and *must* come home, and the whole game is the tension of the loop. Closed loops are stakes made mechanical (§1.6).

Audit resource loops for: leaks (resources that vanish untracked — a destroyed parcel with no verdict), unexplained generation (resources appearing from nowhere — a free token), and blocking (a converter that can jam — a ferry that can't unload because the destination is full). Every blocked converter is a potential dead state (§3.2) needing either a designed recovery path (redeploy recovers pack-early stranding) or a declared irreversibility (deliver-early is undo-only — the difference between recoverable and terminal states is itself a teaching atom).

## 4.8 Balancing heuristics

Balancing for puzzle systems = tuning constraints so solutions exist and are interesting, not tuning numbers so play is fair **[Rec]**:

- **The slack rule**: leave slack ≥1 on every constraint that isn't the designed pinch — tight everywhere is a brick. (Inverse of §3.25: pinch exactly one constraint per level.)
- **The degenerate-parity rule**: if a cheap strategy matches an intended strategy's outcome, the cheap one will dominate — balance is making intended play *necessary*, not just possible. Degenerate-solution sweeps (§3.6) are the enforcement mechanism.
- **The granularity rule**: tune in the smallest units the player perceives — beats, moves, parcel counts. Fractional perception (a 0.5-move advantage) is invisible; never tune below perceived granularity.
- **The floor-and-ceiling rule**: the floor (worst acceptable player experience) is completion without help; the ceiling (best realistic) is optimal/par play. Verify both ends are reachable in tests: a level where optimal play still misses par is a mislabeled anchor (§1.14).
- **Cost curves**: where numbers do exist (par vs. level), the curve should be smooth and slightly concave — late-game pars shouldn't scale linearly with early ones or the difficulty asymptote punishes experts disproportionately.

## 4.9 Rules legibility: simulating in the head

The player must be able to run a small mental version of the sim **[Conv]**. Requirements:

- **Rule count ≤ ~7 core rules**: more than that and players stop simulating and start guessing. Additional rules must layer as *atoms* (learned incrementally, §2.7) so the working set stays small.
- **Observable mechanics**: every rule must have at least one visible manifestation — a rule whose only evidence is a verdict is a rule that reads as arbitrary.
- **Predictable interactions**: when two rules meet, the outcome should be the one the player would guess — or an authored surprise that teaches (§1.7's informative divergence). Surprising-for-no-reason outcomes are trust leaks.
- **Legibility test**: ask a player to predict the outcome of a proposed plan *before* running it. Where their prediction and the sim disagree *and the player can articulate why they predicted otherwise*, you've found either a legibility gap (their model is reasonable and wrong — fix presentation) or a designed lesson (their model is naive — keep it and make the divergence informative).

## 4.10 Mechanic lifecycle and vocabulary freezes

Mechanics age through stages: proposal → prototype → teach → freeze → vocabulary **[Rec]**:

- **Proposal**: a mechanic enters as a hypothesis — what puzzles does it enable (§4.2's multiplicative test)?
- **Prototype**: grey-boxed against the engine contract; interaction-matrix cells filled in; veto rules written.
- **Teach**: its curriculum arc exists (§2.8) before any level depends on it.
- **Freeze**: its behavior is locked — post-freeze, content authors may *use* but not *extend* it (the "engine-frozen authoring" rule, Part 10; the real-world reason: the TRS/RBM/PFT engines freeze their vocabularies so level authors can build against a stable contract — dispatch-stale field names are exactly the failure a freeze prevents).
- **Vocabulary**: after freeze it joins the noun/verb inventory and the signifier table (§2.3); renaming/retuning post-freeze invalidates authored levels and golden traces — the cost is why freezes exist.

### Applied checklist (Part 4)

- [ ] Verb/noun inventory written, finite, enumerable; every verb necessary in ≥1 level.
- [ ] New verbs pass the multiplicative test; synonym/collapsed verbs rejected.
- [ ] Interaction matrix tabulated; veto rules explicit; context gates used to shrink per-beat space.
- [ ] Total ordering + documented tie-breaks + canonical hashes; no wall-clock in sim.
- [ ] Sim/presentation separation enforced; nothing game-relevant lives only in presentation.
- [ ] Resource loops audited for leaks, unexplained generation, blocking converters.
- [ ] Rules ≤~7 core; every rule observable; prediction-divergence test in playtests.
- [ ] Mechanic lifecycle stages respected; freezes real.


## 4.11 Mechanic interaction design: the three interaction types

When two mechanics meet in one state, their interaction takes one of three shapes **[Rec — taxonomy]**, and each shape has different design value:

- **Additive interaction**: mechanics coexist without affecting each other's logic — a skid hazard and a bell both on the board, functioning independently. Cheap and safe; produces variety but not depth. The danger is a game built entirely of additive interactions, which feels like a collection of gadgets rather than a system.
- **Modifying interaction**: one mechanic changes the other's meaning — the redirect junction doesn't just coexist with actors' routes, it *replaces* them wholesale. Modifiers are the depth engine: the toy that substitutes for a skid turns "ring production" from a single-source mechanic into a choice. When evaluating a proposed mechanic, ask what it *modifies*; mechanics that modify nothing are usually additive filler.
- **Emergent interaction**: the pair produces behavior neither has alone — HEAVY token + plate + settle ordering produces "a staged prop keeps its plate pressed across beats," an interaction none of the three has individually. Emergent interactions are where idioms live (§4.3 Tier 2). They're also where bugs live — the distinguishing mark being whether the interaction is *stable and teachable* or *fragile and arbitrary*.

Design rule: for every pair of mechanics that will ever share a level, classify their interaction deliberately. Undesigned pairs produce surprises you didn't choose; the matrix (§4.4) is where you catch them.

## 4.12 The system's "feel contract": predictability at different scales

Players hold three nested models of the system, and legibility must work at each **[Rec]**:

- **Local model**: what this action does right now ("pickup attaches the parcel"). Local legibility = previews and immediate visible feedback. Failures here produce "I didn't know it would do THAT."
- **Regional model**: how this mechanic behaves across contexts ("ferries carry N parcels plus one rider, always"). Regional legibility = consistency — the rule must be identical in level 3 and level 30 or the model can't consolidate.
- **Global model**: the game's epistemology ("this game is deterministic and inspectable; surprise means I missed something"). Global legibility = the sim-presentation contract (§4.6) and verdict honesty (§9.5). Players with a strong global model interpret failure as information; without it, failure reads as noise.

Audit level: playtest questions target each scale — "what does X do" (local), "is that always true" (regional), "why do you think that happened" (global).

## 4.13 System complexity budgets

Systems have a carrying capacity for complexity — exceed it and players stop forming models (§4.9). Budget components **[Rec]**:

- **Rule count**: core rules ≤7 (§4.9); total documented rules ≤ ~20 across the game, of which any single level exercises ≤7.
- **Exception count**: exceptions are rules with conditions ("except when X"). Every exception doubles the teaching cost of its rule. Budget: ≤1 exception per core rule, and exceptions must be *load-bearing in levels* — an exception no level uses is a rule you made players learn for nothing.
- **Vocabulary size**: verbs ≤15, noun types ≤20, sensory/status tags ≤6 per entity class. These are display limits more than engine limits — the inventory must fit in a player's head, and §1.10's chunk budget is the binding constraint.
- **Per-level complexity**: entities on a board (§2.24 table) × verbs-in-play ≤ a complexity score you calibrate per chapter; a level exceeding its chapter's budget gets split.

When a proposed mechanic would exceed budgets: cut a different mechanic first (mechanic-turnover discipline), fold it into an existing verb (can `send` subsume `hand_over_ferry`? — no, actually: they differ in rider-semantics, which is why both exist — the test is whether the fold preserves legality distinctions), or reject the proposal.

## 4.14 Feedback vocabulary: states, events, and verdicts

The system's output vocabulary — what it can tell the player — deserves the same rigor as the input vocabulary **[Rec]**:

- **States** are persistent and inspectable (parcel packed, token staged, plate pressed). Every state the player can act on must be *queryable* — an inspector, a highlight, a manifest row. Hidden states that matter are the classic "how was I supposed to know" generator.
- **Events** are transient and logged (BellRing, skid, loan-due). Events need a timeline/log surface — the beat timeline is the event display; a game whose events leave no trace forces players to memorize history, which is working-memory tax (§1.10).
- **Verdicts** are terminal judgments (pass/fail per condition). Verdicts need diagnosis — which condition, which entity, which beat (§9.5). A verdict without a pointer is an insult.

Rule: every state type, event type, and verdict type has exactly one designed display form (the signifier table applied to system output, §2.3). States get inspectors, events get the timeline, verdicts get the violation report — consistent across all levels.

## 4.15 Difficulty of the system vs. difficulty of the content

A subtle distinction that determines where design effort goes: **system difficulty** (how hard the rules are to learn) vs. **content difficulty** (how hard the levels are given the rules) **[Rec]**.

- High system difficulty is almost always bad for a puzzle game — players who can't form the model can't enjoy the content built on it. Baba Is You has famously *low* system difficulty (push things; words make rules) and extremely high content difficulty.
- The portfolio sits the same way: TRS's rules fit on a card (things move on beats; interventions exist; conditions must hold); RBM's on a card plus a phase table; PFT's on a card plus a capacity rule. If a level needs a *new rule* rather than a new *arrangement*, that is system difficulty creeping — the mechanic-lifecycle review (§4.10) is the gate.
- Measure the two separately in playtests: system difficulty shows up as wrong mental models (players predict wrong with confidence); content difficulty shows up as correct models, wrong plans (players predict correctly that their plan will fail — and can say why). Different fixes: teach the rules vs. tune the level.

## 4.16 Anti-features: what to keep OUT of the system

Listing what a puzzle system must not contain is as load-bearing as what it must **[Rec]**:

- **No hidden randomness** in anything outcome-relevant (§1.4's inspectable-simulation rule). Cosmetic randomness (particle spread, ambient variation) is fine and flagged as such.
- **No irreversible actions without legible marking**: every irreversible verb must look irreversible at proposal time — a `deliver` action should carry stronger commitment-signaling than a `pack`. The commitment-boundary legibility rule (§3.9) at the verb level.
- **No global timers** in a planning game — any always-ticking clock converts contemplation into twitch and contradicts the genre (§1.2 contemplative absorption). Per-level horizons (midnight) are fine because they're *named stakes*, not anxiety loops.
- **No resource that exists only to be managed**: if a resource's only function is tracking and spending (energy, currencies), it adds bookkeeping without decisions — cut it unless it creates real scheduling problems (RBM loans are the counter-example: they're bookkeeping that IS the game).
- **No teleology the player can't see**: the sim should never "know" things the player can't inspect — adaptive difficulty that's hidden reads as rubber-banding (§1.15's honesty rule).

## 4.17 The system spec as a document

The mechanics layer needs its own written spec, distinct from level docs **[Rec]** — the *System Card*:

1. Verbs: names, arities, legal contexts, reversibility.
2. Nouns: types, state fields, which fields are player-visible.
3. Rules: core rules ≤7, exceptions ≤1 each, each rule's observable manifestation.
4. Ordering: the resolution order (beat phases, tie-breaks), written once, referenced by every level.
5. States/events/verdicts: the output vocabulary and its display forms.
6. Veto list: explicit non-interactions.
7. Freeze status: what is locked, what's still mutable, who may unfreeze.

The System Card is the document level-authors may not violate — when a level "needs" something outside the card, either the card was incomplete (amend it properly, re-verify levels) or the level is out of scope (redesign). The card is small enough to memorize; that is the point.

## 4.18 Worked example: the three engines as one system-design exercise

TRS, RBM, and PFT are three different *content* games on what is recognizably **one system-design discipline** — which is the whole point of the DeterministicEngine contract. The shared skeleton:

| Discipline | TRS | RBM | PFT |
|---|---|---|---|
| Verb vocabulary | interventions (place/set/redirect) | loans, staging, guard manipulation | the 12-action set |
| Ordering | beat ticks, actor order | beat phases | move sequence |
| Resource loops | intervention slots | loan tokens (closed) | parcels + ferry capacity |
| States | entity positions, armed flags, rung events | token statuses, plate states, ray states | packed/deployed/delivered/carried |
| Verdicts | condition set (EventCount, EntityStateAtEnd) | all-returned + no-trips + outcomes | all delivered + par accounting |
| Legibility risk | beat-order divergences | phase-order divergences | stranded-state invisibility |
| Reversibility | runs atomic, planning free | manifest editable, beats committed | undo free, deliveries terminal |

The exercise this table represents is the reusable skill: given any new game concept, you should be able to fill its column before writing a line of code. If you can't name the ordering or the verdicts, the concept isn't a game yet — it's a vibe.


## 4.19 Depth vs. width in system design

A system has **width** (how many distinct things exist — verbs, nouns, tokens) and **depth** (how much reasoning each thing supports). The classic small-team error is buying width when the game needs depth **[Rec]**, because width is visible in screenshots ("20 power-ups!") while depth is only visible in play.

- Depth is produced by *interaction*, not inventory. A single verb with rich interactions (`deploy` altering graph topology) generates more puzzles than five verbs that each do one thing.
- Width costs are multiplicative: each new noun multiplies the interaction matrix cells, the signifier budget (§2.3), the tutorial burden, and the test surface. A game adding its 16th verb should expect to re-verify the existing 15 against it — pairwise matrix review is the cost schedule.
- **The substitution test**: for any proposed new mechanic, ask "could an existing mechanic produce this experience?" If yes, don't add it — the experience is content, not system. New mechanics are justified only by *classes of puzzles* no existing mechanic can express (§4.2's multiplicative test restated).
- Depth signals in review: a level where one mechanic is doing three different jobs across beats is a depth asset; a level using six mechanics once each is width-waste — content should concentrate interactions, not survey vocabulary.

## 4.20 The mechanic proposal template

A proposed mechanic enters review as a filled template, not a pitch **[Rec]**:

1. **Verb/noun delta**: what exactly is added to the inventory.
2. **Puzzle classes enabled**: ≥3 named puzzle shapes it creates that existing mechanics can't (with a sentence each).
3. **Interaction cells**: its row/column of the interaction matrix — what it modifies, what modifies it, expected emergent pairs.
4. **Teaching cost**: atoms it adds (§2.7) and where in the curriculum they land.
5. **Visibility**: how its effects are shown — states, events, verdicts (§4.14).
6. **Failure modes**: what goes wrong when players misunderstand it (the wrong-approach classes it generates).
7. **Veto implications**: what it explicitly must NOT interact with.
8. **Cost**: content required to justify it (levels, signifiers, tutorial beats) vs. benefit.

Rejected proposals are archived with reasons — a rejected mechanic that keeps coming back is a signal (the game wants something it doesn't have), but re-proposing without new evidence is noise.

## 4.21 Hidden state and the visibility gradient

Hidden state is a resource to be spent, not an accident to be tolerated **[Rec]**. The gradient:

- **Visible state**: inspectable directly (positions, counts, statuses). Default for anything the player must act on.
- **Inferable state**: not directly shown but derivable from shown history (a mechanism armed at beat 2 — the arming event is in the timeline even if the armed flag isn't displayed). Acceptable for deduction texture; requires the derived-from events to be logged (§4.14).
- **Discovered state**: revealed only by probing (the player tries `load_ferry` and learns capacity). Legitimate *only* for cheap probes (§3.3) and only the first time — discovered rules must then enter the player's model permanently (shown in a "learned rules" panel or equivalent persistent surface).
- **Secret state**: never visible or inferable. Forbidden for anything outcome-relevant in this genre — a secret rule is a lie the engine tells (§3.14).

The gradient discipline: information sits at the *highest* (most visible) level the design can afford. Deduction puzzles deliberately demote some state to inferable — and document the demotion in the LevelCard so reviewers can verify it was a choice, not an oversight.

## 4.22 System telemetry: what to measure inside the sim

Systems produce measurable health signals **[Rec]**:

- **Verb usage distribution** per level: a verb unused across many levels is dead weight or untaught (§3.8 mechanical blind spots).
- **Interaction frequency**: which matrix cells actually fire in real play — cells that never fire are either untested surface or unused vocabulary.
- **Illegal-action rate**: players attempting illegal actions (a `ride_ferry` with a full rider slot) signal either a legibility gap (why is it illegal? — show the reason) or a wrong affordance (it looks legal — fix signifier). Illegal-action clustering on one verb is a top-5 diagnostic signal for that verb's UX.
- **Undo rate per action type**: actions undone most often are either high-risk (irreversible) or misunderstood (the preview failed) — the two causes need different fixes and the data distinguishes them (undo-with-immediate-redo = experimentation, healthy; undo-then-long-pause = confusion).
- **Dead-state frequency**: how often players reach stranded/dead states and how long they linger before detection — stranding detector coverage measured empirically (§3.2).

## 4.23 Systems for co-op: shared-state design

Multiplayer systems add one hard problem: **shared truth**. Where does authoritative state live, and who can mutate it? (Part 5 treats the design side; the systems-design consequence is here.) For deterministic engines the answer is clean: the sim is the authority, player inputs are proposals, and validation is uniform (validateAction). Systems choices to avoid:

- Client-asserted outcomes (a player claims "I delivered") — breaks determinism and trust simultaneously.
- Shared mutation of free-form state (two players editing the manifest simultaneously) — requires either locking, turn-taking, or splitting mutable surfaces by player. Deterministic engines prefer *serialized proposals*: both players propose, the engine orders and applies — the same total-ordering discipline as beats, applied to input.
- Asymmetric hidden state without asymmetric display — information asymmetry (§5.2) is a design feature only when each player's *visible* state is complete for their role.

## 4.24 Common systems-design mistakes

| # | Mistake | Signature | Fix |
|---|---|---|---|
| 1 | The kitchen sink | Verb/noun count grows each sprint, no deletions | Complexity budget + substitution test |
| 2 | Vocabulary drift | Field/mechanic names diverge between docs, dispatches, code (dispatch says "walk," engine says "travel") | Frozen vocabulary + name registry; cross-check every external doc against the master |
| 3 | Ordering folklore | Resolution order known to the engine author but not written | The System Card's ordering section; content audits verify against it |
| 4 | Sim-state leaks | Game-relevant facts living only in presentation | State-completeness audit (§4.6) |
| 5 | The invisible verb | Players never discover a legal verb (hand_over_ferry syndrome) | Illegal-action telemetry + vocabulary audits |
| 6 | Reversibility inconsistency | Some actions undoable, some not, undocumented | Reversibility column in System Card; commitment-boundary legibility |
| 7 | The surprise interaction | Pair of mechanics produces behavior no one designed | Interaction matrix + playtest for emergent pairs |
| 8 | Trust debts | Small divergences (presentation vs sim) shipped because "cosmetic" | Zero tolerance: every divergence is a bug, classed as trust-critical |
| 9 | Overloaded control | One input does different things by context, undisplayed | Explicit verbs or visible mode indicators |
| 10 | Frozen-vocabulary violation | Content built against a stale spec | Authoring against the frozen master only; dispatches versioned |

## 4.25 Part 4 model card

| Design object | Instrument | Verified by |
|---|---|---|
| Verb/noun inventory | Finite enumerable list | Solvability traces |
| Interactions | Matrix + veto list | Playtest emergent-pair watch |
| Determinism | Ordering doc + canonical hashes | Replay bit-equality tests |
| Sim separation | Presentation reads sim only | Sim-only test suite |
| Resource loops | Source/sink/converter audit | Leak-free level analysis |
| Complexity | Budgets per §4.13 | Inventory + per-level counts |
| Legibility | Rules ≤7 + observable manifestations | Prediction tests in playtest |
| Lifecycle | Proposal→freeze pipeline | Proposal template + freeze registry |


## 4.26 The system's contract with level authors

The system defines not just what players can do but what *authors may rely on* — the authoring contract **[Rec]**:

- **Guaranteed semantics**: every rule documented in the System Card is a promise — authors may build levels whose solutions depend on it (ride_ferry carries exactly one rider; mountedOn gates occupant packing). A level built on an undocumented quirk is a level built on sand — the quirk can be patched, breaking the level.
- **Stable action surface**: authors enumerate legal actions via the engine, never by assumption — the "real action union" lesson from the portfolio itself (dispatch names like walk/pick_up/build/commit_orders were stale; the engine's actual union was travel/pickup/drop/load_ferry/...). Authoring tools must *query* the vocabulary, never hard-code it.
- **Over-approximation awareness**: engines sometimes expose analytically-permissive surfaces (parcelGraph treating ferry edges as traversable regardless of parcelCapacity). Authors must know which engine helpers over-approximate and verify solutions with the authoritative path (applyAction), not the approximation.
- **Pinning**: authored levels pin to a system version; golden traces re-verify on system change — a system update that breaks a pinned level is a system bug or a deliberate migration, never a silent event.

## 4.27 System evolution and versioning

Systems evolve; the discipline is making evolution *legible to content* **[Rec]**:

- **Additive-only rule**: after freeze, new verbs/nouns/rules may be *added* but existing ones may not change semantics — a semantic change invalidates every authored level and golden trace built on it (the same rule as public APIs, for the same reason).
- **Versioned vocabulary**: the System Card carries a version; level metadata records the version it was authored against; CI re-verifies traces on version bump. Divergence reports name the first level whose trace broke.
- **Deprecation path**: a mechanic being retired goes through a deprecation window — levels using it are enumerated, reworked or retired, THEN the mechanic is removed. A mechanic removed before its levels is a surprise waiting to ship.
- **Exception growth is the tell**: if evolving the system means adding exceptions rather than new rules ("except when the ferry is at the east dock"), the system is fighting you — the right move is usually a new *explicit* mechanic, not a conditional inside an old one.

## 4.28 The depth audit: proving the system earns its keep

Before content production scales, audit the system's actual generative power **[Rec]**:

- **Enumeration exercise**: list 20 level ideas that use only the frozen vocabulary. If you can't, the vocabulary is too thin or you don't understand it yet — fix understanding before adding mechanics.
- **Interaction census**: for each mechanic, count its meaningful interactions. Distribution should be skewed: a few load-bearing verbs with many interactions (deploy, loan, redirect), several specialists with few (send, hand_over_ferry). A flat census (everything interacts with everything equally) means nothing is load-bearing — the system lacks a spine.
- **The one-level proof**: build the exemplar level (§2.23) using ONLY frozen vocabulary. If the exemplar can't be built without extensions, the vocabulary is incomplete — extend now, before mass production, not after.
- **Idiom headroom check**: from the interaction matrix, can you name ≥3 plausible player-discoverable idioms? A system with no idiom headroom produces no community techniques — depth in theory, flatness in practice.


## 4.29 Combinatorial depth, counted

What "verb economy" actually computes **[Rec]**. For a game with V verbs, N noun classes, and an interaction matrix M (fraction of verb×noun pairs that produce distinct effects):

**TRS**: ~4 verbs (observe, predict, intervene via RedirectJunction, place/remove interventions) × ~6 nouns (agents, toys, junctions, obstacles, regions, counters). Not every pair interacts meaningfully — a RedirectJunction does nothing to a parked toy — but ~40% of pairs do → ~10 distinct interactions, each teachable.

**RBM**: ~8 verbs (loan, carry, place, return, distract, wait, swap, peek) × ~7 nouns (tokens, carriers, guards, rooms, manifest rows, phases, due-beats). Higher arity — place takes token+room, distract takes guard+time — → ~25 distinct interactions, but the *emergent* pair space is bigger: loans×phases×sensory-tags generates the forced-overlap depth.

**PFT**: 12 verbs × ~8 nouns (couriers, parcels, ferries, islands, stations, routes, slots, edges). Highest raw count, but the verbs are *narrow* (each does one thing, no context-merging) → ~35 interactions, most of them load-bearing by design (the 12-action vocabulary is deliberately minimal).

The comparison: PFT has the most surface but the least hidden interaction; TRS has the least surface but the deepest per-verb semantics (each intervention type is its own mini-system). RBM sits in the middle — moderate surface, emergent depth from scheduling. Three different answers to the same question: where should complexity live?

## 4.30 Deterministic resolution, worked

The phase-order contract, played through **[Rec]**. RBM settle phase at beat 20:

State: Loan(Vase, due 14, placed at Study, restingOn=Table); Loan(Candle, due 18, returned on-time); G1 at Hall (scanning), G2 at Study.

Resolution:
1. **loans**: Vase is overdue (due 14 < 20) and unreturned → mark `overdue`; the plate/token resolution hasn't run yet so `restingOn=Table` still holds.
2. **crew**: carriers idle; nothing to do.
3. **guards**: G2 scans *previous post* — it was at Hall last beat, so it checks Hall, not Study. Study is unguarded this beat.
4. **returns**: none pending.
5. **settle**: evaluate conditions — Vase overdue → fail; plates resolve before overloaded-cargo check (§4.5's ordering rule) so the Vase's position is finalized *then* checked.

The authored ordering matters: if guards scanned *current* posts instead of previous, the player couldn't exploit patrol-window play — a different game, same rules on paper. Deterministic ordering isn't implementation detail; it's the game design.

## 4.31 Emergence audit, run

How to audit a system's emergent depth **[Rec]**:

1. **Enumerate the designed interactions** (the matrix) — the planned surface.
2. **Enumerate the discovered interactions** (from playtests: things players did that weren't designed) — the emergent surface.
3. **Classify each discovery**: additive (a new combo of known rules), modifying (a known rule behaving unexpectedly), emergent (a genuinely new behavior from rule interaction).
4. **The ratio**: emergent / total interactions. ~0% = purely scripted; ~5-15% = healthy emergence; >30% = the game's real rules are different from the designed rules (either embrace or fix).
5. **The catalog**: keep the emergent discoveries as named idioms (sacrificial skid, ferry-juggling, guard-baiting); they're the game's deeper vocabulary, and knowing they exist lets levels be authored *for* them deliberately.

The mistake: treating emergence as good in itself. Emergence is good *when it's legible* — a player should be able to find the idiom by reasoning about the rules, not by accident. Emergent-by-accident is a bug factory; emergent-by-inference is depth.

## 4.32 The three games' systems cards, side-by-side

| | TRS | RBM | PFT |
|---|---|---|---|
| Core mechanism | Interventions on a deterministic replay | Loan scheduling under patrols | Route/logistics on a graph |
| Sim model | Re-sim per change, beat-indexed | Beat phases, per-beat ordering | Turn-less moves, graph state |
| Verbs | ~4, intervention-focused | ~8, schedule-focused | 12, move-focused |
| Verbs are | Deep (each is a system) | Medium (each interacts with time) | Shallow (each is atomic) |
| Emergence source | Intervention×causal-graph | Loans×phases×tags | Graph×capacity×packing |
| Ordering | Beat re-simulation | loans→crew→guards→returns→settle | Move sequential, settle at end |
| Key invariant | Determinism under re-sim | Guards scan previous post | Parcel conservation |
| Stranding | Not applicable (re-sim) | Overdue-unreturned | pack-early, ferry-killed, stranded |

The same design machinery (verb/noun/matrix/ordering) produces three mechanically distinct games — the strongest argument that "systems design" is a real discipline and not a synonym for "features".

## 4.33 The freeze contract

What an engine-freeze actually guarantees **[Rec]**:

- **Vocabulary freeze**: no new verbs/nouns/conditions without a new version; authors can rely on the listed set.
- **Semantic freeze**: existing names keep their meaning; `restingOn` doesn't get redefined between levels.
- **Ordering freeze**: the resolution sequence is fixed; content authored under one ordering is valid under all later ones.
- **Surface freeze**: the action-schema (what fields, what types) is stable; client UIs and authors target the same surface.
- **Additive-only versioning**: new things get new names; old things stay. Breaking changes are forbidden by policy, not by convention.

The freeze is what makes content-production *possible* — an author building against a moving engine is authoring twice.

## 4.34 Applied checklist (supplement)

- [ ] Interaction counts computed per game; complexity budget justified.
- [ ] Resolution order has a written, replayed example.
- [ ] Emergence audit run; idioms cataloged; ratio assessed.
- [ ] Systems Card per game exists and matches the engine.
- [ ] Freeze contract: vocabulary/semantic/ordering/surface all versioned additive-only.


# PART 5 — CO-OP & MULTIPLAYER DESIGN

Multiplayer for a small puzzle team is a different discipline than multiplayer for action games. The wins available are asymmetric-information puzzles, shared planning, and teachable-moment co-play — not twitch netcode. This part covers design first, then the minimum-viable networking model for deterministic games.

## 5.1 Meaningful role differentiation

Co-op fails when both players do the same thing at half capacity **[Conv]**. Role differentiation that *means* something takes one of four forms:

- **Verb-split**: different players own different verbs. TRS co-op variant: one player places interventions, the other controls which conditions are being satisfied this attempt (the planner vs. the actor). Strong differentiation, requires the verb sets to be balanced in engagement — a player with the boring half of the vocabulary is a spectator with buttons.
- **Information-split**: players see different state (Keep Talking and Nobody Explodes is the extreme case — one sees the bomb, one sees the manual). The deepest co-op structure available to puzzle games because it converts communication itself into the mechanic (§5.2).
- **Space-split**: players control different regions — PFT two-courier mode is literal space-split (each player steers a courier), and the puzzle is coordinating the shared ferry. Cheapest to build, least co-op-feeling unless the regions must interact.
- **Time-split**: players act in alternating phases — RBM-style: one player owns loan staging, the other owns guard-beat timing. The phase order becomes the turn order — a structure deterministic engines get for free.

The test for meaningful differentiation: **remove one player and the other cannot finish alone.** If solo-completion is trivially possible, the split was cosmetic.

## 5.2 Information asymmetry as the mechanic

The richest vein for co-op puzzles **[Conv]**: give players different *views* of the same state and make them communicate to bridge it.

- **Asymmetry by display**: each player's screen shows what their role can see — in TRS co-op, the "observer" sees the world and run; the "intervener" sees only the intervention palette and the conditions, and must be *told* where things are. Communication becomes the gameplay: "the marshal skids at the arch on beat 3" is a sentence that carries game-state.
- **Asymmetry by knowledge**: same view, different information — one player sees due-beats, the other sees token tags (RBM variant). The plan is negotiated from partial views.
- **Asymmetry of authority**: one player can act, the other can only advise — the "expert defuser" pattern, which inverts normal co-op: the acting player is blind, the advising player is sighted but helpless. Excellent for teach-the-teacher dynamics (§5.7).

Design rules: (a) asymmetry must be *complete* — if both players can see everything, communication is optional and the mechanic evaporates; (b) the information split must be *complementary* — each player's missing information must live on the other screen; (c) communication should be possible-but-costly — voice works, but constrained channels (limited pings, a fixed phrase wheel) can themselves be the puzzle.

## 5.3 Coordination verbs

Some verbs exist only for co-op — verbs whose entire meaning is interpersonal **[Conv]**:

- **Handoff**: transfer control/ownership of a shared resource — PFT's `hand_over_ferry` is literally this verb in single-player form; in co-op it's the same verb across players (my courier yields the ferry to yours).
- **Signal**: a limited-bandwidth communication channel — pings, markers, "look here." Signals must be designed for *ambiguity tolerance*: a ping means whatever the players agreed it means, and the game should not over-specify (over-specified signals kill the emergent protocol players love inventing).
- **Wait-for**: explicit synchronization — holding a state until the partner confirms. In turn-phase co-op this is the "ready" commit; in real-time it's literal synchronization of actions.
- **Interleave**: verbs that only make sense in combination — "I hold the door while you pass." Requires state that persists across players' actions (a held-open plate is shared infrastructure).

## 5.4 Player-count scaling

A co-op design must declare its player-count contract **[Conv]**:

| Mode | Design consequences |
|---|---|
| **Solo** | All mechanics reachable by one player; never gate content behind coordination |
| **Duo (the standard)** | Design for two; the asymmetric case is usually the best-tuned |
| **Duo + optional 3rd** | Third player = advisor/spotter role, designed as assist (spectator-with-ping) rather than a squeezed-in third actor |
| **Drop-in/drop-out** | Mid-session join/leave must not break state — deterministic sims survive it trivially (state serializes; partner pauses or solos) |

Scaling sins: dividing the same work N ways (each player gets 1/N of the fun), requiring N-player precision on a latency-sensitive beat (impossible over a network), and making the N-player version strictly harder without re-scaling content (a puzzle sized for one brain breaks a team of two who must also coordinate).

## 5.5 Authoritative models for deterministic games

For real-time-twitch games netcode is hard; for deterministic puzzle co-op it's a solved problem **[Conv]**:

- **State-sync/lockstep**: both clients run the same deterministic sim; inputs (proposals) are relayed; identical inputs → identical states (canonicalHash proves it). Cheapest model — the network only carries actions, never state. Failure mode: divergence if any nondeterminism leaks in (float ordering, wall-clock reads) — which is why §4.5's determinism discipline is the *prerequisite* for lockstep.
- **Server-authoritative relay**: a small server owns the sim state; clients send proposals, server applies and broadcasts results. Costs a server; wins: no divergence possible (one truth), late-join trivial (send the state), spectating free (read-only feed). For the portfolio, a WebSocket room server is the right size — the operation is literally a relay for action proposals plus a state snapshot for joiners (the deployed Render-hosted room servers pattern: rooms keyed by code, `join → propose → broadcast`, sim runs server-side or deterministically on each client).
- **Host-migration peer**: one player's client is authoritative; others relay through. Fine for couch-to-online ports; failure mode is the host's connection being everyone's problem. For a browser portfolio the relay-server is better — no host to migrate.

Decision rule **[Rec]**: use server-authoritative relay when sessions matter (shared puzzle rooms, persistent lobbies, spectator join) and state-sync only when the operation is purely synchronous-pair and you can guarantee determinism. Both reduce to the same engineering invariant: *proposals go over the wire, never assertions*.

## 5.6 Disconnect tolerance

Small co-op games die on disconnect handling **[Conv]**:

- **Graceful solo continuation**: if a partner drops, the remaining player can continue solo — mechanics that were split collapse gracefully (the acting player gains the advisor's verbs). Never force-quit a session on partner drop.
- **Rejoin with state restore**: serialize state server-side; a rejoining client restores and resumes mid-plan. Because sims are deterministic and serializable (the serialize/restore contract), rejoin is a solved problem — the only design is "which role does the rejoiner resume."
- **Timeout semantics**: define what happens to an uncommitted proposal from a dropped player (discard it — partial proposals never apply; commitment boundaries are atomic, §3.9).
- **Pause policy**: turn/beat-based co-op pauses naturally (no tick without proposals); free-running co-op needs an explicit pause rule — consensus pause (both agree) is the only fair form.

## 5.7 Spectator and teaching modes

Deterministic, watchable games have built-in spectating **[Conv]** — the question is what the spectator can *do*:

- **Pure observer**: sees state, no input. Free with a relay server (read-only feed). Valuable for streams (§1.16) and for "watch me solve" sessions.
- **Advisor**: observer + signals (pings/markers). The natural "teacher" seat — the experienced player watches a novice and can point but not act. This is the highest-value multiplayer mode for a puzzle game *because it's the least invasive*: it doesn't change core gameplay, it adds a socially useful seat.
- **Scrub-share**: shared timeline control — any participant can pause/scrub the replay. Turns a run into a discussable artifact — the social version of the counterfactual analysis (§1.18).
- **Teach-the-teacher asymmetry**: the teaching inversion — the expert can only describe, the novice must execute. Builds the expert's *verbalization* skill and the novice's confidence simultaneously; mode it as "guided play" in the lobby (roles: Operator / Instructor).

## 5.8 Social friction design

Co-op introduces failure modes that are social, not mechanical **[Conv]**:

- **Blame allocation**: shared failure needs fair attribution or it poisons the room. Verdicts should blame *the plan*, not a player — "the loan schedule failed at returns" not "you failed." Never instrument per-player blame scores in cooperative puzzle games; they convert teammates into judges.
- **Griefing surfaces**: any player action that can destroy shared state is a griefing surface — a partner `deliver`-ing a parcel early to strand it. Mitigations, in order: (a) reversibility (undo-consensus — both must agree to undo), (b) permission scoping (each player controls their own courier/loans), (c) friend-only rooms by default. Deterministic games are naturally griefer-resistant: proposals must be *legal*, and legal actions can't corrupt state — the worst case is a bad-but-legal move, which undo-consensus fixes.
- **Skill mismatch**: a puzzle balanced for two equal players collapses when one out-solves the other — the expert backseats, the novice spectates, both have less fun. Mitigations: advisor mode as the default for mismatched pairs (expert advises, novice operates — the fun redistributes correctly), and difficulty knobs that don't punish asymmetry.
- **Quiet-partner problem**: in asymmetric-info co-op, a silent partner breaks the game — provide a minimum-bandwidth floor (signal/pings even without voice) and never require speech for solvability (accessibility AND robustness).

## 5.9 Co-op in the three games: applied designs

- **TRS co-op**: Observer/Intervener split. Observer sees the world + runs (the film); Intervener sees conditions + palette, not the world. Communication = the game. Alternatively a co-editing mode: both place interventions, plan must be consensus — adds negotiation, keeps determinism. Advisor seat for streams.
- **RBM co-op**: Phase-split. Player A owns loan staging (which tokens, where), Player B owns timing (when commits land, beat management). The manifest is shared truth; proposals serialize through the server. High co-op ceiling: scheduling is inherently a negotiation.
- **PFT co-op**: Courier-split + shared ferry. Each player owns courier(s); the ferry is a shared resource requiring handshake (`hand_over_ferry` becomes an inter-player verb). The shared-capacity problem is the game's core made cooperative.
- **Shared infrastructure**: one WebSocket relay pattern serves all three — room code + proposal relay + state snapshot + spectator feed. The engines' propose/commit APIs map directly onto proposal/broadcast; no per-game netcode invention needed beyond message vocabulary.

### Applied checklist (Part 5)

- [ ] Role differentiation is load-bearing: solo-impossible structure, engagement-balanced halves.
- [ ] Information asymmetry complete and complementary; communication channel deliberately sized.
- [ ] Coordination verbs designed (handoff/signal/wait-for/interleave).
- [ ] Player-count contract declared; drop-in/drop-out safe.
- [ ] Relay model chosen: server-authoritative for lobbies/spectating; proposals over wire, never assertions.
- [ ] Disconnect → solo-continue + rejoin-restore; consensus pause; orphaned proposals discarded.
- [ ] Advisor spectator mode exists; verdicts blame plans not players; undo requires consensus.


## 5.10 Co-op puzzle design specifically

Co-op puzzles are not solo puzzles with a second player attached — the cooperation must live in the puzzle's structure **[Conv]**. The four structural templates that reliably produce co-op puzzle experiences:

- **Partitioned subproblems**: the puzzle splits into halves each player solves, with a coupling point — two couriers whose routes must interleave at one ferry crossing (PFT's natural shape). The coupling is where the co-op happens; a partition with no coupling is two solo games sharing a screen. Design rule: ≥1 forced coupling per level, and the coupling must require *sequencing* (who crosses first changes feasibility), not just co-presence.
- **Interleaved dependencies**: player A's step 3 is impossible without player B's step 2 — chained prerequisites across players. RBM phase-split is this pattern in time rather than space: the loan staged at beat 2 exists to hold the ray open at beat 6 for the partner's crossing. Chained prerequisites force communication about *plans*, not just positions — the deepest co-op conversation.
- **Complementary information**: each player holds half the constraint set (§5.2) — the puzzle is *joint deduction*. Structurally the strongest co-op form because the communication is the solve; the risk is real-time pressure on communication (solved by turn-based planning — the genre's natural fit).
- **Shared budget**: a common resource both players draw from — a shared intervention pool, shared ferry capacity. Budget competition is constructive friction: "I need the last slot" is a negotiation, and negotiation is co-op content. Design rule: the budget must be *scarce enough to force discussion but not scarce enough to force dominance* — target budgets where roughly 60–80% of both players' wants can be satisfied, so trade-offs are real but survivable.

Anti-pattern to reject: **the watchdog design** — one player works while the other watches for a signal. The watching role is spectating with extra steps; if asymmetry is wanted, use complementary-information (both think) rather than watchdog (one acts, one looks).

## 5.11 The co-op difficulty problem

Two players are not one player twice — they're a different cognitive system **[Conv observation]**:

- **Communication overhead is real difficulty**: a plan that's trivial in one head becomes hard when it must be negotiated — because plans live as *sentences* now, and sentences are lossy. For the same nominal challenge, co-op needs either more time or simpler structure; estimate co-op difficulty ≈ solo difficulty + coordination tax (rule of thumb: +30–50% effective difficulty for partitioned designs, +60–100% for asymmetric-information designs, scaling with how much must be *transmitted*).
- **Divergent models**: each player models the system separately; model mismatches between partners produce arguments the game should *adjudicate* — deterministic sims can answer "what happens if..." authoritatively (preview/commit is the dispute-resolution mechanism: propose the contested plan, watch the sim resolve it). In co-op puzzle games the preview isn't a convenience, it's the referee.
- **The overtalker balance**: asymmetry in who talks produces one player's plan dominating. Structural fixes: alternate decision authority by phase (A plans loans, B plans timing), or concurrent-but-separate proposal windows (both submit, engine orders) — both give the quieter player structural voice without needing rules about talking.

## 5.12 The protocol layer: messages that a co-op game actually needs

Deterministic co-op needs a small, enumerable message vocabulary — which is the multiplayer echo of the frozen-vocabulary rule **[Rec]**:

```
LOBBY:   create_room → room_code | join_room(code) → {state_snapshot, role}
PLAY:    propose(action) → accept|reject(reason)
         commit → {new_state | violation_report}
         undo_request → consensus poll → applied|denied
         signal(kind, target) → broadcast (pings, markers)
META:    role_swap, pause_vote, resume, leave, rejoin(code) → state_snapshot
         spectator_join → read_only_feed
```

Design notes: `propose` vs `commit` mirrors the engines' proposal boundary (§3.9) — proposals are free, commits are atomic and shared. `undo` as a *vote* preserves consensus (both players' state is shared, so undo must be bilateral). `signal` vocabulary should be small and enumerably useful — 4–6 signal kinds (point, warn, affirm, ask-question, suggest-verb) beat 20 ambiguous emotes.

## 5.13 Lobby and session UX for small co-op

The multiplayer UX layer most small teams under-build **[Conv]**:

- **Zero-account join**: room codes (4–6 chars) beat friend systems for a portfolio game — no auth, no account creation, shareable as a URL (the join link IS the invite). Every account requirement on a casual co-op game costs real conversion.
- **Role pick, not skill claim**: let players pick roles by preference (Observer/Intervener) not by claimed skill — a skill-picker screen produces pressure and lying; a role-picker produces play.
- **The pre-game contract**: show both players the level conditions and a 10-second orientation before the first proposal — asymmetric views make this *necessary* (each player needs to know what they can and can't see).
- **Session persistence**: rooms survive browser refresh — a reload is a rejoin (§5.6), not a death. Room codes + server-side state serialize this trivially.
- **Timeboxing**: default session ~20–40 minutes, level-sized units — co-op scheduling friction means shorter units beat longer ones for retention.

## 5.14 Competitive and adversarial variants

The portfolio's games are cooperative by nature, but each has an adversarial variant worth noting as design space **[Rec]**:

- **TRS adversarial**: one player authors the world + conditions (the dungeon-master seat), the other solves — asymmetric adversarial where the "opponent" is literally the designer. The level-editor-as-gameplay pattern.
- **RBM adversarial**: one player moves guards (limited patrol choices), the other plans loans — the heist-vs-security structure. Requires guard verbs, which is real scope — file as stretch.
- **PFT adversarial**: shared ferry with *opposing* deliveries — both players want the limited capacity for their own parcels. Zero-sum scheduling; strong but changes the game's gentle tone — decide by identity, not feasibility.

Competitive variants inherit the same infrastructure (proposals, commits, shared state) — the adversarial layer is vocabulary + scoring, not new netcode. Still: adversarial modes are scope, and scope is finite (Part 11) — these are documented as stretch goals, not commitments.

## 5.15 Production cost of multiplayer: the honest accounting

Multiplayer's real cost for a small team is not netcode — it's *design surface and QA matrix* **[Conv]**:

- Every level must be re-verified for its co-op shape (does the puzzle still work split? does the coupling hold?).
- The QA matrix doubles: solo-path + duo-path + drop-out cases + role-swap coverage.
- UI doubles: every screen needs a who's-who representation (whose proposal, whose commit, whose undo vote).
- Support surface: connection issues become your problem ("the game is broken" = "my wifi dropped" in player perception).

The honest sizing **[Rec]**: a well-scoped co-op mode adds ~30–50% to a puzzle game's production cost; a poorly-scoped one adds 100%+ and still ships fragile. What makes the portfolio's version *well*-scoped: deterministic sims (no rollback netcode), proposals-only protocol (no state-sync debugging), turn/beat structure (no latency-sensitive windows), and room-code lobbies (no account systems). A team that can't afford the +30–50% should ship advisor-mode-only first (the smallest real multiplayer) rather than none at all — advisor mode is ~15% cost for most of the social value.

## 5.16 Part 5 model card

| Design object | Instrument | Verified by |
|---|---|---|
| Roles | Verb/information/space/time splits | Solo-impossibility test |
| Asymmetry | Complementary views | Missing-info audit |
| Coordination | Handoff/signal/wait-for/interleave verbs | Protocol vocabulary |
| Networking | Server relay, proposals-only | Determinism + divergence tests |
| Resilience | Solo-continue + rejoin-restore | Drop/rejoin scenario tests |
| Social health | Consensus undo, plan-blame verdicts | Grief-surface audit |
| Difficulty | Coordination-tax estimate | Co-op playtest cohorts |


## 5.17 Local co-op and pass-and-play

The cheapest multiplayer is one screen and one keyboard **[Conv]**:

- **Couch advisor**: two players, one controls, one advises — the "homework help" mode that's been the real multiplayer of puzzle games since forever. Design for it deliberately: spectator-legible plan-state (§2.22), discussion-friendly pacing (no timers during discussion), and a screen both players can read at couch distance (§6.6's hierarchy applies doubly).
- **Pass-and-play**: turn-taking on one device — natural for beat/move games (each player takes a beat, or alternates parcels). PFT works as pass-and-play with zero changes: the undo and move-counter already serialize perfectly. The design work is purely in accounting ("Player 1 delivered 3, Player 2 delivered 2") if you want individual credit — and whether individual credit is even desirable (§5.8's blame rule suggests shared credit only).
- **Shared-screen asymmetric**: both players see the same screen but roles differ in *verbs* — one drives interventions, the other manages conditions. Works where the screen already shows everything; the split is input-side, not display-side.

## 5.18 Asynchronous multiplayer

Multiplayer that doesn't require simultaneity **[Conv]**:

- **Replay challenge**: "I solved it in 11 moves — beat that." The artifact (a replay trace) is the multiplayer payload — deterministic sims make replays small, verifiable, and shareable (a trace is just an action list; verify by re-running). This is the highest-value/lowest-cost multiplayer for a puzzle game: no servers beyond static hosting, no simultaneity, real competition.
- **Ghost mode**: race against a friend's trace rendered as a ghost plan — their intervention placements visible as translucent alternatives. Async but presence-y.
- **Turn-based co-op**: players take turns proposing — the "words with friends" model applied to heists. A turn is one commit; state persists server-side between turns. Turns an evening of co-op into a week of correspondence — the right async model for the portfolio's planning-heavy games.

## 5.19 Trust, safety, and moderation floor

Even tiny multiplayer needs a safety floor **[Conv]**:

- **No voice/text required**: communication constrained to designed signals removes 90% of toxicity surface — a deliberate choice, not a limitation (Journey's no-text constraint is the canonical example: players invent richer communication through limited channels, and harassment has no bandwidth).
- **Friend rooms by default**: the code IS the access control; no public matchmaking means no stranger-risk surface at all.
- **Session-scoped identity**: display names exist only inside the room, no profiles, no history — nothing to doxx, nothing to harass over, nothing to maintain.
- **Abuse escapes**: leave-room must be instant and consequence-free; a player trapped in a bad session is a safety failure, not an engagement win.

## 5.20 The co-op playtest

Co-op playtesting differs from solo in one main way: you're testing *a relationship*, not an interface **[Rec]**:

- Recruit pairs who actually know each other — strangers test worst-case communication, friends test the real product.
- Observe the *channel*: how much gameplay happened through talk vs. through the game's signals? If all coordination happened in voice, the signal system is dead weight; if none happened at all, the game didn't force co-op.
- Watch for the spectating failure: is one partner visibly less engaged? Time-to-boredom for the passive role is the co-op's deadliest metric.
- Test the drop: mid-session disconnect is a scripted test case, not an accident — verify solo-continue works and rejoin restores.

### Applied checklist (§5.17–5.20)

- [ ] Advisor/couch mode deliberately designed: legible shared state, discussion-safe pacing.
- [ ] Replay challenges + ghost modes supported by verifiable traces.
- [ ] Signal-only communication option; friend rooms default; instant consequence-free exit.
- [ ] Co-op playtests use real pairs; engagement tracked per-role; drop mid-session scripted.


## 5.21 The co-op decision framework

Whether a game should be co-op at all — an honest framework **[Rec]**:

Ask in order:
1. **Does the core loop have >1 independent decision-stream?** If one player can make all decisions, co-op is watching, not playing.
2. **Can information be partitioned without being fake?** If the only way to split info is to hide what the engine knows, the asymmetry is manufactured and shallow.
3. **Does coordination add depth or just difficulty?** Coordination that just adds communication overhead is a tax (§5.8), not a mechanic.
4. **Is the tech cost honest?** ~30-50% extra build cost; if scope is tight, drop co-op (§5.17).
5. **Does it serve the portfolio?** A 3-game portfolio needs variety — if two games are single-player-deep, one co-op is a differentiator; if all three are co-op, the portfolio is monotone.

For the portfolio: **TRS and PFT want co-op variants; RBM resists it** (its tension is temporal, not informational — splitting the heist across two players either trivializes the schedule or manufactures fake partitions).

## 5.22 Coordination verbs, deeper

The verbs that exist *only* because of co-op — designed deliberately, not emergent:

- **Signal**: "I see something" — a ping with a location, no semantics. The universal co-op verb.
- **Commit-vote**: "I'm ready" — gates progression on consensus; prevents the impatience cascade.
- **Claim**: "I'll take the left half" — a soft reservation reducing contention without hard locks.
- **Hand-off**: "You finish this" — transferring a partial plan; requires shared state legibility.
- **Override**: "Do it anyway" — the dangerous verb; requires either seniority mechanics or unanimous veto.

The mistake: adding coordination verbs without the UI to support them. A verb that requires text chat is a verb that dies on consoles/mobiles. Prefer in-world signaling (cursors, markers, pings) to chat dependency.

## 5.23 The info-partition matrix

For asymmetric co-op, tabulate who knows what **[Rec]**:

| Info | Player A | Player B | Why split |
|---|---|---|---|
| Map | Full | Partial (fog) | A plans routes, B scouts |
| Verb set | Observer verbs | Intervener verbs | The core asymmetry |
| State | Current only | History + forecast | A reacts, B plans |
| Feedback | Immediate local | Delayed aggregate | Creates the "did it work?" loop |

The split must be **complementary** — each player's missing info is *on the other screen*, not hidden entirely. If information is just removed, it's a filter, not a partition.

## 5.24 Co-op difficulty budgeting

The coordination tax quantified **[Rec]**:

- **2 players, symmetric info**: ~1.2-1.5× single-player difficulty baseline (coordination overhead).
- **2 players, asymmetric info**: ~1.5-2× (communication + complementary knowledge).
- **3+ players**: scales poorly; design for subsets (split-screen tasks, region delegation) rather than full-group coordination.
- **The ceiling**: coordination tax shouldn't exceed ~50% of total difficulty; if the challenge is mostly "getting the humans to agree", the game has become a team-building exercise, not a puzzle.

Compensation: co-op levels are *designed* for the tax — bigger state space (each player holds part), more parallel demands (forces delegation), longer loops (communication latency needs room).

## 5.25 The disconnect playbook

Player drops mid-session **[Conv]**:

- **Graceful degradation**: their role pauses or transfers; the session continues.
- **Rejoin**: same role, same view-state; don't re-onboard them.
- **Abandon timeout**: 5-10 min of no-return = role auto-transfers or session converts to single-player.
- **The ghost rule**: never silently drop them — remaining players see "X left" explicitly; the fiction never pretends they were never there.

For the relay model (§5.7): the server holds canonical state; a rejoiner just re-syncs. For lockstep: a drop is harder — either full pause or deterministic AI-fill, which is its own design problem.

## 5.26 Adversarial co-op

One player works against the rest **[Contested — fun when designed, miserable when emergent]**:

- **Hidden traitor** (one player sabotages): only works with hidden information and limited communication windows; dead if the group can fully coordinate.
- **DM/GM mode** (one player authors/difficulties): asymmetric by design; works for puzzle games (a player builds the board others solve).
- **King-of-the-hill** (players compete for a shared goal): not co-op at all — a different genre wearing the label.

Rule: adversarial modes are **a separate game design**, not a flag on the co-op mode. Don't bolt them on.

## 5.27 The solo experience of a co-op game

Every co-op mode needs a solo answer **[Conv]**:

- **Playable solo with AI/hotseat**: the player takes both roles; works if the roles aren't information-asymmetric by screen (local pass-and-play breaks hidden info).
- **Playable solo with reduced scope**: a solo mode with different level tuning; honest about being a different game.
- **Solo unavailable**: stated on the box; don't pretend.

TRS's co-op works solo-with-both-roles only if the information partition is optional — a toggle that recombines the screens. PFT's courier-split works solo by hot-seat. The game that can't answer "what if I'm alone" loses solo players entirely.

## 5.28 The lobby and social-contract UX

Pre-game friction is co-op's silent killer **[Rec]**:

- **Zero-account lobbies**: room codes + links, no sign-up (§5.11).
- **Role display**: who plays what before anyone commits; a player who discovers mid-game they got the boring role quits.
- **Communication floor**: if coordination needs chat, say so; if pings suffice, say that too.
- **A "how to play together" 60-second card**: not the tutorial — just the co-op verbs and the turn structure.
- **The exit**: leaving must be as easy as joining; a hostage lobby breeds griefing.

## 5.29 The spectator design table

| Spectator type | What they see | What they do | Use when |
|---|---|---|---|
| Pure | The game view | Nothing | Streams, judges |
| Advisor | The game view + ping tool | One ping per N seconds | Mentorship |
| Scrub-share | Timeline + annotations | Pause/annotate replays | Post-mortem, teaching |
| Teach-the-teacher | Full state + student-visibility | Composes demonstrations | Level-design review |

The spectator is a UI surface, not a camera. Each type is designed separately; "watching" is not one thing.

## 5.30 Applied checklist (supplement)

- [ ] Co-op decision framework run per game; "no" is a valid answer.
- [ ] Info-partition matrix written; every partition is complementary.
- [ ] Coordination verbs have UI support; none require text chat.
- [ ] Difficulty budget: coordination tax ≤50% of total.
- [ ] Disconnect playbook: degradation, rejoin, timeout, ghost rule.
- [ ] Solo experience answered honestly.
- [ ] Lobby UX: zero-account, role display, communication floor stated, easy exit.


# PART 6 — VISUAL DESIGN & GRAPHICS

Visual design for a puzzle game is a *functional* discipline before an aesthetic one: the picture's first job is to make the state legible; its second is to make the game worth looking at. Both jobs are learnable, and the failure mode of most small-team art is having them in the wrong order.

## 6.1 Readability first: the hierarchy that can't be skipped

### Silhouette, value, hue — in that order

The eye resolves shape before color, and value (light/dark) before hue (which color) **[Conv — perceptual fundamentals]**. Design consequence: every readability-critical distinction must work at each layer:

- **Silhouette layer**: entities must be distinguishable by shape alone — parcel vs. courier vs. ferry vs. mailbox, each with a unique outline. The test: render the board in pure black-on-white silhouettes; if two interactive things confound, the silhouettes fail and no palette will save them.
- **Value layer**: the scene must read in grayscale — active/interactive elements brighter or darker than static dressing, decisive elements highest-contrast. The squint test (blur/squint at the board) verifies: the most important thing should still be the most visible thing.
- **Hue layer**: color is the *third* channel, used for categories and redundancy — never the only carrier of meaning (colorblind-safe, §6.7). Hue encodes family (ferry routes blue, parcels amber), not identity.

### The 3-second rule

A new player should parse the board's essential structure — goal, actors, obvious obstacles — within ~3 seconds of first seeing it **[Rec]**. Failed 3-second reads mean the read stack (§2.5) is broken at the visual layer: too many things competing, or the decisive thing undersold. Fixes are always in order: reduce → contrast → guide (remove competing salience, raise the decisive element's contrast, add a leading line or camera pull to it).

### Salience budget

Salience (how much a thing grabs the eye) is a zero-sum resource on a board **[Rec]**. Spend it on purpose:

- Decisive interactive entities: high salience (motion, contrast, color accent).
- Supporting entities: medium (identifiable, not demanding).
- Dressing/background: low (desaturated, lower contrast, still).
- **One element gets the top slot**: the current decision's subject — and it should move with context (the undelivered parcel's glow, the pending bell). A board where five things shout is a board where nothing is heard.

## 6.2 Art direction systems: making consistency a process

Consistency is what makes a game look *designed* rather than *assembled* — and it's produced by system, not taste **[Conv]**.

### The three-instrument method

- **Style pillars (the anchor)**: 3–5 adjectives/rules that every art decision can be tested against. Example for this portfolio: *legible, crafted, warm, quiet*. Every asset is checked against the pillars — an asset violating one is wrong even if it's beautiful ("it's a gorgeous illustration but it isn't *quiet*").
- **The style bible**: the concrete translation — palette (exact values, not vibes), shape language (rounded vs. angular, stroke weights), texture rules (flat vs. grained, noise budget), lighting rules (direction, softness), type scale. The bible makes pillars reproducible by anyone on the team and across the portfolio — write it before asset production, update it when a decision is made that wasn't covered.
- **The freeze**: when the style is *done enough* — after which consistency beats improvement. Frozen doesn't mean perfect; it means the next asset matches the last one. Style thrash (redesigning the look mid-production) is a top-3 killer of small-team visual quality: the game ends with three art periods visible side by side. Freeze late enough to have learned, early enough to produce in volume — typically after the exemplar level (§2.23) validates the look.

### Art direction for a puzzle game specifically

The style bible for this genre has extra entries:

- **The state-color table**: every state gets a designed display (§4.14) — pressed/unpressed, armed/discharged, staged/returned. States are the information; their colors are in the bible, not invented per asset.
- **The verb-icon table**: every verb has a canonical icon that reads at UI size — `pickup` ≠ `drop` ≠ `load` at 16px. Icon language shares the bible's shape rules (a rounded world uses rounded icons).
- **The salience map**: which entities get top/middle/low salience *by category* — authoring the attention budget at the system level so individual assets can't shout by accident.

## 6.3 Camera and projection: the view is a mechanic

Camera choice is a gameplay decision disguised as a graphics decision **[Conv]**. The four usable options for this genre:

| Projection | What it costs | What it buys | Portfolio fit |
|---|---|---|---|
| **Fixed ortho 2D** | Depth cues lost | Total legibility, authored composition, zero camera problems | PFT's natural home — logistics graphs read as diagrams |
| **Isometric/dimetric** | Vertical ambiguity (height illusions) | Spatial richness, classic "model village" feel | RBM — the heist board reads as a maquette; height must be marked (PFT's stair-equal-heights trap shows why: altitude legibility is authored, not free) |
| **Fixed perspective** | Depth distortion, occlusion risk | Cinematic weight, authored drama | TRS — the sealed observation: a fixed camera is *the fiction* (the record), so perspective is spent on composition, not navigation |
| **Free camera** | Occlusion and orientation problems | Player agency | Wrong for all three — free cameras solve problems these games don't have and create ones they can't afford |

Rules for whichever you choose:

- **Fixed cameras are authored cameras**: every view is a composition — the decisive elements must be *in frame* when they matter (TRS's cameraRegions exist for this: the designer controls where causality is visible). Audit: for every beat-event, is it on-screen when it happens?
- **Height ambiguity is the isometric tax**: elevations must be carried by signifiers (shadows, height markers, explicit level-of-ground icons), because iso views lie about altitude by construction.
- **Camera moves must be motivated**: pans/zooms exist to follow causality or reveal, never for style — an unmotivated move makes players hunt for "what changed" that nothing did.

### Applied checklist (§6.1–6.3)

- [ ] Silhouette test passed for every interactive entity pair.
- [ ] Squint test: decisive element wins in grayscale.
- [ ] 3-second parse verified on fresh viewers per board archetype.
- [ ] Style pillars, bible, and freeze written; asset reviews cite the pillars.
- [ ] State-color and verb-icon tables in the bible before mass asset production.
- [ ] Camera projection chosen per game on legibility grounds; fixed cameras audit "is the decisive event in frame" per beat.


## 6.4 Sprite, tile, and modular-kit thinking

Small teams cannot afford bespoke art per level — the answer is **kits**: modular asset systems where a finite set of pieces combines into all the game's environments **[Conv]**. Kit thinking is systems thinking applied to art.

### The kit anatomy

A production-ready kit has five layers, each independently versionable:

1. **Primitives**: the atomic shapes — floor tiles, edge caps, corner joins, wall ends. Rule: every primitive must tile against every sibling in its family (a straight edge piece must connect cleanly to every other straight, corner, and junction). Breaks in tiling are the #1 visible-quality leak in kit-based games — seams read as bugs even when they're art.
2. **Connectors**: the pieces that hide the joints — transition tiles, shadows, caps, overlays. A kit without a connector budget produces visibly modular (read: cheap-looking) environments because every joint shows.
3. **Feature pieces**: the authored landmarks — one-off hero assets per region (the clock tower, the big bell). Budget them: ~5–10% of tiles should be features; features are what make a kit not *feel* like a kit, and they're cheap precisely because they're rare.
4. **Variation set**: 2–4 alternates per heavily-repeated primitive (cracked stone A/B/C, parcel tape variants). Human eyes detect repetition within ~3 identical adjacent tiles — variation exists to break that count, at the cost of keeping the alternates subtle (they must vary without varying the silhouette or value, or they spend salience on noise).
5. **Props**: non-tiling dressing — crates, lamps, signage, vegetation. Props are where per-level flavor lives; keep them in the low-salience band unless they're interactive, because a prop that reads interactive is a §2.3 signifier violation.

### Kit rules that protect quality

- **One kit per biome/region, one accent color per region.** Regional palette anchoring (§2.5's sparse-density fix) doubles as navigation: "the red-quarry island" orients the player before any text does.
- **The interactive layer is never tile-driven.** Interactives are always distinct objects on top of the kit — never baked into floor art. Baked-in interactives produce the classic failure where players can't tell what's functional (and they can't be animated, highlighted, or state-changed because they're painted into the background).
- **Kit documentation**: a one-page sheet per kit showing every piece, its tiling neighbors, and its intended use — the asset-side analog of the System Card. Undocumented kits get used wrong (a connector piece used as a wall; a feature tile repeated 40 times because someone didn't know it was a one-off).

### For browser delivery specifically

Sprite kits for the web have an extra constraint set: texture atlas everything (one draw-call batch per layer is the target), keep primitives power-of-two-friendly in size, and pre-declare the palette at the kit level so region-recolors are tint operations on shared atlases rather than re-authored tiles. A tile kit that can't recolor by region is two kits that will be built twice.

## 6.5 Texture and material restraint

The visual-noise budget **[Rec]**: every surface has a *texture density* (detail per area) and the rule for puzzle games is **restraint by default**.

- **Flat colors are a style, not a compromise.** The Witness, Untitled Goose Game, and most of the acclaimed puzzle canon run on flat or near-flat shading — because flat surfaces don't compete with state information. Texture is where readability goes to die: a noisy floor makes every marker on it ~30% less visible (informal figure; the direction is robust). Spend texture density only where the eye is meant to rest — distant scenery, region borders, feature pieces — never under interactive content.
- **Material vocabulary ≤ 6.** Stone, wood, metal, water, foliage, fabric — a game that invents a seventh material per region spends bible-consistency on novelty. Constrain to a material table in the bible, and differentiate regions by palette and silhouette rather than by new materials.
- **Noise/grain budget**: procedural texture (film grain, noise overlays, paper texture) unifies a flat look but must sit *below* the information layer — grain at 5–15% opacity that never crosses interactive elements' silhouettes. The test is the same squint test: grain that survives squinting is too loud.
- **One lighting story**: pick a single light direction and softness for the game and hold it. Mixed light directions (sun from left on one asset, right on another) is the most common "looks amateur" tell in assembled asset packs — cheaper than any texture, more damaging than any missing one.

## 6.6 UI/UX visual hierarchy

The interface is the game's second information system and it obeys the same salience rules as the board — with harsher limits, because UI has no aesthetic excuse for confusion **[Conv]**.

### The hierarchy mechanics

- **F-pattern and Z-pattern reading**: players scan UI the way they scan pages — top-left first, across, then down the left edge (F) or diagonally (Z) **[Conv from UX research]**. Put the primary action and primary state in the first fixations: board games put the goal/conditions top-left, the commit/primary button bottom-right (end of the Z).
- **The 8px spacing system**: a consistent spacing unit (4px or 8px grid) applied uniformly is the invisible force that makes UIs look designed — uneven margins are the single loudest amateur tell in small-team UI. Space in multiples of the base unit only; an element "almost aligned" reads as a bug.
- **Type scale ≤ 4 sizes**: display / heading / body / caption, with fixed weights per size. A fifth size is almost always a mistake, and body text below ~14px equivalent is an accessibility fail for browser games (§6.7).
- **One accent color for the whole UI**: the commit/primary-action color, used on ≤5% of UI area. Accent dilution (everything highlighted) destroys the action-hierarchy — if five things are accent-colored, the player can't find the button that matters.
- **State-first panels**: the panel's job is *state* (manifest, conditions, inventory), not chrome. Budget ≥70% of panel area to information, ≤30% to frame — a panel that's mostly decorative border is furniture where a window should be.

### The board-vs-UI boundary

Information must live in the right one of two places: **diegetic board info** (parcels glow on the island, the bell on the tower) and **chrome UI** (manifests, counters, hints). The boundary rule: *identity and position* live on the board; *counts, lists, and history* live in chrome. Violations — a move counter floating on the board, a parcel list painted on an island — produce confusion because the player can't tell what's inspectable-world and what's interface.

## 6.7 Accessibility: the non-negotiable floor

Accessibility in visuals is a checklist, not a philosophy **[Conv — WCAG-derived standards apply to game UI]**:

- **Contrast**: text ≥4.5:1 against background (≥3:1 for large/display text); UI-critical graphics ≥3:1 against adjacent colors. These are WCAG AA numbers and they are the floor, not the target — a moody palette that can't hit them is a moody palette that can't be read.
- **Colorblind redundancy**: ~8% of males have red-green deficiency — every hue-coded distinction needs a second channel: shape, icon, pattern, or label. The portfolio audit: ferry routes need patterns not just blue; sensory tags need icons not just color (HEAVY = weight icon, BRIGHT = sun, NOISY = waves); team/player colors need letter or shape backup. Test by rendering the board in simulated deuteranopia — free tools exist; run it once per palette change.
- **Text size**: body text ≥14px at standard scale, ≥18px recommended for primary information; everything scalable (browser zoom must not break layouts — this is free in web tech if layouts aren't pixel-locked).
- **Motion**: honor `prefers-reduced-motion` — disable decorative animation, parallax, and screenshake when set. Vestibular triggers are real and cheap to avoid; motion-off must lose zero information (any info conveyed by motion needs a static fallback).
- **Flash/photosensitivity**: no >3 flashes/second, no large high-contrast flash areas — the Harding test numbers. Puzzle games have no excuse to be near this edge ever.
- **Focus/keyboard**: every interactive element reachable and visibly focused by keyboard; focus rings visible (≥3:1 contrast). Game-specific but required: tab order must follow the read stack (§2.5), not DOM order.

## 6.8 Performance budgets for browser games

A browser puzzle game has a strict envelope: it must hit 60fps on mid-range laptops and load fast enough that a shared link converts **[Conv for the web platform]**:

- **Frame budget 16.6ms**: allocate it — sim ≤2ms (deterministic engines are cheap; measure), render ≤8ms, UI/layout ≤3ms, slack 3ms. The sim share is why engines are pure functions: a 30-beat re-simulation for scrubbing must fit the budget, so keep applyAction allocation-free where hot.
- **Draw calls ≤ ~100**: sprite-batched; every interactive entity animated on transforms, not new draw calls. Canvas2D handles this trivially at board scale; the budget only bites when particles go wild (§8.4).
- **Texture memory ≤ 256MB GPU-side**: for a tile-kit portfolio this is generous — atlases compress; the risk is un-baked text (render text to canvas at load, don't re-rasterize per frame).
- **Load weight ≤ 10MB first paint, ≤ 5s on average broadband**: the share-link conversion constraint — every second of load loses players. Lazy-load chapters (ch1 assets at boot, ch2+ in background), compress atlases (WebP/basis), and font-subset the typefaces (a full font is ~200KB+; a subset for your glyphs is ~20KB).
- **Memory discipline**: replay traces and undo stacks are bounded (cap undo at 1000 actions, snapshots compressed) — a memory leak in a puzzle game shows up as hour-three slowdowns that users report as "the game broke."

### Applied checklist (§6.4–6.8)

- [ ] Kit has 5 layers, tiling verified per primitive, one-page sheet per kit.
- [ ] Interactive layer never baked into tiles; regions palette-anchored.
- [ ] Texture restraint: flat default, materials ≤6, grain sub-information-layer, single light story.
- [ ] UI: 8px grid, type scale ≤4, one accent, ≥70% information area.
- [ ] WCAG floor: 4.5:1 text contrast, colorblind redundancy, reduced-motion honored, keyboard navigable.
- [ ] Budgets: 16.6ms frame split measured; ≤100 draw calls; ≤10MB first paint; chapters lazy-loaded.


## 6.9 The anti-slop discipline: what "looks designed" actually means

"AI slop" and generic game art share a signature: **decisions that were never made** — gradients with no reason, detail without structure, effects without purpose **[Rec — this is the working definition for reviews]**. The opposite — work that reads as *designed* — has three properties:

- **Every element answers a question asked of it.** A border is there because hierarchy needed separation; a texture is there because the surface needed identity; a glow is there because a state changed. Elements with no answer are noise by definition, and noise is what reads as slop.
- **Constraints are visible.** Designed work shows its limits — one palette, one light, one type scale — and the discipline is legible to a viewer who never saw the bible. Slop shows the absence of limits: any color anywhere.
- **Restraint in effect density.** The designed game uses ~3 effects types consistently (hover-state, state-change flash, ambient drift); the slop game uses 15 because each was added to fix a specific dull moment. Fix dull moments with staging, not particles (Part 8's restraint rules).

Practical review test — **the subtraction test**: remove an element. If nothing breaks and nothing is missed, it was decoration; decoration isn't wrong, but it must be *intentionally* budgeted decoration (low salience band). If removing it *improves* readability, it was slop.

## 6.10 Visual iteration pipeline

How art actually gets iterated on a small team **[Rec]**:

1. **Grey-box until logic-verified** (§2.15's rule at asset scale): no art time before a level plays correctly — art'd content resists redesign.
2. **Style frames**: 1–3 finished-looking stills per game (the "if we had infinite time it would look like this" frames) — they pin the bible's intent in pixels and are the cheap way to catch style disagreements before production.
3. **Kit-first production**: primitives → connectors → features → variation (§6.4 order) — building features before primitives means rebuilding features when primitives change.
4. **Consistency passes**: periodic full-game sweeps against the bible (palette drift, stroke-weight drift, a prop that doesn't belong) — drift is inevitable; passes are how you amortize it rather than shipping three art periods.
5. **Readback reviews**: review screenshots at the sizes players see them — a board that reads at 200% zoom review but fails at 100% ship size was reviewed wrong. Always review at ship resolution, on a non-retina screen at least once (high-DPI screens hide sins).

## 6.11 Applied: art direction for the three games

| Decision | TRS | RBM | PFT |
|---|---|---|---|
| Projection | Fixed perspective (sealed observation) | Isometric (maquette heist) | Ortho 2D (logistics diagram) |
| Style pillars | archival, forensic, still | nocturnal, warm, tense | postal, friendly, precise |
| Palette anchor | desaturated archive tones + one warm accent for active events | midnight blues + warm interior ambers; night is the palette | watercolor pastels, per-island regional anchors |
| Salience king | the pending event (bell about to ring) | the active phase's entity (the ray being crossed) | the undelivered parcel |
| Kit | scene kits per location + intervention icons | room kits + token/prop atlas + phase UI | island kits + edge/ferry set + parcel variants |
| One risky call | film-grain archival texture (sub-info) | light-radius visibility effects (must stay legible) | hand-drawn line edges (must not compete with graph clarity) |

The discipline visible in this table: each game gets *one* risky/stylish call, stated explicitly — the rest is functional restraint. That's the anti-slop rule applied at the game level: one flourish per game, everything else serves the read.

## 6.12 Common visual-design mistakes

| # | Mistake | Signature | Fix |
|---|---|---|---|
| 1 | Hue-only coding | "the red parcel" fails colorblind test | Shape/icon/label redundancy |
| 2 | Salience flatline | Everything equally loud; nothing leads | Salience map; one element gets the top slot |
| 3 | Kit seams | Visible tile joints reading as bugs | Connector layer budget |
| 4 | Chrome-heavy UI | Panels mostly frame, not information | ≥70% information area |
| 5 | Texture competition | Grain/noise louder than state | Sub-information grain budget |
| 6 | Mixed lighting | Assets lit from different directions | One light story in bible |
| 7 | Style thrash | Art periods visible side-by-side | Freeze + consistency passes |
| 8 | Font soup | >4 type sizes, >2 typefaces | Fixed type scale |
| 9 | Decoration-as-clue | Props reading as interactives | Affordance audit, screenshot test |
| 10 | Resolution blindness | Only ever reviewed at high-DPI/zoomed | Ship-resolution review gate |

## 6.13 Part 6 model card

| Design object | Instrument | Verified by |
|---|---|---|
| Readability | silhouette→value→hue hierarchy | squint test, 3s parse |
| Art direction | pillars + bible + freeze | consistency passes |
| Camera | projection choice per game | in-frame audits |
| Kits | 5-layer kit + sheets | tiling verification |
| UI | grid + type scale + accent | screenshot review at ship res |
| Accessibility | WCAG floor + redundancy | deuteranopia render, reduced-motion pass |
| Performance | frame/load/memory budgets | profiling on mid-range hardware |


## 6.14 Animation as state language

Animation in a puzzle game is **state-change made temporal** — its job is to carry causality, not decorate **[Rec]**:

- **Transition duration is information**: fast transitions (~100–200ms) read as mechanical/state changes; slow ones (~400–800ms) read as significant/irreversible. Use duration *semantically* — a `deliver` should animate longer than a `pickup` because it means more (commitment, §3.9). Inconsistent durations scramble the language: if every change takes 400ms, nothing reads as important.
- **Causality chains must animate sequentially**: when event A causes B causes C, animate them in order with micro-delays (~80–150ms gaps) — simultaneous animation of a causal chain destroys the ability to *read* causation (§1.18's staging rule at animation scale). TRS runs are the extreme case: beat events should tick visibly, one causal step at a time, so a run reads as a story.
- **Loops for state, not decoration**: looping animations should mark *ongoing states* (a waiting ferry bobs; an armed mechanism hums) — a loop that marks nothing is a battery drain and an attention thief. Every loop needs a "what state does this advertise?" answer.
- **Easing is meaning**: ease-out (fast start) reads as responsive/user-caused; ease-in (slow start) reads as heavy/mechanical; linear reads as robotic/timed. Match easing to the fiction — parcels don't ease like bells (§8.2 for the curve table).

## 6.15 Icon design micro-rules

Icons are the smallest assets with the largest consequences **[Conv]**:

- **Design at ship size**: an icon that reads at 256px and collapses at 16px was designed at the wrong size — sketch at 16px/24px equivalents, verify at actual pixels.
- **Noun vs. verb icons differ**: nouns get silhouette-heavy icons (a parcel's box); verbs get motion-implying icons (an arrow, a hand). Confused categories produce ambiguous affordances — a parcel *icon* on a button means "parcel," not "pick up parcel."
- **State badges compound, don't replace**: pressed/active states are badges or frames on the base icon, not a different icon — badge-consistency lets any icon carry any state.
- **No text inside icons**: icons must be localization-proof and small-size-proof; letterforms in icons fail both (a "P" for parcels is not a parcel).
- **The verb-icon table is versioned**: icons are part of the frozen vocabulary (§4.10) — players learn them once; changing an icon mid-production is a tutorial debt.

### Applied checklist (§6.14–6.15)

- [ ] Animation durations semantic (fast=mechanical, slow=significant); causal chains animate in order.
- [ ] Loops advertise states only; easing matched to fiction.
- [ ] Icons designed at ship size; noun/verb categories distinct; states as badges; no embedded text; icon table versioned.


## 6.16 The style-bible template

A concrete art-direction document structure — one page, fillable in a day **[Rec]**:

```markdown
# Style Bible — [Game]
## Pillars (3-5 adjective-rules)
1. Diagram-first: every frame reads as a map/diagram before a picture
2. Ink-and-paper: linework + flat fill, no gradients except light
3. Warm-quiet: desaturated palette, one warm accent
4. Stillness: motion is information; idle is calm

## Palette
- Base: #F4F1EA (paper), #2A2724 (ink)
- Roles: interactive=#2E5AAC, active=#D9822B, danger=#B3382C
- Restraint: 5 colors + 2 neutrals; anything new requires dropping one

## Shape language
- Interactive: 3px line + rounded corners
- World: 1px line + square corners
- Characters: filled silhouettes, no internal detail

## Light
- One soft source, upper-left, no shadows on interactive elements

## Type
- 2 faces: grotesque for UI, serif for flavor; 4 sizes total

## Don'ts (explicit)
- No outlines on text; no drop shadows; no textures on interactive layer
```

The pillars and don'ts are the load-bearing sections — they're what let a second artist match the first.

## 6.17 Icon design micro-rules

Icons are the smallest design unit that can sink a game **[Conv]**:

- **One metaphor per icon**: pack = a box closing, not a box+arrow+star.
- **Silhouette wins**: at 16px the icon is a shape, not a picture — test at smallest display size.
- **Consistent stroke**: every icon shares line weight (2px typical at 24px grid).
- **Vocabulary mapping**: verb icons are shaped like what the verb *does* (load_ferry = horizontal arrow into hull), not what it *is*.
- **No icon-only critical actions**: destructive/irreversible actions get icon+label; icon-only is for frequent, safe verbs.
- **States**: default/hover/disabled/active — 4 visual states per icon, designed not defaulted.
- **The pair test**: any two icons side-by-side must be distinguishable at 16px grayscale.

## 6.18 Browser rendering pipeline notes

Practical rendering for browser puzzle games **[Conv]**:

- **Canvas2D for boards**: GPU-lite, plenty for <500 sprites; simpler than WebGL for the shapes these games need.
- **Offscreen-canvas for statics**: the tile/dressing layers rendered once to an offscreen canvas; composited per frame — kills the per-frame redraw cost.
- **Dirty-rect updates**: only redraw the region that changed; for a mostly-static board this is most of the frame.
- **RAF-driven**: everything on requestAnimationFrame; no setInterval timers driving visuals.
- **State→scene mapping**: presentation reads the sim's current state each frame; no accumulating animation state that could disagree.
- **Spritesheet discipline**: one atlas per domain, packed offline; no per-frame image loads.
- **Text cost**: canvas text is expensive; prerender common strings to offscreen canvases or use DOM for UI text.

## 6.19 The anti-slop audit procedure

The mechanical process for catching decoration **[Rec]**:

1. **Screenshot the board** at ship-resolution.
2. **The squint test**: blur 4px; what's still readable should be the critical layer.
3. **The subtraction pass**: for every visual element, ask "what does this communicate?" If the answer is nothing or "it's pretty" — mark it.
4. **The pair test**: look for elements in the same visual weight; do they compete? One wins or both simplify.
5. **The fresh-eyes test**: a person who's never seen the board is asked "where do you look first?" — the answer should match the designed scan order.
6. **The 3-second test**: show the board for 3s, hide it, ask "what's the active problem?" Failure = the read stack is broken.

The audit produces a mark-list: every flagged element is either justified (kept) or deleted/simplified. No "maybe" — decorative-by-default is the failure the audit exists to catch.

## 6.20 Per-game visual pillars, locked

| Pillar | TRS | RBM | PFT |
|---|---|---|---|
| Read | Surveillance-camera stillness | Cutaway-dollhouse clarity | Diagram-first map |
| Palette | Ink+paper + one warm accent | Night blue + warm lit interiors | Island pastels + ink borders |
| Shape | Thin lines, rectangular rooms | Isometric blocks, chunky actors | Rounded islands, diagram routes |
| Light | Hard surveillance light, no atmosphere | Interior warm pools, dark exterior | Flat daylight, soft shadows |
| Type | Mono grotesque for UI | Condensed for manifest | Rounded for friendliness |
| Don'ts | No bloom, no atmosphere fog | No daylight scenes | No texture, no perspective |
| Motion | Discrete, mechanical | Smooth-but-weighty | Gentle easing everywhere |

Each game's visual identity is one row; together they read as a designed series rather than three unrelated games.

## 6.21 Accessibility deeper

Beyond the §6.7 floor **[Conv]**:

- **Text scaling**: UI survives 200% zoom without breaking layout; canvas text prerendered at 2x.
- **Motion**: `prefers-reduced-motion` disables non-informational animation (ambient particles, bounce); information-bearing animation shortens but doesn't disappear.
- **Color**: the redundant encoding is *shape/position/label*, not "another color"; the audit (§6.19) is run in grayscale.
- **Focus**: every interactive element has a visible focus state (the "focus ring" is designed, not browser-defaulted); keyboard-only playthrough is a release criterion.
- **Photosensitivity**: no >3Hz flashes; no full-screen strobing ever.

Accessibility isn't a checklist added late — it's a set of constraints the *system* is built under from the start.

## 6.22 Applied checklist (supplement)

- [ ] Style bible exists as a filled template; pillars and don'ts explicit.
- [ ] Icon vocabulary meets the micro-rules; pair-test and 16px tests pass.
- [ ] Rendering pipeline uses offscreen statics + dirty-rect + RAF.
- [ ] Anti-slop audit run per board; mark-list resolved.
- [ ] Per-game visual pillars locked and mutually consistent.
- [ ] Accessibility constraints built into the system, not audited at the end.


# PART 7 — AUDIO DESIGN

Audio is the most neglected layer in small-team games and the cheapest quality multiplier available: a game with good sound feels twice as polished at 5% of the art budget. For puzzle games specifically, audio carries real information — confirmations, state changes, causal chains — which makes it a legibility tool, not just polish.

## 7.1 Event-sound mapping: the audio verb table

Every audible event in the game needs an entry in a mapping table — the audio equivalent of the signifier table **[Conv]**. The discipline: **sound is designed per event-type, never per asset** — you don't pick "a nice click for this button," you define what "commit" sounds like and every commit uses it.

| Event class | Sound function | Design constraints |
|---|---|---|
| **Action acknowledgment** | Confirm input registered | Instant (<30ms attack), short (<150ms), quiet — it's a receipt, not a reward |
| **State change** | Signal a persistent change | Distinct per state *direction* (press vs. release need different pitches — RBM plate inversions demand it) |
| **Commit boundary** | Mark the atomic moment (Run pressed, loan committed) | The most-authorized sound in the game — weighty, clear, singular |
| **Resolution/verdict** | Pass/fail per condition | Two families only (pass-variant, fail-variant); verdicts must never sound punitive (§1.6 — the sound shouldn't laugh at you) |
| **Causal event** | World events in the sim (skid, bell, ferry depart) | Diegetic-feeling (§7.2); distinctive enough to be a timeline marker |
| **Ambient** | Bed that establishes place | Static, non-informative; must never masquerade as an event sound |
| **Error/illegal** | Action rejected | Immediately distinguishable from acknowledgment — same family, different direction; never harsh |

The mapping table columns: event → trigger (what sim event fires it) → sound ID → priority → category (diegetic/UI) → accessibility fallback (visual equivalent required? §7.8). The table is versioned like everything else — audio vocabulary is frozen vocabulary (§4.10).

Rules that matter most: **no silent events that matter** (if it changes state, it has a sound — silence is how important events become invisible, §3.8 temporal blind spots have an audio half), and **no sound for nothing** (every sound must map to an event; ornamental sound effects that fire without state-change train players to ignore the audio channel).

## 7.2 Diegetic vs. UI audio: the two-channel model

Separate the soundscape into two channels with different rules **[Conv]**:

- **Diegetic channel**: sounds of the world — skids, bells, ferry engines, parcel thuds. Rules: positioned (louder toward where it happens — stereo pan for 2D games is a free legibility cue), material-consistent (wood sounds like wood), event-mapped (exists because a sim event happened). Diegetic sounds carry *spatial* information.
- **UI channel**: sounds of the interface — commits, hints, menu moves, verdicts. Rules: centered, dry (no reverb tail that muddies the next sound), abstract (UI sounds aren't things, they're signals), quieter than diegetic in conflict. UI sounds carry *system* information.

The categories must never leak: a diegetic-sounding UI cue (a door creak for a menu) confuses the ontology of the soundscape ("what just happened in the world?" — nothing did); a UI-sounding diegetic event (a synth blip for a bell strike) breaks the world's material truth.

## 7.3 Procedural synthesis basics: WebAudio reality

A browser portfolio gets its sound from **synthesis, not sample libraries** — cheaper to ship (zero audio files), smaller to load (§6.8's load budget), and infinitely parameterizable **[Rec for this platform]**. WebAudio primitives that produce a complete sound palette:

- **Oscillators**: sine (pure tones — UI pings, bell fundamentals), triangle (softer harmonics — wooden knocks), sawtooth (bright/buzzy — machinery, filtered down for most uses), square (hollow/retro — alarms). Pick per material-family: metals = sine+noise transient; wood = triangle+short decay; mechanical = saw+lowpass.
- **Noise buffer**: white noise through filters is 60% of foley — skids, thuds, whooshes are shaped noise. A bandpass sweep down = skid; a short burst + lowpass = thud; shaped noise is the difference between "synthesized" and "dead cheap."
- **ADSR envelopes**: Attack-Decay-Sustain-Release shapes loudness over time. The values that matter: UI acks (A 5–20ms, D 60–120ms, no sustain), impacts (A 1–5ms, D 100–400ms), beds (A 2–5s, sustain). Attack time alone is 80% of whether a sound feels instant or soft.
- **Filters**: lowpass (dulls/softens — distance, material, underwater), highpass (thins — tension, shrill), bandpass (the whoosh-maker). A lowpass at ~400Hz is the universal "far away" signifier.
- **LFOs/modulation**: slow oscillators driving parameters — vibrato (pitch wobble) for living sounds, filter wobble for mystery/unease. Used sparingly: modulation is the difference between a machine and a creature.
- **Scheduled automation**: WebAudio's `setValueAtTime`/`linearRampToValueAtTime` sequence parameters — a sequence of pitch events over time is how you make *motifs* (the pass-chime, the fail-low) rather than single blips.

Minimal synth stack per game: ~15–25 parametric sound definitions (JSON: type, freq, envelope, filter, duration) covering the event-sound map, a tiny synth engine (~200 lines: oscillator + gain envelope + filter chain + noise), and zero audio files. The whole stack is smaller than one sprite.

## 7.4 Sound palettes: a sonic style bible

The audio analog of the style bible (§6.2) **[Rec]**:

- **Frequency slotting**: assign each event family a frequency band — high (UI acks, ~2–6kHz), mid (causal events, ~500–2kHz), low (impacts, ambiences, ~80–500Hz). Slotting prevents masking: events in the same band blur together, events in separate bands stay distinct. The mix is an allocation problem, not a volume problem.
- **Material consistency**: wooden things sound wooden everywhere — the bible maps entity materials → synth families (wood→triangle, metal→sine+noise, mechanical→saw+lowpass) so a bell and a parcel-thud live in the same world.
- **The motif**: one short musical gesture (2–4 notes) as the game's audio signature — the pass-chime variant, the level-complete flourish. Motifs work like logos: consistent, short, and appearing at meaningful moments only (a motif that plays constantly is wallpaper).
- **The silence budget**: decide where silence lives — under UI sounds never (they must always read), under contemplation always (puzzle thinking wants quiet). A game that's never silent has no dynamic range; the wins don't land because nothing was ever quiet.

### Applied checklist (§7.1–7.4)

- [ ] Event-sound table complete: every event mapped, no silent important events, no unmappable sounds.
- [ ] Diegetic/UI channels separated with different rules; no leakage between them.
- [ ] Synthesis stack: oscillator+envelope+filter+noise per event; ~15–25 defs cover the map.
- [ ] Frequency slotting assigned; material table in audio bible; one motif; silence budgeted.


## 7.5 Mix priorities: what plays loudest when everything fires

A mix is a priority system executed in real time **[Conv]**. When multiple events fire together — and in these games they do, every beat boundary — the mix decides what the player hears. The priority stack, top-down:

1. **Verdicts and commit boundaries** — the most important sounds in the game; always full presence, never ducked.
2. **Causal events on the critical path** — the bell, the skid, the delivery: the sounds that ARE the story of the run. Duck everything beneath them ~6–9dB during their window.
3. **Action acknowledgments** — short enough that they're almost always over before priority 1–2 conflicts; keep them out of the same frequency band as verdicts (§7.4 slotting).
4. **Ambient beds** — the first thing to duck; beds exist to fill silence, and their job during busy moments is to leave. Sidechain-style ducking (bed volume drops when causal events fire) is a few lines of gain automation and is the single biggest "sounds professional" trick in game audio.
5. **Ornamental/secondary** — decorative loops and minor foley; cut first, cut entirely under contention.

Loudness targets for browser delivery **[Rec]**: aim for perceived mix centered ~-16 to -14 LUFS equivalent (there's no browser loudness standard; the practical rule is "clearly audible on laptop speakers, not blown out on headphones"), with peaks capped ~-1dBFS via a limiter on the master bus. The bigger danger in WebAudio is unbounded stacking — 8 simultaneous synth voices at full gain = clipping distortion that reads as cheap. A master limiter (DynamicsCompressor node) is 5 lines and prevents the entire failure class.

## 7.6 Audio as teacher: earcons and mechanical feedback

Audio teaches when sounds carry *consistent information* **[Conv]**:

- **Earcons** (audio icons): short distinctive sounds assigned to meanings — a rising two-note for "progress," a falling one for "regression," a specific chime for "condition satisfied." The earcon table must be *taught once and held*: three exposure rules apply (the player needs ~3 consistent pairings before the sound means anything), and earcons collapse if the same sound means two things.
- **Mechanical truth in audio**: the sound should tell you *why* — a plate releasing because its load left vs. because a token was returned can be the same event with different *contexts*, and the audio should match (release-thud vs. return-chime). Sounds that don't distinguish causes force players to check visually what audio could have told them.
- **The beat clock in audio**: for beat-driven games, an audible tick is the strongest temporal anchor available — but it must be subliminal by default (a felt pulse, not a metronome demanding attention) and it must be *accurate*: an audio tick that's off the sim's beat is a trust leak. If you can't keep the audio clock phase-locked to the sim, leave the tick visual-only.
- **Warning gradients**: urgency can be communicated by *pitch/tempo escalation* — the classic "time running out" cue. Use sparingly: escalation only works if the game is honest about what's expiring (RBM's approach to midnight could carry a rising pulse — legitimate because the deadline is real; a fake escalation on a contemplative game is a lie).

## 7.7 Music strategy for contemplative games

Music in puzzle games has one job: **support thinking without demanding attention** **[Conv for genre]**:

- **Ambient/textural over melodic**: memorable melodies compete for working memory (§1.10 — the same resource the puzzle wants). Drone-textures, slow chord beds, and generative loops serve contemplation; hook-driven melodies serve trailers.
- **Generative layers**: WebAudio can synthesize music too — slow pad progressions with probabilistic variation, or layers gated on game state (a base layer always; a second layer during committed runs; a third during near-complete states). State-gated layers are adaptive music at ~50 lines of code — the cheapest adaptive system there is.
- **When to have none**: silence is legitimate strategy. The Witness famously shipped with almost no music — the soundscape IS the soundtrack. For a portfolio: TRS could ship ambient-only (the archival room tone + events), RBM benefits from a slow nocturne pulse, PFT from gentle generative mallets. Different games want different music budgets; the bible-level rule is only that music never fights state information for the mix.
- **The off switch is sacred**: a mute that works instantly, persists, and is easy to find — players playing on calls, at night, or who just don't want audio must never fight for it. Mute is table stakes; volume granularity (music/SFX split) is the grown-up version.

## 7.8 Audio accessibility

Audio accessibility is two directions **[Conv]**:

- **Deaf/hard-of-hearing**: every information-carrying sound needs a visual equivalent — state flashes, timeline markers, HUD pings. The accessibility fallback column of the event-sound table (§7.1) is where this lives; the rule is *no info exclusively in audio* (a bell that only rings audibly is a blind-spot bug — literally: it punishes deaf players and players on mute equally).
- **Reduced audio options**: not everyone can parse busy soundscapes — options for simplified mixes (fewer simultaneous events, longer event spacing) and mono output (stereo panning must never carry sole information — the left/right cue needs a visual counterpart).
- **Cognitive audio load**: the same working-memory budget applies — ≥3 simultaneous distinct sounds is where parsing degrades; the mix priority system (§7.5) protects this by ducking/cutting under contention.

## 7.9 The audio implementation checklist

Engineering reality for browser audio **[Rec]**:

- **Autoplay policy**: browsers block audio until a user gesture — first interaction unlocks the AudioContext; design the first-screen interaction to unlock naturally ("press to begin" is the universal pattern, and it doubles as the title screen).
- **Scheduling discipline**: WebAudio scheduling must be driven by the sim's beat events, not requestAnimationFrame polling — beats fire audio precisely (the beat-clock rule §7.6); scrubbing the timeline must silence in-flight sounds and re-fire events correctly on replay.
- **Preload the noise buffer**: noise generation at load, not first-use — first-use generation causes a hitch exactly when the first skid happens.
- **Gain-node architecture**: master → buses (diegetic/UI/music/ambient) → event voices. The bus structure is what makes ducking, muting-by-category, and accessibility-mix options trivial — build the buses first, they're ~20 lines.
- **Voice stealing**: cap simultaneous voices (~8–12) with oldest-first stealing — an event storm can't clip or crackle; the mix protects itself.

## 7.10 Applied: audio identity for the three games

| Element | TRS | RBM | PFT |
|---|---|---|---|
| Sonic world | archival room — tape hiss, paper, mechanism clicks | nocturnal heist — distant traffic, interior warmth, mechanism precision | pastoral postal — birds, water, bells, friendly thuds |
| Signature sound | the tick + the event crack (events interrupting stillness) | the phase-clock pulse + heist-familiar latches/clicks | the parcel thunk + ferry bell |
| Verdict pair | record-scratch pass / dead-air fail | sunrise-approach pass / alarm-adjacent fail (never harsh) | delivery-stamp pass / gentle return-to-sender fail |
| Music | none or room-tone only | slow nocturne pulse, tempo toward midnight | generative mallets, per-island variation |
| Beat anchor | mechanical tick (diegetic — the record's clock) | phase transition swells | none needed (untimed) |
| Risk call | letting stillness do the work — most of the game nearly silent | making the deadline *audible* without stress fatigue | keeping charm sounds from cluttering information |

## 7.11 Common audio mistakes + model card

| # | Mistake | Signature | Fix |
|---|---|---|---|
| 1 | Silent important events | State changes with no audio | Event-sound table completeness |
| 2 | Audio info only | Deaf/mute players miss critical info | Visual equivalents required |
| 3 | Mix flatline | All sounds equally loud during busy beats | Priority stack + ducking |
| 4 | Voice-stack clipping | Event storms distort | Master limiter + voice cap |
| 5 | Ornamental sounds | Sounds that fire on nothing | Every sound maps to an event |
| 6 | Punishing verdicts | Fail sounds that mock | Verdict pair: informative, not insulting |
| 7 | Competing music | Melodies fighting working memory | Ambient/texture over melody |
| 8 | The metronome | Audible ticking that isn't accurate or wanted | Phase-locked tick or none |
| 9 | No mute path | Players trapped with audio | Instant persistent mute |
| 10 | Slop sfx | 15 unrelated stock sounds | Synth palette from one material table |

| Design object | Instrument | Verified by |
|---|---|---|
| Event sounds | Event-sound table | Silent-event audit |
| Channels | diegetic/UI separation | Ontology check |
| Mix | priority stack + ducking | Busy-beat listening pass |
| Teaching | earcons + gradients | Consistency (3-exposure) |
| Access | visual equivalents, mute | No-audio playthrough |
| Identity | material table + motif | Palette review vs. bible |


## 7.12 Synthesis recipes: the concrete toolkit

WebAudio recipes for the sounds a game like this actually needs **[Conv, recipes Rec]**:

**The UI tick**: sine osc at 800-1200Hz, 30-50ms, ADSR(2ms, 20ms, 0, 30ms), gain ~0.15. Slight random detune (±20Hz) prevents machine-gun repetition.

**The commit thunk**: sine at 120-180Hz + filtered noise burst at 2-4kHz, ADSR(5ms, 80ms, 0, 150ms), gain ~0.4. The low sine = weight, the noise = texture.

**The error buzz**: two detuned saws (100Hz ± 5Hz), lowpass at 800Hz, ADSR(10ms, 200ms, 0.3, 100ms), gain ~0.2. Harsh but not punishing.

**The success sting**: a 2-3 note motif (e.g. C5→E5→G5), triangle osc, ADSR(20ms, 400ms, 0.1, 300ms), gain ~0.3, slightly delayed note onsets (50ms).

**The ambient bed**: two detuned sines or a filtered noise (lowpass ~500Hz), very slow amplitude LFO (0.1Hz), gain ~0.05. Should be felt, not heard.

**The wind/textured layer**: filtered noise, bandpass ~1-3kHz, slow gain LFO, randomized center frequency drift. For TRS's phonograph hiss or RBM's night air.

**The mechanical truth**: for a scheduled game, the beat-clock tick is a click (very short square, 2-5kHz, 20ms, gain 0.1) + a small whoosh per phase change. Mechanical means predictable: same tick every beat, not varied to death.

**Pattern**: every recipe is an osc/noise source + filter + envelope + gain + a light modulation. Anything more complex and you're building instruments; pick a palette and stick to it.

## 7.13 The mix math

Browser audio mixing numbers that work **[Rec]**:

- **Master**: -1dBFS peak limiter, ceiling -1. Never rely on the OS volume.
- **Music bed**: -18 to -14 LUFS perceived (~-20dBFS RMS); sits under everything.
- **UI**: -10dBFS peaks; short, transient.
- **Critical events** (verdict, insight): -6dBFS peaks; allowed to punch through via ducking.
- **Ambient**: -24dBFS RMS; subliminal.
- **Voice/dialogue** (if any): -12dBFS peaks, ducks everything else.

**The duck rule**: when a critical event fires, sidechain-duck the music by -6dB for 400ms. Ducking is how a mix gets priority without loudness.

**Headroom**: leave 6dB of headroom under the limiter; a mix that hits the ceiling on every event is a mix that clips.

## 7.14 Adaptive music implementation

Generative music that's actually achievable in a browser **[Conv]**:

**The layer-gate model**: N loops (e.g., pad, rhythm, melody, sparkle) all running in sync; the game state gates which loops are audible. Idle = pad only; active thinking = pad+rhythm; near-solution = pad+rhythm+melody; solve = all + sting.

**The state map**: a small table game-state → layer-mask; the only adaptive logic needed. No real-time composition.

**Transitions**: layers fade in/out over 2-4 beats; a hard cut is worse than no adaptation.

**The contemplative strategy for the portfolio** **[Rec]**:
- **TRS**: a single sustained pad + the phonograph's mechanical hiss; music enters only post-solve.
- **RBM**: a slow nocturne pulse (one note per beat-phase); layers join as the night progresses.
- **PFT**: generative mallets — a pentatonic scale triggered by moves; success = the phrase completing.

Each is 3-4 loops + a state map. A full dynamic score is a team, not a solo.

## 7.15 Audio testing and QA

Audio bugs are invisible until someone hears them **[Rec]**:

- **The silent-test**: play a level with sound off; nothing important should be lost (accessibility + falls back gracefully).
- **The loud-test**: play with audio at max; no clipping, no harsh transients, limiter engaged.
- **The context-test**: play while music/ambient runs; event sounds still readable.
- **The autoplay-test**: open the game cold on a fresh browser; the first gesture unlocks audio correctly.
- **The leak-test**: run for 10 minutes; no accumulating voices/nodes (WebAudio leak = eventual silence or crash).
- **The platform-test**: Chrome + Safari + Firefox; WebAudio quirks differ (Safari's stricter autoplay, Firefox's different noise buffering).
- **The mix-test on small speakers**: laptop/phone speakers drop low end; critical events need mid/high frequency content.

## 7.16 Voice and dialogue

If the game uses any voice: **[Rec]**

- **Voice direction**: one speaker, one mic, one acoustic space; mixing multiple sources without normalization is a giveaway of amateur production.
- **Record dry**: no reverb baked in; add it in-engine if needed.
- **Caption everything**: voice is never the only channel for information.
- **Small vocabulary**: 10-20 lines, used precisely; a character who talks constantly is noise.
- **Consider silence**: for puzzle games, no voice is often the right call — words on screen read faster than spoken ones and don't date.

## 7.17 The audio manifest

Audio assets tracked like everything else **[Rec]**: every sound in the manifest with (name, event-mapping, source/recipe, format, loudness-normalized?, bus, license). Orphaned audio files are a smell; a sound with no mapped event is dead weight.

## 7.18 Applied checklist (supplement)

- [ ] Recipes exist for all event classes in the palette.
- [ ] Mix numbers assigned per channel; ducking wired.
- [ ] Adaptive music = layer-gate + state-map, not freeform composition.
- [ ] Silent/loud/context/autoplay/leak/platform tests all run.
- [ ] Audio manifest complete; no orphans.


# PART 8 — GAME FEEL & JUICE

"Game feel" is the quality of the loop between what the player does and what the game shows. For puzzle games the stakes are different from action games: nobody needs the parcel to feel weighty in their thumb, but everybody needs the game to feel *truthful* — responsive, honest, and unembellished. Juice is seasoning; the rules here are mostly about restraint.

## 8.1 Input response and the latency budget

Responsiveness is the foundation under all other feel **[Conv]**:

- **Input-to-acknowledgment < 100ms**: the visible/audio acknowledgment of any input must land within ~100ms or the input feels ignored. In browser games the killers are event-loop stalls (a heavy operation blocking the frame) and waiting for animation/confirm before acknowledging — acknowledge first, resolve second (§8.7's loop).
- **Input buffering**: actions taken during a resolution (a second proposal while the first animates) should be queued, not dropped — dropped inputs feel like broken controls. For committed-run games (TRS) the rule is stricter: inputs during a run must either be accepted-and-queued-for-after or cleanly rejected with a visible reason — silently eating inputs is the worst of both.
- **Hover/focus preview**: the affordance check — hover states must fire <50ms and be accurate (a hover highlight on something not actually interactive is a §2.3 lie). Previews (§3.9) are the high-value hover: showing what *would* happen is worth 10× its cost in feel.
- **Perceived latency vs. actual**: a sound that fires at input-time plus an animation that resolves over 300ms *feels* instant even though the resolution took 300ms — perceived latency is about the first confirmation, not the last. Budget accordingly: acknowledgment is instant; resolution can take its designed time.

## 8.2 Animation curves and the easing table

Curves are the shape of change over time; they carry meaning (§6.14 previewed this) **[Conv]**:

| Curve | Shape | Reads as | Use for |
|---|---|---|---|
| Linear | constant | mechanical, timed, relentless | beat ticks, clock hands, deterministic motion |
| Ease-out | fast→slow | responsive, light, "done quickly" | UI acks, pickups, hover states |
| Ease-in | slow→fast | heavy, gathering momentum | big doors, deliveries, weight |
| Ease-in-out | slow→fast→slow | smooth, deliberate, cinematic | camera moves, major transitions |
| Overshoot/back | past→settle | springy, playful, "snap" | parcel placements, confirmations |
| Anticipation | back→forward | wind-up, intentionality | anything committing (the run start) |
| Bounce/spring | oscillating settle | physical, fun | deploy pieces locking in, board spawns |

Duration defaults: acks 80–150ms, standard transitions 200–300ms, significant changes 350–600ms, >800ms only for ceremony (level-complete reveals). Easing must match the fiction and the semantics — and consistency matters more than any single choice (the state-change language §6.14: players learn "quick changes are small, slow changes are big" and un-learn it painfully if the durations scramble).

## 8.3 Anticipation, action, recovery

Animation principles 101, but for puzzles they map differently **[Conv as animation canon]**:

- **Anticipation** (wind-up before the move): in action games it's a character crouch; in puzzle games it's the *pre-commit state* — the held parcel hovering, the "about to run" pulse on the commit button, the placement ghost previewing. Anticipation in UI form = affordance that the next action is significant.
- **Action** (the move itself): must be *readable as a single unit* — a delivery should read as one gesture even if it's 5 internal steps. Multi-step sims resolved as one fluid action vs. stepped one-by-one is a staging choice (§6.14's sequencing rule decides which).
- **Recovery** (the settle): the post-action state must read as *rest* — an action that leaves residual motion or unresolved states feels unfinished. Deliveries end static; hovers end clean. Recovery is also where the game shows the *consequence* — the aftermath frame should hold long enough to be registered (~300ms minimum on decisive moments).

## 8.4 Screenshake, particles, and the restraint doctrine

The two most abused feel tools **[Conv]**:

- **Screenshake** disciplines: shake should communicate *impact magnitude* and nothing else — Eiserloh's trauma model (shake intensity accumulates with event weight, decays over time) is the standard. For puzzle games the legit uses are few: a heavy delivery landing, a verdict hit. Rules: ≤3 shake "types" (small/med/large), each mapped to event classes in the feel bible; NEVER shake on UI actions or menus; rotational shake is subtler and less nauseating than translational at the same amplitude; and `prefers-reduced-motion` disables it entirely (§6.7).
- **Particles** disciplines: particles are for celebrating *states* (delivery sparkle, condition-met shimmer) and ambient texture — never for hiding emptiness. Budget: one particle type per event class; max simultaneous emitters ~4; particle lifetime <1.5s (long-lived particles become noise); and every effect must pass the subtraction test (§6.9) — remove it, does anything get less clear? Particles that fail are slop.
- **The restraint doctrine generally**: every feel element must answer "what does this tell the player?" Juice that answers nothing is noise at best and confusion at worst — a sparkle with no state-change teaches players to *distrust* sparkles, which is worse than no sparkle at all.

## 8.5 State interpolation and time control

For beat/move-driven games, feel lives in how discrete state becomes continuous display **[Rec]**:

- **Discrete sim, interpolated display**: sims tick in beats; the renderer interpolates positions/transitions *between* state snapshots — entities ease from beat-position to beat-position rather than teleport. The rule that preserves determinism (§4.6): interpolation is presentation-only, never feeds back into sim.
- **Scrubbing = time travel**: the timeline scrub (jump to beat N with restored state) is a feel feature as much as a debugging one — scrubbed state changes should animate *fast* (compressed duration ~50–100ms per skipped beat) so scrubbing feels like fast-forwarding through time, not teleporting.
- **Playback speed as a player control**: 1×/2×/4× run speeds respect the player's time — a re-watch at 4× is courtesy; first-watches default to 1× because the run is the drama (§1.18). Speed is presentation-only; the sim ticks identically regardless.
- **Pause as a first-class state**: runs must be pausable mid-beat (state serializable at any boundary); a run the player can't pause is a hostage situation for attention.

### Applied checklist (§8.1–8.5)

- [ ] Ack <100ms everywhere; inputs buffered or cleanly rejected; hover <50ms.
- [ ] Easing table adopted; durations semantic and consistent.
- [ ] Every action reads as anticipation→action→recovery; decisive moments hold ≥300ms.
- [ ] Shake ≤3 types, event-mapped, reduced-motion off; particles budgeted and subtractable.
- [ ] Sim/display interpolation clean; scrub fast-forwards; speeds 1×/2×/4×; pause anytime.


## 8.6 The feedback loop: input → acknowledge → resolve → confirm

The complete feel loop has four stages, and feel failures localize to exactly one **[Conv]**:

1. **Input** — player acts. Requirements: controls legible (signifiers §2.3), inputs buffered (§8.1).
2. **Acknowledge** — <100ms confirmation the input registered: the button depresses, the parcel lifts, the sound fires. Acknowledgment is *immediate and cheap*; it says "heard you," not "here's what happens."
3. **Resolve** — the sim does the work: the action applies, states change, consequences propagate. Resolution duration is designed time (§8.2 durations); it may be instant or staged (a run's beats).
4. **Confirm** — the final state is presented as rest: the parcel rests, the verdict stamps, the dust settles. Confirmation says "this is now true" — skipping it leaves the player uncertain whether the action *took* (the unresolved-recovery problem, §8.3).

Two canonical failures: **acknowledge-and-resolve fused** (the UI waits for the sim before showing anything — feels laggy even at 60fps) and **no confirm stage** (the state changes but nothing marks it as settled — players double-click, causing double-actions, because they didn't trust the first one registered). Design every interactive surface through the four stages explicitly; most "the UI feels bad" complaints are one missing stage.

## 8.7 Feel in the planning/observation split

Different interaction models need different feel investments **[Rec]**:

- **Planning surfaces** (placing interventions, editing manifests, arranging pieces): feel = *tactile confidence* — drags that track exactly, snaps that announce (a snap needs its own small ack — a click sound and a 80ms settle), ghosts that preview legality (green/red placement states as immediate validation). Planning feel is about making manipulation trustworthy: the player should feel the *system* through the UI.
- **Observation surfaces** (watching runs): feel = *dramaturgy* (§1.18) — pacing, staging, the rhythm of beats ticking, the held frame on decisive moments. Feel work here is tempo: a run that dumps its resolution instantly has no drama; a run that crawls has no respect. Beat-to-beat pacing ~250–500ms per beat reads as "alive" without dragging.
- **The boundary** (the commit moment): feel = *stakes* — the Run button deserves the game's heaviest acknowledgment (a real sound, a real transition). The commit is the emotional hinge; undersell it and runs feel like paperwork.

## 8.8 Polish tiers vs. scope: what to feel-first

Feel work has steeply diminishing returns and must be sequenced **[Rec]**:

- **Tier 1 (mandatory)**: input acknowledgment, the four-stage loop, basic state-change transitions, timeline scrub. Without these the game feels broken, not unpolished.
- **Tier 2 (the 20% that reads)**: commit-boundary ceremony, verdict staging (pass/fail moments), smooth interpolation, the delivery/resolve confirmations. This tier is where "feels polished" comes from — concentrated on the moments players screenshot.
- **Tier 3 (return-diminishing)**: ambient motion (idle loops), secondary particles, micro-interactions on every surface. Add only after Tier 2 is verified and only where they answer the restraint-doctrine question (§8.4).
- **Never**: juice that obscures state (a confetti burst over the parcel you needed to see), juice that delays information (a 2s intro animation before the board is readable), juice that lies (a sparkle on a failed action).

Budget rule: polish effort concentrates on the *moments players will remember and share* — the commit, the solve, the verdict, the final delivery. A game polished everywhere is a luxury; a game polished at its peaks reads as polished everywhere.

## 8.9 The feel audit: a walkthrough protocol

Feel degrades invisibly during production; the audit catches it **[Rec]**:

1. **Cold-start walkthrough**: title → first level → first action — time every stage; every >100ms gap between input and ack is a finding.
2. **The spam test**: rapid repeated inputs on every interactive surface — buffering failures, stuck animations, and missed inputs all surface here.
3. **The interruption test**: mid-animation interruption (click during transition, cancel during run) — state must stay consistent; players *will* do this.
4. **The mute test**: all-information-must-survive-silence (audio as redundancy, not carrier).
5. **The reduced-motion test**: same completeness with motion off.
6. **The slow-machine test**: throttle CPU 4× (dev tools) — feels fine at 60fps can be broken at 20fps; ack stages must never depend on frame timing.

## 8.10 Juice that serves puzzles: the allowed list

Where juice legitimately helps this genre **[Rec]**:

- **Anticipation on commits** (the game's heaviest ack, §8.7).
- **Sequential resolution** (causal chains animating in order — feel AND teaching, §6.14).
- **Verdict ceremony** (solve moments earn flourish — it's a peak the player remembers, §1.14 peak-end).
- **State celebrations on landmarks** (first completion of a mechanic, chapter closes — earned, rare).
- **Micro-confirms on combos** (batch deliveries, multi-condition satisfies — marks the player's efficiency visibly).

Where it's never allowed: anywhere it competes with state information, anywhere it delays the read stack, anywhere it fires without a state change.

## 8.11 Applied: feel budgets per game + model card

| Feel surface | TRS | RBM | PFT |
|---|---|---|---|
| Hero moment | the run (commit→watch→verdict) | the returns phase (the exhale) | the under-par delivery |
| Planning feel | placement ghosts + slot constraints | manifest editing + phase previews | drag-snap-deploy tactility |
| Observation feel | beat tick pacing + camera staging | phase-step reveals + ray sweeps | n/a (interactive) |
| Verdict feel | stamp/record motif | sunrise/dawn resolution | delivery stamp + route completion |
| One risk call | resist over-animating the sim — events must stay legible | resist letting phase reveals blur the beat boundaries | resist charm that buries the accounting |

| Design object | Instrument | Verified by |
|---|---|---|
| Responsiveness | 4-stage loop, <100ms ack | cold-start audit |
| Temporal language | easing/duration table | consistency pass |
| Drama | commit/verdict ceremony | peak-moment reviews |
| Restraint | subtraction test | feel audit |
| Time control | scrub/speed/pause | interruption test |


## 8.12 The animation principles, applied to games

Disney's 12 principles, translated for interactive media **[Conv]**:

- **Squash & stretch** — in games it's applied to state changes, not character bodies: a button compresses on press (the acknowledgment), a tile bulges on placement.
- **Anticipation** — the wind-up before the action: a cursor pulse before a commit, a token lean before a return. Skips when latency matters more (§8.1's <100ms).
- **Staging** — where the eye goes: a single bright/moving element at the decisive point; everything else dims/mutes.
- **Straight-ahead vs pose-to-pose** — games are pose-to-pose media: discrete states, interpolated transitions. Don't tween every frame; tween between states.
- **Follow-through & overlap** — objects settle rather than stop: a parcel slides, bounces, rests. Adds ~50ms of perceived weight.
- **Slow in & out** — easing: default ease-out (fast start, gentle land) for player-initiated actions; ease-in-out for world-driven changes.
- **Arc** — moving things on curves, not straight lines: a parcel's path arcs toward its destination even on a grid.
- **Secondary action** — the supporting motion that makes the main motion legible: a door's hinge squeak *and* the shadow under it opening.
- **Timing** — see §8.2's duration table; the single most consequential principle for feel.
- **Exaggeration** — amplify the meaningful, not the arbitrary: a successful solve can overshoot and settle; a failure can't be dramatized into a punishing spectacle.
- **Solid drawing → solid state** — objects read as having persistent presence (no popping in/out; a token off-screen still exists in the sim's presence).
- **Appeal → legibility** — appealing motion is motion that communicates; nothing extraneous is animated.

## 8.13 The "dead game" diagnostic

When a game feels dead, it's almost always one of five fixable causes **[Rec]**:

1. **No acknowledgment layer** — inputs go straight to resolution. Add the <100ms ack (sound + micro-animation); most "deadness" is actually missing acks.
2. **Uniform timing** — every transition uses the same duration. Add duration variety by event importance (200ms ack, 500ms resolve, 1s confirm).
3. **No motion language** — state changes teleport. Add the minimum: fade + scale, or slide along the causal axis.
4. **Silence** — even muting the audio, a dead mix means dead feel; check §7.1's event-sound table is actually wired.
5. **Stasis between actions** — the world does nothing while the player thinks. Add the ambient layer: idle animations on entities, drifting particles at low density, a breathing UI.

The diagnostic order: ack → timing → motion → audio → ambient. Each is cheap; skipping them makes the game feel unfinished regardless of content.

## 8.14 Juice that's earned vs. juice that's free

Not all polish costs the same **[Rec]**:

**Cheap juice (always do)**:
- Input acks (<100ms): cost = one function call per input.
- Eased transitions: cost = `ease-out cubic` in the tween system.
- A solved state that celebrates (one burst, one sting): cost = one effect.
- A persistent mute and a working pause: cost = wiring.

**Expensive juice (schedule deliberately)**:
- Custom animation per verb-noun pair: cost scales with vocabulary size — budget explicitly.
- Physics-driven reactions (particles responding to sim): cost = engineering + tuning.
- Camera choreography: cost = a camera system, worth it only for showcase moments.
- Adaptive audio layers: cost = composition + implementation; see §7.8.

The rule: **cheap juice is non-negotiable; expensive juice is chosen per-game**. TRS earns its fixed-camera discipline through ack/timing/motion polish, not spectacle. RBM earns its heist feel through the settle-phase exhale animation. PFT earns its coziness through gentle motion and the under-par celebration.

## 8.15 Feel failure catalog

- **Mushy inputs**: ack >100ms, or absent. Fix: input→ack immediately, resolution later.
- **Snappy-but-empty**: instant teleports that feel hollow. Fix: 50ms scale-settle on state changes.
- **Over-juiced**: every event shakes/particles/pulses. Fix: subtraction (§6.9) applied to motion.
- **Conflicting feedback**: animation and audio disagree (the sting says success, the verdict says fail). Fix: single source of truth on outcome.
- **Forgotten edge states**: what does "paused mid-transition" look like? "Muted mid-sting"? Fix: the spec covers every transition's start/mid/end.
- **Feel debt**: "we'll polish later" — later never comes. Fix: §8.8's polish tiers in the schedule.

## 8.16 The feel spec: a template

For each verb, write the feel spec row **[Rec]**:

| Verb | Ack (<100ms) | Resolve (300-600ms) | Confirm (0.5-1s) | Sound | Motion |
|---|---|---|---|---|---|
| pickup | cursor-grip + soft tick | item lifts + shadow | rest state + drop sound | tick→lift→thud | ease-out arc |
| deploy | cursor-place ghost | piece fades in + settles | sit sound | deploy thunk | fade+scale |
| loan | stamp slide | token moves to manifest | due-beat marker appears | stamp+slide | along manifest axis |
| redirect | junction highlights | path redraws | path-settle sound | junction click | line morph |

A feel spec is content: it lives in the LevelCard-adjacent spec and gets reviewed with the level.

## 8.17 Applied checklist (supplement)

- [ ] Every verb has a feel-spec row (ack/resolve/confirm/sound/motion).
- [ ] Dead-game diagnostic run: acks <100ms, durations varied, no teleports, audio wired, ambient present.
- [ ] Expensive juice chosen per-game and in the schedule.
- [ ] Edge states (pause mid-transition, mute mid-sting) specced.
- [ ] No feedback contradiction: animation and outcome agree.


## 8.18 Juice recipes per game

Concrete feel patterns for the portfolio **[Rec]**:

**TRS — the surveillance feel**:
- Commit: a mechanical "chunk" (the plan locks in; 300ms scale-settle on the commit UI).
- Rewind: the timeline scrubs backward with a tape-hiss + speed-ramp; resim is shown as a cut, not a morph.
- Solve: the verdict stamps (a single 150ms stamp animation + ink sound); no confetti — the observation aesthetic.
- Fail: the world stills for 400ms before the verdict; the pause IS the judgment.

**RBM — the heist feel**:
- Loan: a stamp sliding onto the manifest (200ms) + a ledger-line animation.
- Carry: tokens bob slightly in the carrier's sprite; HEAVY = slower bob, deeper shadow.
- Place: the token settles into its restingOn spot (ease-out 300ms); a placed token glows faintly.
- Guard scan: a cone-pulse from the guard (400ms); the scanned room darkens briefly.
- Settle: the night exhales — all verbs dim, the manifest scrolls closed, returns resolve in sequence (1s per return, staggered).

**PFT — the cozy feel**:
- Pickup: parcel pops into the carrier's hands (150ms ease-out bounce).
- Pack: a fold animation (250ms) + paper-crumple sound.
- Load/ride ferry: the ferry physically moves along its edge (interpolated, not teleported); the courier stands on it.
- Deliver: a soft ding + the parcel fades into the recipient (300ms).
- Under-par: the move counter flashes green once + a small sting; no celebration cascade.

## 8.19 The input-handling contract

How inputs are processed **[Conv]**:

- **Input queue**: inputs buffer during resolution; they're applied at the next sim tick, not dropped.
- **Hover preview**: on hover, show the action's consequence ghost before commit (the predict affordance); this is free prediction, not a tutorial.
- **Drag vs click**: decide per verb — pickup/drag for physical verbs (PFT), click for discrete verbs (TRS junctions); mixing both confuses the mental model.
- **Cancel**: right-click/Esc always cancels a pending draft; a draft is never locked until explicitly committed.
- **Multi-input**: simultaneous inputs resolve in fixed order (documented); no "whoever clicked first wins" races.
- **The commit boundary**: draft → commit is a single atomic action; the UI shows the boundary (a "Ready" state vs a "Running" state).

## 8.20 The timing curve reference

Duration values that work **[Conv + Rec]**:

| Action | Duration | Curve |
|---|---|---|
| Input ack | <100ms | instant or ease-out 50ms |
| Hover preview | 80-120ms | ease-out |
| Button press | 100-150ms | ease-in-out |
| Placement settle | 200-350ms | ease-out |
| Token carry | 400-600ms | ease-in-out |
| Path redraw | 300-500ms | ease-out |
| Solve reveal | 500-1000ms | ease-out + slight overshoot |
| Verdict stamp | 150-200ms | ease-in (weight) |
| Scene transition | 400-800ms | ease-in-out |
| Ambient drift | 2-6s | sine |

Rule: durations <50ms read as instant; >1000ms read as a cutscene. Most game feel lives in the 100-600ms band; the outlier durations (instant ack, slow ambient) are the anchors that make the middle feel right.

## 8.21 Applied checklist (supplement)

- [ ] Juice recipes specced per game; each verb's feel row exists.
- [ ] Input contract: queue, preview, cancel, commit boundary all implemented.
- [ ] Timing curves follow the reference table; no 50-100ms dead zone.
- [ ] Feel audit run (§8.6): every verb has ack/resolve/confirm.
- [ ] Expensive juice (§8.14) budgeted and chosen.


# PART 9 — ONBOARDING & TUTORIALS

Onboarding is the moment the game makes its contract with the player (§1.11). For puzzle games, onboarding is where most churn happens — not because the game is hard, but because teaching is a design skill most teams under-invest in. The genre's gold standard is "teaching without tutorials" (§2.8); this part is the engineering of that ideal.

## 9.1 The teach-test-stretch pattern

The fundamental curriculum unit for teaching any mechanic **[Conv]**: every new atom gets a three-beat arc.

- **TEACH**: introduce the mechanic in a constrained context where the lesson is forced but the stakes are zero. The space of wrong answers is pruned (§2.8) — the player can only do the right thing, and doing it shows the rule. TRS-01 structure: place the one available intervention, watch the obvious thing happen. The teaching moment must be *observable* — if the player can't see the cause-and-effect, the lesson didn't land even if the level completed.
- **TEST**: a second level using the mechanic with slightly more freedom — the player must recall and apply it correctly, but the puzzle is still below full difficulty. The test level is where you *verify* the lesson landed: a player who fails the test level wasn't taught, they were pushed through. If >30% of playtesters fail the test level of any mechanic, the teach level failed — go back and fix teaching, not testing.
- **STRETCH**: the mechanic used as *vocabulary* inside a normal puzzle — combined with prior atoms, at normal difficulty. This is where the atom graduates: it's no longer the lesson, it's a tool. Stretch levels must come after recall is verified.

The pattern scales: each chapter's first three levels are often teach-test-stretch for the chapter's new mechanic, and the mechanic joins the vocabulary the rest of the game uses freely. The full arc maps onto the skill-atom curriculum (§2.7): introduction ≈ TEACH, elaboration ≈ TEST+STRETCH, exploitation ≈ vocabulary use.

## 9.2 Tutorial level construction: the mandatory sequence

The opening level is the highest-stakes piece of design in the game — it must simultaneously teach controls, establish tone, and earn the player's trust **[Conv]**. The mandatory-sequence structure that works (TRS-01/RBM-01-style first levels):

1. **Zero-explanation setup**: show the world, state the goal plainly (one line, visible). The player should be able to guess what to do before being told — affordance design carries this.
2. **One forced action**: a single obvious move, gated so the player can only do the right thing (or the safe thing). This is the "press X" moment — the freedom is constrained precisely so the first experience is competence, not confusion.
3. **Visible consequence**: the forced action's result must be *dramatic and obvious* — the parcel moves, the bell rings, the door opens. The player must see the game respond, or the teaching loop never starts.
4. **Second action with slight freedom**: a choice between two obvious moves — the first real decision. Both choices should be viable; the lesson is "your choices matter" not "guess right."
5. **Completion as reward**: the level ends quickly (~60–90s total) with a visible win state — progress, a new area, a stamped card. The first session's dopamine schedule (§1.4) starts here: an early guaranteed win.
6. **Immediate re-contextualization**: level 2 uses the same mechanic in a less-constrained context — the test phase of teach-test-stretch, entered before the player has time to forget.

Rules the sequence must not violate: no text longer than one line at a time; no punishing early experimentation (an action that's wrong should fail *interestingly*, not just be blocked); no unskippable anything (except the one forced action); no interruption by meta-systems (no "rate the game," no account setup, no ads) inside the first ten minutes.

## 9.3 Discovery vs. instruction: what to say and what to show

The text-usage rules sharpened (§2.8's "demonstrate what's demonstrable") into a decision table **[Rec]**:

| Information type | Best vehicle | Example |
|---|---|---|
| Goal/objective | One line of text, always visible | "Deliver all parcels" |
| Verb existence | UI affordance (the button exists) + safe first use | the deploy slot glows when relevant |
| Verb *behavior* | Demonstration (the teach level) | the ferry visibly holds 2 parcels |
| Rules/ordering | Text when non-demonstrable | phase table for RBM — "loans resolve before guards" can't be demonstrated, so it's stated |
| Strategy/insight | Never text — ever | the insight is the game; saying it is the spoiler |
| Feedback/diagnosis | World-anchored pointers, not prose | highlight the violating entity at the beat |

The meta-rule: text is the vehicle of last resort for anything the player could discover — every sentence of instructional text is a debt the game must repay in agency, and players skim text anyway. Where text is necessary (rules, goals), it's *short, placed, and permanent* — not a tutorial box that vanishes (players who need it later can't find it) but a panel or legend always accessible.

## 9.4 Agency preservation during onboarding

The dark temptation of tutorial design is removing agency to prevent error **[Conv]** — and it's toxic to the exact motivation structure puzzle games need (§1.1 autonomy). The balance:

- **Constrain the space, not the choices**: the teach level limits *where* you can act (one socket glows) but never *whether* you can think — the player still decides to act. A tutorial that plays itself teaches nothing.
- **Safe failure > prevented failure**: let wrong things be attempted and show their failure (§3.5) rather than locking them out. A player who can try the wrong lever learns more than one who couldn't touch it — and learns the *boundary* of the rules, which is knowledge.
- **Escape hatches everywhere**: tutorials must be skippable/restartable (a "skip ahead" that forfeits the teaching but serves repeat players and confident ones). Forcing tutorials on experienced players is disrespect they punish by leaving.
- **No forced waits**: text that must be read for 5 seconds, unskippable intro animations — every forced wait is a quit-candidate moment in the first session (§1.2's #1 flow-breaker).

## 9.5 Retry cost and failure communication

When the player fails — and in a puzzle game they will, constantly — the game's response determines whether failure teaches or punishes **[Conv]**.

### The verdict screen as diagnosis

A failure verdict has four obligations, in order:

1. **What failed**: the violated condition stated plainly ("a bell rang twice," "the parcel never reached Greywater," "the token wasn't home at midnight").
2. **Where it failed**: the entity/location highlighted — point at the thing, don't describe it.
3. **When it failed**: the beat/phase/move marked on the timeline — temporal location is as important as spatial in these games.
4. **Why it failed**: the causal chain — "the skid pushed the ring from beat 3 to beat 4, outside the window." The *why* is where learning happens; a verdict that stops at "what" reports the crime without naming the culprit.

The verdict must pass the blame test (§1.12): a skeptical player, shown the verdict, can hand-verify the failure — or the verdict itself is a trust leak.

### Retry economics

- **Retry cost ≈ 0**: restart is instant, prior plan is preserved (ghost/last-state visible), iteration is the loop.
- **Partial-credit information**: verdicts should show how *close* the failure was — "2/3 conditions met," "arrived 1 move late" — because near-misses are informative (§1.4) and "nope" is not.
- **Failure taxonomy display**: different failures get different verdict framings — a *wrong-plan* failure (conditions unmet, explain how), a *dead-state* failure (stranded — name the stranding cause, §3.2), a *timeout* failure (deadline missed — show where time was spent). Uniform "YOU FAILED" teaches nothing.

### Applied checklist (§9.1–9.5)

- [ ] Every mechanic has a teach-test-stretch arc; test-failure >30% sends the teach level back.
- [ ] Level 1 has the 6-step mandatory sequence; total ≤90s; zero meta interruptions.
- [ ] Text decision table applied; strategy/insight never written.
- [ ] Agency preserved: choices real, failure safe, tutorials skippable.
- [ ] Verdicts name what/where/when/why; retry ≈ free; proximity shown.


## 9.6 The first-session funnel: onboarding metrics

The first session is measurable and should be **[Conv]**:

- **Install→first-action**: time from open to first committed input. Target <60s; >3min means the title/menu/first-level read is failing (or the load is too long — §6.8).
- **First-action→first-solve**: time to complete level 1. Target <3min for the tutorial-structured level; >8min suggests the teach arc is unclear (not hard — unclear).
- **Level-1→level-2 continuation**: % who start level 2 after finishing level 1. Target >70%; drop-off here is the strongest single onboarding health metric — it's the point where the player has a full model of what the game is and chooses whether to stay.
- **Session-1 return rate**: % returning within 48h. The honest measure of whether the first session made a promise worth coming back for.
- **Tutorial-completion non-correlation**: track whether players who skip tutorials (where allowed) finish the game at similar rates — if they do, the tutorial wasn't needed (finding about its value); if they don't, the tutorial was load-bearing (finding about its necessity). Either result is actionable.

Instrument the funnel with the same discipline as levels (§1.13): each metric exists to change a decision, and the decisions here are all "where does the first session lose people and why."

## 9.7 The FTUE (first-time user experience) checklist

The consolidated pre-ship checklist for onboarding **[Rec]**:

- [ ] Cold open works: launch → playing in <10s, no account, no permission screens.
- [ ] First input unlocks audio cleanly (WebAudio gesture rule, §7.9) — the first click is already designed.
- [ ] Level 1: goal stated in ≤8 words; first action forced-safe; consequence dramatic; done in 90s.
- [ ] First session contains: 1 real insight, 1 system promise, ≥1 visible progress marker, 0 unforced waits.
- [ ] Controls legible without text: every interactive element survives the screenshot test.
- [ ] All rules stated are *shown* within 60s of being stated — text without demonstration is debt.
- [ ] First failure is safe and informative (the designed wrong-approach produces its teaching failure).
- [ ] The map after level 1 offers ≥2 open nodes (incubation insurance from minute one).
- [ ] Quit-then-resume loses nothing — save is lossless from the first action.
- [ ] A "skip" exists for every teach element after level 3 — veterans aren't held hostage.

## 9.8 Failure communication deep-dive: the verdict library

The verdict layer deserves its own designed vocabulary — a **verdict library**: for every failure class, a pre-written verdict template with slots for entity/beat/reason **[Rec]**. Examples from the portfolio:

- TRS condition-violation: "「BELL」rang {count}× in beats {window} — needed {required}. The ring at beat {beat} came from {entity}'s {cause}." — slots filled from sim data; the *cause* slot is the diagnosis.
- RBM loan-overdue: "「{token}」was not home by midnight. It left {home} at beat {loan_beat} and was due back at beat {due_beat}. The returns phase at beat {due} found it at {where_it_was}." — the whole heist narrative in three slots.
- PFT stranding: "「{parcel}」can no longer reach {destination}. The route broke when {cause} (ferry route gone / courier stranded / capacity exceeded)." — dead-state with named cause (§3.2's requirement).

Rules for verdict writing: blame the plan and the world, never the player (§5.8's blame rule applies to solo play too — "the schedule failed" not "you failed"); every verdict is hand-verifiable from visible state (the blame test); and verdicts are *authored content* — write them with the same care as level text, because they're the most-read text in the game.

## 9.9 Teaching in the three games: applied structures

- **TRS-01 "Grand Opening"** structure: the first level should place a single toy at a marked spot, watch it strike the bell — the toy IS the lesson (bells ring by strikes). Level 2: same world, the skid hazard teaches *involuntary* strikes. Level 3: the redirect junction. By level 4, players own the vocabulary; conditions escalate (EventCount windows appear). The teaching arc is causal-literacy-first: watch, then intervene.
- **RBM-01**: first night teaches the loop in miniature — one token, one plate, one guard ray, one due-beat. The phase order is demonstrated by *watching a pre-scripted run* before the player touches anything (the phase table is non-demonstrable — §9.3 — so the scripted demo carries it). Stretch: the second night has 2 tokens and an overlapping window.
- **PFT-01**: one island pair, one parcel, one ferry — the complete loop (pickup→load→ride→unload→deliver) in five moves. Level 2 introduces a second courier and the one-rider rule (the portfolio's first real constraint). Level 3 introduces `deploy` — the first graph edit, the moment the game reveals it isn't a walking simulator.

## 9.10 Common onboarding mistakes + model card

| # | Mistake | Signature | Fix |
|---|---|---|---|
| 1 | Text-wall tutorial | Instructions the player skips then fails | Demonstrate; text only for non-demonstrable rules |
| 2 | The hostage tutorial | Unskippable teaching on replay/return | Skip/exit on every teach element |
| 3 | Punished curiosity | First experimentation penalized | Safe failure or blocked-with-reason |
| 4 | The cliff-after-tutorial | Level 2 wall (difficulty spike post-teach) | Sawtooth trough + test-level verification |
| 5 | Invisible vocabulary | Verb exists but never demonstrated | Vocabulary audit; every verb taught once |
| 6 | Assumed genre knowledge | "obvious" conventions unexplained | Fresh-player cold test — gamers ≠ players |
| 7 | Dead first session | No insight, no promise, no progress in 10min | The FTUE checklist |
| 8 | Checkpoint gap | Long tutorial lost on quit | Lossless save from minute one |
| 9 | Verdict as insult | "FAILED" with no diagnosis | Verdict library, blame-the-plan voice |
| 10 | Teaching the UI, not the game | Tutorial explains buttons, not thinking | Teach decisions; controls self-evident via affordance |

| Design object | Instrument | Verified by |
|---|---|---|
| Curriculum | teach-test-stretch per atom | test-level pass rates |
| First level | mandatory sequence | cold-start playtests |
| Text policy | demonstrate-first table | text-audit pass |
| Failure UX | verdict library | blame-test reviews |
| Health | funnel metrics | level-1→2 continuation |


## 9.11 Teach-test-stretch worked examples

The pattern concretized per game **[Rec]**:

**TRS (sealed-observation causality)**:
- **Teach**: L1 shows a single observer + one actor on a fixed path; the player places nothing — just watches the causality. The only verb is "watch" and "predict".
- **Test**: L2 introduces the first intervention (a RedirectJunction) on a 2-beat loop; the player must place one intervention to change the outcome. Failure = watching it play out unchanged.
- **Stretch**: L3 adds a second actor + a skid→BellRing consequence; the player must use the *interaction* (not just the redirect) to satisfy an EventCount window.

**RBM (timing/loan heist)**:
- **Teach**: L1 is one room, one token, one guard on a fixed post; the loan manifest has one row; the only verbs are loan and return. The clock is generous.
- **Test**: L2 adds a second room and a patrol; the player must sequence loan→carry→place→return before the due beat.
- **Stretch**: L3 introduces a sensory tag (a HEAVY token that slows the carrier) and a patrol that *moves*; the player must exploit the guard-scans-previous-post rule.

**PFT (logistics cargo)**:
- **Teach**: L1 is two islands, one parcel, one ferry, one courier; verbs are pickup→load_ferry→ride_ferry→unload_ferry→deliver. The move counter is visible from move 1.
- **Test**: L2 adds a third island and a second parcel; the player must sequence the loop twice without stranding.
- **Stretch**: L3 introduces pack (deploy) and a parcelCapacity constraint; the player must pack one parcel before riding, or the ferry can't carry it.

The rule visible in all three: the **teach level has ONE new thing**; the **test level requires using it under light constraint**; the **stretch level makes it interact** with something already learned.

## 9.12 The first ten minutes

The FTUE minute-by-minute **[Rec]**:

| Time | What's happening | Risk |
|---|---|---|
| 0–30s | Boot, title, "start" — one button | Options paralysis at the menu |
| 30–90s | L1 intro: the world, the one-verb verb | Long intro text |
| 90–180s | First action + first feedback | Unclear affordance |
| 3–5min | First level solved | First failure |
| 5–7min | L2: the test | Spike in difficulty |
| 7–10min | L3 or first "real" level | The first real stuck |

The 10-minute checkpoint: by 10 minutes a player should have (a) used the core verb, (b) seen the consequence, (c) solved at least one level, (d) seen the next hook. If any of these is missing at 10min, the onboarding is failing.

Instrument this: log time-to-first-action, time-to-first-solve, drop-off per level. The funnel is the onboarding's report card.

## 9.13 Handholding calibration

How much instruction per difficulty **[Rec]**:

| Player state | Instruction level |
|---|---|
| Never seen the verb | Explicit prompt + forced action |
| Seen it once | Hint available, not forced |
| Used it twice | No prompt; the verb is vocabulary |
| Stuck on a stretch level | Tier-1 hint offered silently |
| Failed twice | Tier-2 offered |
| Failed 4+ | Tier-3 offered + "skip" escape |

The anti-pattern to avoid: **permanent assistance**. A prompt that stays on screen after the player has used the verb twice is a sign the designer doesn't trust the player — and players feel it.

## 9.14 Tutorial anti-patterns, expanded

- **The wall-of-text tutorial**: >3 consecutive text boxes before any action. Players skip it and then can't play.
- **The video tutorial**: a non-interactive cutscene teaching interaction. Teaches nothing; costs engagement.
- **The gated-everything tutorial**: every UI element locked until "taught". Feels like a hostage situation; teaches resentment.
- **The forgotten-mechanic tutorial**: teaching a verb the player won't need for 10 levels. By the time it's needed, it's forgotten; teach just-in-time.
- **The wrong-difficulty first level**: L1 that's too easy (the game looks trivial) or too hard (the game looks hostile). L1's job is *legibility*, not challenge.
- **The invisible-assist tutorial**: secretly rubber-banding the first levels. Breaks §1.13's trust contract when discovered.
- **The "read the wiki" tutorial**: offloading teaching to external docs. If the game can't teach itself, the teaching is broken.

## 9.15 Verdict-screen deep design

The failure/success verdict is the single most-visited screen **[Rec]**:

**Success verdict** must show: what solved it (the sequence or state that satisfied the condition), the par/score comparison, and the next hook. Never just "WIN".

**Failure verdict** must show: what was wrong (the condition not met), where (the board location), when (the beat), why (the mechanic). The "why" is the teaching moment.

**The blame test**: a skeptical player should be able to reconstruct the failure from the verdict alone. If they can't, the verdict is a shrug.

**Verdict microcopy**:
- No "FAILED" in red caps; "Not quite — [the reason]" is the register.
- No "You died"; the player's *plan* failed, not the player.
- Specifics over sympathy: "The guard saw the token at beat 7" > "Almost!"

## 9.16 Onboarding for returners

The second session's problem **[Rec]**:

- **Persistent progress**: level-select shows what's done; never force a replay of tutorial.
- **A refresher, not a tutorial**: "New since you left" or "Remember [verb]?"; 10 seconds, not a re-teach.
- **Re-entry difficulty**: the first level of session 2 should be below the last-completed level's peak, not above it.
- **Save state trust**: if a player quit mid-level, resume mid-level — never restart.

## 9.17 Applied checklist (supplement)

- [ ] Teach/test/stretch per mechanic verified; each level introduces exactly one new thing.
- [ ] 10-minute checkpoint instrumented and achievable.
- [ ] Handholding decays with demonstrated use.
- [ ] Verdict screen passes the blame test for every failure class.
- [ ] Returner onboarding exists: refresher, not re-teach.


# PART 10 — CONTENT PRODUCTION PIPELINES

Content production is where design intent meets industrial reality. A 40-level game is not 40 designs — it's a *pipeline* that takes a design spec and produces verified, reviewable, shippable artifacts. This part treats the pipeline as an engineered system, because ad-hoc content production is where small teams lose months.

## 10.1 Level authoring as data: the declarative discipline

The foundational rule: **levels are data, not code** **[Conv]**. A level file is a declarative description — entities, initial state, conditions, constraints, metadata — that the *unchanging engine* interprets. Never level-specific code, never engine branches per level.

Why it matters beyond tidiness:

- **Verification becomes uniform**: if levels are data, one harness (load → check invariants → run golden traces → validate conditions) verifies every level identically. Level-specific code needs level-specific tests — untestable at scale.
- **Determinism is preserved**: code paths that only run for one level are where nondeterminism hides (an `if (level === 'x')` that reads the clock). Data can't hide behavior.
- **Authoring without rebuilding**: designers change level files and re-verify without touching the engine — the content/ engine split is the portfolio's actual architecture (`src/content/levels/` vs `src/engine/`).
- **Diffs become reviewable**: a level change is a data diff — readable, reviewable, revertible. A level change inside logic is none of those.

The data schema is itself a designed surface: fields should be typed, enumerated where possible (entity kinds from a fixed list, conditions from a fixed condition-vocabulary — EventCount/EntityStateAtEnd/VisibleFrom-style typed conditions), and *validated at load* (schema errors are build failures, not runtime surprises). A level file that parses but violates semantics ("ferry capacity -1") should fail validation before any test runs.

## 10.2 LevelCard metadata: the level's passport

Every level carries structured metadata — the LevelCard **[Rec]** — that serves design review, telemetry analysis, and the pipeline. Fields:

```yaml
id: pft-007
chapter: 2
order: 7
title: "The Sign Is an Address"
insight: "Deployed signs are movable addresses — mountedOn makes the mailbox itself movable."
atoms_assumed: [walk-edges, deploy-creates-edges, ferry-capacity]
atoms_taught: [mountedOn-gates-occupant-packing]
critical_path: "deliver 3 parcels via deployed sign socket → discover sign is movable address"
difficulty_profile: {insight: high, search: med, memory: low, precision: low}
estimated_solve: {min: 4, max: 12}
winning_traces: [golden-trace-1.json]
wrong_approaches:
  - {attempt: "deliver via bridge first", fails: "bridge doesn't reach Greywater", teaches: "route doesn't exist — address must move"}
  - {attempt: "pack all before deploy", fails: "stranded - nothing moves", teaches: "deploy precedes transport here"}
hints:
  t1: "The mailbox and the sign are the same thing."
  t2: "mountOn lets deployed pieces move what sits on them."
  t3: "Deploy the sign at the socket nearest the dock first."
par: {moves: 11, note: "approximate — author-solve +2"}
tags: [graph-surgery, chapter-2-core]
review: {status: approved, date: "...", reviewer: "..."}
```

Field rationale: `insight` forces the beat-sheet discipline (§2.20); `atoms_*` feeds curriculum audits; `critical_path` is the review baseline; `wrong_approaches` is the designed-failure inventory (§3.5); `hints` is the authored ladder (§3.4); `winning_traces` feeds CI (§10.7); `par` gets labeled approximate until verified (honest evidence, Part 12); `tags` enables cohort analysis ("how do all graph-surgery levels perform").

## 10.3 Block-of-3 production: the cadence unit

The smallest production batch that produces a usable arc: **one teach level + one elaboration + one challenge**, for one mechanic family **[Rec — the pattern generalizes common practice]**.

Why threes:

- One level can't teach: a single level either over-teaches (too easy, boring) or under-teaches (too hard, walls).
- Two levels can't stretch: teach+test covers the mechanic but doesn't grow the vocabulary.
- Three levels cover the teach-test-stretch arc (§9.1) in one reviewable batch.
- The block is the *review unit*: review a block together and you can verify the arc, not just the levels.

Production rhythm that works for a small team: one designer produces a block per sprint-block (2–4 days of design+authoring time), the block enters review (§2.28), then the next block starts on a *different* mechanic family — rotating families across blocks prevents the mechanic-fatigue where the designer bakes too hard on one system and produces six samey levels.

The cadence also scales content math: a 40-level game is ~13 blocks + capstones + onboarding arc — block math makes scope concrete (Part 11).

## 10.4 Engine-frozen content authoring: the contract

The rule that makes 40 levels shippable: **content authors build against a frozen engine vocabulary** — the verbs, conditions, entity kinds, and evaluation rules are fixed; authors may *combine* but not *extend* **[Conv as build engineering; the portfolio's actual convention]**.

- The frozen vocabulary is the System Card + condition vocabulary (§4.17) — everything a level can invoke is enumerable. The authoring tool lists the vocabulary; authoring anything else is a schema error.
- When a level "needs" a mechanic that doesn't exist: the request goes to an engine change process (§4.26/4.27) — mechanic added → vocabulary versioned → levels verified — never a level-specific hack. The alternative (each level carrying engine extensions) is how content games rot.
- Dispatch drift is the known failure mode: outside documents (spec handoffs, stale dispatches) describing vocabulary that differs from the frozen engine (the real example: dispatch verbs walk/pick_up/build/commit_orders vs. the engine's travel/pickup/drop/load_ferry/...). Rule: the engine's `getLegalActions`/frozen schema is the only authoritative vocabulary — every external doc is checked *against* it, and mismatches are reported, never silently mapped.
- Authoring tools must surface the freeze: the level editor/autocomplete offers only legal vocabulary — a designer who *can't* write an invalid verb produces valid levels by construction.

### Applied checklist (§10.1–10.4)

- [ ] Levels are pure data; zero level-specific engine branches; schema validation at load.
- [ ] LevelCard schema complete and enforced; insight/atoms/hints/traces mandatory.
- [ ] Production cadence in blocks of 3, rotating mechanic families.
- [ ] Authoring surfaces only frozen vocabulary; external docs cross-checked against engine truth; drift reported.


## 10.5 Asset manifest discipline

The asset side of the pipeline — art, audio, fonts, level files, data — needs a manifest: the authoritative list of every shippable asset with its metadata **[Conv]**:

- **Naming convention**: `category_region_asset_variant.ext` — `tile_quarry_floor_b.png`, `sfx_verdict_pass.wav`, `level_pft_007.json`. Names encode category and ownership; a name that doesn't tell you what it is and where it belongs is technical debt in asset form.
- **Manifest fields per asset**: path, hash/version, owner (kit it belongs to), usage (levels/UI/screens referencing it), size, load-tier (boot/lazy). The manifest is what makes the lazy-load budget (§6.8) auditable — you can't lazy-load what you haven't classified.
- **Orphan audit**: assets not referenced by anything must be flagged — orphans are load weight that serves nothing and hide old versions masquerading as current. Run the audit as a build step: every shipped asset must justify its existence via the usage field.
- **Version discipline**: asset updates bump versions; old versions leave the manifest or get marked deprecated — "v2 overwrites v1 in place" produces the classic bug where the shipped game shows half-old art because two files disagreed.

## 10.6 Procedural vs. authored: the decision framework

When should content be generated vs. hand-made? For puzzle games the answer is almost always **authored**, but the reasoning matters **[Conv]**:

- **Author when**: the content is the game (levels, puzzles, any beat where intent matters). Puzzles are authored because the *insight* is the content — a generator can't author insights it doesn't understand; it produces volume without curriculum.
- **Generate when**: the content is *background* — cosmetic variation (tile decoration scatter, cloud positions, ambient texture), filler between authored anchors (a generated stretch of path between two authored rooms), or parameterized content within authored constraints (procedurally-arranged dressing on an authored board).
- **Hybrid (the useful middle)**: authored skeleton + generated dressing; authored constraints + generated fill. PFT islands could be authored topology with generated visual dressing — the puzzle is authored, the scenery is generated.
- **The verification asymmetry**: authored content is verified once by design review; procedural content must be verified *per generation* — a generator needs constraint-checkers (islands reachable, capacity consistent) that are themselves engineering. For a 40-level game, a level generator costs more than the levels would — generation pays off only at volumes or variabilities that exceed authoring capacity (daily puzzles, endless modes), which is a product decision, not a default.

## 10.7 Verification machinery: the level CI

Levels-as-data makes levels *testable* **[Rec]** — the verification harness is the pipeline's heart:

- **Schema validation**: every level file parses, types check, vocabulary frozen-legal. First gate; failures are build-breaking.
- **Invariant checks**: reachable destinations exist, capacities non-negative, conditions well-formed, deadlines satisfiable in principle — structural sanity without solving.
- **Golden-trace verification**: the authored winning trace(s) replay through the engine and pass — proves solvability (§3.14's designer-owes-a-solution rule, automated). Traces version with levels; a system update that breaks a trace is detected immediately (§4.27).
- **Wrong-approach verification**: scripted wrong-paths produce their designed failure states — proves the teaching failures actually happen (§3.5 made executable).
- **Multi-solution verification**: where the LevelCard claims multiplicity, ≥2 distinct verified traces exist (§3.6).
- **Par sanity**: par ≥ author's verified best + margin, par < any brute-force bound (pars that can't be beaten are lies; §1.14 anchoring).
- **Coverage report**: which verbs/atoms/conditions each level exercises — feeds the curriculum audit (§2.7's assumption map).

The harness runs on every content commit; a level is "shipped" only when the whole gate passes — not when a designer says it's done. This is the engineering backbone that makes 40 authored levels *verifiable* rather than *plausibly correct*.

## 10.8 The authoring toolchain: minimum viable

The tools that produce levels **[Rec — scoped to small teams]**:

- **Hand-edited data files + schema validation** is the correct starting point — an editor before 20+ levels exist is premature tooling; the schema is the editor's contract anyway.
- **A level replayer**: load a level, run a trace, watch the result — the single most valuable content tool (it IS the playtest harness). Build it before building any editor.
- **A validator CLI**: run the §10.7 gates locally before commit — "pre-commit for levels." If the CI runs it, authors need it locally.
- **An analyzer surface**: stranding/reachability analysis (PFT's analyzeOrderStatuses pattern) callable on demand — the designer's "is this branch dead" oracle.
- **Optional editor**: only after the schema stabilizes — a form/JSON editor with autocomplete over frozen vocabulary. Editor features that pay: live trace playback, condition-preview (see what EventCount windows look like), wrong-approach scripting.

Tooling rule: **tools encode the discipline** — autocomplete of frozen vocabulary, inline validation errors, mandatory metadata fields. A tool that lets you write a bad level faster is worse than no tool.

### Applied checklist (§10.5–10.8)

- [ ] Asset manifest exists: names encode ownership, hashes version, orphans flagged in build.
- [ ] Authored-by-default; generation only for background/fill, with constraint checkers if used.
- [ ] Verification gates: schema + invariants + golden traces + wrong-approach + par sanity + coverage.
- [ ] Replayer + validator CLI before any visual editor; tools enforce vocabulary rather than permit violations.


## 10.9 Content versioning and migration

Levels change after shipping — bugs, difficulty retunes, renames. Versioning discipline **[Rec]**:

- **Level-level versioning**: each level file carries a content version; player saves reference the version they were created against. A level retuned after players have save-state must either migrate saves (preserve completion flags) or declare incompatibility — silent invalidation of a player's progress is a save-integrity violation (§1.8's "the game stays where they left it").
- **Migration rules**: adding content (new levels) never invalidates old saves; changing a solved level's mechanics should preserve its solved-status flag (the player earned it); changing a level's *conditions* mid-campaign is the only class of edit that might legitimately reset progress — and it's the class to avoid post-launch.
- **Content branches**: experimental levels live on branches, graduate to main only through full verification — main is always shippable. A main branch with a broken level is a broken game, not a work in progress.
- **Trace versioning**: golden traces tie to the engine version *and* level version — a trace is meaningless outside its context; store versions with traces so stale-trace failures are diagnosable at a glance.

## 10.10 Ownership boundaries in production

For a distributed/specialist production (the actual model: coordinator dispatches bounded work packages to specialist sessions) **[Rec]**:

- **Path-scoped ownership**: work packages specify *which paths* may be touched — `src/content/levels/` for level authors, `src/engine/` for engine owners, `tests/unit/` for test authors. Overlapping edits are conflicts-by-design; the boundary is the coordination mechanism ("you are not alone in the codebase").
- **Interface contracts over shared understanding**: the contract files (contracts.ts-style engine interfaces) are the coordination surface — specialists work against the contract, not against each other's code. Contracts get versioned like everything else (§4.27).
- **Deliverable boundaries**: each work package ships a self-contained artifact (tarball of the assigned tree + REPORT.md documenting decisions/divergences) — the report is where *discovered divergences* (stale dispatch fields, missing refs, engine traps) are recorded. The report is not optional paperwork; it's how the coordinator learns what was actually true.
- **Acceptance is executable**: "done" = the package's tests pass and the type check is clean — not "looks right." Executable acceptance is the only thing that scales across specialists without a review bottleneck.

## 10.11 The content calendar and dependency map

Content has dependencies — level 7 assumes atoms from level 4; chapter 3 needs chapter 1's mechanics frozen **[Rec]**:

- **Dependency-order production**: teach blocks for a mechanic *must* precede levels using it — the atom inventory (§2.7) IS the dependency graph, and the calendar should be its topological sort.
- **Freeze gates on the calendar**: a mechanic's dependent-blocks may not start until the mechanic is frozen — unfrozen mechanics with dependents in production is the recipe for mass rework (§4.10).
- **Review slack**: every block carries review+rework slack (~30% of authoring time) — calendars without slack produce unreviewed content, which is worse than late content.
- **The content burn-down**: track levels in states — designed → grey-boxed → self-solved → reviewed → verified → polished → shipped. The burn-down shows where production actually stalls (usually: verification waits on tooling, or review bottleneck on one person — the fix is the bottleneck, not more authoring).

## 10.12 Common pipeline mistakes + model card

| # | Mistake | Signature | Fix |
|---|---|---|---|
| 1 | Code-in-content | Level logic in engine branches | Data-only levels, schema gate |
| 2 | Untraceable art | Assets without owners/usage | Manifest + orphan audit |
| 3 | Premature editor | Editor built before schema stable | Replayer + validator first |
| 4 | Vocabulary drift | Authoring against stale docs | Frozen vocabulary + drift reports |
| 5 | Review bottleneck | All levels through one reviewer | Protocol + delegated scope (§2.28) |
| 6 | Unverified claims | "It's solvable, probably" | Golden traces mandatory |
| 7 | Untested failures | Wrong approaches assumed, not scripted | Scripted failure traces |
| 8 | Silent breakage | System change breaking levels invisibly | Versioned traces in CI |
| 9 | Dependency inversion | Content built before its atoms | Topo-sorted calendar |
| 10 | Ship-when-tired | Levels shipped by fatigue, not by gate | Executable acceptance |

| Design object | Instrument | Verified by |
|---|---|---|
| Levels-as-data | Schema + validation | No engine branches audit |
| Metadata | LevelCard | Field-completeness gate |
| Cadence | Blocks of 3 | Calendar + burn-down |
| Contracts | Frozen vocab + contracts | Drift reports |
| Verification | CI gates | Trace suite green |
| Boundaries | Path-scoped work | No out-of-scope edits |


## 10.13 The LevelCard schema, complete

The full content-data contract for one level **[Rec]**:

```yaml
id: pft-007
chapter: 3
order_in_chapter: 2
title: "The Long Way Round"
insight: "A parcel must be packed before the ferry departs; late packing strands it"
atoms: [load_ferry, ride_ferry, pack, deliver]
critical_path: [pickup(p1), pack(p1), load_ferry(p1), ride_ferry(f1), unload_ferry(p1), deliver(p1)]
hook: "A single parcel on a 3-island loop; the ferry leaves at a fixed beat"
naive_failure: "Load first, then try to pack on the far side — the pack station is on the origin island"
wrong_approaches:
  - {id: "load-then-pack", class: "teaching", detection: "parcel unpacked at load_ferry"}
  - {id: "two-trips", class: "near-miss", detection: "ride_ferry twice; parcel delivered but over par"}
hints:
  t1: "Look at where the pack station lives."
  t2: "pack() before load_ferry()."
  t3: "pickup p1 → pack p1 → load_ferry p1 → ride_ferry → unload → deliver"
difficulty:
  search_depth: 2
  branching: 1.4
  insight_distance: 2
  memory_load: 1
  precision: 1
  familiarity: 3
par: {moves: 6, verified: true, source: "golden-trace"}
winning_traces:
  - [pickup(p1), pack(p1), load_ferry(p1,f1), ride_ferry(f1,i2), unload_ferry(p1), deliver(p1)]
verification:
  golden_trace: true
  scripted_failures: [load-then-pack, two-trips]
  multi_solution_claim: false
telemetry:
  median_solve_time_s: 94
  hint_tier_distribution: {t1: 0.2, t2: 0.5, t3: 0.3}
  first_attempt_rate: 0.31
notes: "First pack-level; players who fail here didn't read the pack station's location"
```

Every field is either load-bearing (game reads it), review-bearing (humans read it), or telemetry-bearing (it updates). Fields with no consumer are deleted.

## 10.14 The authoring toolchain concretely

The tools, in dependency order **[Rec]**:

1. **The format** — YAML/JSON LevelCard; schema-validated; the single source of truth.
2. **The replayer** — runs a trace against the engine, reports state at each beat; the first tool to build.
3. **The validator** — runs the LevelCard's declared verification: golden trace solves, scripted failures fail, par achievable.
4. **The previewer** — renders a level from data without the full game; visual debugging.
5. **The editor** — optional and late; a UI for authoring LevelCards. Most teams skip it entirely; text + validation is enough for years.

Order matters: never build the editor before the validator. A level you can't verify isn't content.

## 10.15 The block-of-3 cadence, scheduled

The 3-level production unit concretized for schedule **[Rec]**:

- **Day 1-2**: teach level authored + validated + arted.
- **Day 3-4**: test level authored + validated; art later if kit ready.
- **Day 5**: challenge level authored; all three reviewed as a block.
- **Day 6-7**: playtest the block; fix findings.
- **Day 8**: merge, verify, next block.

One block per week per level-designer is a reasonable velocity. Three blocks per chapter, ~4-5 chapters per game = ~3 months of content per game with a single dedicated author.

## 10.16 Asset manifest discipline

The manifest fields **[Rec]**:

```yaml
- id: ui.icon.pack
  path: assets/ui/icons/pack.svg
  type: icon
  size_kb: 3
  usage: [pft-007, pft-008, ...]
  load_tier: eager   # or lazy / on-demand
  license: internal
  checksum: sha256:...
```

Rules:
- Every asset in the manifest; every manifest entry used by something.
- Naming: `<domain>.<category>.<name>` (ui.icon.pack, audio.sting.solve, art.tile.dock_02).
- Checksums in CI catch unlogged asset changes.
- Orphans (unused files) are deleted, not archived — VCS is the archive.
- Load tiers decide the loading order: eager (<100KB total, needed at boot), lazy (chapter-level), on-demand (per-level).

## 10.17 Procedural vs authored, decided

The decision rule **[Conv]**: procedural when (a) the content is high-volume/low-signal (endless mode filler), (b) the cost of authoring exceeds the cost of generating + filtering, (c) the generator can be verified to the same bar. Otherwise authored.

For the portfolio: **authored**. All three games' depth comes from deliberate insight-placement, which is exactly what generators can't place. A procedural level that happens to be elegant is luck, not design. **[Rec]**

A middle path that works: **procedural assistance for authored content** — a solver/verifier that searches the state space to find degenerate solutions or calculate optimal move counts, informing the human author. The generator serves the author, never replaces them.

## 10.18 The migration playbook

When a LevelCard format version changes **[Rec]**:

- Version field in every file from day one.
- Migrations are additive or explicit transforms; never silently coerce.
- A migration script is committed with the format change.
- Old content re-validates post-migration in CI.
- If a level can't be migrated automatically, it's flagged — a human decides.

## 10.19 Applied checklist (supplement)

- [ ] LevelCard schema complete and version-stamped.
- [ ] Toolchain order respected: replayer → validator → previewer → editor.
- [ ] Block-of-3 cadence calendared.
- [ ] Asset manifest has usage tracking and checksums.
- [ ] Procedural-vs-authored decision recorded per content type.
- [ ] Migration playbook exists before the first format change.


# PART 11 — PRODUCTION & SHIPPING

Production is the discipline of finishing: scope control, milestone honesty, testing programs, and the launch gate. For a small team the entire craft reduces to one skill — **cutting the right things** — plus the verification machinery that keeps cut things from silently re-breaking.

## 11.1 Scope control and minimum shippable identity

### The identity-first scope model

The scope question is not "how much can we build" but "**what is the smallest version of this game that is still *itself***" **[Rec]**. The minimum shippable identity (MSI) is defined by three pillars, each of which must survive in any cut:

- **The core loop pillar**: the game's irreducible play pattern — TRS: observe→intervene→run→verdict; RBM: loan→stage→schedule→return; PFT: route→pack→ferry→deliver. Cut anything before cutting the loop's integrity.
- **The differentiator pillar**: what makes it not-generic — TRS's sealed observation dramaturgy, RBM's return-by-midnight constraint, PFT's untimed optimization. If a cut would remove the differentiator, the cut is wrong; the game ships as "a worse version of existing stuff" (the user's own product rule).
- **The polish pillar**: the minimum feel/readability floor — the game must look and respond like a finished thing at whatever size it ships.

Features outside the pillars are negotiable: extra mechanics, co-op modes, meta-progression, level counts. The MSI document names the pillars explicitly and every scope decision cites them — "does this serve a pillar?" is the entire review question.

### Scope debt vs. scope cut

Distinguish two operations **[Rec]**: **cutting** (removing a feature permanently from the plan) vs. **deferring** (moving it post-launch or to stretch goals). Danger: *soft-cutting* — silently half-building a feature because cutting it felt bad. Half-built features are worse than cut ones: they cost the time and deliver neither value nor the honesty of absence. Rule: a feature exists in the plan at 100% or 0% — "do it less" is always a trap (a "less good" tutorial is worse than an honest difficult game; a half-working co-op is worse than none).

### Content math for scope

Level counts are the first scope pressure. Numbers that work: a portfolio puzzle game needs ~25–40 levels for a satisfying arc (≈8–13 blocks + capstone + onboarding); below ~20 the game reads as a demo, above ~60 the marginal level stops adding value and starts adding maintenance. The honest accounting: at a block-of-3 per 2–4 days cadence (§10.3), 40 levels is ~5–8 weeks of *level production alone* — budget around it, don't pretend it's parallel-free.

## 11.2 Milestone gates: concept → vertical slice → content-complete → RC → release

Milestones are gates with *entry criteria*, not dates with hopes **[Conv]**.

### Gate 1 — Concept → prototype

Exit criteria: the core loop exists in grey-box; one level playable end-to-end; the differentiator is *demonstrable in the build* (not the design doc); the vocabulary inventory is drafted. Common failure: "concept approved" on a document instead of a build — the gate exists because papers lie and builds don't.

### Gate 2 — Prototype → vertical slice

Exit criteria: the exemplar level (§2.23) built, art-directed, and playtested; the pipeline's core (levels-as-data + verification + replayer) working; the style bible drafted; the engineering skeleton (engine contract, save system, UI shell) proven. The vertical slice answers: "can the finished game look/feel/work like this?" — it's a promise the rest of production must keep.

### Gate 3 — Vertical slice → content-complete

The long gate: all levels produced in blocks, all verified, all reviewed. Exit criteria: every level through the gates (§10.7), every mechanic's curriculum arc complete, all LevelCards approved, the whole game completable end-to-end by a non-author. This is where most projects die — the middle is unglamorous and the only thing that survives it is the pipeline being real (§10.7's automated gates are what makes "content-complete" mean something).

### Gate 4 — Content-complete → release candidate (RC)

Exit criteria: zero known blocking bugs; all playtest findings triaged to fixed-or-wontfix-with-reason; accessibility checklist (§6.7) passed; performance budgets met on target hardware; audio/visual consistency passes done. RC means "if nothing else changed, we could ship this" — the discipline is treating it that way (no "one more feature" in RC).

### Gate 5 — RC → release

Exit criteria: the launch checklist (§11.5) fully green; store/package assets ready (Part 12); the release build verified as the RC build (no untested last-minute changes — the classic release-week bug). Post-launch plan exists (what telemetry/watch for first-week issues; what the response loop is).

### The kill criteria

Every milestone carries pre-agreed kill/pivot triggers — "if the exemplar doesn't produce the intended feel after 3 iterations, pivot the differentiator; if content velocity is <half plan at mid-production, cut content not quality." Deciding the triggers *before* the pain makes them usable in it.

## 11.3 Playtest programs: recruit, observe, code, fix-verify

The complete program **[Rec — synthesizing standard practice]**:

1. **Recruit**: fresh-eyes players, puzzle-genre positive but portfolio-naive (§3.7). Sources: friends-of-friends, Discord/itch communities, classmates — paid in pizza/credit, not in biasing "be nice" framing.
2. **Protocol**: think-aloud, no-help rule, time-boxed stalls, the shaped-questions post-session (§3.16). Written down so every session is comparable.
3. **Observe**: the behavioral table (§1.19) — what they did, not what they said; the solve-anatomy phases (§3.22).
4. **Code findings**: every observation classified — legibility / teaching / difficulty / bug / unfairness / engagement — with the level and phase attached. Uncoded playtests produce anecdotes; coded playtests produce a work queue.
5. **Fix-verify**: fixes verified on *new* players, never the finder (§3.7). A fix confirmed only on the person who triggered it is unverified.
6. **Cadence**: small rounds (5–8 testers, 6–10 levels each) every production phase, plus a full-game cold-playthrough at content-complete — the last fresh eyes before the game's eyes get old.

## 11.4 Regression testing for a deterministic portfolio

Testing is cheap when the game is deterministic — which is the whole point of the architecture **[Rec]**:

- **Unit**: engine rules in isolation (applyAction edge cases, legality boundaries, ordering guarantees — settle-before-press, scan-at-previous-post).
- **Golden traces**: every level's winning trace + scripted failure traces replay in CI (§10.7) — the strongest regression net available: if a code change breaks a level, a trace catches it before any human does.
- **Determinism tests**: same seed/state/action → identical canonicalHash — catches ordering drift, float nondeterminism, hidden wall-clock reads.
- **Snapshot/state-migration tests**: serialize→restore→verify — catches save-format drift.
- **UI smoke**: the minimal browser-level checks (title loads, level enters, commit produces verdict) — a handful of Playwright paths, kept tiny because UI tests are brittle; the deep testing lives at engine level.
- **The discipline**: tests run on every commit; a red test never gets a "known failing" comment — it gets fixed or the level gets re-authored. A repo with tolerated-failing tests is a repo where nobody looks at CI.

### Applied checklist (§11.1–11.4)

- [ ] MSI document: three pillars named; every scope decision cites them; features at 100% or 0%.
- [ ] All five gates have written exit criteria; kill triggers pre-agreed.
- [ ] Playtest program: fresh-eyes recruitment, coded findings, fix-on-new-eyes verify.
- [ ] CI: unit + golden traces + determinism + migration + smoke; zero tolerated failures.


## 11.5 Certification and launch checklists

The final gate is a checklist, executed literally, because release-week is when everyone is most tired and most likely to skip steps **[Conv]**.

### Pre-launch (the release candidate's own bar)

- [ ] RC build is byte-identical to what was tested (rebuild reproducibility; hash the artifact).
- [ ] Full-game cold playthrough completed on target browsers (Chrome + one other, plus a low-spec machine) — on the *shipped build*, not a dev build.
- [ ] Save integrity: quit/resume at 20 points across the game loses nothing; old saves from prior builds migrate or declare.
- [ ] Accessibility pass: contrast sweep, colorblind sim, reduced-motion, keyboard-only path through core loop.
- [ ] Audio pass: no silent important events; mute works; no clipping at busy moments.
- [ ] Performance pass: frame budget holds through heaviest levels; load ≤ budget; memory stable across a 1-hour session.
- [ ] Determinism: replay a sample of traces in the *production* build — engine parity between dev and shipped.

### Store/package surface

- [ ] Store assets done before launch day: cover art (§12.1), screenshots (real gameplay, not mockups — the honest-evidence rule, §12.4), trailer (§12.2), description copy.
- [ ] Metadata accurate: genre, player count, play-time estimate honest.
- [ ] Legal floor: asset licenses verified (fonts, any non-synthesized audio, libraries), privacy policy if any telemetry exists, age-appropriateness correct.
- [ ] Price/availability configured correctly — the most embarrassing launch bugs are store-config bugs (wrong region, wrong price), not game bugs.

### Launch day

- [ ] The announcement plan ready (where posted, with what assets, linking to what).
- [ ] The watch plan: who monitors crash reports/reviews/first-day telemetry and what the response loop is.
- [ ] The hotfix path rehearsed: a trivial fix has been shipped through the release pipeline before (an untested hotfix path fails exactly when needed).
- [ ] The team is rested — launches are marathons in miniature; decisions made at hour-14 of launch day are bad ones.

## 11.6 Postmortem method

The postmortem is how a small team compounds experience **[Conv]**:

- **Timing**: 1–2 weeks after launch — soon enough for memory, late enough for data.
- **Structure**: what went right (what to keep), what went wrong (what to change), what we'd do differently (decisions, not regrets), what surprised us (assumptions that broke — these are the highest-value learnings).
- **Blameless by rule**: findings name systems and decisions, not people — "the pipeline shipped a broken level" not "Jordan shipped it." Postmortems that assign blame get dishonest input next time.
- **Numbers over vibes**: playtest metrics, content velocity vs. plan, bug counts by category, which levels under/over-performed — the data audit alongside the feelings audit.
- **Output**: the written lessons become checklist items — a postmortem that doesn't produce new checklist lines was a meeting, not a method. Every "went wrong" should map to either a process change or a checklist entry.

## 11.7 Risk management for a small team

The five highest-probability failure modes and their mitigations **[Rec]**:

| Risk | Early signal | Mitigation |
|---|---|---|
| Scope explosion | Feature list grows weekly; "just one more" | MSI pillars + 100%/0% rule |
| Content bottleneck | Level velocity <half plan | Blocks-of-3 cadence + grey-box discipline + review slack |
| Unverified content | "Looks right" levels reaching review | CI gates mandatory (§10.7) |
| Polish debt | "We'll juice later" forever | Tier-2 polish items scheduled, not wished-for (§8.8) |
| Testing theater | Playtests without coding/fix-verify | Protocol + coded findings queue |

Plus the meta-risk — **the silent middle**: months 2–4 of content production where nothing is visibly progressing and morale is the actual risk. Mitigate with the burn-down (§10.11) making progress visible, and with milestone celebrations as designed events (content-complete is a party, not a Tuesday).

## 11.8 Team practices for a distributed/specialist production

Practices that survive the coordinator-specialist model **[Rec]**:

- **Decision records**: every non-trivial decision logged as "decision + reason + alternatives rejected" — the memory of *why*. Six months later, "why did we freeze the vocabulary this way" is answerable in one file.
- **Bounded dispatches**: work packages specify paths, contracts, acceptance criteria — never open-ended "improve the game" assignments (§10.10).
- **Report discipline**: every package returns a REPORT.md of decisions + discovered divergences — the coordinator's ground truth about what was actually delivered vs. dispatched (§10.10).
- **Async-first communication**: written artifacts over meetings — a small distributed team lives in documents, and the bible you are reading is itself the largest async artifact.
- **Weekly demos**: the build is shown working weekly — an un-demoable week is an early warning, not a scheduling quirk.

## 11.9 Common production mistakes + model card

| # | Mistake | Signature | Fix |
|---|---|---|---|
| 1 | Scope creep | Feature list grows after vertical slice | MSI + 100%/0% |
| 2 | The eternal prototype | Never leaving concept phase | Gate-1 build criteria |
| 3 | Content-as-afterthought | "we'll just make levels" | Blocks cadence + velocity tracking |
| 4 | Polish panic | Last-week juice cram | Polish tiers scheduled from start |
| 5 | Playtest theater | Testing that produces anecdotes not fixes | Coded findings + verify loop |
| 6 | The RC-plus-one | "one more feature" in RC | Gate-4 discipline |
| 7 | Untested ship path | First release is also first pipeline run | Rehearsed hotfix path |
| 8 | Blame postmortem | Findings name people | Blameless structure |
| 9 | Invisible middle | Months with no visible progress | Burn-down + weekly demos |
| 10 | Silent kill | Project dies slowly without decision | Pre-agreed kill triggers |

| Design object | Instrument | Verified by |
|---|---|---|
| Scope | MSI pillars + 100%/0% | Scope reviews |
| Milestones | Gate criteria | Gate reviews |
| Quality | CI + playtest program | Trace suite + coded findings |
| Launch | Checklists executed literally | RC==shipped hash |
| Learning | Postmortem→checklist | New checklist lines exist |


## 11.10 The risk register

Production risk management for small teams is a living table, not a process **[Conv]**:

| Risk | Likelihood | Impact | Early warning | Mitigation |
|---|---|---|---|---|
| Solo-bus-factor | Med | Fatal | One person owns a subsystem | paired code review; REPORT.md conventions |
| Content stall | High | High | level velocity <50% plan 2wk running | §10.11 slack + scope cut trigger |
| Engine churn | Med | High | vocabulary changes mid-production | §10.4 freeze + versioning |
| Art direction thrash | Med | Med | 3+ styles in shipped build | §6.2 freeze + single art lead |
| Audio last | High | Med | audio milestones all late | audio integrated into §10.3 cadence |
| Playtest blind spot | Med | High | <5 fresh players per round | §11.3 recruit pipeline |
| Scope creep via "one more" | High | High | feature requests weekly | MSI + the 100%/0% gate |
| Judge-audience miss | Med | High | demo metrics differ from player metrics | §12.9 demo design |
| Burnout | Med | Fatal | sustained >40h/wk, no recovery | schedule rest; kill optional scope early |
| Submission snafu | Low | High | platform/format fail at deadline | dry-run submission 1 week early |

Review weekly; a risk with no early-warning metric is a hope, not a risk.

## 11.11 Scope-cutting playbook

When the burn-down says you won't make it, cut in order **[Rec]**:

1. **Cut optional modes** — co-op, extra difficulties, bonus levels: the MSI never included them.
2. **Cut content volume** — fewer levels, same arcs: 20 great levels > 40 padded.
3. **Cut content categories** — the whole secondary mechanic family, not slices of each.
4. **Cut polish tiers** — drop tier-3 juice, keep tier-1-2 (§8.8).
5. **Cut platform coverage** — one browser only, stated.
6. **Cut features** — only if MSI survives; if not, the project wasn't scoped honestly.

Never cut: the core loop, the differentiator, the onboarding, the verdict system, save integrity. Those ARE the MSI.

The decision structure: cutting is a Gate-4-style decision — made with the evidence (burn-down + velocity), made once, made early. Recurring "should we cut" debates are the cost of not deciding.

## 11.12 Estimation heuristics

Small-team estimation that works **[Rec]**:

- **Estimate in half-days minimum** — finer granularity is false precision.
- **Multiply by 2.5** the "ideal" estimate for anything new; by 1.5 for repeat work. [Contested — but consistently under-estimating is worse.]
- **Track velocity honestly**: level velocity = levels shipped/week measured over 4 weeks; use it for all projections.
- **Buffer asymmetrically**: 20% buffer on well-understood work, 50%+ on research/novel work.
- **Estimate the verification too**: a level isn't done when authored — budget review + playtest + fix.
- **The "unknown unknowns" line item**: 10-15% of total budget unallocated by design; teams that allocate 100% discover the unknowns the hard way.
- **Re-estimate weekly**: estimates decay; the burn-down is the re-estimation mechanism.

## 11.13 The milestone calendar concretized

For a 3-game portfolio with a fixed deadline (e.g., a competition submission ~Oct 30), the calendar works backward **[Rec]**:

- **T-8wk**: Gate 4 (RC) on all three games — content frozen, only fixes.
- **T-10wk**: Gate 3 (content-complete) — all levels authored, playtested once.
- **T-14wk**: Gate 2 (vertical slice) — one full game-region per game proven.
- **T-18wk**: Gate 1 (concept) — core loop playable in grey-box.
- **T-22wk**: Gate 0 (MSI) — the identity locked, scope declared.

The last 4 weeks: polish tier 2-3, demo mode (§12.9), submission kit, dry-run submission, contingency. Teams that leave <4 weeks for this are teams that ship with known bugs.

## 11.14 The working agreement for multi-agent teams

When the "team" is human + agents + contributors, the working agreement is the only thing that scales **[Rec]**:

- **Owned surfaces**: every file/system has an owner; changes outside your surface need the owner's review.
- **REPORT.md convention**: every work package ends with a REPORT.md at the surface root: what was done, what wasn't, what's risky.
- **No silent departures**: an unfinished handoff is worse than a missed deadline; status is a deliverable.
- **Dispatch vocab freeze**: the vocabulary used in work-package specs is itself reviewed — a stale spec field reaching an author is a production bug (§10.4's drift rule).
- **Review latency SLA**: reviews under 48h or escalate; blocked-work queues are the silent middle's first symptom.
- **The boss rule**: when two contributors disagree on a borderline call, the surface owner decides; appeal goes to the producer, once.

## 11.15 Applied checklist (supplement)

- [ ] Risk register exists, has early-warning metrics, reviewed weekly.
- [ ] Scope-cut playbook agreed; MSI lines known.
- [ ] Estimation uses the 2.5x/1.5x rules; velocity measured not guessed.
- [ ] Milestone calendar back-planned from the deadline.
- [ ] Working agreement: ownership, REPORT.md, review SLA, boss rule.
- [ ] 4+ weeks reserved for polish + submission.


## 11.16 The decision record

Every consequential choice gets a permanent record **[Rec]**:

```markdown
# DR-041: RBM settle-phase resolves plates before cargo
Date: 2026-10-01
Status: accepted
Context: settle-order question during content review — do plates or overloaded-cargo resolve first?
Decision: plates resolve first; overloaded-cargo checks the post-plate state
Consequences: lets a heavy token be "released" onto a plate and still count as stowed;
prevents a paradox where an overloaded plate-holder fails the cargo check
Supersedes: none
Superseded by: —
```

Rules:
- One DR per decision; numbered, dated, immutable once accepted.
- A DR is superseded only by a newer DR — the history is the audit trail.
- DRs live in the repo, not in chat; the file is the record.
- Small scope doesn't exempt — "it's just a prototype" decisions are the ones that get argued about later.

## 11.17 The definition-of-done ladder

"Done" is a ladder, not a flag **[Rec]**:

1. **Authored**: the artifact exists (level card, sound, code).
2. **Validated**: passes its schema/checks.
3. **Integrated**: works in the build, not just in isolation.
4. **Reviewed**: a second person has seen it.
5. **Verified**: its acceptance criteria pass in CI.
6. **Playtested**: a real player has touched it.
7. **Shipped**: in a build players will actually run.

Work-in-progress limits: nothing counts as "done" below rung 5; a level at rung 3 is a WIP, not a deliverable. The ladder prevents the common failure of "it's done" meaning "it exists".

## 11.18 Technical debt policy

How to handle deferred quality **[Conv + Rec]**:

- **Track it explicitly**: a `DEBT.md` listing every known shortcut; invisible debt compounds.
- **Pay it on schedule**: debt isn't forgiven; each milestone pays some (Gate 3 pays prototype debt, Gate 4 pays integration debt).
- **Bankruptcy is a decision**: sometimes the debt *is* paid by deleting the feature; that's a scope decision (§11.11), not a free pass.
- **The "would I want to maintain this in 6 months" test**: if the honest answer is no, fix it now or don't build it.
- **No invisible rewrites**: a rewrite is a decision with a DR, not a side project; invisible rewrites are how prototypes die.

## 11.19 Post-launch support

What happens after ship **[Conv]**:

- **The watch period**: 48-72h of monitoring post-launch; a dedicated person watches for criticals.
- **The hotfix path**: a rehearsed process for shipping a critical fix within hours (not days).
- **The patch plan**: known non-critical issues batched into a first patch (~1 week post-launch).
- **The live balance**: any post-launch tuning is a DR; silent balance changes breed player distrust.
- **The archive**: the build, the docs, the postmortem — all stored where they survive the project ending.

For a competition context, post-launch is mostly the last two: a patch if a critical surfaces during judging, and the archive so the work survives.

## 11.20 The producer's weekly ritual

For a small team, production is a set of rhythms **[Rec]**:

- **Monday**: burn-down + risk-register review; the week's priorities set.
- **Wednesday**: blocker check — anything stalled >48h escalates.
- **Friday**: ship-something review — what's ready to merge/verify this week.
- **Continuous**: REPORT.md reads on completed work; dispatch-drift spot checks.
- **Monthly**: playtest round; the findings enter the queue.

The ritual is the management; small teams die of unexamined weeks, not big mistakes.

## 11.21 Applied checklist (supplement)

- [ ] Decision records for all consequential choices; immutable, numbered.
- [ ] Definition-of-done ladder posted; nothing ships below rung 5.
- [ ] DEBT.md exists; debt is scheduled and tracked.
- [ ] Hotfix path rehearsed; patch plan exists.
- [ ] Producer's weekly ritual running: Monday priorities, Wednesday blockers, Friday ship-review.


# PART 12 — COMPETITIVE & PORTFOLIO PRESENTATION

A game nobody sees is a game that doesn't exist. For a portfolio built to showcase skill — to judges, recruiters, or players — presentation is part of the product, and it's subject to the same honesty rules as the game itself.

## 12.1 Cover art and key art principles

Cover art is the game's first proof-of-quality **[Conv]**:

- **Thumbnail-first design**: the art must read at 200px wide — store pages and portfolio grids are viewed at thumbnail scale before any click. The test: shrink it to ~200px and squint — if it becomes mush, it fails. Strong covers at thumbnail have: one clear silhouette, ≤3 colors of visual weight, no text smaller than the title itself.
- **One image = one idea**: the cover says *what the game is*, not everything in it. A heist game shows a heist icon (the clock, the token, the ray), not a collage of every feature. Composition rule: one focal object, negative space around it, the title readable at thumbnail.
- **Identity colors**: the cover uses the game's palette-anchor (§6.2) — the cover and the game must look like the same product; a cover that promises neon delivers pastel is a bait-and-switch at the front door.
- **Series coherence**: a three-game portfolio should look like a *suite* — shared layout grammar (same title placement, same frame device) with per-game palette/icon. Judges and players read the suite-discipline as production maturity.
- **No generic renders**: avoid the slop markers — gradients with no reason, lens flare, stock-3D look. The anti-slop rules (§6.9) apply hardest here because the cover is where the "looks designed vs. assembled" judgment happens fastest.

## 12.2 Trailer and store copy

The trailer and copy serve one purpose: make the game's *thinking* legible to someone who's never played **[Conv]**:

- **The 15-second hook rule**: the first 15 seconds must show the game's verb and its stakes — for these games, that's "watch the plan execute" (a run resolving), "the loan must come home," "three parcels, two ferry slots." Start with the game's *thing*, not the logo, the title, or the ambiance. Most indie trailers waste the first 8 seconds on logos; judges skip.
- **Show the loop, not the features**: 20–40 seconds of an actual complete loop — place interventions → run → verdict — beats any feature list. Viewers evaluate "would I enjoy the moment-to-moment" unconsciously; the loop is the only honest way to show it.
- **The fail→learn→solve micro-arc**: the strongest trailer arc for puzzle games is watching a plan fail informatively and the next attempt succeed — it demonstrates the core psychological loop (§1.18's anticipation→divergence→diagnosis→reframe) in 20 seconds.
- **Copy rules**: the store description's first two sentences are the pitch — the hook in sentence one ("a heist where every borrowed thing must be home by midnight"), the evidence in sentence two (player count, game count, the differentiator). Feature bullets after, never before.
- **Length honesty**: trailers 60–90s for small games; >2min means you didn't edit. Copy: 3 short paragraphs max — hook, evidence, specifics; anything longer is for the README.

## 12.3 The submission kit structure

For competitions and portfolio submissions, the kit is what judges actually review **[Rec]**:

1. **The playable artifact** — a link that works with zero setup (a hosted build > a repo > a download). Every click between a judge and playing loses a fraction of evaluations.
2. **The 1-page pitch** — the hook, the three games' identities, why the portfolio is coherent (the "one discipline, three dialects" framing, §3.23), what's verified (real numbers: tests passing, levels authored, playtest cohorts run).
3. **The design evidence** — the bible/summary doc showing the production discipline; judges at this level evaluate *process* as much as product. The LevelCard system, the CI gates, the playtest protocol — these demonstrate skill the game alone can't show.
4. **The honesty ledger** — what's real vs. what's claimed: par-approximation flags, unverified features clearly marked, limitations stated. The honest-evidence principle (§12.4) applied to the kit itself.
5. **The contact/author card** — who made it, what role, how to reach. Obvious, but missing from half of student submissions.

## 12.4 Honest evidence: documentation without inflation

The portfolio's credibility is its calibration **[Rec — and the user's own stated value: honest evidence over confident claims]**. Rules:

- **Claim only what's verified**: "30 levels, all CI-verified" is a fact; "deep engaging puzzles" is a claim. Facts are the currency; unverifiable adjectives are inflation.
- **Mark the uncertain**: pars labeled "approximate, author-solve+2" until playtested (§10.2); unfinished features marked "in progress," never presented as done. The difference between verified and intended must always be visible.
- **Show the verification, not just the result**: the test count (47/47 green), the playtest cohorts, the CI gate — evidence of *process* is more convincing than evidence of *output* for a portfolio piece, because process is what can't be faked.
- **Never overstate role or scope**: "I designed and built the engine" is verifiable; "the team" claims that hide single-author work (or claim solo credit for team work) both surface in review. Portfolio integrity is a long asset.
- **Limits are features**: a scope-bounded game that nails its pillars reads better than an ambitious game with rough edges everywhere — the MSI discipline (§11.1) is itself portfolio-worthy when documented.

## 12.5 Portfolio presentation for a student/small-team context

Specific to building toward internships/positions **[Rec]**:

- **Process > product**: recruiters evaluating a student project read the *decisions* — the beat sheets, the System Card, the CI gates — because that's what predicts professional performance. A finished small game with visible discipline beats an ambitious unfinished one with nothing shown.
- **The writeup IS the portfolio**: the ability to produce this bible — to articulate design knowledge at production depth — is itself the demonstrated skill. Include the design document in the kit.
- **Show taste**: the anti-slop discipline (§6.9), the honest-evidence discipline, the restraint doctrine — these read as taste to experienced evaluators, and taste is the differentiator at entry level.
- **Deploy the thing**: a playable deployed link is worth ten screenshots; a judge who can *play* the game in 30 seconds will evaluate the game, while one who can only read about it evaluates the writing.

## 12.6 The competition lens: what judges actually evaluate

For skill-showcase competitions (the actual context) **[Rec]**:

- **The three-axis read**: judges evaluate (1) does it work (playable, verified), (2) is it designed (discipline visible in product AND process), (3) is it interesting (a differentiator, a point of view). Most entries fail axis 2 — the discipline is where a solo entrant can beat teams.
- **The 5-minute test**: judges spend ~5 minutes per entry on first pass — the game must communicate in that window (§12.2's hook rules apply to the whole submission).
- **Coherence as a multiplier**: three games that share a discipline (deterministic engines, one pipeline, one design language) present as *one production*, which reads as more impressive than three unrelated demos — the portfolio structure is itself a competitive strategy.
- **Evidence density**: every claim in the submission should be checkable in the artifacts — the evaluator who digs finds confirmation, not inflation.

### Applied checklist (Part 12)

- [ ] Cover reads at 200px; one idea; series-coherent; palette-anchored.
- [ ] Trailer opens on the verb+stakes within 15s; shows the loop; ≤90s.
- [ ] Kit: playable link + 1-page pitch + design evidence + honesty ledger + author card.
- [ ] Every claim verifiable; uncertainties marked; process evidence included.
- [ ] Portfolio coherence presented as the production story.


## 12.7 Cover art deeper: the thumbnail test and the read-stack

Cover/key art follows the same salience rules as level boards (§6.1), compressed to 256px:

**The thumbnail test, executed properly**:

1. Render the key art at the actual display sizes: 64px (list view), 256px (card), 1024px (header).
2. At 64px: exactly one shape should survive. If two compete, merge or drop one.
3. At 256px: the title reads without squinting. If it doesn't, the type is decorative, not communicative.
4. At 1024px: a detail layer rewards a closer look (texture, hidden element) — but no new *information*; all key info is legible at 256px.

**The read-stack for covers** (applied to key art):
- **1st read**: silhouette — the game's single icon (the record player, the crowbar, the parcel).
- **2nd read**: value contrast — where's the focal point.
- **3rd read**: title + tagline — readable at every size.
- **4th read**: supporting elements — only for the large-format viewer.

**Cover common shapes**:
- **Icon + title** (Baba Is You, Mini Metro): one symbol, one word. Best for abstract/design-forward games.
- **Scene + title** (Untitled Goose Game): one moment that sells the fantasy. Riskier — needs a legible scene at thumbnail size.
- **Typography-led** (The Witness): the title itself is the art. Works when the name is strong and the type is designed, not defaulted.

**For the portfolio**: TRS = icon + title (the phonograph/record, or a single lit window); RBM = scene (the house at night, one lit window, a figure mid-loan); PFT = diagram-as-cover (the island graph drawn in the game's art style). Three covers that read as a series: same typeface family, same composition grammar, different single symbols. **[Rec]**

## 12.8 Trailer and copy deeper: the structural beats

**The trailer's internal structure** (the 60s expanded version of §12.2's 15s):

| Time | Beat | Job |
|---|---|---|
| 0–5s | Hook image | The single strongest image; no logo yet |
| 5–15s | Setup | The world, the verb, the constraint — in order |
| 15–30s | Escalation | A harder version; show a failure |
| 30–45s | The insight | The "aha" moment, shown fast enough to not spoil |
| 45–55s | Scope montage | Variety proof: different boards, mechanics |
| 55–60s | Title + CTA | One line, one link, end |

Two non-negotiables: **no letterboxing, no narration** unless the voice IS the game (Baba's wordplay could justify narration; most can't). **Music cuts on the insight beat** — silence or a single sting, never the driving track.

**Store copy structure**:
- **Line 1** (the sentence): "[Verb] [constraint] in [world]" — "Redirect the watchers' gaze in a house that won't forget" (TRS); "Borrow, deliver, return — before midnight" (RBM); "Route the parcels across the islands" (PFT).
- **Paragraph 2**: the differentiator — what's mechanically unusual.
- **Paragraph 3**: scope honesty — level count, mode, length estimate.
- **Bullets**: 3–5 mechanical features, not adjectives. "12 moves per level, no timer" beats "relaxing puzzle experience".

**The honest-length rule**: if the game is 4 hours, say 4 hours. Players reviewing scope-correct short games say "short but complete"; players deceived say "rip-off". The copy controls the expectation, not the impression.

## 12.9 The demo-day problem

Competitions end in demos — judges playing, not watching **[Conv]**:

**Demo design differs from ship design**:
- **A curated path**: a "demo mode" level sequence (3 levels: hook, escalate, wow) — NOT the ship's level 1-3. The demo assumes 5 minutes, not a session.
- **A skip**: judges can jump levels; never gate a demo on prior completion.
- **A reset**: one-key restart of the current level; judges break things.
- **A poster context**: a 1-slide "what is this" visible beside the demo for observers.

**Demo telemetry**: in demo builds, log the funnel (opened → first level → solved/walked away). Judges who walk away at level 1 were lost by the demo design, not the game.

**The pitch-on-top-of-demo**: if a human pitches while judges play, the script is 60 seconds: one sentence of setup, one invitation to try, then silence while they play. Talking over someone's play is the fastest way to not be remembered.

## 12.10 Postmortem of the pitch

After submission, the pitch artifact gets a postmortem like everything else:

- **What got played**: which level did judges reach? Which did they skip?
- **What got remembered**: in judge feedback, which features were named (the ones that landed) and which weren't (invisible)?
- **What was asked**: judge questions reveal the communication gaps — "can you undo?" means undo wasn't legible in the first minutes.
- **What scored**: where did the three-axis read (§12.6) land — concept, execution, polish — and which axis cost the most?

Feed into the next pitch's §12.3 submission kit — the kit itself is a living artifact.

## 12.11 The honest-evidence appendix

The full rules for claims in materials **[Rec]**:

- **Level counts**: count only what's verified in the build at ship — never "coming soon".
- **Screenshots**: real captures, current build, unretouched; if a caption is needed, the screenshot failed.
- **Videos**: captured from the shipped build, not a marketing build; no footage that isn't in the game.
- **Claims**: "no in-app purchases", "offline", "open source" — only if literally true.
- **Duration**: a median from playtests, not a guess; "most players finish in 3-5 hours" is honest if that's what the data says.
- **Awards/press**: only what exists; no "featured in" for a tweet.

The discipline is the same as the in-game trust rules (§1.13): every claim is a promise, and promises broken in marketing are remembered longer than promises kept.

## 12.12 Applied checklist

- [ ] Cover passes the 3-size thumbnail test; one shape survives at 64px.
- [ ] Trailer hits the 6-beat structure; music cuts on the insight beat.
- [ ] Copy's first sentence is verb+constraint+world; scope is honest.
- [ ] Demo mode exists: curated path, skip, reset, poster context.
- [ ] Demo build logs its funnel.
- [ ] Every claim in materials is verifiable in the shipped build.
- [ ] Postmortem of the pitch scheduled post-submission.


## 12.13 The press kit

What ships alongside the game for press/judges **[Conv]**:

- **fact-sheet.txt**: name, genre, one-line pitch, platform, release date, developer, contact, key features (3 bullets), links.
- **Screenshots**: 5-8 at native resolution + thumbnail; named `game-ss-01.png` etc.; each showing a different aspect (not 8 shots of the same level).
- **Key art**: the cover at multiple sizes; a transparent logo variant.
- **Trailer**: the ≤90s video + a 15s cut for social.
- **About.txt**: who made it, why, what it's for (the competition, the portfolio); 2-3 paragraphs.
- **GIF/webm captures**: 3-5 short loops showing the core action; these get shared where videos don't.

The kit is a single zip; anything a journalist needs is inside it, named obviously. A press kit that's hard to use produces no press.

## 12.14 The playtest-video discipline

If you capture playtest footage **[Rec]**:

- **Consent is written**: "may be used publicly" is explicit.
- **Faces optional**: gameplay capture needs no faces; a screen-only recording serves the evidence purpose.
- **Real failures stay**: cutting every stumble produces a fake-competent video; the struggle is the evidence the game works.
- **Timestamp the moments**: a submission video showing "player insight at 02:14" beats a highlight reel; the timestamped insight is the demonstration of design.
- **No coaching**: the footage shows what players do without help; a coached playtest video is marketing, not evidence.

## 12.15 The submission-kit checklist, concrete

For the competition context **[Rec]**:

- [ ] **Playable build** at the required URL/path; verified from a clean browser session.
- [ ] **README** at repo root: how to run, controls, known limitations.
- [ ] **fact-sheet.txt** complete.
- [ ] **Trailer** uploaded to the required host; ≤90s, real gameplay.
- [ ] **Screenshots** 5-8, named, current build.
- [ ] **About/dev notes**: the 2-3-paragraph story.
- [ ] **Submission form** fields filled identically to the fact sheet (consistency matters).
- [ ] **Backup**: a zip of the entire kit + the build, kept offline.
- [ ] **Dry run**: full submission walked through once before the deadline.
- [ ] **Contact**: a monitored email on the kit, not a dead address.

## 12.16 The portfolio as artifact

How a portfolio of games should be *presented* differently from individual games **[Rec]**:

- **Series coherence**: the three games share a visual grammar (typeface, composition, palette discipline) — judges/hirers read a portfolio as a design *position*, not a pile.
- **The throughline**: one stated design interest ("observation under constraint", "systems-first design") that all three games express differently — this is the portfolio's thesis.
- **Comparative depth**: each game demonstrates a different axis (TRS = temporal causality, RBM = scheduling, PFT = spatial logistics); the variety is the argument for range.
- **Process > product**: for student/early-career portfolios, the design documents and postmortems often matter more than the shipped games — a strong REPORT.md outperforms a weak build.
- **The "one more thing"**: a single unifying artifact (a portfolio site, a combined trailer, a design doc) that treats the three as one work.

## 12.17 Judging rubric deconstruction

How competition judges actually read **[Contested — varies by competition, but the pattern holds]**:

- **Concept** (30%): is the idea interesting? A mediocre-executed great idea often beats a polished clone.
- **Execution** (40%): does it work? Bugs at the judging screen are fatal; a stable mediocre build beats a broken ambitious one.
- **Polish** (20%): does it feel made? The presentation layer is the cheapest place to fake quality.
- **Novelty** (10%): is it different? Pure novelty rarely wins alone, but novelty×execution does.

The 5-minute test (§12.6): judges reach the verdict in ~5min of play. If the first 5 minutes are tutorial and friction, the score is set before the game shows anything.

## 12.18 Applied checklist (supplement)

- [ ] Press kit zipped; fact-sheet, screenshots, trailer, about all present and named.
- [ ] Playtest footage has consent + uncut failures + timestamps.
- [ ] Submission-kit checklist executed with dry-run.
- [ ] Portfolio presented with series coherence + throughline.
- [ ] First 5 minutes of play tested for the judging rubric.


# PART 13 — GENRE CASE STUDIES

Ten games that solved the problems this portfolio faces, analyzed for the specific lessons they teach — not reviews, but extraction. Each case ends with its application to the three reference games.

## 13.1 Baba Is You (Hempuli, 2019): the vocabulary that rewrites itself

**What it is**: a grid puzzle where the rules are physical objects — "BABA IS YOU," "WALL IS STOP," "FLAG IS WIN" appear as pushable word-tiles in the world; rearranging them rewrites the level's rules. Sokoban's grammar made recursive.

**Mechanic lessons**:

- **The meta-mechanic multiplies everything.** One rule — *rules are objects* — makes every other rule a variable. The portfolio's analog is PFT's `deploy`: a verb that edits the graph itself rather than moving through it. The lesson: the highest-leverage verb you can author is the one that changes the *system*, not the state.
- **Vocabulary-as-content**: the game's levels are mostly "which words are available" — content is vocabulary allocation. TRS's authored *intervention vocabulary per level* (which of skid/toy/delay/redirect is offered) is the same move: the level's character is defined by what's *in the toolbox*.
- **Failure is free and instant**: restart/undo is a single input, making experimentation frictionless — players push combinations they'd never try at higher cost. The portfolio inherits this directly: undo cheapness is exploration permission.
- **Difficulty lives in self-reference**: the hardest levels make the player use the mechanic *about* the mechanic (making "WIN" itself movable). Difficulty-by-recursion is the purest form of depth-over-width (§4.19).

**Presentation lessons**: MS-Paint-adjacent art that is nonetheless *consistent* — every word-tile identical in style, every entity silhouette-legible, state changes (rule breaks) flagged by a visible shake. Proof that consistency outranks fidelity: the game looks cheap and reads perfectly.

**Portfolio application**: vocabulary allocation as level design (per-level intervention/tool subsets); rule-objects as the differentiator; consistency-beats-fidelity as the art budget rule.

## 13.2 The Witness (Thekla, 2016): teaching without a single word

**What it is**: a first-person island covered in line-drawing panels; every rule is taught purely through puzzle sequences — never a word of instruction — and the island itself is the map/hub.

**Mechanic lessons**:

- **Demonstration ladders**: each mechanic gets a panel sequence that prunes wrong interpretations until only the rule is learnable — the literal teach-by-constrained-space method (§2.8). The first panel of each rule family can't be mis-solved into teaching the wrong lesson. The portfolio version: TRS-01's forced-first-action, PFT-01's five-move complete loop.
- **The world IS the curriculum**: the island's areas each own a mechanic family — geography is the course structure (§2.18 map design). Areas are hub-connected (incubation-friendly §1.7); a stuck player wanders elsewhere.
- **Environment as story and as marker**: the island narrates (corpse-statues, buildings) and marks progress (the laser beams literally shoot to the mountain as you complete areas — progress made physical, §1.5's in-world progress).
- **No-UI discipline**: almost no interface exists — the player is trusted entirely. The trust IS the game's identity (§1.15 difficulty-as-respect taken to its limit).

**Presentation lessons**: flat-shaded, limited palette per region, absolute clarity of interactive panels against scenery — the interactive-layer-never-baked rule (§6.4) at industry-defining fidelity. Also: silence as sound design (§7.7) — almost no music; the soundscape is the soundtrack.

**Portfolio application**: demonstration-ladder curriculum; region-mechanic mapping; environmental progress markers; silence as a music strategy; the trust-the-player identity.

## 13.3 Untitled Goose Game (House House, 2019): verb economy as comedy engine

**What it is**: a village sandbox where you are a goose with a tiny verb set — honk, grab, flap, sneak — and a to-do list of authored mischief goals.

**Mechanic lessons**:

- **Four verbs, infinite material**: the entire game is applications of ~4 verbs in a reactive world — the verb-economy proof (§4.2) that depth comes from a world that *responds*, not from a verb list. The portfolio version: every portfolio verb should earn its place by how many *states it can change meaningfully* in the world.
- **Goals as puzzle spec**: the to-do list is literally a list of condition-sets ("get the boy to wear the wrong glasses") — authored *outcomes* left to player method. TRS's authored conditions are the same structure: the requirement is specified, the method is open.
- **Readable social systems**: villagers react to the goose legibly — you learn their routines by watching (observation-first causality, TRS's core skill). The lesson: NPC/system behavior that can be *read* enables planning; opaque reaction just produces chaos.
- **Mischief framing**: low stakes + playful failure = experimentation-positive (§1.6's stakes-without-punishment — being caught is mildly inconvenient, which licenses trying weird things).

**Presentation lessons**: a distinct style ("a real place but simpler") executed with total discipline — flat shading, confident silhouettes, visible restraint. Also the sound design lesson: one adaptive element (the piano reacting to play) carries the whole score — adaptive audio at minimal cost.

**Portfolio application**: tiny-verb-large-world architecture; condition-specified goals with open methods; legible reactive systems enabling observation-based planning; restraint as style.

## 13.4 A Little to the Left (Max Inferno, 2022): cozy pacing and multi-solution tolerance

**What it is**: a tidy/untidy puzzle game — arrange household objects into satisfying order; no timers, no fail states, a cat who occasionally ruins your work.

**Mechanic lessons**:

- **Aesthetic judgment as the puzzle**: solutions are "what looks right" — multiple valid arrangements, verified by rule-systems (rotational symmetry, size ordering, color grouping). Multi-solution design (§3.6) at its most tolerant: the game accepts any arrangement satisfying its rule predicates.
- **Untimed by identity**: zero time pressure is the product promise — the cozy genre contract. PFT's untimed planning is the same decision at the mechanical level: when the challenge is optimization (par), removal of time-pressure costs nothing and widens the audience.
- **Micro-episodes**: puzzles are 20–90 seconds each — session structure is a string of tiny wins (§1.8's win-density front-loaded aggressively). The portfolio analog: early levels at 60–90s create the "one more" engine.
- **The cat**: a gentle chaos agent that periodically undoes tidy-ness — controlled disruption that keeps the game from being sterile without ever feeling punitive (it's cute AND it resets some boards — loss re-framed as character).

**Presentation lessons**: hand-drawn warmth — imperfect lines, soft palette, domestic textures — style matching fantasy at low cost. Proves the style-bible approach: a strong narrow style executed consistently beats mixed-fidelity asset packs.

**Portfolio application**: multi-solution tolerance machinery; untimed as identity; micro-episode density early; disruption-with-charm (the controlled-chaos agent as a design pattern worth borrowing — a TRS equivalent: the world occasionally surprising you in ways that are informative, not punitive).

## 13.5 Stephen's Sausage Roll (increpare, 2016): difficulty by constraint

**What it is**: a Sokoban-descended puzzle — roll sausages onto grills in a 3D grid world; famously minimal tutorial, famously difficult, famously *fair*.

**Mechanic lessons**:

- **The smallest space that works**: levels are tiny boards with enormous depth — state-space size is decoupled from board size (§3.2). The portfolio lesson: don't confuse board scale with problem scale; a 6-island PFT level can be harder than a 40-node maze.
- **Constraint, not complexity**: difficulty comes from *tight* state spaces — few entities, few legal moves, but every move consequential and mostly irreversible (burnt sausage, fallen block). Irreversibility as a difficulty instrument is the anti-PFT design (PFT uses undo-freedom; SSR uses commitment gravity) — both are valid, choose per game identity and mark irreversibility clearly (§4.16's legible-irreversibility rule).
- **Fair-brutal compact**: the game never explains and never cheats — the entire difficulty is *findable*, which is why players tolerate the walls. The respect-mechanism (§1.15) taken to its extreme.
- **No filler**: ~100 levels, each with a reason to exist — insight-bearing levels near 100% (§3.2's 70% floor exceeded on purpose).

**Presentation lessons**: aggressively plain visuals, nothing ornamental — presentation entirely subordinate to the read. Proof that polish budget can be zero when design quality is the product.

**Portfolio application**: tight-space-over-big-space; irreversibility as a difficulty instrument (and its legibility requirement); the fair-brutal compact as a branding decision; the no-filler content bar.


## 13.6 Cosmic Express (Hazelden/Davis/Eykholt, 2017): the logistics-space master's class

**What it is**: lay a single track through a grid so a train picks up and delivers aliens of matching colors — one continuous path, no branches, capacity constraints. The most direct ancestor of PFT's design space.

**Mechanic lessons**:

- **The single-path constraint multiplies difficulty**: forcing one unbranched route converts a routing puzzle into a packing problem — the constraint *is* the game. The portfolio analog: PFT's one-rider ferry and bounded parcelCapacity are constraint-first designs — the rules that *prevent* things are what create the puzzles.
- **Levels as tiny topology**: boards are small grids; the *shape* of the level IS the puzzle (chokepoints, one-way regions, delivery order). Author topology first (§3.26's "the map is the puzzle") — exactly the PFT recipe.
- **Failure is spatial, not punitive**: a wrong track just doesn't work — visible, undoable, undramatic. The failure tone matches the cozy presentation while the puzzles stay hard: proof that aesthetic softness and mechanical hardness coexist (PFT's whole tone bet).
- **Difficulty-by-last-cell**: the classic Cosmic Express experience is a level that fails on the final delivery — near-miss failures that motivate perfectly (§1.4) because the *whole plan* is visible at failure (nothing hidden to blame).

**Presentation lessons**: diagrammatic clarity — the board reads like a transit map; colorful without noise; every constraint is visible in the picture. The presentation rule it proves: a logistics game should look like a *legible diagram first*, a world second.

**Portfolio application**: single-path/one-rider constraints as puzzle engines; topology-first authoring; failure tone matching; diagram-legibility as the PFT visual contract.

## 13.7 Opus Magnum / Zachtronics (2017): open-ended optimization as content

**What it is**: an alchemical engine-building puzzle game — place arms and tracks on a hex grid to transmute atoms into products; solutions are machines, and the post-solve screen shows a histogram of cost/cycles/area across all players.

**Mechanic lessons**:

- **Solved is not finished**: every puzzle accepts many solutions and the *metrics* (cost, cycles, area) become the continued game — optimization pressure without any deadline. PFT's par-vs-moves is this exactly: finishable always, excellent sometimes (§1.6's stakes-without-punishment in its purest form).
- **The histogram as social proof**: showing *other players' solution distributions* after solving is the greatest retention hook in puzzle design — it converts "I solved it" into "I solved it *how*?" — and it's nearly free: your own leaderboard data rendered as a distribution. For a portfolio: per-level distribution displays of move counts (or just the player's own best-vs-par) capture most of the effect.
- **Solutions as artifacts**: the game exports solution GIFs — players share their *machines*, not their scores. Solutions-as-shareable-objects (§1.16's artifact rule) at its best; TRS runs are natural candidates (a run is already a small film).
- **Vocabulary depth over breadth**: Zachtronics games teach ~10 parts then spend the game exploiting them — the introduction→elaboration→exploitation arc (§1.5) fully realized: almost all content is exploitation.

**Presentation lessons**: dense period styling executed with total discipline — the game looks like its own alchemical manuscript. The scoring screen (histograms, metrics) is presented as *primary content*, not a footnote — measurement-as-content.

**Portfolio application**: par/optimization as continued game; histogram/distribution displays; solution artifacts as share objects; vocabulary exploitation as content bulk.

## 13.8 Keep Talking and Nobody Explodes (Steel Crate, 2015): information asymmetry perfected

**What it is**: co-op party game — one player sees a bomb with modules; others hold only the paper manual; the defuser describes, the experts decode. Communication is the entire mechanic.

**Mechanic lessons**:

- **Asymmetry must be total**: the defuser literally cannot see the manual; experts cannot see the bomb — partial asymmetry would collapse the mechanic (§5.2's completeness rule).
- **The manual as interface**: the expert's tool is a *document* — information design becomes game design (the manual's layout IS the UX). Portfolio analog: any co-op mode needs its *advisor surface* designed as carefully as the game — the manual is not documentation, it's gameplay.
- **Stress from communication cost**: difficulty is produced by description-channel bandwidth — describing a module under a timer is the game. For turn-based portfolio co-op, time pressure is replaced by *planning pressure* — but the principle holds: constrain the channel, and the constraint is the challenge.
- **The fun is interpersonal**: the design's genius is that it creates conversations — "cut the red wire" is content two players make together. The portfolio version: design for the *conversation the game produces* (§5.10's communication-is-the-solve).

**Presentation lessons**: one screen, one manual — minimal interface where the physical props do the work; proves the game can live mostly outside the screen.

**Portfolio application**: total asymmetry for co-op roles; the advisor-surface-as-gameplay; conversation-as-designed-content; the Observer/Intervener split for TRS co-op is the direct descendant.

## 13.9 Outer Wilds (Mobius, 2019): knowledge as the only progression

**What it is**: a solar-system exploration game with zero upgrades — the only progression is *what the player knows*; the entire game is gated on understanding, reachable technically in the first minutes.

**Mechanic lessons**:

- **Knowledge-gating**: the ultimate player-agency structure — no locks except comprehension (§2.4's knowledge gate). It works because *understanding is verifiable*: if you know why X happens, you know where to go. TRS is this structure miniaturized per-level: the only thing between the player and the solution is causal understanding.
- **The world as puzzle**: the game's systems run on a clock (the 22-minute loop) — causality over time IS the mechanic; the player watches systems and infers rules. This is literally TRS's premise: observation of a deterministic world as the core verb. The lesson the portfolio takes: **a deterministic world running on a clock is a puzzle generator** — every interaction is a clue.
- **Ship's log = externalized model**: the game's detective board accumulates what the player learned — the inference-recording surface (§3.15) that deduction demands.
- **Ending on understanding**: the finale is reachable by knowledge alone — the purest competence fantasy.

**Presentation lessons**: hand-crafted physicality — a village that feels lived-in, planets with real interiors; stakes communicated through beauty (the loop's end is genuinely moving because the world was worth loving).

**Portfolio application**: deterministic-world-as-puzzle-generator; externalized inference surfaces; observation-first verbs; the TRS identity stated as "Outer Wilds' epistemology in a sealed room."

## 13.10 Mini Metro / Mini Motorways (Dinosaur Polo Club, 2015/2021): readable chaos

**What it is**: connect a growing transit network by drawing lines between stations as the city grows — minimalist abstraction of scheduling under pressure.

**Mechanic lessons**:

- **Elegance via disappearance**: the game's genius is what it *doesn't* show — no drivers, no economics, just stations and lines — the smallest model that still produces transit problems (§4.16's anti-features: everything removed that didn't create decisions). For the portfolio: audit for elements that exist only because "games have them."
- **Emergent demand creates the difficulty**: stations spawn and fill — the difficulty curve is *generated by the game's own growth*, not authored per-level (the hybrid authored/procedural model §10.6: authored rules, emergent pressure). The portfolio variant: levels where pressure compounds over the session (RBM's approach to midnight has this shape — the deadline IS escalating demand).
- **Readability under load**: the game stays legible as it gets chaotic — information design at scale: circles/triangles/squares as station types, color as lines. Visual vocabulary (shape-typed stations) is how a complex state stays scannable — §6.1 silhouette layer applied to systems.
- **Graceful loss**: the game ends when a station overflows — the ending is informative (you *see* the failure accumulate) and the restart is instant. Death-with-dignity: failure as a clean score, not a punishment.

**Presentation lessons**: the iconic transit-map aesthetic — proof that diagram-as-style (PFT's design language family) is a complete art direction, not a compromise.

**Portfolio application**: anti-feature audits; generated-pressure difficulty; shape-typed state vocabulary; graceful-loss endings; the diagram-as-style identity for PFT.

## 13.11 Cross-case synthesis: the ten transferable principles

1. **Vocabulary-as-content** (Baba): allocate the toolbox per level.
2. **Demonstration ladders** (Witness): prune wrong interpretations; text last.
3. **Tiny verbs, huge worlds** (Goose): depth from reactive worlds.
4. **Multi-solution tolerance** (Little to the Left): acceptance predicates over exact paths.
5. **Small board, huge space** (Sausage Roll): state space ≠ board scale.
6. **The constraint is the game** (Cosmic Express): what the rules prevent creates the puzzles.
7. **Solved ≠ finished** (Zachtronics): metrics extend content; histograms socialize it.
8. **Asymmetry is co-op** (KTANE): complementary blindness forces conversation.
9. **Deterministic worlds are puzzle generators** (Outer Wilds): clocks + causality = content.
10. **Diagram-first presentation** (Mini Metro): the legible picture IS the aesthetic.

Every principle has a home in the portfolio — the map: TRS ∈ {2,4,9}, RBM ∈ {1,5,7}, PFT ∈ {3,5,6,10}, co-op ∈ {8}. A portfolio whose games each synthesize 3–4 proven principles while differing in domain is positioned as *informed*, not *derivative* — the case studies are the evidence the design choices weren't guesses.


## 13.12 How to run your own case study

The method used in this part, made repeatable **[Rec]**:

1. **Play to competence**: finish the game or reach its hard levels; surface impressions miss the design.
2. **The mechanic inventory**: list every verb/noun/system; the inventory is usually smaller than expected — which is the first lesson.
3. **Find the load-bearing rule**: which single mechanic, if removed, collapses the game? (Baba's rules-as-objects; Outer Wilds' knowledge-as-gating.)
4. **Trace one "aha"**: pick a specific puzzle and reconstruct its design backwards — what was the insight, where was it placed, how was it scaffolded?
5. **Study the failure states**: what does the game do when you're wrong? The failure design is usually the more instructive half.
6. **Measure the restraint**: what's NOT there? (No quest log in Outer Wilds; no undo in Sausage Roll.) Absences are decisions.
7. **Extract the transferable**: state the lesson at the level of mechanism, not theme — "rules-as-objects" transfers; "be a goose" doesn't.
8. **Apply it once**: name where in your own project the lesson lands — a lesson without an application is trivia.

A case study that ends in admiration is tourism; a case study that ends in a named mechanism and an application is research.

## 13.13 The case-study pattern library

Patterns abstracted from the exemplars, ready to lift **[Rec]**:

| Pattern | Source | Mechanism | Portfolio fit |
|---|---|---|---|
| Rules-as-objects | Baba Is You | the vocabulary itself is manipulable | TRS: interventions ARE the objects |
| Demonstration curriculum | The Witness | each idea taught by 5-7 escalating boards | every chapter's block-of-3 |
| Gate-by-knowledge | Outer Wilds | progress requires knowing, not finding | TRS verdicts; all puzzle gates |
| Optimization-as-content | Opus Magnum | solving isn't the end; scoring is | PFT par + move counter |
| Historical-solution visibility | Zachtronics histograms | your solution vs. the distribution | post-solve screens |
| Restraint-as-signal | Sausage Roll | low verb count → each is load-bearing | the whole vocab-freeze method |
| Forced-perspective problems | Cosmic Express | the layout IS the difficulty | PFT topology design |
| Asymmetric info | Keep Talking | complementary knowledge, real-time | TRS Observer/Intervener |
| Physics-as-punchline | Untitled Goose Game | emergent physical comedy | presentation looseness |
| Cozy difficulty | A Little to the Left | stakes-free perfectionism | PFT's untimed par |
| Multi-solution legitimacy | Mini Metro | many valid routes | hybrid uniqueness default |

## 13.14 What NOT to copy

The negative-space lessons **[Rec]**:

- **Don't copy The Witness's grid abstraction**: it works because the whole game is the grid; grafting it onto a different game is decoration.
- **Don't copy Baba's rule-rewriting**: it requires the entire game be built around it; a "rules level" in a normal game is a gimmick level.
- **Don't copy Outer Wilds' opacity**: knowledge-gating works because the whole game is designed to be re-derived; hiding information in a normal puzzle is just hidden information.
- **Don't copy Keep Talking's real-time pressure**: communication-under-time is the game's identity; adding timers to co-op puzzles mostly adds stress without depth.
- **Don't copy Zachtronics' complexity ceiling**: their audience self-selects for engineering depth; borrowing the histograms without the depth is false advertising.

The rule: **copy mechanisms, not aesthetics**. If the lesson is "restraint", the copy is "my game should have fewer verbs", not "my game should look like Sausage Roll".

## 13.15 Case-study synthesis for the portfolio

How the pattern library lands per game **[Rec]**:

**TRS gets**:
- Rules-as-objects (Baba): interventions are the manipulable vocabulary — the causal-graph IS the rule set.
- Gate-by-knowledge (Outer Wilds): the verdict screens reveal mechanism — you progress by understanding, not by finding.
- Demonstration curriculum (Witness): each intervention type taught across its own escalating block.
- Asymmetric info (Keep Talking): the co-op variant partitions observation/intervention.

**RBM gets**:
- Forced-perspective problems (Cosmic Express): the manor's layout creates the scheduling difficulty, not the schedule itself.
- Optimization-as-content (Opus Magnum): settling on-time is solving; settling efficiently is the real game.
- Physics-as-punchline (Goose): the loans' sensory tags produce emergent comedy — the HEAVY vase that slows the carrier.
- Restraint-as-signal (Sausage Roll): ~8 verbs, all load-bearing.

**PFT gets**:
- Multi-solution legitimacy (Mini Metro): many valid routes at varying par.
- Cozy difficulty (A Little to the Left): no timer, the move counter as the only judge.
- Optimization-as-content (Opus Magnum): under-par as the mastery target.
- Demonstration curriculum (Witness): the 12-action vocabulary taught in strict order.

**Cross-portfolio gets**:
- Restraint-as-signal everywhere: the entire vocab-freeze method descends from it.
- Historical-solution visibility: post-solve par distributions if infrastructure allows.
- Mechanism-over-aesthetic discipline: the portfolio's identity is mechanical coherence, not visual similarity.

## 13.16 The exemplar curriculum

If a new designer can only play 5 games to learn from, the order **[Rec]**:

1. **Baba Is You** — for vocabulary design; play until the rule-writing clicks.
2. **Cosmic Express** — for how layout creates difficulty; a masterclass in puzzle-from-topology.
3. **Outer Wilds** — for knowledge-as-progression; the purest "the player learns" design.
4. **Opus Magnum** — for score-as-motivation; how to extend a puzzle game's life.
5. **Keep Talking and Nobody Explodes** — for information asymmetry; the only co-op that teaches it cleanly.

Each teaches one mechanic-idea the others don't; together they cover most of what Parts 3-5 argue.

## 13.17 Applied checklist (supplement)

- [ ] Case-study method run on at least one game not in this list before using its lessons.
- [ ] Pattern library extracted as mechanisms, not aesthetics.
- [ ] "What not to copy" list written per exemplar.
- [ ] Per-game applications named specifically, not "this applies everywhere".


# PART 14 — APPENDICES

The reference layer: checklists for every stage, the glossary, the failure-mode catalog, and the annotated reading list. Everything here is designed to be printed, pinned, and audited against.

## 14.1 The master checklists

### A. Level checklist (pre-review, per level)

- [ ] Beat sheet complete: insight (1 sentence), atoms, critical path, hook, naive failure, difficulty knobs, pacing shape, verification.
- [ ] Key insight named and load-bearing (naive approach fails *because* it lacks the insight).
- [ ] Critical path written as state-sequence; bottleneck authored deliberately.
- [ ] Tracking load ≤4 at board-read; entity count within chapter budget.
- [ ] Wrong approaches classified: critical path has zero dead failures.
- [ ] Hint ladder: T1 relationship / T2 tool / T3 first-step; authored at design time; reviewed in isolation.
- [ ] Solution policy declared (unique/hybrid/open); claimed multiplicity has ≥2 verified traces.
- [ ] Signifier consistency: all affordances wear their costume; screenshot test passed.
- [ ] Pacing: ≤2 tension units without release; execution-after-insight <60s.
- [ ] LevelCard complete: metadata, traces, wrong approaches, hints, par flagged approximate-until-verified.
- [ ] Verification: golden trace + scripted failures green in CI.
- [ ] Accessibility: no time-punishment, no memory-required-offscreen, colorblind-safe markers.

### B. Art/visual checklist (per region + full game)

- [ ] Silhouette test: every interactive pair distinguishable as shapes.
- [ ] Squint test: decisive element wins grayscale read.
- [ ] 3-second parse on fresh eyes per board archetype.
- [ ] Kit: 5 layers present; primitives tile; connector budget spent; features ≤10%.
- [ ] Interactive layer never baked into tiles/dressing.
- [ ] Salience map: one top-slot element; dressing in low band.
- [ ] Palette anchored per region; materials ≤6; single light story.
- [ ] UI: 8px grid; type ≤4 sizes; one accent; ≥70% info area.
- [ ] Contrast ≥4.5:1 text; ≥3:1 graphics; colorblind redundancy.
- [ ] Reviewed at ship resolution on non-retina display.

### C. Audio checklist (per game)

- [ ] Event-sound table complete; no silent important events; no unmappable sounds.
- [ ] Diegetic/UI channels separated; no leakage.
- [ ] Synth palette from material table; ~15–25 defs cover the map.
- [ ] Frequency slotting assigned; mix priority stack + ducking implemented.
- [ ] Earcons consistent (3-exposure taught, never re-used for other meanings).
- [ ] Master limiter on; voice cap; no clipping at busy moments.
- [ ] Mute instant + persistent; music/SFX split volume.
- [ ] Visual equivalent for every information-carrying sound.
- [ ] AudioContext unlocked on first gesture; noise buffers preloaded.

### D. Playtest checklist (per round)

- [ ] 5–8 fresh-eyes testers; portfolio-naive; recruited not just friends.
- [ ] Think-aloud protocol; no-help rule observed; written consent for recording.
- [ ] Time-boxed stalls; hint-tier-minimum recorded per stuck tester.
- [ ] Behavioral table filled per tester (actions, not self-report).
- [ ] Shaped post-session questions in writing.
- [ ] Findings coded (legibility/teaching/difficulty/bug/unfairness/engagement) into queue.
- [ ] Fix-verify on new players only.
- [ ] Level metrics logged: solve times, first-attempt rates, hint usage, abandonment.

### E. Release checklist (final gate)

- [ ] RC build hash == tested build.
- [ ] Cold playthrough on target browsers + low-spec machine, shipped build.
- [ ] Save integrity: quit/resume at 20 points; old saves migrate or declare.
- [ ] Accessibility: contrast, colorblind, reduced-motion, keyboard.
- [ ] Audio: mute, no clipping, all info non-audio-redundant.
- [ ] Performance: frame/load/memory budgets on production build.
- [ ] Store assets: cover@200px, trailer ≤90s, real screenshots, honest copy.
- [ ] Legal: licenses verified; privacy if telemetry; age rating right.
- [ ] Launch plan: announcement, watch, hotfix path rehearsed.
- [ ] Postmortem scheduled.

### F. Systems checklist (per mechanic + per game)

- [ ] Verb/noun inventory finite and enumerable.
- [ ] New verbs pass multiplicative test; no synonym/collapsed verbs.
- [ ] Interaction matrix tabulated; veto rules written.
- [ ] Total ordering documented; tie-breaks deterministic + documented.
- [ ] Canonical hashes; no wall-clock in sim; presentation reads sim only.
- [ ] Rules ≤7 core; every rule observable.
- [ ] Resource loops audited: no leaks, no unexplained generation, no unhandled jams.
- [ ] System Card written; freeze status current.
- [ ] Reversibility documented per verb; irreversible actions marked.
- [ ] Complexity budgets: verbs ≤15, nouns ≤20, tags ≤6/class.


## 14.2 Glossary (~150 terms)

Terms used in this bible and standard across game design. Definitions are working definitions, not dictionary entries.

**A**

- **Accessibility (a11y)** — design features enabling play across ability ranges: contrast, colorblind redundancy, reduced motion, remapping, captions for audio cues.
- **Acknowledgment** — the immediate (<100ms) confirmation that an input registered; the second stage of the feel loop.
- **Action space** — the set of legal actions in a state; enumerable in deterministic engines via getLegalActions.
- **Adaptive music** — music that changes with game state (layers gated on conditions).
- **ADSR** — Attack, Decay, Sustain, Release: the envelope shaping a synthesized sound's loudness over time.
- **Affordance** — what an object allows the player to do; a property of the system (a plate affords pressing).
- **Aha moment** — the insight event: sudden restructuring of a problem's representation; the core product of puzzle games.
- **Anchor (difficulty)** — a reference number (par, estimated solve) that shapes player expectations; anchoring bias makes pars influential.
- **Applied checklist** — this document's per-section list of concrete, testable rules.
- **Arity** — how many targets a verb takes (pickup=1, deploy=2, hand_over_ferry=3).
- **Art direction** — the system that makes visuals consistent: pillars, bible, freeze.
- **Asset manifest** — the authoritative list of every shippable asset with metadata (path, version, usage, load-tier).
- **Assist mode** — optional aids that lower the floor without moving the ceiling; disclosed, never silent.
- **Asymmetric information** — co-op structure where players see complementary-but-different state; communication bridges the gap.
- **Atom (skill atom)** — the smallest learnable unit: action→feedback→model→mastery (Danc's model).
- **Authoring contract** — the set of guaranteed semantics content authors may rely on (frozen vocabulary, stable action surface).

**B**

- **Bartle types** — Achiever/Explorer/Socializer/Killer motivation taxonomy; folklore, useful loosely.
- **Beat** — a discrete time step in a deterministic sim; actors/events resolve per beat.
- **Beat sheet** — a level's one-page design contract: insight, atoms, critical path, hook, naive failure, knobs, pacing, verification.
- **Blame test** — the check that a failure verdict lets a skeptical player verify the failure was their own.
- **Blind spot** — a category of things players can't see: spatial, temporal, mechanical, semantic, self-model.
- **Block of 3** — the production cadence unit: teach + elaborate + challenge levels for one mechanic family.
- **Bottleneck state** — a state every solution must pass through; the level's skeleton.
- **Brute-force friendly** — a puzzle solvable faster by enumeration than insight; a design failure.

**C**

- **Canonical hash** — a stable serialization hash proving determinism (same state → same hash).
- **Capstone** — a chapter's peak level combining prior mechanics; branded difficult.
- **Chapter** — a group of levels sharing a mechanic family and difficulty band.
- **Checkpoint** — where failure costs are bounded from; in planning games, the commit boundary.
- **Choke** — a gate requiring demonstrated skill, not possession.
- **Chunking** — expertise compressing multiple entities into single mental units; why experts carry more load.
- **Churn** — player abandonment; five causes: confusion, boredom, unfairness, completion, life.
- **Closed loop** — a resource that must return to origin (loans); stakes made mechanical.
- **Cognitive load** — working-memory demand: intrinsic (the problem), extraneous (presentation waste), germane (model-building).
- **Combinatorial explosion** — interaction surface scaling as verbs×nouns×contexts; controlled by matrices, vetoes, gating, arity.
- **Commit boundary** — where drafts become locked actions (Run, commit); must be atomic and legible.
- **Complementary asymmetry** — co-op design where each player's missing info lives on the other's screen.
- **Condition set** — the authored win-state vocabulary (EventCount, EntityStateAtEnd, VisibleFrom-style predicates).
- **Confidence budget** — how much information presentation spends vs. hides; the opacity budget ∝ interactivity.
- **Converter** — a node transforming one resource form to another (loan→staged→returned).
- **Coordination tax** — the extra difficulty co-op adds via communication overhead (~30–100% depending on asymmetry).
- **Critical path** — the required state-sequence every solution passes through.

**D**

- **Dead region** — states with no reachable solution; must be detectable and announced with reasons.
- **Decision quality** — interesting-decision properties: options defensible, consequences legible, choices compound.
- **Deduction puzzle** — a puzzle whose state space is epistemic (what's known) rather than physical.
- **Degenerate solution** — an unintended trivial solution that bypasses the insight; must be pruned or owned.
- **Density** — entities-per-screen; clutter and sparseness are the two failure modes.
- **Determinism** — same state+action → same outcome, verifiable by canonical hash; prerequisite for lockstep and replays.
- **Diegetic** — belonging to the world (sounds/lore/UI of the fiction) vs. the interface.
- **Difficulty vector** — the 6-component profile: search depth, branching, insight distance, memory load, precision, familiarity.
- **Divergence** — where player prediction and sim output differ; the learning moment in observation games.
- **Dominant strategy** — a strategy strictly better than alternatives; its presence kills decision quality.
- **Ducking** — automatically lowering background audio when priority events fire.
- **Due beat** — the deadline beat a loaned token must return by (RBM).

**E**

- **Earcon** — an audio icon: a short sound consistently mapped to a meaning.
- **Easing** — the curve shaping change-over-time (linear, ease-in/out, overshoot, anticipation, spring).
- **Elegance** — maximal consequence space over minimal vocabulary.
- **Emergence tiers** — scripted(0), combinatorial(1), idiomatic(2), degenerative(3).
- **Engine-frozen authoring** — content built only against frozen engine vocabulary.
- **Event-sound mapping** — the table assigning designed sounds per event-type.
- **Exemplar level** — the vertical-slice level proving the game's identity; the standard for all later levels.
- **Exploitation phase** — when a taught mechanic is used as assumed vocabulary in harder problems.
- **Extraneous load** — cognitive cost of presentation; always waste.

**F**

- **F-pattern** — eye-scan pattern: top-left, across, down the left edge.
- **Failure taxonomy** — teaching / near-miss / dead / silent-success-trap failure classes.
- **Flow** — absorbed engagement state; requires clear goals, immediate feedback, challenge-skill balance.
- **Forced overlap** — when two demands contend for one resource; where scheduling depth comes from.
- **Freeze** — the moment vocabulary/style is locked; consistency thereafter beats improvement.
- **FTUE** — first-time user experience; the first-session checklist.
- **Funnel (level shape)** — broad approach narrowing into the challenge.

**G**

- **Gate** — a progress controller typed by friction: open, soft, choke, gate, lock, wall.
- **Golden trace** — an authored winning action-sequence replayed in CI to verify solvability.
- **Griefing surface** — a player action that can harm shared state; mitigated by reversibility, permission scoping, friend-rooms.
- **Grey-box** — un-arted level geometry used for logic verification before any art pass.
- **Grind puzzle** — a level solvable by persistence without insight; rationed to ≤25%.

**H**

- **Hint ladder** — the graded help system: T1 relationship → T2 tool → T3 first-step.
- **Histogram hook** — post-solve distribution displays (Zachtronics) extending content socially.
- **Hook** — the level's visually/conceptually interesting element at first glance.
- **Hub topology** — a central area with player-chosen spokes; enables incubation.
- **Hypothesis diversity** — how many distinct plans a player tries; low diversity signals a broken model.

**I**

- **Idiom** — a player-discovered technique the rules support but designers didn't name (sacrificial skid).
- **Incubation** — insight arriving after stepping away; requires ≥2 open nodes and graceful exits.
- **Information asymmetry** — see asymmetric information.
- **Input buffering** — queuing inputs during resolution rather than dropping them.
- **Insight distance** — how far the key idea is from naive framing; a difficulty component.
- **Interest curve** — alternation of tension/release peaks at every scale.
- **Interpolation** — presentation-layer smoothing between discrete sim states.
- **Intervention** — a placed alteration of the world before/during a run (TRS's verb class).
- **Intrinsic load** — the problem's real difficulty; tunable only via structure.

**J**

- **Juice** — feedback polish: particles, shake, animation flourishes; restraint doctrine applies.

**K**

- **Key insight** — the single idea collapsing a puzzle's difficulty once seen.
- **Knowledge gate** — progress gated on comprehension, not possession.

**L**

- **Latency budget** — input-to-ack <100ms; the floor of responsiveness.
- **Leading lines** — visual elements steering the eye toward goals/paths.
- **LevelCard** — structured level metadata: insight, atoms, critical path, traces, wrong approaches, hints, par.
- **Lockstep** — netcode model where identical inputs produce identical states on each client.
- **Loss aversion** — losses felt ~2× stronger than equivalent gains (rule of thumb).
- **LUFS** — loudness unit; browser mix target ≈ -16 to -14 perceived.

**M**

- **Mandatory sequence** — the tutorial structure: setup → forced action → consequence → free action → completion → recontext.
- **Mechanic lifecycle** — proposal → prototype → teach → freeze → vocabulary.
- **Meta-puzzle** — a puzzle using earlier puzzles' results as inputs.
- **MSI (minimum shippable identity)** — the smallest game version still itself: core loop + differentiator + polish floor.
- **Modular kit** — the 5-layer asset system: primitives, connectors, features, variation, props.
- **Motif** — a short musical signature appearing at meaningful moments.
- **MountedOn** — a relation where a deployed piece carries/moves what sits on it (PFT pattern; movable addresses).
- **Move counter** — PFT's score measure; par is the anchor it compares against.

**N**

- **Naive failure** — the obvious wrong approach; must fail informatively.
- **Near-miss** — failure visibly close to success; motivating when honest.
- **Noun** — an entity type with state (courier, parcel, plate, token).

**O**

- **Occlusion discipline** — hidden things are authored: hide information deliberately, never orientation.
- **Olympic rings** — level pattern: independent mini-problems feeding one exit.
- **Opacity budget** — allowable hidden information scales with interactivity.
- **Overjustification** — extrinsic rewards displacing intrinsic motivation; coins-for-puzzles risk.

**P**

- **Par** — the target move/score count; an anchoring device, set generously.
- **Pass-and-play** — turn-taking local multiplayer on one device.
- **Peak-end rule** — memory ≈ peak + end moment; end sessions on wins.
- **Phase order** — the fixed per-beat resolution sequence (loans→crew→guards→returns→settle).
- **Pool** — where resources are held between source and sink.
- **Postmortem** — the blameless learning review: right/wrong/differently/surprises, producing new checklist lines.
- **Preview** — showing an action's consequence before committing; converts memory problems to observation problems.
- **Proposal/commit split** — free drafts vs. atomic application; the multiplayer echo of the commitment boundary.
- **Proximal goal** — what the player is trying to do right now; must always be answerable.
- **Psychological contract** — the implicit promise of what the game is; violations read as betrayal.

**R**

- **Ratchet** — a step that can't slide back; progress-preserving structure.
- **Read stack** — the priority order players extract board info: orientation, active problem, affordances, deltas, ambient.
- **Readiness gate** — milestone exit criteria before next phase.
- **Recurrence** — a later level re-using an earlier board with new demands.
- **Reframe** — the representational shift that is an insight (object→resource, tool→liability, visible→movable).
- **Regression testing** — golden traces + determinism + invariants re-verified on change.
- **Relatedness** — the social need; served in solo games by shared vocabulary, artifacts, spectatorship.
- **Relay model** — server-authoritative co-op: proposals relayed, state broadcast, no host.
- **Resolution order** — the fixed sequence events resolve in; must be total and documented.
- **Restraint doctrine** — every feel/visual element must answer "what does this tell the player."
- **Reversibility** — whether an action can be undone; irreversibility must be legible.
- **Reward prediction error** — dopamine = surprise vs. expectation; anticipation's mechanism.
- **Room code** — zero-account lobby identity; shareable as a link.
- **Rubber-banding** — hidden adaptive difficulty; forbidden as dishonest.

**S**

- **Salience** — attention-grab weight; a zero-sum board resource spent deliberately.
- **Sawtooth curve** — difficulty ratcheting within chapters, dropping at each new mechanic.
- **Scan order** — where the eye lands 1st/2nd/3rd on a board; authored via salience.
- **Scrub** — timeline time-travel: jump to beat N with restored state.
- **SDT** — Self-Determination Theory: competence, autonomy, relatedness.
- **Signifier** — what an object communicates about its affordance (the costume on the affordance).
- **Silent-success trap** — a wrong path that appears to work; worst failure class on critical paths.
- **Sim/presentation separation** — the sim runs without the renderer; presentation reads sim, never writes.
- **Skill atom** — see Atom.
- **Slack** — available capacity minus required demand at the binding constraint; scheduling difficulty lives here.
- **Soft gate** — passable at cost; converts frustration into opted-in challenge.
- **Spectator mode** — observer seats: pure / advisor (signals) / scrub-share / teach-the-teacher.
- **Squint test** — blur the board; the decisive element should still pop.
- **Staging** — making causality readable on-screen: sequencing, camera regions, timing of reveals.
- **State-manipulation puzzle** — changing entity values to satisfy conditions (TRS's family).
- **Stranded state** — a dead position with a named cause (pack-early, ferry-killed); detection with reasons.
- **Style bible** — the concrete art rules: palette, shape language, texture, light, type.
- **Style pillars** — 3–5 adjective-rules every art decision tests against.
- **Subgoal scaffold** — intermediate goals authoring a path to the key insight.
- **Subtraction test** — remove an element; if nothing breaks, it was decoration; if it improves, it was slop.
- **Sunk cost** — prior spend warping quit decisions; never exploited ethically.
- **Sweep (degenerate)** — the systematic check for unintended trivial solutions.
- **System Card** — the mechanics-layer spec: verbs, nouns, rules, ordering, states/events/verdicts, vetoes, freeze.

**T**

- **Teach-test-stretch** — the per-mechanic curriculum arc.
- **Telemetry** — instrumented signals feeding decisions: solve times, hint tiers, abandonment, entropy.
- **Temporal blind spot** — events missed during attention elsewhere; stagger or mark them.
- **Tension-release unit** — one demand-effort-resolution cycle; pacing's atom.
- **Think-aloud protocol** — playtesters narrate hypotheses; maps their model, not their opinions.
- **Tie-break** — the deterministic rule resolving simultaneous competing events.
- **Token (RBM)** — a loanable property item with sensory tags and a due-beat.
- **Topology** — the structure of choices: linear, branch-merge, hub, loop, open field.
- **Tracking load** — entities the player must predict simultaneously; ≤4 at board-read.
- **Trust leak** — any divergence between presented and sim state; or unfair information surprise.
- **Turn-phase co-op** — multiplayer where phases are turns; deterministic engines get it free.

**U**

- **Undo** — reversibility as a timeline, not a stack; converts trial-and-error into reversible search.
- **Unfairness triggers** — hidden info punished, inconsistent rules, tutorial betrayal, opaque scoring.
- **Unlock math** — open-node count held in 2–6 for incubation without choice paralysis.

**V**

- **Verb** — a player/world action (pickup, deploy, loan, redirect); the vocabulary's dynamic half.
- **Verb economy** — value = combinations enabled / verbs required.
- **Verdict** — the terminal judgment on a run: must name what/where/when/why.
- **Verdict library** — pre-written per-failure-class templates with entity/beat/reason slots.
- **Vertical slice** — the build proving finished-game quality in miniature.
- **Veto rule** — an explicit non-interaction (toys are not actors).
- **Vocabulary** — the finite verb/noun/condition set; frozen and enumerable.

**W**

- **Weenie** — a visual magnet landmark pulling the player (Disney term).
- **Win density** — victories per hour; front-loaded early, tapered by design.
- **Wrong approach** — a plausible incorrect plan; classified as teaching/near-miss/dead/trap.

**Y** / **Z**

- **Zeigarnik effect** — unfinished tasks intrude on memory; open nodes as honest retention.
- **Z-pattern** — eye-scan: top-left → top-right → diagonal → bottom-right; puts primary action at the end.


## 14.3 The common failure-modes catalog

The consolidated catalog of ways games like these die — cross-referenced to where the fix lives. Triage order: a failure on the critical path outranks any polish.

### Production-layer failures

| Failure | Signature | Fix at |
|---|---|---|
| Scope explosion | Feature list grows weekly; "just one more" | §11.1 MSI + 100%/0% |
| Eternal prototype | Never leaves concept phase | §11.2 Gate-1 build criteria |
| Art-first levels | Beautiful unplayable boards | §2.15 grey-box-first |
| Content bottleneck | Level velocity <half plan | §10.3 cadence + §10.11 slack |
| Polish debt | "We'll juice later" forever | §8.8 scheduled tiers |
| Silent middle | Months without visible progress | §10.11 burn-down |
| Review bottleneck | One reviewer for everything | §2.28 protocol + triage |
| Dispatch drift | Stale spec fields reaching authors | §10.4 frozen-vocab cross-check |
| Code-in-content | Per-level engine branches | §10.1 data-only rule |
| Ship-when-tired | Levels shipping by fatigue | §10.10 executable acceptance |

### Systems-layer failures

| Failure | Signature | Fix at |
|---|---|---|
| Kitchen sink | Verbs grow, none deleted | §4.13 budgets + §4.19 substitution |
| Synonym verbs | Two verbs, one meaning | §4.2 audit |
| Ordering folklore | Resolution order unwritten | §4.17 System Card |
| Sim-state leaks | Presentation holding game-facts | §4.6 completeness audit |
| Invisible verb | Players never find it (hand_over_ferry) | §4.22 illegal-action telemetry |
| Trust debts | Cosmetic divergences shipped | §4.24 #8 zero tolerance |
| Vocabulary drift | Names differ doc↔engine | §4.24 #2 registry |
| Surprise interaction | Undesigned mechanic pairs | §4.4 matrix + emergent-pair watch |
| Wall-clock sim | Real time leaking into simulation | §4.5 determinism audit |
| Overloaded control | Context-sensitive input, unshown | §4.24 #9 explicit verbs |

### Content/puzzle-layer failures

| Failure | Signature | Fix at |
|---|---|---|
| No insight | "It's just harder" levels | §3.2 insight requirement |
| Brute-force friendly | Enumeration beats thinking | §3.11 insight-forcing bottleneck |
| Author's puzzle | Designer can't see difficulty | §2.28 fresh-eyes requirement |
| Two-lock | Two hard parts serially | §3.12 #5 split |
| Dead-end roulette | Wrong path → silent dead state | §3.2 detection + §3.5 evidence |
| Hint short-circuit | T1 gives T3 | §3.4 tier isolation |
| Precision trap | 1-move windows everywhere | §3.11 precision only when tested |
| Where's-Waldo board | Problem invisible, not hard | §2.5 density + scan order |
| Betrayed contract | Late level punishes early lesson | §2.16 #10 consistency audit |
| Verdict-as-insult | "FAILED" no diagnosis | §9.5/§9.8 verdict library |

### Presentation-layer failures

| Failure | Signature | Fix at |
|---|---|---|
| Salience flatline | Everything loud, nothing leads | §6.1 salience map |
| Hue-only coding | Colorblind fails | §6.7 redundancy |
| Kit seams | Visible joints | §6.4 connector budget |
| Chrome-heavy UI | Frame > information | §6.6 ≥70% rule |
| Mixed lighting | Assets lit differently | §6.5 one light story |
| Style thrash | Art periods visible | §6.2 freeze + passes |
| Silent events | State changes unheard | §7.1 table completeness |
| Mix flatline | Everything equally loud | §7.5 priority + ducking |
| Font soup | >4 sizes, >2 faces | §6.6 type scale |
| Slop vectors | Unjustified decoration everywhere | §6.9 subtraction test |

### Player-experience failures

| Failure | Signature | Fix at |
|---|---|---|
| Hostage tutorial | Unskippable teaching | §9.4 escapes |
| Cliff-after-tutorial | Post-teach wall | §1.3 trough + §9.1 test-verify |
| Punished curiosity | First experimentation penalized | §9.4 safe failure |
| Forced re-watch | Full runs per attempt | §1.2 scrub/jump-to-beat |
| Re-execution tax | Re-doing solved plans | §2.11 never repay insight |
| Stuck-lock | One node gates everything | §2.1 ≥2 open nodes |
| Mid-run hostage | Unpausable observation | §8.5 pause first-class |
| Ambiguous commit | Draft vs. locked unclear | §3.9 boundary legibility |
| Sunk-cost retention | "I've spent too long" | §1.11 never stretch tails |
| Dead first session | No insight/progress in 10min | §9.7 FTUE checklist |


## 14.4 Recommended reading: the annotated canon

Books and resources worth a designer's time, annotated with *why* — not a bibliography dump.

### Design theory

- **Jesse Schell — *The Art of Game Design: A Book of Lenses*** — the broadest usable design framework: ~100 lenses, each a question to ask your game. Use it as a review instrument (run a level through the Lenses of Curiosity, Interest Curve, and Elemental Tetrad), not a textbook to read once.
- **Katie Salen & Eric Zimmerman — *Rules of Play*** — the academic foundation: systems, play, and meaning formalized. Dense but load-bearing; chapters on uncertainty and information are the theory behind Parts 1–4.
- **Daniel Cook — essays (daniel-cook.com / GDC talks)** — skill atoms, loops, and the "chemistry" framing used in §2.7; the blog essays are shorter than any book and more useful than most.
- **Sylvester — *Designing Games: A Guide to Engineering Experiences*** — Tynan Sylvester's engineering-first design text; the best written argument for emergence-driven design and the clearest treatment of pacing.
- **Mark Rosewater — "Ten Things Every Game Needs"** — Magic: The Gathering's head designer on the structures games require (goals, rules, interaction, catch-up, inertia, surprise, strategy, fun, flavor, hook); short, free, and the best single-lecture scope of what a game must have.
- **Raph Koster — *A Theory of Fun*** — fun-as-learning thesis that grounds §1.5's mastery loop; read for the argument that boredom and frustration are the twin failure poles.

### Puzzles & level design specifically

- **Elyot Grant — "Puzzle Design" GDC talks + Lunarch Studios posts** — the "aha/threshold" framework: the best public material on puzzle-specific difficulty and insight engineering (§1.7, §3.2).
- **Thekla's The Witness postmortems & interviews** — how the demonstration-ladder curriculum was built; rare public detail on a generational puzzle game.
- **increpare's Stephen's Sausage Roll commentary** — interviews on constraint-difficulty and the no-filler content bar (§13.5).
- **Hempuli's Baba Is You talks** — the development of rule-as-object design; how a jam prototype became a systems landmark (§13.1).
- **Cosmic Express & Zachtronics dev commentaries** — logistics design and optimization-metrics-as-content (§13.6–13.7).
- **Game Maker's Toolkit (Mark Brown) videos** — the "what makes a puzzle good" episodes and level-design essays; the most efficiently-packaged level-design material in video form.

### Production, art & audio

- **Jason Gregory — *Game Engine Architecture*** — for understanding what engines do at the level a designer needs (state, ticks, determinism); heavy but chapters are standalone.
- **Squirrel Eiserloh — "Juice It or Lose It"** — the canonical game-feel talk (trauma-based shake, layered juice); an hour, foundational for Part 8.
- **Jan Willem Nijman — "The Art of Screenshake"** — the 30-minute walkthrough of juice elements; pairs with Eiserloh as the feel canon.
- **Lisa Brown — "How I think about game UI" and UX-for-games talks** — interface hierarchy applied to games specifically (Part 6.6).
- **WCAG documentation + Game Accessibility Guidelines (gameaccessibilityguidelines.com)** — the checklists that ground §6.7.
- **Marshall McGee — *Designing Games for Music* / adaptive-audio essays** — the accessible entry to game-audio strategy (Part 7).

### Psychology & motivation

- **Deci & Ryan — *Self-Determination Theory* (theory chapters, or "Glued to Games" by Rigby & Ryan)** — the readable version of SDT for games (§1.1).
- **Kahneman — *Thinking, Fast and Slow* (select chapters)** — peak-end, loss aversion, anchoring; read the chapters, not the whole tome (§1.14).
- **Csikszentmihalyi — *Flow*** — the source text for §1.2; the conditions chapter is the usable part.
- **Celia Hodent — *The Gamer's Brain*** — cognitive-science-for-games: perception, memory, motivation applied; bridges §1.10 and accessibility.

## 14.5 Cross-reference: the three games × the bible

The application map — where each game's specific problems live in this document:

| Topic | TRS | RBM | PFT |
|---|---|---|---|
| Psychology | anticipation §1.4, observation §1.18 | stakes §1.6, scheduling flow §1.2 | autonomy §1.1, par-anchoring §1.14 |
| Level design | causal-graph topology §2.1 | temporal/manifest topology §2.1 | graph topology §2.1, bottlenecks §3.2 |
| Puzzle family | sequencing+deduction §3.1, §3.24 | scheduling §3.1, §3.25 | spatial/logistics §3.1, §3.26 |
| Systems | EventCount conditions, idiom space §4.3 | phase ordering §4.5, closed loops §4.7 | deploy graph-edits §4.2, stranding §3.2 |
| Co-op | Observer/Intervener §5.9 | phase-split §5.9 | courier-split §5.9 |
| Visual | fixed perspective §6.3 | isometric §6.3 | ortho diagram §6.3 |
| Audio | stillness + event cracks §7.10 | nocturne pulse §7.10 | generative mallets §7.10 |
| Feel | commit ceremony §8.7 | returns exhale §8.7 | under-par win §8.7 |
| Onboarding | causal-literacy arc §9.9 | phase-demo arc §9.9 | loop-in-5-moves arc §9.9 |
| Production | conditions-as-content | manifest-as-content | topology-as-content |

## 14.6 How to keep this bible alive

A design bible that doesn't get edited becomes a museum **[Rec]**:

- **Version it**: the bible is a document under change control like everything else — decisions that supersede it get written in.
- **Amend by rule**: a rule can be changed only by a decision record (§11.8) — "we learned X" with the evidence, appended; not silently overwritten.
- **Checklist currency**: when a playtest discovers a new failure mode, it enters §14.3 — the catalog grows with the team's scars.
- **Terminology registry**: names used in this document ARE the project's vocabulary — when code/docs/dispatches drift from them, that's a finding (§10.4), not a synonym.


## 14.7 Design templates (copy-paste ready)

The reusable skeletons every section of this bible references. Copy these into the repo's `docs/templates/` and instantiate per artifact.

### Beat-sheet template

```markdown
# [Level ID] — [Title]
## Insight (one sentence)
## Atoms used
## Critical path
## Hook
## Naive failure + classification
## Difficulty knobs touched
## Pacing shape (T-sequence)
## Verification (traces, scripted failures)
## Hints (T1/T2/T3)
## Notes for the art pass
```

### Decision-record template

```markdown
# DR-NNN: [Title]
Date: YYYY-MM-DD
Status: proposed | accepted | superseded
Context: [why this is a decision]
Decision: [the call]
Consequences: [what follows]
Supersedes: [older DR or "—"]
Superseded by: [newer DR or "—"]
```

### REPORT.md template (per work package)

```markdown
# REPORT — [Package ID]
Owner: [name/agent]
Status: done | partial | blocked
## What was done
## What wasn't done
## What's risky
## For the next package
```

### Postmortem template

```markdown
# Postmortem — [Project]
Date:
## What went right
## What went wrong
## What we'd do differently
## Surprises
## New checklist lines (added to §14.1)
```

### Playtest-session script

```markdown
# Playtest Round N
Tester ID: | Date: | Build: | Level(s):
## Think-aloud transcript highlights
## Behavioral table (actions, not opinions)
## Where they stalled (tier needed)
## Shaped post-session questions + answers
## Findings coded (legibility/teaching/difficulty/bug/unfairness/engagement)
## Fix-verify: does this need re-testing?
```

### System-Card template

```markdown
# System Card — [Game] v[N]
Freeze status: [frozen | provisional]
## Verbs (list with arity)
## Nouns (list with state)
## Core rules (≤7, observable)
## Resolution ordering (total order + tie-breaks)
## States / Events / Verdicts vocabulary
## Veto rules
## Invariants
## Known idioms
## Version history
```

### Level-Review template (per §2.28)

```markdown
# Review — [Level ID]
Reviewer: | Pass: fresh-eyes | repeat
## Insight check (is there one?)
## Critical-path check
## Tracking load (≤4?)
## Wrong-approach check (no dead failures?)
## Signifier consistency
## Pacing shape
## Verdict: ship | rework | escalate
```

### Failure-verdict template (per §9.15)

```markdown
# Verdict — [Failure class]
Text template: "Not quite — [what failed]."
Where shown: [board region]
When: [beat/time shown]
Why: [mechanic named]
Blame test: can the player reconstruct it? [Y/N]
```

## 14.8 The production calendar, one-page

A single-sheet view of the whole pipeline **[Rec]**:

| Phase | Gate | Activities | Exit |
|---|---|---|---|
| Concept | G1 | core loop, MSI, grey-box | playable loop |
| Vertical slice | G2 | one region at ship quality | the exemplar level |
| Content | G3 | block-of-3 × chapters, playtests | all content verified |
| RC | G4 | polish, fixes, demo mode | submission-ready build |
| Release | G5 | submission kit, launch, watch | shipped + postmortem |

With the per-week rituals (§11.20) running through all of it.

## 14.9 The bible's use pattern

How a team should actually use this document **[Rec]**:

- **New member onboarding**: read Parts 1, 4, 10 first (philosophy, systems, pipeline); the rest is reference.
- **Level design**: keep §14.1-A printed; work through §2 and §3 per level.
- **Review**: the review protocol (§2.28) + the checklists are the tool; this file is the standard.
- **Decisions**: when stuck, check the relevant part; if the bible doesn't answer, write a DR and add the answer.
- **Postmortem**: §11.9's method + §14.7's template; the output feeds back into §14.3.
- **Never**: treat it as immutable. §14.6's amendment rule is the correct relationship — the bible is the current best understanding, versioned like everything else.


*End of document.*
