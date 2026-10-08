// SVG board for Please Forward the Town — postcard valley map. Placeholder
// for the Pixi stage that lands later: everything renders from PftLevel +
// PftPlayState, so a stage can replace these elements without touching App
// state. Nodes are islands, sockets are anchor points, the ferry runs its
// lane, deployed pieces draw as connections, cargo rides on whoever holds it.

import type { CargoLocation, PftLevel, PftPlayState } from "../engine/pft/types.js";
import { ferryPoint, nodePos, slotOffset } from "./layout";
import { nameOf } from "./describe";

interface Props {
  level: PftLevel;
  state: PftPlayState;
  selected: string | null;
  onSelect: (id: string | null) => void;
}

const GLYPH: Record<string, string> = {
  parcel: "✉",
  bridge: "═",
  courier: "✦",
};

/** Everywhere a CargoLocation renders, as an entity point. */
export default function SceneView({ level, state, selected, onSelect }: Props) {
  const locOf = (loc: CargoLocation): { x: number; y: number } | null => {
    switch (loc.type) {
      case "node":
        return nodePos(level, loc.nodeId);
      case "courier": {
        const c = state.couriers[loc.courierId];
        return c ? nodePos(level, c.at) : null;
      }
      case "ferry": {
        const f = state.ferries[loc.ferryId];
        const def = level.ferries.find((x) => x.id === loc.ferryId);
        if (!f || !def) return null;
        const a = nodePos(level, def.docks[0]);
        const b = nodePos(level, def.docks[1]);
        const t = def.docks[0] === f.at ? 0.32 : 0.68;
        const p = ferryPoint(a, b, t);
        return { x: p.x, y: p.y - 18 };
      }
      case "delivered": {
        const r = level.recipients.find((x) => x.id === loc.recipientId);
        return r ? nodePos(level, r.node) : null;
      }
    }
  };

  // Slot index keeps co-located entities from stacking invisibly.
  const slot = (kind: "courier" | "cargo" | "piece" | "fixture", id: string): number => {
    const sibs: string[] = [];
    if (kind === "cargo") {
      for (const [pid, p] of Object.entries(state.parcels)) {
        if (p.location.type === "node") sibs.push(pid);
      }
      for (const [pid, p] of Object.entries(state.pieces)) {
        if (p.status === "packed" && p.location.type === "node") sibs.push(pid);
      }
    }
    sibs.sort();
    return Math.max(0, sibs.indexOf(id));
  };

  return (
    <svg
      className="scene"
      viewBox="0 0 800 440"
      role="img"
      aria-label="Valley map"
      data-testid="scene"
      onClick={() => onSelect(null)}
    >
      <defs>
        <radialGradient id="water-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#8ecfd8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#78bbc7" stopOpacity="0.15" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="800" height="440" className="sky" />
      <ellipse cx="400" cy="280" rx="420" ry="150" className="water" />
      <text x="400" y="70" className="map-label">
        the valley crossing
      </text>

      {/* natural edges */}
      {level.edges.map((e, i) => {
        const a = nodePos(level, e.a);
        const b = nodePos(level, e.b);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="path" />;
      })}

      {/* ferry lanes + boats */}
      {level.ferries.map((f) => {
        const a = nodePos(level, f.docks[0]);
        const b = nodePos(level, f.docks[1]);
        const fa = state.ferries[f.id];
        const t = fa && fa.at === f.docks[1] ? 0.68 : 0.32;
        const p = ferryPoint(a, b, t);
        return (
          <g key={f.id}>
            <path d={`M ${a.x} ${a.y + 30} Q ${(a.x + b.x) / 2} ${Math.max(a.y, b.y) + 78} ${b.x} ${b.y + 30}`} className="ferry-lane" />
            <g
              className={`ferry ${selected === f.id ? "selected" : ""}`}
              onClick={(ev) => { ev.stopPropagation(); onSelect(selected === f.id ? null : f.id); }}
              data-testid={`ent-${f.id}`}
            >
              <path d={`M ${p.x - 26} ${p.y} L ${p.x + 26} ${p.y} L ${p.x + 16} ${p.y + 14} L ${p.x - 16} ${p.y + 14} Z`} className="ferry-hull" />
              <rect x={p.x - 8} y={p.y - 12} width="16" height="12" rx="2" className="ferry-cabin" />
              <text x={p.x} y={p.y + 30} className="ent-label">
                {f.name}
                {fa && fa.cargo.length > 0 ? ` (${fa.cargo.length}/${f.parcelCapacity})` : ""}
              </text>
            </g>
          </g>
        );
      })}

      {/* deploy sockets */}
      {level.sites.map((s) => {
        const a = nodePos(level, s.connects[0]);
        const b = nodePos(level, s.connects[1]);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const occupied = Object.values(state.pieces).some((p) => p.status === "deployed" && p.siteId === s.id);
        return (
          <g key={s.id}>
            {!occupied ? (
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="socket-ghost" />
            ) : null}
            <rect x={mx - 7} y={my - 7} width="14" height="14" rx="3" transform={`rotate(45 ${mx} ${my})`} className={occupied ? "socket filled" : "socket"} />
            <text x={mx} y={my + 22} className="ent-label">
              {s.name}
            </text>
          </g>
        );
      })}

      {/* deployed pieces draw as real connections */}
      {Object.entries(state.pieces).map(([pid, p]) => {
        if (p.status !== "deployed") return null;
        const site = level.sites.find((s) => s.id === p.siteId);
        if (!site) return null;
        const a = nodePos(level, site.connects[0]);
        const b = nodePos(level, site.connects[1]);
        return (
          <g key={`dep-${pid}`} className="deployed">
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="plank" />
            {[0.28, 0.5, 0.72].map((t, i) => (
              <line
                key={i}
                x1={a.x + (b.x - a.x) * t}
                y1={a.y + (b.y - a.y) * t - 6}
                x2={a.x + (b.x - a.x) * t}
                y2={a.y + (b.y - a.y) * t + 6}
                className="plank-rib"
              />
            ))}
          </g>
        );
      })}

      {/* island nodes */}
      {level.nodes.map((n) => {
        const p = nodePos(level, n.id);
        return (
          <g key={n.id}>
            <ellipse cx={p.x} cy={p.y + 8} rx="58" ry="34" className="island" />
            <ellipse cx={p.x} cy={p.y} rx="58" ry="34" className="island-top" />
            <text x={p.x} y={p.y + 60} className="node-name">
              {n.name}
            </text>
          </g>
        );
      })}

      {/* recipients + exits sit at their nodes */}
      {level.recipients.map((r, i) => {
        const p = nodePos(level, r.node);
        const o = slotOffset("fixture", i);
        const done = level.orders.some((o2) => o2.recipientId === r.id && state.fulfilled[o2.id]);
        return (
          <g key={r.id} className={`fixture recipient ${done ? "done" : ""}`}>
            <rect x={p.x + o.x - 12} y={p.y + o.y - 10} width="24" height="22" rx="3" />
            <text x={p.x + o.x} y={p.y + o.y - 18} className="ent-label">
              {r.name}
            </text>
          </g>
        );
      })}
      {level.exits.map((x) => {
        const p = nodePos(level, x.node);
        return (
          <g key={x.id} className="fixture exit">
            <path d={`M ${p.x + 34} ${p.y - 66} L ${p.x + 34} ${p.y - 40} L ${p.x + 52} ${p.y - 60} L ${p.x + 34} ${p.y - 54} Z`} />
            <text x={p.x + 44} y={p.y - 30} className="ent-label">
              {x.name}
            </text>
          </g>
        );
      })}

      {/* staged cargo at nodes / on ferries / delivered */}
      {Object.entries(state.parcels).map(([pid, p]) => {
        const base = locOf(p.location);
        if (!base) return null;
        const o = p.location.type === "courier" ? { x: 0, y: -34 } : p.location.type === "delivered" ? slotOffset("fixture", 4) : slotOffset("cargo", slot("cargo", pid));
        const sel = selected === pid;
        return (
          <g
            key={pid}
            className={`cargo parcel ${sel ? "selected" : ""}`}
            onClick={(ev) => { ev.stopPropagation(); onSelect(sel ? null : pid); }}
            data-testid={`ent-${pid}`}
          >
            <rect x={base.x + o.x - 9} y={base.y + o.y - 9} width="18" height="18" rx="4" />
            <text x={base.x + o.x} y={base.y + o.y + 4} className="cargo-glyph">
              {GLYPH.parcel}
            </text>
            <text x={base.x + o.x} y={base.y + o.y + 26} className="ent-label">
              {nameOf(pid)}
            </text>
          </g>
        );
      })}

      {/* pieces: packed are cargo; deployed already drew as connections; delivered sit at recipients */}
      {Object.entries(state.pieces).map(([pid, p]) => {
        if (p.status === "deployed") return null;
        const loc: CargoLocation = p.status === "packed" ? p.location : { type: "delivered", recipientId: p.recipientId };
        const base = locOf(loc);
        if (!base) return null;
        const o = loc.type === "courier" ? { x: 0, y: -34 } : loc.type === "delivered" ? slotOffset("fixture", 5) : slotOffset("piece", slot("cargo", pid));
        const sel = selected === pid;
        return (
          <g
            key={pid}
            className={`cargo piece ${sel ? "selected" : ""}`}
            onClick={(ev) => { ev.stopPropagation(); onSelect(sel ? null : pid); }}
            data-testid={`ent-${pid}`}
          >
            <rect x={base.x + o.x - 11} y={base.y + o.y - 7} width="22" height="14" rx="3" />
            <text x={base.x + o.x} y={base.y + o.y + 4} className="cargo-glyph">
              {GLYPH.bridge}
            </text>
            <text x={base.x + o.x} y={base.y + o.y + 24} className="ent-label">
              {nameOf(pid)}{p.status === "delivered" ? " ✓" : ""}
            </text>
          </g>
        );
      })}

      {/* couriers */}
      {level.couriers.map((c, i) => {
        const s = state.couriers[c.id];
        if (!s) return null;
        const p = nodePos(level, s.at);
        const o = slotOffset("courier", i);
        const sel = selected === c.id;
        return (
          <g
            key={c.id}
            className={`courier ${sel ? "selected" : ""}`}
            onClick={(ev) => { ev.stopPropagation(); onSelect(sel ? null : c.id); }}
            data-testid={`ent-${c.id}`}
          >
            <circle cx={p.x + o.x} cy={p.y + o.y - 10} r="8" className="courier-head" />
            <rect x={p.x + o.x - 9} y={p.y + o.y - 2} width="18" height="20" rx="6" className="courier-body" />
            <text x={p.x + o.x} y={p.y + o.y + 32} className="ent-label">
              {c.name}{s.cargo.length > 0 ? ` ✉${s.cargo.length}` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
