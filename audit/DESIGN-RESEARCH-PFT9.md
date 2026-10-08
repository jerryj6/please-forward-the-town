# Design Research Dataroom 9 — Logistics/Cargo Puzzle Feel

Seeded sources: Mini Metro (throughput legibility), Monster's
Expedition (Draknek — one-verb depth), Cosmic Express (route as the
puzzle object), Railbound (grid-painting connections). What makes
route-planning legible and satisfying; spec inputs for the
post-release TimelineView/inspector item in DEBT.md.

## 1. The plan is the object, not the pieces

- **Source:** Cosmic Express/Railbound — the player's artifact is the
  ROUTE, drawn once and evaluated whole; satisfaction comes from
  seeing the whole plan run at once, not from per-step micromanagement.
- **PFT spec input:** TimelineView should render the committed journal
  as the artifact — a scraggable per-commit timeline where each entry
  shows actor, action glyph, and resulting-hash tick. Our journal is
  already the canonical record (probe-undo-all: 281/281 prefix hashes
  byte-exact) — the inspector just needs to display it.

## 2. One verb, many consequences (feel = legible consequences)

- **Source:** Monster's Expedition ships one verb (push log) with
  deep emergent consequences — feel comes from consequences being
  predictable AND surprising, never from verb count.
- **PFT spec input:** the inspector should surface consequence-of-
  action at commit time: which orders became stranded/unstranded, which
  recovery class flipped. Engine already emits `order.stranded`/
  `order.unstranded` events with reasons — TimelineView entries should
  carry the event badge inline (the "why" is already in the journal).

## 3. Congestion is visible before it fails

- **Source:** Mini Metro — the player reads the jam before the fail
  state; visible pressure enables strategy.
- **PFT spec input:** per-commit achievability summary in the
  inspector (N orders achievable / M stranded / recovery classes) —
  `analyzeOrders` already computes this; a compact "orders board"
  column in the timeline makes congestion legible pre-fail.

## 4. Divergence is the satisfaction: A/B your plan

- **Source:** route-planning games feel great when replanning is
  cheap — you can compare two routes and SEE the better one.
- **PFT spec input:** the inspector's strongest afford is
  fork-and-compare: undo to a checkpoint (byte-exact — verified),
  take an alternate continuation, and show the two outcomes'
  finalHash/diff. All the state math is proven; the spec is purely
  presentational: checkpoint pins + branch compare.

## 5. Deliverables stay inert; verbs own the drama

- **Source:** in every legible logistics game, parcels never act —
  drama lives in the routing layer.
- **PFT spec input:** TimelineView should GROUP by courier and
  infrastructure, not by parcel — the actor/edge view. Matches the
  coop split structure already proven (courier streams, infrastructure
  verbs in the DENY table).

## Concrete spec inputs for DEBT.md (TimelineView/inspector)

1. Journal → timeline rows: actor glyph, action verb, site/entity,
   event badges (stranded/unstranded/delivered).
2. Checkpoint pins: canonicalHash chip per commit; click → rewind to
   that prefix (engine undo is exact).
3. Orders board: per-commit achievability + recovery-class counts.
4. Fork compare: two continuations from one pin → hash diff +
   delivered-count diff.
5. Coop filter: courier-stream lanes (coop-necessity attribution).
