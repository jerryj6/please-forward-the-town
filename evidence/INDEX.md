# Evidence index — Please Forward the Town

Verification artifacts for gate review (generated 2026-10-08). Re-run any row locally with the listed command.

| Evidence | Where / command | Status |
|---|---|---|
| Engine determinism | `npm run test:unit` (hash + replay tests) | PASS |
| Winning traces per level | `npm run test:campaign` (each PFT-XX winning trace replayed to solved) | PASS |
| Designed wrong approaches | `npm run test:depth` (asserted right-reason failures) | PASS |
| Co-op mechanism | `npm run test:network` — revisioned commands, idempotent commandIds, stale-revision reject, snapshot+history join, reconnect window | PASS (23/23) |
| 2-client browser co-op | `npm run test:e2e` — real browsers, one authoritative room | PASS |
| Type safety | `npx tsc --noEmit` strict + exactOptionalPropertyTypes | PASS |
| Build | `npm run build` → dist/ + dist/build-id.json | PASS |
| Art manifest | `art/manifests/assets.json` (SHA-256 per file; generation manifest /Users/devin/art/MANIFEST.md) | PASS |
| Anchor freeze signoff | art/ANCHOR-REVIEW.md (independent reviewer 406d53d6) | FROZEN all 3 |
| Audio manifest | docs/AUDIO-MANIFEST.md (procedural WebAudio cue table) | PASS |
| Playtest kit | docs/PLAYTEST-KIT.md | ready |
| Full verify suite | test:properties + test:campaign + test:depth + test:performance + test:a11y + test:visual | PASS |
| A11y fixes | WCAG contrast + select labels (axe-driven) | PASS |
| Human playtests (G5) | pending external testers | PENDING |
| Production verify (G6) | `npm run verify:production --url <deployed>` | pending deploy |

Repo history: 18 commits at index time.
