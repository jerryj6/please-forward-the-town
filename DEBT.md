# DEBT — PFT engineering ledger

Truthful list of known gaps, deliberate deferrals, and follow-ups. Nothing here
blocks the G6 ship gate unless marked **[BLOCKER]**.

## Ship-critical
- [ ] **G0/G6 [BLOCKER]**: 3 public GitHub repos (jerryj6/please-forward-the-town) or a PAT, then
      Render deploy of render.yaml, then verify:production against the live build id.
- [ ] **G5 [BLOCKER]**: real human playtests per docs/PLAYTEST-KIT.md — scripted
      engine/browser runs are labeled automated playtests and do NOT count.
- [x] Cover art: 2400×1350 final shipped at public/assets/pft-cover-2400.png (SHA in art manifest) — done 2026-10-08
      (AI upscaler or re-render at target size) before submission, not a resize.

## Post-release (deliberate deferrals)
- [ ] Seat-attributed commits: net commands currently carry no per-seat author
      field; attributing ledger entries to a player seat needs a protocol bump.
- [ ] Hint telemetry: hint-ladder usage is client-local only; no anonymous
      counters for "which tier unblocked whom" — needs a minimal metrics path.
- [ ] Mid-level save/resume: saves are per-level verdict records; resuming a
      half-finished level needs snapshot+restore of play state (engine supports
      it; client doesn't expose it).
- [ ] Timeline/inspector depth: command inspector exists; a full TimelineView
      (per-entity state scrubbing) is designed but not built.
- [ ] Migration playbook: save/manifest version-migration steps are implied by
      versioned defs but not written up as an operator doc.

## Resolved during refinement
- [x] Co-op join-levelId: joiner rendered LEVEL_DEFS[0] chrome over the room's
      level state — fixed (PlayScreen resolves room levelId at render), locked
      by finale co-op specs. (TRS never had it.)
- [x] Honesty validators: check:content probes every carded wrongApproach /
      coopNote against the real engine — 0 unprobed, 0 drift as of last run.
