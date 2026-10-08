# PFT work package — deterministic engine report

**Role:** gameplay/rules engineer (PFT engine owner)
**Scope:** `src/engine/contracts.ts`, `src/engine/pft/*`, `src/content/levels/pft01-last-crossing.ts`, `tests/unit/pft01.test.ts`, this report.
**Master:** `DEVIN-CLOUD-MASTER-HANDOFF.md` SHA-256 `9eafb3af47415a2015a9d0842271a6524f6aca2536ab714721c79438b135eea7`
**Requirement IDs covered:** PFT-001..012, PFT-C, PFT-F (engine-level subset), GME-004/010, §I.3.3, §IV.5.1, §IV.5.5.

## What was delivered

| Path | Contents |
|---|---|
| `src/engine/contracts.ts` | Verbatim copy of the assigned contract (see Deviations). |
| `src/engine/pft/types.ts` | Finite graph (nodes w/ declared heights, natural edges, marked deploy sockets), couriers w/ cargo capacity, parcels, infrastructure pieces in `packed`/`deployed`/`delivered`, ferry services, postal links, orders, `PftAction` verb set, `OrderStatus`/recovery types, canonical event names. |
| `src/engine/pft/sim.ts` | `simulate(level, plan, seed)` — runs a plan through the production `PftEngine` commit path, returns events, committed actions, final hash, `RunEvaluation`, per-order statuses, causal explanation, and exact move stats. |
| `src/engine/pft/engine.ts` | `PftEngine implements DeterministicEngine<PftLevel, PftPlayState, PftAction>` + plan/commit session (`propose`/`commit`, base-revision check, idempotent command ids), undo checkpoint stack, `canonicalHash` (stable-sorted JSON → sha256, `node:crypto`), versioned `Replay`/`SaveEnvelope` (`makeReplay`/`replayRun`, `makeSave`/`loadSave`), `evaluate`, `acceptResult` (success only), stranded-order analysis (`analyzeOrderStatuses`). |
| `src/content/levels/pft01-last-crossing.ts` | PFT-01 exactly per PFT-C: West lantern, Middle courier+ferry dock+bridge handle, East orchard/museum/exit; ferry 1 courier + 1 parcel; three orders; `par: 9`. |
| `tests/unit/pft01.test.ts` | 12 vitest cases covering every required assertion plus invariants. |

## Decisions (spec citations)

- **Three-state pieces (PFT-002/003).** `PieceState` is a closed union; `walkGraph` contributes an edge only for `status === 'deployed'`. Packed and delivered pieces have no graph presence — no ghost route is possible by construction, and `evaluate()` asserts it as invariant `invariant:no-ghost-routes`.
- **Delivery is final and consuming (PFT-002).** `deliver` moves the item to `{delivered: recipientId}` — out of cargo, out of the graph, fulfilling exactly the matching open order.
- **Handling endpoints (PFT-005).** `pack` requires the courier at a node in `piece.handlingNodes` AND at an endpoint of the deployed socket. Deploy requires `site.handlingNode === courier.at`, `site.accepts` kind match (PFT-007), and for stairs differing declared heights (PFT-009). One piece per socket.
- **Occupancy (PFT-006).** Nodes may declare `mountedOn: pieceId`; packing is rejected while a courier or parcel occupies such a node. Standing on a *bank* (far endpoint) is legal — it strands, it does not block packing, matching PFT-C's recoverable-packing example. All actions validate completely before mutation, so a conflicting move/pack cannot partially commit ("rejection without partial mutation", §IV.5.1).
- **Ferry capacity (PFT-004).** The ferry has `courierCapacity` + `parcelCapacity` and dock endpoints. Parcels aboard at ride time = hold contents + parcels carried by riding couriers; a carried parcel consumes the parcel slot — no invisible extra slot. Empty returns are legal (ride with zero cargo). Load/unload moves parcels between dock staging and the hold.
- **Relay mailbox (PFT-008).** `send` moves a staged parcel along a declared directed link, only while its mailbox piece is deployed; couriers never move. Packing/delivering the mailbox kills the link (analysis + legality agree).
- **Planning boundaries & halting (PFT-012).** `travel` takes an explicit multi-hop path and validates every hop up front; a broken assumption rejects the whole order atomically with the broken hop named.
- **Stranded/recovery classification (PFT-C, §IV.5.5).** After every commit the engine recomputes per-order achievability and emits `order.stranded`/`order.unstranded` with a `recovery` class: `redeploy` (a still-owned piece can be hypothetically re-deployed at a reachable compatible socket to restore the order — packing early), `undo` (only restoring a delivered piece helps — final handover early), `none`. Reclassification (pack → deliver) re-emits `order.stranded` with the new class.
- **Plan/commit protocol (§3.4).** `propose` binds `baseRevision`; `commit` rejects stale revisions and is idempotent on `commandId` (repeat returns the original commit, never double-applies).
- **Undo (PFT-002, §IV.5.1).** Checkpoint stack of complete prior states; `undo()` restores one verbatim — `undo(apply(s,a)) == s` exactly.
- **Versioned records (§I.3.3, §IV.5.1).** `Replay` = rulesVersion + levelId + seed + committed actions + finalHash; `replayRun` re-commits through the production path and compares hashes; version mismatch throws (no silent replay). `SaveEnvelope` carries `checkpointHash` = canonicalHash of the state.
- **canonicalHash.** Recursive key-sorted canonical JSON over every gameplay-relevant field (state incl. seed, plus level topology content) → sha256 hex. Cargo arrays are maintained sorted so order-insensitive sets hash stably.
- **Completion (PFT-011).** `completed` is a live predicate over all orders simultaneously; courier extraction orders are state-based and non-sticky — a courier who rides back to Middle un-satisfies the contract (PFT-C: "courier remaining on Middle after deliveries does not win"). `contract.completed` fires on the rising edge.
- **`evaluate` maps to `RunEvaluation`:** outcomes = contract orders; observations = engine invariants (conservation — each item in exactly one place; single-state pieces at legal places; no ghost routes).

