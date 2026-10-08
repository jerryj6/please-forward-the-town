# REPORT — PFT-02/03/04 level authoring package

Scratch dir: `~/work/pft-levels` (engine + pft01 extracted from
`pft-ref-current.tar.gz`; spec from `DEVIN-HANDOFF-PACKAGE.zip`).

## Verification commands and exit codes

| Command | Exit | Output |
|---|---|---|
| `npm i vitest typescript` (pre-existing package.json) | 0 | vitest 2.1.9, typescript installed |
| `npx vitest run tests/unit/pft02-04.test.ts` | 0 | 22 tests passed |
| `npx vitest run` (full suite incl. pft01 baseline) | 0 | 34 tests passed (12 + 22), 0 failures |
| `npx tsc --noEmit` | 0 | clean under the repo's strict tsconfig |

tsconfig flags actually enforced: `strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`,
`noUnusedParameters` — a superset of the dispatch's list; all pass.

## Environment adaptation

Dispatch SETUP assumed Linux + nvm install of Node 22. Actual VM: macOS,
Node v24.20.0 already at `/opt/homebrew/bin/node`. Skipped nvm; used the
system Node. No behavioral difference (vitest/tsc pinned locally).

## Requirement status

| Requirement | Status | Evidence |
|---|---|---|
| PFT-02 multi-item juggling w/ ferry sequencing | DONE | `pft02`: 2 parcels + 1 bridge, ferry 1/1, two couriers; two verified traces |
| "not solvable by repeating one ferry click" | DONE | Requires bridge↔path↔ferry choreography; capacity test proves no single-click loop |
| PFT-03 second courier OR build/deploy dependency | DONE | Chose redeploy dependency: one bridge must serve two creeks then ship (temporary deployment card verbatim) |
| PFT-04 courier+cargo across hub w/ capacity pressure | DONE | Hub = Middle Landing; stair+bridge+2 couriers+ferry cap 1; capacity/occupant pressure via cargo juggling |
| PFT-04 two strategically distinct solutions, both verified | DONE | Trace A (stair at West cliff socket, 18 moves) vs Trace B (stair redeployed to Middle hoist, 20 moves); distinct infrastructure signatures asserted via `piece.deployed` siteId + ride/drop usage diffs |
| LevelCard per level (winningTraceSummary, wrongApproaches, coopNote) | DONE | `PFT02_CARD`, `PFT03_CARD`, `PFT04_CARD` exports |
| ≥2 designed wrong approaches per level, failing for the RIGHT reason | DONE | PFT-02: 4 (stranded courier undo-only / missing cargo undo-only / ferry capacity / no open order). PFT-03: 4 (undo-only cargo / PFT-005 endpoint / no connection / recoverable strand). PFT-04: 5 (undo-only cargo+occupant / no connection / endpoint / PFT-009 height / PFT-007 kind). Tests assert stranded orderId + recovery kind + rejection reason substring |
| 3-tier hint ladder per level | DONE | In LEVELS.md + embedded in the CARD exports' `hints` array |
| Recoverable-packing semantics demonstrated | DONE | `order.stranded` `redeploy` on pack vs `undo` after deliver asserted in tests (PFT-02 ×2, PFT-03, PFT-04) |
| Determinism: same seed → same canonical hash | DONE | Per level: `finalHash` equality across two `simulate` runs + `makeReplay`/`replayRun` equality |
| Untouched start does not win | DONE | `simulate(level, [], seed).success === false` per level |
| Follow pft01 field structure exactly | DONE | Same field order/names, header comment, `PFT_RULES_VERSION`, `par` on each level |
| Engine frozen — no modifications | DONE | `src/engine/` untouched (only read) |

## Not in assigned paths / coordination notes

- `src/content/levels/index.ts` still exports only PFT-01 — registration left to
  the index/integration owner (outside my assigned paths).
- No level uses `postalLinks`/`send` or `hand_over_ferry`/`unload_ferry`-only
  flows: those mechanics aren't demanded by PFT-02..04's escalation cards; mail
  is PFT-05+ territory per the campaign arc.

## Dispatch ↔ master/engine discrepancies resolved

| Dispatch said | Reality (types.ts/engine.ts) | Resolution |
|---|---|---|
| Actions `walk, pick_up, build, commit_orders` | `travel, pickup, drop, load_ferry, unload_ferry, ride_ferry, pack, deploy, deliver, send, hand_over_ferry, wait` | Used the real union; master spec wins over dispatch wording |
| "second courier" for PFT-03 optional | Two-courier semantics constrained (below) | Chose the redeploy-dependency reading for PFT-03; second courier appears in PFT-02 and PFT-04 where exits diverge |

## Engine constraint discovered (design consequence)

`ride_ferry` moves **only the riding courier** on a two-dock ferry — the ferry
ends at the far dock, so a second courier can never follow onto the far shore
in the same trip (and `fs.cargo + cs.cargo <= parcelCapacity` means the riding
courier's carried parcel occupies the sole slot). Consequence: no level may
require both couriers to end on the far shore of one 2-dock ferry. Resolution
in design: divergent exits — PFT-02's Lark exits at the North dock via the
West↔North edge; PFT-04's Lark exits at the Loft postbox (her exit explicitly
cannot rely on the removed stair, per the card).

## File inventory

