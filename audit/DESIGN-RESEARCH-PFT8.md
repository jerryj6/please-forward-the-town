# Design Research Dataroom 8 — Polish Is a Lie Detector

Seeded sources: Berbank Green's juiciness taxonomy (feedback surfaces
as honesty checks — polish that contradicts the sim is a lie the
player catches), juice audit methods (every state change earns a
visible/readable consequence), applied to PFT's feedback surfaces.

## 1. Juice is a correctness check, not decoration

- **Source:** the juiciness taxonomy's core claim — juicy feedback is
  the player's debugger. When polish and sim disagree, the polish is
  the bug the user sees. So "add juice" = "make the sim legible,"
  never "make the lie prettier."
- **PFT application:** PFT's feedback surfaces are already
  sim-grounded: strand events name the stranded order + recovery
  class; rejections name capacity and entity. The surfaces most in
  need of polish are the ones where the sim speaks but the client
  may not show it: (a) the strand TRANSITION itself (which commit
  killed the route), (b) the recovery-class badge (redeploy vs undo
  vs none — three different urgency colors), (c) the superseded
  verdict (just landed upstream — the one surface that was lying).

## 2. Sequence the feedback in the same order the sim does

- **Source:** juice rules — consequence should appear when the cause
  lands, not deferred. A delayed consequence reads as unrelated.
- **PFT application:** engine gives us commit-time events already —
  `order.stranded` fires on the exact commit that breaks
  achievability, `order.unstranded` on the fixing deploy. The one
  hazard documented upstream: t0-unachievable orders emit no strand
  (no transition) — if the client only listens for events, a
  never-achievable order shows no warning at all. Surface needs an
  initial achievability sweep, not just event wiring. (Already
  solved engine-side via `analyzeOrders` fallback — the client just
  needs to render it at t0.)

## 3. Cheap feedback beats missing feedback at the hot spots

- **Source:** the taxonomy ranks surfaces by interaction frequency —
  polish where the player touches the sim most, not where the design
  is proudest.
- **PFT application:** PFT's highest-frequency interactions are
  travel/commit/reject — every one already returns a reason string.
  The medium-frequency hot spot is `undo` — engine-side it's
  byte-exact (probe-undo 11/11), so the client affordance (undo
  afford + journal rewind legibility) is the polish surface that
  most deserves work: it converts our correctness property into a
  player-visible promise.

## 4. Verdict surfaces are the highest-stakes lie detector

- **Source:** win/loss readouts get caught lying fastest — the player
  audits them personally. A wrong verdict poisons trust in every
  other surface.
- **PFT application:** exactly what this pass's superseded policy
  fixes: a completed board that still folds was showing a fresh
  verdict on a stale hash — the honest marker is 'superseded,' not
  'complete.' Engine-side semantics now locked by the spec test
  (107/107).

## 5. The leaderboard economy needs a multiset, not a number

- **Source:** juice on the meta-layer — scores get contested when
  they're coarse. If two "equal" scores hide different work, the
  surface lies.
- **PFT application:** our multiset dedupe is the honest scoring
  layer — a 27-move plan and its commute-reorder deserve the same
  economy credit, not the same 'plan count.' Whatever the client
  shows for plan space (LEVELS.md upstream), the honest number is
  distinct-multisets-per-length — that's the polish surface that
  keeps the difficulty claims verifiable.