## Spec ambiguities resolved

1. **"Lateness penalties exact."** The master defines PFT planning as explicitly untimed (GME-003: "Planning is untimed"; PFT-E: "Do not impose a realtime clock on required solo play"); no lateness mechanic exists in the PFT rules. Resolved as **exact move accounting + optional soft par**: `SimStats` reports `moves` (committed actions = integer beats), `ferryTrips`, `packs`, `deploys`, `deliveries`, and `lateMoves = max(0, moves - par)` when the level declares `par`. It is informational mastery feedback and never fails a contract. If the coordinator intended a different penalty, the accounting surface is already deterministic and exact.
2. **"Packing the bridge without delivering strands it unrecoverably → fail" vs. master PFT-C** ("packing bridge before retrieving lantern removes access, but redeploying the still-owned bridge restores it"). Resolved to the master: the world-state flag for pack-early is `recovery: 'redeploy'` (recoverable). The committed **plan** that packs and never delivers still **fails** with a stranded explanation because a plan is judged at exhaustion — tested as `pack-without-deliver fails` (lantern stranded on West, museum order open, `success === false`). Early **delivery** is the undo-only stranding (PFT-C explicit), tested via `recovery: 'undo'` + `engine.undo()` + completion. Both master's cases and the prompt's test names are satisfied.
3. **Seed.** PFT-01 has no stochastic rules; `seed` is carried into state, hash, and replay for version honesty (§IV.5.1) and is reserved for future seeded content.
4. **Contract names.** The master's §3.3 names (`resolveBeat`, `evaluateGoals`, `Event`, `ObservationResult`) map onto the verbatim contract as: `applyAction` resolves a beat (each commit = one integer beat), `evaluate` implements evaluateGoals → `RunEvaluation` (outcomes/observations), `GameEvent`/`PredicateResult` cover Event/ObservationResult. No rename needed.
5. **"Delivered" vs. decorative copy (PFT-003).** Engine state carries no decorative duplicates at all; a delivered piece has exactly one `delivered` record. Rendering the finished-town copy is a client concern and out of engine scope.
6. **Multi-courier ferry rides.** `ride_ferry` moves one courier per action (capacity ≥1 enforced); PFT-02+ multi-courier rides would be a trivial extension — noted for the level-design owner.

## Deviations

None. `contracts.ts` is verbatim as instructed; no other files touched.

## Build & test evidence

Toolchain on this VM (no Node preinstalled): nvm → Node 22.23.3, npm dev-deps `typescript@5.9.3`, `vitest@2.1.9`, `@types/node`. Commands:

```
npm install vitest typescript @types/node
npx tsc --noEmit      # strict incl. noUncheckedIndexedAccess + exactOptionalPropertyTypes → clean
npx vitest run        # 12/12 pass
```

Actual output:

```
 ✓ tests/unit/pft01.test.ts (12 tests) 23ms
 Test Files  1 passed (1)
      Tests  12 passed (12)
```

tsconfig used for the strict check (repo should keep equivalent flags):

```json
{ "compilerOptions": { "target": "ES2022", "module": "ESNext",
  "moduleResolution": "Bundler", "strict": true,
  "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true,
  "noImplicitReturns": true, "noFallthroughCasesInSwitch": true,
  "noUnusedLocals": true, "noUnusedParameters": true,
  "forceConsistentCasingInFileNames": true, "skipLibCheck": true,
  "types": ["node"], "lib": ["ES2022"] },
  "include": ["src/**/*.ts", "tests/**/*.ts"] }
```

## Test coverage → spec mapping

| Test | Requirement |
|---|---|
| order A passes | PFT-C trace A |
| order B passes | PFT-C trace B — no hard-coded delivery order (GME-010) |
| early handover → `order.stranded` (redeploy→undo) → undo → completes | PFT-C failure/recovery; §IV.5.5 undo path |
| pack early → `recovery: 'redeploy'` → `order.unstranded` → completes | §IV.5.5 compatible redeployment |
| pack-without-deliver → fail + stranded explanation | PFT-C; prompt acceptance |
| ferry capacity violation rejected (hold + carried > 1) | PFT-004 |
| deterministic replay: same hash + event log; `replayRun` identical | §IV.5.1 |
| serialize/restore byte-stable, mid-plan continuation identical | §I.3.3, §IV.5.1 |
| delivered bridge → no travel to West + `no-ghost-routes` + conservation | PFT-003, PFT-F |
| lantern-only / courier-back-on-Middle → no win | PFT-C, PFT-011 |
| duplicate commandId idempotent; stale baseRevision rejected | §3.4, §IV.5.1 |
| pack from West (non-handle side) rejected | PFT-005 |

## Open items for downstream owners

- `mountedOn` occupancy nodes, stairs, mailboxes, signs, ferry hand-over are implemented in the engine and legality-checked, but only the bridge is exercised by PFT-01 content; later level cards (PFT-02..12) must add their own tests.
- Event names (`piece.packed`, `order.stranded`, …) are exported via `PftEvent` in `types.ts`; the client/network owner should consume those constants rather than re-stringify.
- No UI, networking, or animation is in scope here; engine state is plain JSON for transport.
