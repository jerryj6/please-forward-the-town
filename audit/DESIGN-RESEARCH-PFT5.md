# Design Research Dataroom 5 — "The Same Move Twice": Action-Economy Design

Seeded sources: Opus Magnum's cycle-optimal mindset (every repeat of an
action is a cost you chose), the action-economy literature around
"efficient plans vs survivable plans," and PFT's own under-par
discoveries. Concrete techniques mapped to PFT.

## 1. Count the repeats, not just the total

- **Source:** Opus Magnum grades solutions on cycle time — a plan that
  repeats a move is expensive even at the same total length, because
  repetition is where inefficiency hides. The player-visible metric
  makes the economy legible.
- **PFT application:** our multiset dedupe IS the repeat-aware metric —
  pft-07's two "optimal" 20s were the same actions reordered (one
  economy), while pft-05's role-swap is a genuinely different economy
  (different courierIds). The economy of a plan = its multiset; the
  economy of a level = how many distinct multisets reach each length.

## 2. Under-par discoveries are economy breakthroughs, not bugs

- **Source:** Opus Magnum players find solutions under the listed
  record and the game treats them as achievements — a better economy
  is the whole game.
- **PFT application:** PFT-10 plan C (27 vs par 28) is exactly this —
  it swaps one ferry ride for two sends: the postal link is cheaper
  than water for the second parcel. The economy insight is teachable:
  "wire beats boat" is the level's detour dividend made literal. Par
  remains the design target; plan C is the curated bonus-beat.

## 3. Redundant moves are a symptom; redundant VERBS are a disease

- **Source:** action-economy design distinguishes a wasteful plan
  (extra moves) from a broken one (wrong verbs) — only the second is
  a design failure.
- **PFT application:** the DENY sweep proves PFT has no broken verbs —
  every level's taught verb yields 0 completions when removed, and
  minimalism probes show zero redundant moves in all 18 traces. The
  padding audit shows the only inflation is commute-order, never
  extra-verb waste. PFT's economy is healthy at both levels.

## 4. The cheapest plan teaches the deepest lesson

- **Source:** cycle-optimizers learn a game's deepest mechanics by
  chasing minimums — the optimal plan reveals what the designer
  actually priced.
- **PFT application:** our optimal strategies are the design's own
  pricing statement: pft-08's 3 optimal endings all share the
  "crossing-outlives-errands" structure; pft-12's single optimal
  strategy says the finale has exactly one cheapest economy (send
  early, office last). Difficulty-vector appendix makes this honest.

## 5. Let the player re-buy a move (undo as economy lab)

- **Source:** action economies stay legible when experimentation is
  cheap — Opus Magnum's free rewinding is why players chase records.
- **PFT application:** probe-undo.mts verifies engine.undo() is
  byte-exact against fresh replay (11/11) — the lab is sound:
  players can A/B a detour vs a wire at zero risk, which is the only
  way plan C was ever going to be discovered.