- `src/content/levels/pft02-two-parcels-one-boat.ts` — level + `PFT02_CARD`
- `src/content/levels/pft03-a-bridge-with-two-addresses.ts` — level + `PFT03_CARD`
- `src/content/levels/pft04-the-upstairs-address.ts` — level + `PFT04_CARD`
- `tests/unit/pft02-04.test.ts` — 22 tests, all green
- `LEVELS.md`, `REPORT.md`

No known defects; nothing faked. Par values match the verified move counts.

---

# REPORT — PFT-05/06/07 level authoring package (chapter 2 "composition")

## Verification commands and exit codes

| Command | Exit | Output |
|---|---|---|
| `npx vitest run tests/unit/pft05-07.test.ts` | 0 | 23 tests passed |
| `npx vitest run` (full suite incl. pft01 + 02-04 baselines) | 0 | 57 tests passed (12 + 22 + 23) |
| `npx tsc --noEmit` | 0 | clean under the repo's strict tsconfig (strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes + noImplicitOverride + noUnusedLocals + noUnusedParameters) |

## Requirement status

| Requirement | Status | Evidence |
|---|---|---|
| PFT-05 cargo-only relay mailbox + separate courier route | DONE | `pft05`: `postalLinks` link-north-east + foot ferry (`parcelCapacity: 0`) — the parcel can only ever cross by mail; courier walks home by bridge/path |
| PFT-05 mail parcel + preserve real way home; mailing a courier impossible | DONE | Trace A/B verified; courier can't take the link (no travel edge), send rejects carried parcels and packed pieces |
| PFT-06 ferry deliverable at shore-side recipient; jobs need earlier crossings | DONE | `pft06`: ferry `handlingNode:'east'`, order-ferry via `hand_over_ferry`; 2 parcels + bridge + extraction all precede handover |
| PFT-06 second strategy via different staging / alternate crossing | DONE | Trace B: `load_ferry`+`unload_ferry`+`drop` staging signature vs direct carries in A (asserted via committed-action types + who rides) |
| PFT-07 recipient's deployed location changes; movable address sign | DONE | `pft07`: lots are `mountedOn:'sign-1'` — the address exists only where the sign is deployed; obsolete recipient has no order |
| PFT-07 don't satisfy at obsolete location or while packed | DONE | Deliver at old lot rejected "no open order"; pack while tea pending strands order-tea redeploy→undo |
| LevelCard per level | DONE | `PFT05_CARD`, `PFT06_CARD`, `PFT07_CARD` (winningTraceSummary, wrongApproaches, hints, coopNote) |
| ≥2 designed wrong approaches per level, right reason | DONE | PFT-05: 5, PFT-06: 4, PFT-07: 4 — each asserts stranded orderId + recovery kind or exact rejection substring |
| 3-tier hint ladder | DONE | In LEVELS.md + CARD `hints` |
| Determinism + untouched start fails | DONE | Same pattern as 02-04, per level |
| Engine frozen | DONE | `src/engine/` untouched |

## Design notes / engine interactions discovered

- **Foot ferry (`parcelCapacity: 0`)** is how PFT-05 makes the postal link load-bearing: freight literally cannot cross the water otherwise. `ride_ferry` counts carried parcels against the cap (`"ferry parcel capacity 0 exceeded: 1 parcels would be aboard"`).
- **Deployed pieces always create a walk edge** on their site's `connects`, whatever the kind — so the mailbox socket is deliberately placed on `north↔west`, duplicating the existing orchard-path edge; a mailbox deployed there activates the link without giving couriers a dry crossing (PFT-008 preserved).
- **`hand_over_ferry`** requires `fs.at === handlingNode === courier.at === recipient.node` and an empty hold; after handover the ferry edge leaves `courierGraph` (`ride_ferry` then fails "has been handed over"). Stranded orders after handover classify `recovery='none'` — no piece hypothesis restores a service edge. Verified in tests.
- **`mountedOn` nodes** power PFT-07's moving address: packing the sign is refused while a courier (or cargo) stands on a node mounted on it (PFT-006), and the lane simply leaves the walk graph when the sign packs — "address exists nowhere while packed" falls out for free.
- **Coarse analysis caveat (documented for integrators):** `orderAchievable` picks the *first* handlingNode reachable on a deployed piece — PFT-07's sign lists `'east'` first so order-sign reads achievable via the live East handle. And `parcelGraph` treats ferry edges as traversable regardless of `parcelCapacity` — the strand analysis over-approximates parcel routes (does not matter here: link-inactive send rejection is the tested surface).
- **One-rider rule reminder (from 02-04 package):** two couriers can never both stand on the far shore of one 2-dock ferry — hence PFT-06's Lark exits by land (West gate) and Wren closes alone.

## File inventory (this package)

- `src/content/levels/pft05-return-to-sender.ts` — level + `PFT05_CARD`
- `src/content/levels/pft06-the-ferrys-last-fare.ts` — level + `PFT06_CARD`
- `src/content/levels/pft07-the-moving-address.ts` — level + `PFT07_CARD`
- `tests/unit/pft05-07.test.ts` — 23 tests, all green
- `LEVELS.md` (appended), `REPORT.md` (appended)

No known defects; nothing faked. Par values match verified move counts (13/15, 17/22, 20).
