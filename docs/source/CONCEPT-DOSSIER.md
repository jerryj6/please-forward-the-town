# Three game concepts for the Handshake challenge

Prepared October 7, 2026. Status: researched design proposals, not implemented or playtested games. Names are working titles.

The objective is a distinctive, immediately playable browser game with a complete solo experience and meaningful live multiplayer. The shortlist optimizes for the contest's four equally weighted criteria: execution, creativity, value, and polish. Rankings below are design judgments, not predictions of judges' scores.

## Recommendation

Prototype **The Record Stands** first. Its central question is unusually specific: can you change a disastrous outcome while preserving every sealed observation of the incident? It combines investigation, experimentation, constrained causality, and a satisfying replay.

**Return by Midnight** is the strongest alternative if the investigation concept proves too difficult to explain or too expensive to create cases for. Its automatic return of borrowed properties creates visible, predictable interactions from a small rule set.

**Please Forward the Town** is the most approachable spatial strategy alternative. Bridges, stations, and other parts of the delivery network are also the cargo you must deliver. Completing one job can remove the route needed for another.

Each game has one defining rule. Features from the earlier brainstorm are included only where they make that rule more expressive.

## What the originality research establishes

This is a bounded mechanics comparison using developer pages and official store descriptions. It is not an exhaustive catalog search, a legal clearance, or a claim that nobody has ever imagined a similar combination. I have not played the comparison games during this research. Missing features in their descriptions are not proof that those features do not exist.

Several earlier pitches had closer precedents than the initial brainstorm acknowledged:

