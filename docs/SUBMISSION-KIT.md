# Please Forward the Town — Submission Kit

Prepared for manual entry by the owner. Everything below is stated against
the actual build in this repository; pending items are flagged **PENDING**.

> **Sourcing note:** `docs/GAME-DESIGN-BIBLE.md` was not included in the ref
> snapshot this kit was authored from. The five presentation rules below were
> extracted from `docs/MASTER-HANDOFF.md` (competition-positioning and
> release sections). Reconcile with the bible before final submission.

## 1. Game identity

- **Title:** Please Forward the Town
- **One-line pitch:** Infrastructure-is-cargo logistics — ferry parcels, and
  the bridge, the stairs, even the postbox, across the valley.
- **Genre:** Browser puzzle game (logistics / route planning)
- **Tagline candidates:**
  1. "Every address must forward — including the road."
  2. "The bridge is cargo now."
  3. "Deliver the town to itself."
- **Description (≈80 words):**
  The valley's last courier doesn't just carry parcels — it carries the
  bridge, the stairs, and the postbox, because in this town the
  infrastructure is the freight. Pack pieces at their sockets, deploy them
  where the routes need to exist, ride the ferry with your own road in the
  hold, and file every order at its address. Twelve authored contracts,
  solo or live 2–4 player co-op, on a deterministic engine.
- **Description (20 words):**
  Logistics puzzle where the roads are the cargo: pack, ferry, and deploy
  the town's own infrastructure to reach every address.
- **Controls summary:** Mouse or touch only. Work the order ledger and the
  scene: `travel`, `pickup`/`drop`, `pack`/`deploy` pieces at sockets,
  `load_ferry`/`unload_ferry`/`ride_ferry`, `deliver`, `send` by postal
  link — the `move-counter` tracks par. `undo` and `restart` sit on the
  board.
- **Solo:** `play-solo` → pick a level (`level-pft-01` … `level-pft-12`) →
  execute the contract → all orders fulfilled.
- **Co-op (2/3/4 players):** `play-coop` → lobby → `Host a room (<level>)` →
  share the room code; teammates `Join` with it. Every action resolves on
  the authoritative server and lands on every planner's board.
- **Browser requirements:** Modern desktop or mobile browser with WebGL and
  WebSocket support (Chrome/Edge/Firefox/Safari, current). No install, no
  account.
- **Tech stack (truthful):** TypeScript, Vite, React client, PixiJS scene
  renderer, `ws` WebSocket room server on Node, vitest/fast-check test
  suite, Playwright e2e.

## 2. Play instructions (for a judge)

- **Hosted:** open `<DEPLOYED-URL>` — site and room server share one port.
- **Local fallback:** `npm ci && npm run build && npm start`, then open
  `http://localhost:8787` (server listens on `PORT`, default 8787). `npm run build` emits the client `dist/`, the
  server bundle, and `dist/build-id.json` = `{ sha, builtAt,
  game: "please-forward-the-town" }` — verify the SHA against the submitted
  commit.
- **60-second path:** `play-solo` → `level-pft-01` → run the contract
  (west, lantern, ferry, orchard, pack the span, museum) → orders complete.

## 3. Assets checklist

- [ ] **Cover art** — `public/assets/pft-cover.png` exists at **1672×941**;
      **PENDING:** export the final submission cover at **2400×1350**.
- [ ] **Screenshots** (≥1920×1080, fresh profile):
  - Title — `/` with `play-solo`/`play-coop` visible.
  - Level select — grid of PFT-01…PFT-12 after `play-solo`.
  - Gameplay — PFT-01 mid-contract: ledger open, `move-counter` ticking,
    ferry loaded.
  - Co-op room — lobby with live room code; second device mid-join if
    available (do not composite).
- [ ] **Trailer (30–60s, 10 beats):**
  1. Valley establishing shot: landings, ferry, sockets.
  2. The order board: every address must forward.
  3. Text card: "The bridge is cargo."
  4. Pack the Town Span at its socket — the road disappears.
  5. `load_ferry` / `ride_ferry` — the road crosses in the hold.
  6. `deploy` — the span lands on a new socket.
  7. Orders stamp fulfilled; `move-counter` closes under par.
  8. Later-level glimpse (multi-piece, postal link, exits).
  9. Co-op: two planners, one valley, live.
  10. Title card + URL + credits.
  Real footage only; no composited multiplayer, no unimplemented scenery.

## 4. Truthfulness (required reading before submitting)

- All in-game art is **AI-generated** under a documented per-game art bible;
  provenance in `art/manifests/assets.json` (generator, per-asset prompt
  log, cutout tooling).
- The engine is **deterministic** — identical action lists produce
  identical final hashes; verified by the property/campaign test suite.
- **Playtests: PENDING (gate G5).** No human playtest sessions conducted or
  claimed. No tester quotes, difficulty claims, or player-reaction copy.
- Claims to keep verbatim-true: 12 authored levels, solo + 2–4 player live
  co-op, no-install browser play, deterministic replay.
- Claims to avoid: human playtest results, "hand-drawn" art, unreachable
  features.

## 5. Platform & submission

**itch.io upload checklist**
- [ ] Project page: title, tagline #1, 80-word description
- [ ] Kind: HTML / browser game; viewport 1280×800, embed enabled
- [ ] Upload zipped `dist/` or link the hosted deployment URL — confirm the
      surface accepts external-URL entries
- [ ] Cover: 2400×1350 final (from current 1672×941 source)
- [ ] Screenshots ×4, trailer video
- [ ] Tags: `puzzle`, `logistics`, `delivery`, `whimsical`, `co-op`,
      `browser-game`, `singleplayer`, `multiplayer`
- [ ] Team credits: **Devin (Cognition AI)** — design, engineering, art
      direction; **owner** — direction, review, submission.
- [ ] Truthfulness note (section 4) in the description footer
- [ ] Manual submission only — owner clicks submit.
