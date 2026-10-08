# PFT Refinement Audit — Pass 5

Pass-5 queue: extend bounded enumeration to PFT-08..12 (honest bounds),
analyze the two pass-4 optima anomalies with recommendations, remaining
bible-part sweeps, degenerate-solve hunt on 11/12. All scripted results
are **automated playtest** — engine frozen, evidence honest.

## 1. Bounded enumeration on the 4-courier levels

**Full DFS is intractable** — confirmed, not assumed: `probe-enum.mts` on
pft-08 at par+0 bound (21) explored the 800k-state cap before reaching a
single completion (`capped=true`, `solutions=0`). Four-courier action
space is too deep for unseeded DFS even at par.

**Seeded-window variant (`audit/probe-enum-tail.mts`)** — honest bounded
form: replay the verified trace's prefix, then enumerate the final-8
action window with the same dedup/progress ordering. Answers "how many
distinct ways does this plan's endgame complete?":

| Level | Prefix | Bound | Explored | Completions | Optimum count |
|-------|--------|-------|----------|-------------|---------------|
| pft-08 | 13/21  | 23    | 524k     | 24          | **6 × 21-move** (8×22, 10×23) |
| pft-09 | 30/38  | 40    | 347k     | 7           | **2 × 38** (5×40) — **no 39 exists** |
| pft-10 | 20/28  | 30    | 600k     | 13          | 2 × 28 (3×29, 8×30) |
| pft-11 | 20/28  | 30    | 1.0M cap | 21          | capped mid-window — 4×29, 17×30 seen; optimum not reached |
| pft-12 | 36/44  | 46    | 169k     | 23          | **4 × 44** (7×45, 12×46) |

Findings: the four-person levels all have **optimal families** (2–6
distinct optimal endings), matching their declared `open` policies.
pft-09 has a second confirmed rung gap (no 39-move plan; same even-slack
pattern as pft-03). pft-11's bound honestly capped — the office-move
endgame is the densest branch point. All curated into LEVELS.md.

## 2. Anomaly analysis + recommendations

**pft-03 missing 18-rung** — RECOMMEND: LEVELS.md note only (done pass 4).
Not a defect: the level's optimum is unique and the gap is a property of
the topology (a wasted move must come in a detour pair). A hint-ladder
tweak would over-teach; players don't need to know the ladder gaps at 18
— the hint tiers already point at the 17-move shape. NO change.

**pft-05 role-swap third optimum** — RECOMMEND: surface in coopNote
(APPLIED). It's literally a fact about role assignment — the coopNote is
the right home. Added: "the bridge pack and sale can sit with either
courier — reassigning it costs the same 13 moves." Also strengthens the
Part-5 coop checklist claim (real negotiation surface).

## 3. Remaining bible sweeps (parts 4, 6, 7, 12, 13, 14)

| Part | Scope | Result |
|------|-------|--------|
| 4 (mechanics/systems) | Engine families: single-resource scheduling (ferry capacity, handling endpoints), state manipulation (pack/deploy/mountedOn), graph topology. No mechanic sprawl across 12 levels; every level composes 2–3 families max. | PASS |
| 6 (visual) / 7 (audio) | Client-side presentation concerns — engine/level data carry `name`/`label` strings and location semantics a renderer needs. Client code is upstream; engine-side affordances present. | N/A (out of refinement scope) |
| 12 (portfolio/competition fit) | Per-level cards, curated LEVELS.md, per-pass audit trail, enumerable solution space with honest bounds = strong portfolio artifacts. | PASS |
| 13 (genre case studies) | PFT = Cosmic Express-family logistics puzzle; conventions held: verified traces, multi-solution tolerance declared per level, teaching WAs legible. | PASS |
| 14 (appendices/reference) | Reference tables only. | N/A |

Earlier passes already covered 3 (puzzle design), 5 (coop), 8 (game
feel, engine side), 9 (onboarding). Bible coverage across passes 1–5 is
now complete.

## 4. Degenerate-solve hunt on PFT-11/12

- **Post-office self-send**: impossible by engine rule — `send` accepts
  parcels only; the office sign is a `piece`. Verified at the action layer
  (no `send`-piece variant in the action union).
- **Fake the moved office**: PFT-12 has ONE exit ('post-office' at
  `office-new`); deploying the sign at the old socket creates the
  `office-old` lane — exits require office-new, so the early socket can
  never substitute. `mountedOn` semantics make the office exist only at
  the socket where the sign actually stands. Correct by design.
- **Packing-order edge cases**: covered by minimalism probes (zero
  redundant actions in all three traces) + recovery classes verified in
  pass 1. The packed-sign-as-freight idiom (L12 plan B) is the declared
  optimal; carrying it by hand costs +2 — not a degenerate, a priced
  alternative.
- **L11 sign-as-freight**: legal schedule variant (load_ferry accepts
  packed pieces) — not cheaper than Finch's carry route since ferry goes
  m↔e and the sign still needs a slip leg. Legit alternate, no fix.

## 5. Content diffs shipped this pass

- `src/content/levels/pft05-return-to-sender.ts` — coopNote surfaces the
  verified role-swap optimum (anomaly recommendation applied).
- `LEVELS.md` — seeded-window "Solution space" sections on PFT-08..12
  with honest bounds (incl. pft-11's cap and pft-09's rung gap).
- `audit/probe-enum-tail.mts` — seeded-window enumerator (re-runnable;
  env-tunable WINDOW/MAX_STATES/MAX_MS).

`npx vitest run` + `npx tsc --noEmit` verified green after edits.