| Earlier direction | Verified precedent | Consequence for this shortlist |
|---|---|---|
| Transfer weight and other object properties | [Prop Swap](https://yernemm.itch.io/prop-swap) explicitly swaps material properties, including weight, friction, and flammability. | Property swapping alone is not our originality claim. Return scheduling must be indispensable to the redesigned game. |
| Change objects by moving their qualities | [The Magic Circle](https://store.steampowered.com/app/323380/The_Magic_Circle/) describes stealing and remixing behaviors; [Ruffy and the Riverside](https://store.steampowered.com/app/1002260/Ruffy_and_the_Riverside/) describes copying and pasting textures that transform the world. | A label-gun presentation by itself would be insufficient differentiation. |
| Complete a museum heist with recordings of yourself | [Echo Heist](https://nitrous-studio.itch.io/echo-heist) describes precisely this broad combination. | A recording-based heist is removed as a standalone finalist. |
| Use repeated versions of yourself as workers | [The Last Clockwinder](https://store.steampowered.com/app/1755100/The_Last_Clockwinder/) builds automation out of recorded actions. | Ghost workers remain a possible supporting convenience, not the headline innovation. |
| Fold a paper world to create routes | [Paper Trail](https://store.steampowered.com/app/1889740/Paper_Trail/) already has both the name and central folding-world premise used in the earlier list. | That earlier pitch is withdrawn. The logistics finalist uses conserved, deliverable infrastructure instead of paper folding. |
| Move map pieces or nested rooms | [Carto](https://store.steampowered.com/app/1172450/Carto/) rearranges map pieces; [Patrick's Parabox](https://store.steampowered.com/app/1260520/Patricks_Parabox/) explores recursive boxes. | Moving space alone is not a novelty claim. The logistics game centers on delivery commitments changing the usable network. |
| Observe events and alter their outcome | [The Sexy Brutale](https://store.steampowered.com/app/552590/The_Sexy_Brutale/) uses a repeating day and interventions to change outcomes. | The Record Stands must make preserved observations a central constraint, rather than relying on time travel alone. |
| Change a disaster's consequences while one major event remains fixed | [Eternal Threads](https://store.steampowered.com/app/1046790/Eternal_Threads/) asks players to save housemates by changing earlier choices while prohibiting them from simply preventing the fire. | Even constrained changes to history have precedent. The narrower proposed distinction is reconstructing physical causes to satisfy several exact recorded observations simultaneously, with visible event-level verification and shared intervention planning. |
| Construct a story satisfying a specified description | [Storyteller](https://store.steampowered.com/app/1624540/Storyteller/) builds stories from characters and settings. | The Record Stands uses a simulated scene, evidence about causes, and invariant observations. It does not claim that satisfying narrative constraints is new. |
| Change weight or gravity to move objects through puzzles | [Quantum Conundrum](https://store.steampowered.com/app/200010/Quantum_Conundrum/) changes physical behavior through dimensional shifts. | Making a heavy safe portable and then heavy again is familiar. The loan game needs conserved transfers between particular objects and automatic returns that coordinate different parts of a plan. |

The specific differentiation hypotheses to test are:

1. **The Record Stands:** editable causes plus immutable observations plus a physical outcome to repair, evaluated together in a shared simulation.
2. **Return by Midnight:** conserved properties with scheduled automatic restitution, where the return itself is a useful action in a cooperative plan.
3. **Please Forward the Town:** infrastructure is useful while temporarily deployed but ceases to be available when delivered, making the order of successful deliveries the central strategic choice.

These hypotheses require a further comparison pass if a close new match appears. They should also survive a simple design test: removing the signature rule must fundamentally change the game.

## 1. The Record Stands

**Pitch:** Change the disaster. Keep every witness right.

**Genre and audience:** A cooperative investigation and causality puzzle for players who enjoy mysteries, experiments, and short chains of surprising consequences. Designed for solo and small groups, with 1–4 people as the target. Initial validation should concentrate on solo and two-player sessions.

**Session target:** A first case that teaches the idea in roughly two minutes; later cases that take approximately five to ten minutes. These are design targets, not measured completion times.

### The fantasy

You work for a small office responsible for correcting minor catastrophes in a peculiar town. A cake has been destroyed, a parade has entered a swimming pool, or a museum exhibit has escaped through the gift shop.

The archive has already sealed a few observations of what happened. Those observations cannot change. The unrecorded causes and details can.

This gives the player a precise puzzle: preserve the required facts while producing a better ending.

The game fixes observations for a level, not every fact about its original history. The catastrophic outcome itself must be outside the set of fixed facts, or the objective would be contradictory.

### The defining rule

Each case contains:

- A starting scene and a short sequence of events.
- A small set of sealed observations.
- A desired new outcome.
- A budget of interventions.
- A visible set of objects and interactions that may be changed.

A successful solution makes the desired outcome true, preserves every sealed observation, and stays within the intervention budget.

For example, the record might require that a particular bell rings on beat four. It does not require that the original falling flowerpot be what rings it. A different cause may produce the same observed event.

Observations should refer to specific objects, positions, and times. Clicking an observation highlights its referents in the scene. The player should never lose because the game silently changes the meaning of a noun or applies an undisclosed linguistic interpretation.

### The central loop

1. Watch the short original incident.
2. Inspect objects and scrub through relevant moments.
3. Identify which links in the chain caused the failure.
4. Place a small number of interventions into the scene.
5. Run the altered sequence.
6. Inspect which facts and goals passed, with the first divergence highlighted.
7. Revise or accept the result.

An intervention is a supported physical change: redirect a junction, reposition a prop, delay a mechanism, or activate a tool at a marked time. Freeform text is unnecessary for the rules or judging of solutions.

### Worked case: The Grand Opening

This is an illustrative design specification, not a validated level.

A fountain wets the delivery lane. A cake trolley skids, strikes a bell, passes through an arch, and reaches the destination with a ruined cake.

The sealed observations are:

1. The brass bell rang on beat four.
2. The red trolley passed through the arch on beat five.
3. The fountain was running on beat six.

The new objective is to deliver the cake intact. The budget is two interventions.

| Trial | Bell at beat 4 | Trolley through arch at beat 5 | Fountain at beat 6 | Cake intact | Outcome |
|---|---|---|---|---|---|
| Original sequence | Yes | Yes | Yes | No | Disaster |
| Stop the fountain | No | Yes | No | Yes | Two observations broken |
| Redirect trolley onto an equally long dry route | No | Yes | Yes | Yes | One observation broken |
| Dry route plus a wind-up toy that strikes the bell on beat four | Yes | Yes | Yes | Yes | Valid repair |

The key discovery is that the bell's occurrence is fixed while its cause is flexible. This should be experienced through the animation and the failed trial, rather than explained in a long tutorial.

The physical scene must make the equal-length route and the toy's timing visible. We should not rely on a hidden exception to make the example work.

Later cases should allow multiple solutions. Different tools might stabilize cargo, redirect an impact, or replace a trigger. The case editor must verify those solutions against the same rules that evaluate player actions.

### Solo play

Solo is the full game. The player has all observations, tools, and inspection functions. Planning is untimed. Pausing, scrubbing, and retrying are normal actions.

Three hint levels can preserve the satisfaction of solving:

1. Highlight the first causal link that changed unexpectedly.
2. Point toward an unused tool relevant to that link.
3. Demonstrate one intervention while leaving the rest of the case to solve.

There is no need to simulate witnesses through a conversational AI model. Witness cards describe defined events in the simulation.

### Multiplayer

Friends inspect and change the same case. Each participant can scrub their own view without moving everybody else's camera or playhead. Planned interventions and annotations are shared.

A player reserves an intervention while editing it. Other players can suggest a different placement, but cannot silently overwrite a teammate's draft. A shared Test action runs the agreed configuration; committing the final result requires a clear ready state.

The intervention budget belongs to the case. Adding people does not grant more interventions. Solo and multiplayer therefore solve the same underlying problem.

Multiplayer value comes from independent hypotheses and combining partial solutions: one person fixes the cake, another notices the broken bell observation, and a third discovers the replacement trigger.

The main social risk is one player doing all the reasoning. Small independent inspection tasks, visible proposals, tool handoffs, and rotating control of the final test can help. Playtests must establish whether those affordances create actual participation. A four-player label should not ship if the cases meaningfully engage only two.

### Progression and replay

A compact campaign can teach one additional idea per case:

1. Preserve one observation while changing the result.
2. Preserve an event's time while changing its cause.
3. Preserve a route crossing while changing what happens before it.
4. Satisfy two observations that share a resource.
5. Preserve observations from two viewpoints.
6. Combine earlier rules in a finale with multiple valid repairs.

Replay comes from alternative objectives, fewer interventions, optional intact objects, and tested tool substitutions. Authored cases are the first priority. Generated variants should only be included when their satisfiability is verified.

Players can share a case code or solution replay. A replay is supplemental; live multiplayer remains part of the actual product.

### Visual and sound direction

Use a miniature town inside an archival case file: a diorama above a compact timeline, with three or four observation cards along the edge. Charcoal drawings, warm paper, one strong accent color, and occasional expressive character animation could give it a recognizable identity.

Green checks and red failures must also have shape and text indicators. Show observations as compact event cards, not pages of exposition. Sound accents should clarify causes: a bell, a wheel skid, a spring releasing. Every essential event also needs a visual cue.

The signature finish is a before-and-after replay with the same observation cards remaining checked in both versions while the ending changes.

### Contest scope

Prototype one scene, three observations, two interventions, and one successful alternate causal chain. The prototype succeeds only if a new player understands why a repaired outcome can still be invalid.

A plausible focused submission is six authored cases, a strong opening case, solo and validated live multiplayer, layered hints, instant retry, and reliable shared state.

Case creation is the principal cost. The simulation needs a small vocabulary of interactions; every extra verb multiplies the authoring and explanation burden.

### Scoring case and failure conditions

- **Execution:** Defined events and predicates make correctness testable. Case validity must be tested alongside networking.
- **Creativity:** The player changes causes while preserving recorded effects. This relationship must create decisions in every case.
- **Value:** The game should produce deductions, laughter at failed hypotheses, and a desire to solve another case alone or together.
- **Polish:** Clear causal feedback, scrubbing, precise observation cards, and satisfying comparison replays can make it feel finished.

Reject or substantially revise the concept if players treat witness cards as arbitrary chores, if correct solutions depend on wordplay the simulation cannot explain, or if every case requires a large set of unique scripted exceptions.

## 2. Return by Midnight

**Pitch:** Borrow the world's properties. Use their return to finish the job.

**Genre and audience:** A small cooperative heist and scheduling puzzle, designed for solo and a few friends. The target is 1–4 participants with a fixed crew and a shared planning board.

**Session target:** Short rooms that take approximately three to seven minutes, with a complete operation spanning a few rooms. This is a proposed target.

### The fantasy

You are a crew retrieving peculiar valuables from a museum that leases out the laws of physics. Your tools let you borrow weight, light, sound, or buoyancy from an object, attach it elsewhere, and choose when the loan expires.

At expiry, the property returns to its original object. A suddenly heavy crate, relit lamp, or restored alarm can be exactly what the plan needs.

The central satisfaction is arranging several returns so the room completes part of the job for you.

### The defining rule

A property loan has an origin, a temporary destination, and a visible return beat. The property exists in exactly one place at a time. It returns automatically when due.

The return is independent of the original object's location: moving a safe does not erase its claim to its weight. That makes transporting an object while its original behavior is temporarily absent a useful puzzle.

The first version should use a deliberately small set of properties:

| Property | While borrowed | What its return can do |
|---|---|---|
| HEAVY | The origin becomes portable; the destination can depress a pressure plate or become immovable. | Anchor an object after delivery, close a plate-controlled route, or stop a moving prop. |
| BRIGHT | Light moves from one object to another. | Restore a sensor, reveal a route, or reactivate a guard's sightline. |
| NOISY | Movement or activation produces sound at the temporary destination. | Restore an alarm or change where the next moving object attracts attention. |
| FLOATING, if the first three work well | An object can occupy a designated elevated path or ferry position. | Lower cargo onto a marked receiver. |

HEAVY and BRIGHT are sufficient for an initial prototype. FLOATING should only be added if the spatial rules remain obvious and easy to render.

### Predictable time

Use discrete planning beats. Players choose commands, see projected consequences, and advance the simulation together. Planning does not consume the in-world clock.

A consistent resolution order is essential:

1. Approved loans and interaction commands take effect.
2. Crew movement resolves under a visible collision rule.
3. Machinery and guards advance.
4. Due properties return.
5. Devices affected by those returns update; the result is shown before the next beat.

Every screen should show both the return beat and an easily understood countdown. Previews must reveal a due return that will invalidate the next move.

This model makes timing central without requiring synchronized reflexes across phones and networks.

### Worked room: The Weight of Evidence

This is an illustrative room, not a tested layout.

A heavy safe contains the target. An exit is controlled by a pressure plate. A light crate already sits on that plate, but cannot depress it. The marked route has two movement segments: the approach and then the exit pad. One crew member starts beside the safe; another can operate the loan tool. The scene visibly previews a guard reaching the exit on beat four.

| Beat | Crew action and room response |
|---|---|
| 1 | Loan HEAVY from the safe to the crate. The crate presses the plate; the exit opens. The safe becomes portable. |
| 2 | A crew member picks up the portable safe and moves it to the approach square. |
| 3 | The crew member carries the safe through the exit onto the pad. HEAVY returns at the end of the beat, anchoring it. The crate becomes light and the exit closes behind the carrier. |
| 4 | The guard reaches the now-closed exit. The safe and carrier are already outside. |

The first lesson is that expiry can finish the operation. A return at the end of beat two makes the safe immovable before its final movement. A return at the end of beat four leaves the exit open during the guard's movement on beat four. Returning at the end of beat three both completes the transport and closes the route at the useful moment. The outside tool operator does not need to traverse that exit.

This room is deliberately constructed so that keeping the property forever does not solve the same problem. The correct return follows from visible movement and machinery rules, rather than an unexplained deadline. The precise layout, guard trigger, and turn order still need implementation and playtesting.

An advanced room might require returning BRIGHT to a sensor after the crew has passed, or returning NOISY to a moving toy so it attracts a patrol at a particular beat. Those must be composed from existing rules, rather than special-case cutscenes.

### The central loop

1. Inspect the room and its delivery objective.
2. Identify properties that can help elsewhere.
3. Choose origins, destinations, and return beats.
4. Queue short crew movements and interactions.
5. Advance, inspect the outcome, and adjust.
6. Deliver the target, satisfy the return conditions, and watch the full operation replay.

### Solo play

A solo player plans the entire fixed crew. Unused crew members wait automatically. Plans can be built a beat at a time; commanding every character on every beat should never be mandatory.

The same mission supplies the same crew, tools, action limits, and return schedule regardless of human count. Solo is a scheduling puzzle, not an attempt to operate several real-time controllers simultaneously.

Recorded plans can replay known movements as a convenience. They should remain editable command sequences, avoiding an additional clone-management game.

### Multiplayer

Humans divide control of the crew while sharing the same supply of loans. Each person can draft actions for their assigned characters, mark a requested property, and signal a dependency such as "need this lamp dark through beat five."

Two people cannot reserve the same property at once. Conflicts appear before execution and can be resolved by a handoff or a changed schedule. Adding players does not increase the number of available properties.

The interaction should be consequential: a teammate's useful return can power your exit; returning something early can remove your route. All players see those dependencies before committing, so cooperation is about planning instead of surprise punishment.

If someone leaves, their current plan remains visible and a remaining player can take over. A reconnect restores the same character assignment when appropriate.

### Progression and replay

Progress through increasing dependency rather than increasing rule count:

1. One loan with an obvious return.
2. One loan used at two points in a route.
3. Two returns that must occur in a particular order.
4. A property whose origin is itself moving.
5. A shared resource needed by two crew members at different times.
6. A finale where several automatic returns complete the exit sequence.

Optional challenges can ask for fewer loans, less disturbance, or a different target. A shared seed should reproduce the same mission and rules; random labels alone would not provide meaningful replayability.

### Visual and sound direction

The room is a toy theater or museum diorama with oversized loan tags. A thin animated thread links each borrowed property to its original object. At return, the thread briefly tightens and retracts, clearly showing what moved where.

Use countdown stamps, audible but optional ticking, expressive guard reactions, and crisp changes of silhouette or lighting. A HEAVY object should visibly settle. BRIGHT should change a real pool of light. NOISY should have a visual sound ring.

The signature finish is a replay in which the crew stops issuing new actions and the last few scheduled returns complete the escape.

### Contest scope

Build one room with two properties, two controlled characters, discrete beats, reversible planning, and one genuinely useful automatic return. Expand only after players intentionally schedule returns rather than merely tolerate the timer.

A focused submission could contain six rooms, three core properties, a small tested set of fixtures, the complete solo experience, live room-code co-op, and replays. Four-person support should depend on cases that give four people useful work.

Do not add an open-ended language system for drafting physical laws. Loan clauses should be a finite set with visible consequences.

### Scoring case and failure conditions

- **Execution:** A small property vocabulary and discrete state changes create a manageable engine and test surface.
- **Creativity:** Scheduled restitution must be an active resource. The concept loses differentiation if permanent property swaps solve most rooms just as well.
- **Value:** Players can solve alone, coordinate with friends, and optimize a successful operation.
- **Polish:** Threads, previews, undo, visible reservations, and consistent timing make complex plans readable.

Reject or revise if the loans feel like ordinary power-ups with annoying timers, if property combinations violate players' reasonable expectations, or if the most reliable strategy is always to choose the longest possible duration.

## 3. Please Forward the Town

**Pitch:** Deliver the bridge before you deliver the road. And please leave yourself a way home.

**Genre and audience:** A welcoming spatial logistics puzzle with cooperative planning. It should work as a satisfying solo route puzzle and a lively shared problem for a small group.

**Session target:** Approximately five to eight minutes per delivery contract, with a compact campaign of contracts.

### The fantasy

An entire town is moving. Its residents have mailed their change-of-address requests, including the addresses of their bridges, ferry docks, staircases, and post office.

You can pack infrastructure into oversized parcels, carry it elsewhere, and temporarily deploy it to keep working. When you complete its delivery, it becomes the recipient's property and leaves your usable delivery network.

The system that lets you finish your work is also what you have been hired to give away.

### The defining rule

Each infrastructure piece has three states:

1. **Packed:** occupies a carrier's cargo slot and provides no connection.
2. **Deployed:** creates a usable connection or service at a compatible location.
3. **Delivered:** satisfies an order and becomes unavailable for further routing during that contract.

Pieces are conserved. Packing a bridge removes that connection from its old location. A completed delivery cannot also leave a working copy behind.

Temporary deployment is allowed at marked compatible sites. This makes the difference between using a bridge and handing it over central to the strategy.

### Core pieces

- A portable bridge connects two compatible banks.
- A ferry transfers a courier and a parcel between marked docks.
- A stair module connects two height levels.
- A relay mailbox transfers a parcel along an explicitly displayed postal connection; it does not teleport people.
- The post-office sign can become a late-game movable extraction destination, introduced only after the core logistics is clear.

The first prototype needs only a bridge and a ferry. Its appeal must come from ordering deliveries, not a large catalog of gadgets.

### Worked contract: The Last Crossing

This is an illustrative contract, not a verified level.

Three islands—West, Middle, and East—form a completely visible route:

`West: lantern — removable bridge — Middle: courier and ferry dock — ferry — East: orchard, museum, exit`

The bridge initially connects West to Middle and can be packed from a marked handle on Middle. The ferry starts on Middle, travels between Middle and East, and carries one courier plus one parcel. It is the contract's fixed transport service; the bridge is its first movable infrastructure delivery. The lantern must go to the orchard on East. The museum on East has ordered the bridge itself. The courier must finish at the exit on East.

A valid plan under these stated rules is:

1. Walk from Middle across the bridge to West, collect the lantern, and return to Middle.
2. Take the lantern on the ferry to East and deliver it to the orchard.
3. Return on the ferry to Middle.
4. Pack the bridge using its Middle-side handle. There is now no connection to West, but no required parcel or courier remains there.
5. Ferry the packed bridge to East and deliver it to the museum.
6. Finish at the exit on East.

Delivering the bridge before retrieving the lantern strands that remaining order on West. Merely packing the bridge is recoverable: it can still be redeployed. Handing it over to the museum removes it from the available equipment for the rest of the contract. Undo remains available to revise the plan.

There is also a different valid delivery order: retrieve the lantern and stage it on Middle, ship the bridge first, then return by ferry for the lantern. Thus the necessary dependency is retrieval before bridge handover, rather than a single prescribed delivery script.

Later contracts can make the ferry itself a delivery, add a second courier whose return route matters, or require temporary bridge deployment at another compatible crossing. Final extraction requires every active courier to reach the marked destination. New layouts and claimed solutions must be checked in the implemented game.

### The central loop

1. Read two or three delivery orders.
2. Inspect the current network and mark the final courier destinations.
3. Decide which infrastructure must remain available until particular parcels have passed.
4. Pack, carry, deploy, and deliver pieces.
5. Observe how each successful delivery changes remaining routes.
6. Complete the contract and see the town assembled at its new location.

The key question is "what must still be reachable after this delivery?" It should appear almost immediately.

### Solo play

A solo player controls a small courier team using short route orders. Time advances only when the player commits a planning step. Idle couriers wait automatically.

The entire map and order list are visible. Route previews show which links will disappear when a piece is packed or delivered. Undo reverses a planning step, including an accidental delivery.

The aim is a thoughtful logistics puzzle, not frantic inventory management. Campaign difficulty comes from interdependence and delivery order. A route order should handle an already-planned walk or ferry trip, so players spend their attention on network choices instead of repeated transport clicks.

### Multiplayer

Players take responsibility for couriers or routes in the same town. They share a finite set of infrastructure and cargo capacity. Parcel handoffs, temporary deployments, and final deliveries have consequences for everyone.

Useful communication tools include "hold this connection," "parcel still west of bridge," and "ready to deliver." A player can place a visible temporary hold request on infrastructure needed by a teammate. The request is a coordination aid rather than a permanent veto.

Commands execute at a shared planning boundary. If a requested move becomes impossible because another command removes its route, the preview flags the conflict before commitment.

A disconnected player's courier keeps its visible plan and can be reassigned. The contract remains completable with one person.

### Progression and replay

1. One delivery that depends on keeping one bridge available.
2. Two parcels competing for limited transport capacity.
3. An item used as infrastructure before its final delivery.
4. A delivery whose destination changes once a building moves.
5. A relay mailbox that carries cargo but cannot rescue a stranded courier.
6. A finale in which the post office itself is the final delivery.

Replay modifiers can change cargo capacity, which island receives an infrastructure piece, or the permitted number of deployments. Only include variants whose delivery graph is verified as solvable.

A local campaign and shared challenge codes are sufficient for replay. A functioning game should not depend on a large public user base.

### Visual and sound direction

Use a bright moving-day town: striped parcels, address labels, tugboats, tiny plants on windowsills, and residents patiently watching their staircase depart.

Packing should be an expressive transformation into a parcel, not a literal folding mechanic. Delivery should make the receiving neighborhood visibly come alive. The town at the end of a contract is a satisfying artifact of the player's plan.

The signature visual is a courier carrying the bridge that was part of their route a moment earlier. The most memorable finale is mailing the post office and following it to the new town.

### Contest scope

One small graph with three islands, a movable bridge, a ferry service, two deliveries, and a courier extraction condition is enough for the first prototype. Making the ferry deliverable belongs in the next contract, after the bridge's three states are understood.

A focused submission might contain six contracts, three infrastructure types, a small fixed courier team, clear route previews, undo, and reliable solo and live multiplayer.

A general room-folding engine, recursive containers, and continuous physics are unnecessary. The network changes can be exact and visually animated.

### Scoring case and failure conditions

- **Execution:** Finite routes and conserved pieces are easier to validate than a freeform physics world.
- **Creativity:** The conflict between infrastructure as a tool and infrastructure as a delivery obligation must drive solutions.
- **Value:** The premise is friendly and understandable; a shared network creates direct cooperation.
- **Polish:** Packing transformations, connectivity previews, courier intentions, and a completed town can provide strong feedback.

Reject or revise if optimal play is mostly repetitive ferry trips, if players can deliver every piece immediately without consequences, or if the game feels like a standard route puzzle with decorative parcels.

## What is being combined

| Earlier idea | Contribution retained | Final concept |
|---|---|---|
| Disaster Department | Test a changed causal chain and inspect its consequences. | The Record Stands |
| Alibi Factory | Evidence grounded in events that actually occurred in the simulation. | The Record Stands |
| The Honest Liar / Redacted | A precise distinction between an observation and the interpretation of its cause. | The Record Stands |
| Fine Print | Explicit constraints that can be satisfied in surprising ways. | The Record Stands; Return by Midnight |
| Petty Physics | Properties as manipulable resources. | Return by Midnight |
| Borrow Tomorrow | Current advantage creates a visible future obligation. | Return by Midnight |
| Ghost Shift | Scheduling and replaying a plan so several actions cooperate over time. | Return by Midnight, as an interface and planning aid |
| Shared Inventory | One group's decision changes another participant's available resources. | Return by Midnight; Please Forward the Town |
| Dead Letter Office / Parcel Panic | Delivery chains, handoffs, and a clear shared objective. | Please Forward the Town |
| The Exit Is an Item | The final route home can itself become a transport obligation. | Please Forward the Town, as a late-game contract |
| Paper Trail / Hole Sale | Spatial reconfiguration that affects available paths. | Please Forward the Town, through deployable infrastructure rather than folding or portable holes |

## Cross-concept quality requirements

1. **Complete solo game.** The first visitor can immediately begin and finish a real level alone. Solo is not just a tutorial or a lobby with empty seats.
2. **Live multiplayer.** At least two people independently control meaningful actions in the same shared state. Replays and leaderboards do not substitute for this requirement.
3. **Stable resources across player counts.** More humans divide control; they do not silently receive extra tools or turns that invalidate comparisons.
4. **Fast recovery.** Undo or rewind is part of learning. A failed experiment should produce information and another attempt quickly.
5. **Visible intentions.** Shared plans, reservations, and dependencies reduce accidental interference.
6. **No dependence on conversational bots.** The proposed solo experiences use the actual rules and simulation. This avoids trying to imitate the social appeal of a human bluffing game.
7. **Useful phone controls.** Large touch targets, tap alternatives to dragging, readable labels, and essential information that remains visible on a small screen.
8. **Multiple ways to read state.** Color is supplemented by shape, text, and animation. Sound conveys personality but is never the only clue.
9. **Graceful arrivals and departures.** Join at a clear planning boundary; preserve the current plan; allow remaining players to take over abandoned control.
10. **A distinctive first minute.** The signature mechanic should be used immediately, not reserved for a distant level.

## Comparison for the contest

These are qualitative design assessments, not measured scores.

| Question | The Record Stands | Return by Midnight | Please Forward the Town |
|---|---|---|---|
| Clearest distinguishing rule | Preserve observations while changing causes and outcome. | Property returns are scheduled actions. | Successful delivery removes useful infrastructure. |
| Emotional payoff | "We changed the ending without making any witness wrong." | "The things we returned finished the escape for us." | "We delivered the town and still got everyone home." |
| Solo completeness | Strong by construction; the whole investigation is available. | Strong if planning is discrete and reversible. | Strong if multi-courier commands stay simple. |
| Meaningful multiplayer | Different hypotheses and shared interventions. | Interdependent schedules and scarce properties. | Handoffs and changes to a shared network. |
| Main production cost | Authoring fair, interesting cases. | Property interactions and time-resolution clarity. | Routing puzzles and avoiding repetitive carrying. |
| Main originality risk | Becoming a conventional time-rewind puzzle. | Becoming ordinary property swapping with a timer. | Becoming ordinary map manipulation or delivery routing. |
| Best initial test | One observation-preserving repair produces an independent deduction. | An expiry is deliberately used to solve a puzzle. | Delivery order changes whether other jobs remain possible. |

## How to choose without guessing at scores

Use one short prototype for the preferred concept, followed by a second only if the first fails its central test. It is not necessary to build three substantial games to choose one.

Test with a small group of people unfamiliar with the design. Include solo players and at least one pair. A sample of six to eight people is useful for finding obvious confusion, but does not establish general audience demand or winning odds.

Observe:

- Can the player explain the defining rule in their own words after the opening?
- Do they intentionally exploit it, or succeed only through random trial?
- Is a failed attempt understandable enough to suggest a next move?
- Do multiplayer participants make consequential contributions?
- Does someone voluntarily attempt an optional challenge or ask for another level?
- Are there multiple viable solutions or decisions worth comparing?

Treat repeated confusion about the core rule as a design problem before creating more content. A larger level count will not repair it.

For the chosen game, reserve substantial time for a cold-start walkthrough, mobile interaction, two-device synchronization, reconnect recovery, and first-time playtests. Execution and polish need their own evidence; a clever pitch cannot earn those scores on its own.

## Submission facts and schedule constraint

The [official mission](https://joinhandshake.com/learn/create-a-multiplayer-game-8d7d59b5/) describes a public, reusable multiplayer game with room codes and no player logins or installations. The [official rules](https://go.joinhandshake.com/rs/390-ZTF-353/images/%5BAI_Skills_Studio_Challenge%5D_Contest_Official_Rules.pdf?version=0) weight execution, creativity, value, and polish equally. Required submission fields include a title, cover image, description, and project URL.

The rules still specify **October 30, 2026 at 11:59 PM Pacific**, while the marketing mission page says October 31. Plan around the earlier deadline. As of October 7, a single focused game with a small amount of excellent content is the sensible production target.

The competition source facts above were rechecked during this work. The design targets, rankings, and proposed mechanics throughout this dossier are recommendations, not requirements from the organizers.
