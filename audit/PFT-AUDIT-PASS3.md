# PFT Refinement Audit — pass 3 (2026-10-08)

Pass 3 of the refinement loop. All runs are **automated playtests**
(engine `simulate`/`commit` calls). Engine frozen; client code is NOT in
this working tree — see §1. Verified after changes: `npx vitest run`
102/102, `npx tsc --noEmit` 0.

## 1. Cross-game bug pattern — divergence detail on failed commits

The TRS agent found its client swallowed the reason for a failed commit.
The PFT **engine and sim layer already surface full divergence detail**:

- `commit` returns `{ ok: false, reason }` with the plan index
  (`rejectedAt`/`rejectionReason` in `SimResult`).
- `explain()` renders "Plan rejected at step N: <reason>." and, on
  incomplete endings, "Contract failed — stranded orders: - <orderId>:
  <reason>" plus an "Unfinished but still achievable: …" list.
- `orderStatuses` carries per-order `achievable`/`recovery`/`reason` —
  the exact expected-vs-actual data a UI needs.

**Scope note:** `src/client` is not in this refinement tree (levels +
engine + tests + docs only). Whether the upstream client RENDERS
`rejectionReason`/`orderStatuses[].reason` is a coordinator-side check —
the data exists; if the UI swallows it, the TRS fix applies verbatim.
Flagged for the coordinator, not shipped as a blind diff.

## 2. Degenerate-solve + strand probes, PFT-02..07

Delete-one-action minimalism probe on all ten verified traces:
**zero redundant actions** (lens 16/18/17/18/20/13/15/17/22/20).
Probe: `audit/probe-pft02-07.mts`.

Spot-check degenerate hunts (automated playtest):

- **L02 — Wren cannot solo the lantern leg** (`false`): the parcel
  hand-off split is load-bearing, not padding.
- **L04 — no route to the loft without the stair** (travel to `loft`
  rejected): the stair is load-bearing on the parcel AND courier paths.
- **L05 — direct-carry the registry fails** (`false`): the capacity-0
  ferry genuinely forces the postal link; the naive approach is a real
  wrong approach, not a disguised solve.
- **L06** strand battery already covered by its WA tests (early handover
  `recovery='none'` including a courier on the wrong shore).
- **L07** old-lot recipient covered by test ("no open order" rejection).

## 3. PFT-10 third plan — verified and UNDER PAR

The pass-2 "send-both-parcels" hunch turned out stronger than legal:
`PFT10_TRACE_C` verifies at **27 moves — one under the 28-move par**
(2 sends, 5 ferry legs, 0 deploys). Changes shipped:

- `tests/unit/pft08-10.test.ts`: `PFT10_TRACE_C` + a passing test
  asserting 27 moves and its distinct signature (new test count 26 in
  the file; suite total 102).
- `pft10-the-detour-dividend.ts`: `solutionPolicy` now says "three
  verified plans"; `winningTraceSummary` documents plan C; level comment
  notes par stays the design target with plan C one under.
- `LEVELS.md`: "Documented alternate" section, curated like TRS's
  discovered-alternates appendix.

**Design call for the coordinator:** keep `par: 28` (plan C is a bonus
par-beat — feels like mastery discovery) or lower to 27 (par = optimal).
I left it at 28 and documented honestly; either is defensible, but the
docs now match the true numbers.

## 4. Bible Part 8 (game feel) — engine-side sweep

Client is out of tree; the engine/sim affordances are confirmed:

- **Action feedback latency:** every commit validates fully then applies
  atomically — feedback is per-action, immediate, and carries events.
- **Undo history legibility:** `engine.undo()` restores a complete prior
  checkpoint (PFT-002); the plan/commit journal is versioned
  (`baseRevision`), and `RecoveryKind` distinguishes `redeploy`/`undo`/
  `none` so the UI can say WHY an order is recoverable.
- **Commit/retract affordances:** commit returns the committed action +
  events or `{ok:false, reason}`; `lateMoves` is mastery feedback and
  never a failure (untimed per GME-003).
- Client-side items the coordinator should verify upstream: does the UI
  render the per-commit event stream live, is the undo journal exposed
  as a browsable list, and is there a retract affordance before commit.

## Checklist coverage

- §3.6: third PFT-10 plan found and curated; all ten 02–07 traces
  minimal.
- Part 8: engine affordances confirmed; client-render items flagged.
- Evidence honest: every number above is a scripted run.
