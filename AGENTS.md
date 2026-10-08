# Please Forward the Town — agent bootstrap

You are working on **Please Forward the Town** (please-forward-the-town), one of three browser games in this production.
The binding contract is `docs/MASTER-HANDOFF.md` (SHA-256 9eafb3af47415a2015a9d0842271a6524f6aca2536ab714721c79438b135eea7). You MUST read
your assigned sections of that file in full before implementing — its length is not an
excuse for skipping it; read it in chunks. Check `docs/DECISIONS.md` for amendments.

## Non-negotiables
- TWELVE authored main levels (PFT-01 … PFT-12); mastery is optional extra only.
- Preserve locked gameplay identity, depth, solo completeness, co-op dependencies, and
  art direction. No self-approved scope cuts, mechanic substitutions, or gate rewrites.
- Use requirement IDs (SHARED/OWN/FLOW/GME/PFT/NET/ART/A11Y/OPS/CONTEST) in reports.
- Work only in your assigned paths; preserve other people's edits; propose interface
  changes to the coordinator before touching another owner's files.
- Run the checks your package requires; report commands + exit codes; distinguish
  implemented vs verified. Never fake evidence or weaken a failing test.
- QA/taste signoff must come from an independent reviewer (a different session), never
  from the implementation author. Real-human playtests (G5) are mandatory before release.
- Paid purchases/upgrades always require owner approval — stop and report instead.
- Verify live deployments against their public build identity, not dashboard status.

## Layout
- docs/MASTER-HANDOFF.md — immutable source of truth (read your assigned sections)
- docs/REQUIREMENTS.json — requirement ledger · docs/DECISIONS.md — decision log
- src/engine — pure deterministic rules (no DOM/network/time deps)
- src/content — versioned level definitions (data, not code)
- src/client — React + PixiJS UI · src/server — Node ws room server
- tests/ · scripts/ · public/assets/ · art/ · evidence/

## Checks (run what exists; implement what your package owns)
`npm run check:source` · `npm run check:static` · `npm run test:unit`
`npm run test:campaign` · `npm run test:network` · `npm run build`
