// Board geometry for Please Forward the Town.
//
// Level manifests carry only the logical graph (nodes, edges, sockets, docks);
// pixel positions are a client concern — the seam where a Pixi stage replaces
// this SVG. Known landings get hand-placed coordinates for the postcard-map
// feel; unknown ones fall back to a deterministic spread so the renderer
// never breaks on later contracts.

import type { NodeId, PftLevel } from "../engine/pft/types.js";

export interface Pt {
  x: number;
  y: number;
}

const NODE_POS: Record<string, Record<NodeId, Pt>> = {
  "pft-01": {
    west: { x: 150, y: 220 },
    middle: { x: 400, y: 220 },
    east: { x: 660, y: 220 },
  },
};

export function nodePos(level: PftLevel, nodeId: NodeId): Pt {
  const known = NODE_POS[level.levelId]?.[nodeId];
  if (known) return known;
  const idx = Math.max(0, level.nodes.findIndex((n) => n.id === nodeId));
  return { x: 140 + 160 * (idx % 5), y: 160 + 130 * Math.floor(idx / 5) };
}

/** Where a courier/parcel/piece glyph sits relative to its node's center. */
export function slotOffset(kind: "courier" | "cargo" | "piece" | "fixture", i = 0): Pt {
  const dx = (i % 3) * 26 - 26;
  switch (kind) {
    case "courier":
      return { x: dx, y: -14 };
    case "cargo":
      return { x: dx, y: 18 };
    case "piece":
      return { x: dx, y: 40 };
    case "fixture":
      return { x: 0, y: -52 - i * 16 };
  }
}

/** Point along a ferry lane: `t` in [0,1] dock A → dock B, bowed downward. */
export function ferryPoint(a: Pt, b: Pt, t: number): Pt {
  const mx = a.x + (b.x - a.x) * t;
  const my = a.y + (b.y - a.y) * t + 52 * Math.sin(Math.PI * t);
  return { x: mx, y: my };
}
