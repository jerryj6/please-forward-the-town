import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle, Texture } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import type { LevelDefinition, WorldSnapshot } from "../../rt/types.js";
import { createDioramaCamera, type DioramaCamera } from "./iso.js";

const TEXTURES = {
  idle: "/assets/sprites/courier/pft-courier-parcels-00.png",
  walk: "/assets/sprites/courier/pft-courier-parcels-01.png",
  crate: "/assets/sprites/courier/pft-courier-parcels-04.png",
  plank: "/assets/sprites/courier/pft-courier-parcels-05.png",
  postbox: "/assets/sprites/env/pft-env-kit-06.png",
} as const;
type TextureKey = keyof typeof TEXTURES;

const COLORS: Record<string, number> = { red: 0xe26955, blue: 0x4f86c6, gold: 0xe8b04a, green: 0x5fae73 };
const WATER = 0x3f8e9b;
const SPLASH_TICKS = 40;
const ACTION_WORDS: Record<string, string> = { deploy: "Lay plank", deliver: "Deliver", drop: "Put down", pickup: "Pick up", lift: "Lift plank" };

export interface PlayerDisplay {
  name: string;
  color: string;
}

interface Props {
  level: LevelDefinition;
  world: WorldSnapshot | null;
  players: Record<string, PlayerDisplay>;
}

type Tile = string | undefined;
const isSocket = (t: Tile): boolean => t === "=" || t === "-";
const isSandbar = (t: Tile): boolean => t === ",";
const isShoal = (t: Tile): boolean => t === ";";
const isLowShore = (t: Tile): boolean => isSandbar(t) || isShoal(t);
const isLand = (t: Tile): boolean => t !== undefined && t !== "~" && !isSocket(t) && !isLowShore(t);
const isZone = (t: Tile): boolean => t !== undefined && t >= "a" && t <= "z";

function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function floodAtSec(level: LevelDefinition): number | undefined {
  return (level as LevelDefinition & { sandbarFloodsAtSec?: number }).sandbarFloodsAtSec;
}

function tideProgress(level: LevelDefinition, world: WorldSnapshot | null): number {
  if (!world) return 0;
  const total = level.timeLimitSec * 20;
  return Math.max(0, Math.min(1, 1 - world.timeRemainingTicks / total));
}

function sandbarFlooded(level: LevelDefinition, world: WorldSnapshot | null): boolean {
  const at = floodAtSec(level);
  if (at === undefined || !world) return false;
  const flag = (world as WorldSnapshot & { sandbarFlooded?: boolean }).sandbarFlooded;
  return flag ?? world.timeRemainingTicks <= at * 20;
}

function shoalFlooded(level: LevelDefinition, world: WorldSnapshot | null): boolean {
  const at = level.shoalFloodsAtSec;
  if (at === undefined || !world) return false;
  return world.shoalFlooded ?? world.timeRemainingTicks <= at * 20;
}

/** Visible height of a block's front face above the waterline; the tide eats it. */
function exposedFace(cam: DioramaCamera, progress: number): number {
  return cam.face * (0.92 - 0.55 * progress);
}

function drawTerrain(
  g: Graphics,
  level: LevelDefinition,
  cam: DioramaCamera,
  progress: number,
  flooded: boolean,
  shoalIsFlooded: boolean,
): void {
  const map = level.map;
  const T = cam.tile;
  const D = cam.depth;
  const face = exposedFace(cam, progress);
  const at = (x: number, y: number): Tile => map[y]?.[x];

  for (let y = 0; y < map.length; y += 1) {
    const row = map[y]!;
    for (let x = 0; x < row.length; x += 1) {
      const tile = row[x];
      const p = cam.project(x, y);
      if (isLowShore(tile)) {
        const shoal = isShoal(tile);
        if (shoal ? shoalIsFlooded : flooded) {
          g.rect(p.x, p.y + D * 0.3, T, D * 0.5).fill({ color: 0x7cc3c2, alpha: 0.35 });
        } else {
          const low = face * 0.28;
          if (!isLand(at(x, y + 1)) && !isLowShore(at(x, y + 1))) {
            g.rect(p.x, p.y + D, T, low).fill({ color: shoal ? 0x756b51 : 0xb79a63 });
          }
          const dryTop = shoal
            ? (hash(x, y) > 0.5 ? 0x9d8e68 : 0x8e805f)
            : (hash(x, y) > 0.5 ? 0xe4cf98 : 0xdcc58c);
          g.rect(p.x, p.y, T, D).fill({ color: dryTop });
          g.rect(p.x + T * 0.15, p.y + D * (0.3 + hash(y, x) * 0.4), T * 0.3, 1.5)
            .fill({ color: shoal ? 0x70674f : 0xc8ae74, alpha: 0.8 });
        }
        continue;
      }
      if (!isLand(tile)) continue;

      const below = at(x, y + 1);
      if (!isLand(below)) {
        g.rect(p.x, p.y + D, T, face).fill({ color: 0x8a7558 });
        g.rect(p.x, p.y + D, T, face * 0.28).fill({ color: 0x6e8a4c });
        for (let i = 0; i < 3; i += 1) {
          const sx = p.x + T * (0.12 + 0.3 * i + hash(x + i, y) * 0.08);
          g.rect(sx, p.y + D + face * 0.4, T * 0.22, face * 0.32).fill({ color: 0x9d8766, alpha: 0.9 });
        }
        g.rect(p.x, p.y + D + face - 2, T, 3).fill({ color: 0xe9f6f0, alpha: 0.75 });
      }

      let top: number;
      if (isZone(tile)) top = (x + y) % 2 === 0 ? 0xe9d6a6 : 0xe1cc98;
      else if (tile === "X") top = 0xb98a58;
      else top = hash(x, y) > 0.5 ? 0x93c46f : 0x8aba67;
      g.rect(p.x, p.y, T, D).fill({ color: top });

      if (isZone(tile)) {
        g.rect(p.x + 1, p.y + 1, T - 2, D - 2).stroke({ color: 0xbfa36e, width: 1, alpha: 0.7 });
      } else if (tile === "X") {
        for (let i = 1; i < 5; i += 1) g.rect(p.x, p.y + (D * i) / 5, T, 1.5).fill({ color: 0x8a6239, alpha: 0.8 });
      } else if (tile !== "#") {
        for (let i = 0; i < 3; i += 1) {
          const h = hash(x * 3 + i, y * 7);
          const tx = p.x + T * (0.1 + h * 0.8);
          const ty = p.y + D * (0.2 + hash(y + i, x) * 0.65);
          g.moveTo(tx, ty).lineTo(tx - 2, ty - 5).moveTo(tx + 2, ty).lineTo(tx + 3, ty - 4).stroke({ color: 0x5e9a4a, width: 1.4 });
        }
        if (hash(x + 11, y + 5) > 0.82) {
          const fx = p.x + T * (0.2 + hash(y, x + 3) * 0.6);
          const fy = p.y + D * (0.3 + hash(x, y + 9) * 0.5);
          g.circle(fx, fy, 2.4).fill({ color: hash(x, y + 2) > 0.5 ? 0xf2ede0 : 0xf3a889 });
        }
      }
      if (!isLand(at(x, y - 1))) g.rect(p.x, p.y, T, 3).fill({ color: 0xc4e39a, alpha: tile === "X" || isZone(tile) ? 0.4 : 0.9 });
      if (!isLand(at(x - 1, y))) g.rect(p.x, p.y, 2, D).fill({ color: 0x5b7f45, alpha: 0.5 });
      if (!isLand(at(x + 1, y))) g.rect(p.x + T - 2, p.y, 2, D).fill({ color: 0x5b7f45, alpha: 0.5 });
    }
  }
}

function drawRipples(g: Graphics, width: number, height: number, time: number): void {
  for (let i = 0; i < 70; i += 1) {
    const speed = 6 + hash(i, 3) * 10;
    const x = ((hash(i, 1) * width + (time / 1000) * speed) % (width + 60)) - 30;
    const y = hash(i, 2) * height;
    const len = 10 + hash(i, 4) * 22;
    const alpha = 0.08 + 0.1 * (0.5 + 0.5 * Math.sin(time / 700 + i));
    g.rect(x, y, len, 2).fill({ color: 0xd6f1ec, alpha });
  }
}

function drawSocket(
  g: Graphics,
  level: LevelDefinition,
  cam: DioramaCamera,
  x: number,
  y: number,
  deployed: boolean,
  highlight: number,
  face: number,
): void {
  const T = cam.tile;
  const D = cam.depth;
  const p = cam.project(x, y);
  const left = level.map[y]?.[x - 1];
  const right = level.map[y]?.[x + 1];
  const horizontal = (isLand(left) || isSocket(left)) && (isLand(right) || isSocket(right));
  const box = horizontal
    ? { x: p.x - T * 0.06, y: p.y + D * 0.14, w: T * 1.12, h: D * 0.72 }
    : { x: p.x + T * 0.16, y: p.y - D * 0.06, w: T * 0.68, h: D * 1.12 };
  if (deployed) {
    g.rect(box.x, box.y + box.h, box.w, face * 0.32).fill({ color: 0x5a3a20 });
    g.rect(box.x, box.y, box.w, box.h).fill({ color: 0xb07642 });
    const boards = 5;
    for (let i = 1; i < boards; i += 1) {
      if (horizontal) g.rect(box.x + (box.w * i) / boards, box.y, 2, box.h).fill({ color: 0x6f4526 });
      else g.rect(box.x, box.y + (box.h * i) / boards, box.w, 2).fill({ color: 0x6f4526 });
    }
    if (horizontal) {
      g.rect(box.x, box.y - 1, box.w, 3).fill({ color: 0xe0c99a });
      g.rect(box.x, box.y + box.h - 2, box.w, 3).fill({ color: 0xe0c99a });
    } else {
      g.rect(box.x - 1, box.y, 3, box.h).fill({ color: 0xe0c99a });
      g.rect(box.x + box.w - 2, box.y, 3, box.h).fill({ color: 0xe0c99a });
    }
    g.rect(box.x, box.y, box.w, box.h).stroke({ color: 0x4a2f19, width: 1.5 });
    return;
  }
  const alpha = 0.45 + 0.45 * highlight;
  const dash = Math.max(5, T / 10);
  const edges: Array<[number, number, number, number]> = [
    [box.x, box.y, box.x + box.w, box.y],
    [box.x + box.w, box.y, box.x + box.w, box.y + box.h],
    [box.x + box.w, box.y + box.h, box.x, box.y + box.h],
    [box.x, box.y + box.h, box.x, box.y],
  ];
  for (const [x1, y1, x2, y2] of edges) {
    const length = Math.hypot(x2 - x1, y2 - y1);
    for (let d = 0; d < length; d += dash * 2) {
      const a = d / length;
      const b = Math.min(1, (d + dash) / length);
      g.moveTo(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a).lineTo(x1 + (x2 - x1) * b, y1 + (y2 - y1) * b);
    }
  }
  g.stroke({ color: 0xfff6de, width: 2.5, alpha });
  if (highlight > 0) g.rect(box.x, box.y, box.w, box.h).fill({ color: 0xfff1c4, alpha: 0.12 * highlight });
}

function drawLantern(g: Graphics, x: number, y: number, size: number, time: number): void {
  const glow = 0.22 + 0.06 * Math.sin(time / 260);
  g.circle(x, y - size * 0.55, size * 0.9).fill({ color: 0xffe08a, alpha: glow });
  g.rect(x - size * 0.06, y - size * 1.25, size * 0.12, size * 0.16).fill({ color: 0x2f2d2a });
  g.circle(x, y - size * 1.24, size * 0.12).stroke({ color: 0x2f2d2a, width: 2 });
  g.roundRect(x - size * 0.32, y - size * 1.1, size * 0.64, size * 0.14, 3).fill({ color: 0x3d3a34 });
  g.roundRect(x - size * 0.26, y - size * 0.96, size * 0.52, size * 0.72, 4).fill({ color: 0xffcf5a });
  g.roundRect(x - size * 0.26, y - size * 0.96, size * 0.52, size * 0.72, 4).stroke({ color: 0x3d3a34, width: 2.5 });
  g.rect(x - 1, y - size * 0.96, 2, size * 0.72).fill({ color: 0x3d3a34 });
  g.roundRect(x - size * 0.34, y - size * 0.26, size * 0.68, size * 0.16, 3).fill({ color: 0x3d3a34 });
}

function drawPiano(g: Graphics, x: number, y: number, size: number): void {
  const width = size * 0.9;
  const height = size * 0.82;
  const left = x - width / 2;
  const top = y - height;
  g.ellipse(x, y + size * 0.04, width * 0.55, size * 0.12).fill({ color: 0x000000, alpha: 0.18 });
  g.poly([
    left, top + height * 0.12,
    left + width * 0.18, top,
    left + width, top,
    left + width, top + height * 0.78,
    left + width * 0.84, top + height,
    left, top + height,
  ]).fill({ color: 0x704326 });
  g.poly([
    left, top + height * 0.12,
    left + width * 0.18, top,
    left + width, top,
    left + width, top + height * 0.14,
    left + width * 0.08, top + height * 0.25,
  ]).fill({ color: 0xa66b3e }).stroke({ color: 0xd4a06b, width: 2 });
  g.rect(left + width * 0.08, top + height * 0.17, width * 0.82, height * 0.61).fill({ color: 0x905a34 });
  g.rect(left + width * 0.13, top + height * 0.2, width * 0.72, height * 0.47)
    .fill({ color: 0x7a492b })
    .stroke({ color: 0x5a351f, width: 1.5 });
  g.rect(left + width * 0.1, top + height * 0.68, width * 0.78, height * 0.13)
    .fill({ color: 0xfff1d5 })
    .stroke({ color: 0x5d3a24, width: 1 });
  for (let key = 1; key < 10; key += 1) {
    const keyX = left + width * (0.1 + key * 0.078);
    g.rect(keyX, top + height * 0.68, 1, height * 0.13).fill({ color: 0xc4b292 });
  }
  for (const key of [1, 2, 4, 5, 6, 8]) {
    g.roundRect(left + width * (0.1 + key * 0.078) - 2, top + height * 0.68, 4, height * 0.065, 1)
      .fill({ color: 0x30241d });
  }
  g.poly([
    left + width * 0.08, top + height * 0.8,
    left + width * 0.9, top + height * 0.8,
    left + width * 0.84, y,
    left + width * 0.14, y,
  ]).fill({ color: 0x81502f });
  g.rect(left + width * 0.08, top + height * 0.12, width * 0.82, height * 0.66)
    .stroke({ color: 0x59351f, width: 2 });
  for (const legX of [left + width * 0.11, left + width * 0.78]) {
    g.roundRect(legX, top + height * 0.79, width * 0.09, height * 0.2, 2).fill({ color: 0x59351f });
    g.circle(legX + width * 0.045, y + height * 0.03, size * 0.035).fill({ color: 0x756b58 });
  }
}

function drawCottage(g: Graphics, x: number, y: number, size: number, depth: number): void {
  const width = size * 0.76;
  const height = size * 0.72;
  const left = x - width / 2;
  const top = y - height;
  g.ellipse(x, y + depth * 0.08, width * 0.64, depth * 0.2).fill({ color: 0x000000, alpha: 0.2 });
  g.rect(left + width * 0.12, top + height * 0.34, width * 0.76, height * 0.58)
    .fill({ color: 0xd1ad78 })
    .stroke({ color: 0x624a34, width: 1.5 });
  g.poly([
    left + width * 0.04, top + height * 0.4,
    x, top + height * 0.08,
    left + width * 0.96, top + height * 0.4,
    x, top + height * 0.58,
  ]).fill({ color: 0x9a5236 }).stroke({ color: 0x583325, width: 1.5 });
  g.poly([
    x, top + height * 0.08,
    left + width * 0.96, top + height * 0.4,
    left + width * 0.96, top + height * 0.83,
    x, top + height * 0.67,
  ]).fill({ color: 0x7d442f });
  g.rect(x - width * 0.1, top + height * 0.58, width * 0.2, height * 0.34)
    .fill({ color: 0x65442f })
    .stroke({ color: 0x3f3026, width: 1 });
  g.rect(left + width * 0.22, top + height * 0.46, width * 0.18, height * 0.16)
    .fill({ color: 0xb9d5cf })
    .stroke({ color: 0x69533b, width: 1.5 });
  g.rect(left + width * 0.62, top + height * 0.46, width * 0.18, height * 0.16)
    .fill({ color: 0xb9d5cf })
    .stroke({ color: 0x69533b, width: 1.5 });
  g.rect(left + width * 0.76, top + height * 0.19, width * 0.12, height * 0.2).fill({ color: 0x79503a });
}

export function GameCanvas({ level, world, players }: Props): JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);
  const [renderReady, setRenderReady] = useState(false);
  const state = useRef({ world, players, level });
  state.current = { world, players, level };

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const app = new Application();
    let disposed = false;
    let initialized = false;
    let destroyed = false;
    let rendered = false;
    const destroy = (): void => {
      if (!initialized || destroyed) return;
      destroyed = true;
      app.destroy({ removeView: true }, { children: true });
    };

    void app.init({ resizeTo: element, background: WATER, antialias: true, preserveDrawingBuffer: true, autoDensity: true, resolution: Math.min(2, window.devicePixelRatio || 1) }).then(async () => {
      initialized = true;
      if (disposed) {
        destroy();
        return;
      }
      element.appendChild(app.canvas);
      const entries = await Promise.all(
        (Object.keys(TEXTURES) as TextureKey[]).map(async (key) => [key, await Assets.load<Texture>(TEXTURES[key])] as const),
      );
      if (disposed) return;
      const tex = Object.fromEntries(entries) as Record<TextureKey, Texture>;

      const waterFx = new Graphics();
      const terrain = new Graphics();
      const ground = new Graphics();
      const actors = new Container();
      app.stage.addChild(waterFx, terrain, ground, actors);

      const sprites = new Map<string, Sprite>();
      const graphics = new Map<string, Graphics>();
      const labels = new Map<string, Text>();
      const smooth = new Map<string, { x: number; y: number; flip: number; lastMove: number }>();
      let terrainKey = "";

      const sprite = (key: string, texture: Texture): Sprite => {
        let s = sprites.get(key);
        if (!s) {
          s = new Sprite(texture);
          s.anchor.set(0.5, 1);
          sprites.set(key, s);
        }
        s.texture = texture;
        return s;
      };
      const pooledGraphics = (key: string): Graphics => {
        let g = graphics.get(key);
        if (!g) {
          g = new Graphics();
          graphics.set(key, g);
        }
        g.clear();
        return g;
      };
      const label = (key: string, text: string, size: number, fill: number, stroke: number): Text => {
        let t = labels.get(key);
        if (!t) {
          t = new Text({
            text,
            style: new TextStyle({ fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif", fontSize: size, fontWeight: "700", fill, stroke: { color: stroke, width: 4 }, letterSpacing: 0.3 }),
          });
          t.anchor.set(0.5, 1);
          labels.set(key, t);
        }
        if (t.text !== text) t.text = text;
        return t;
      };

      const draw = (time: number): void => {
        const { world: current, players: displays, level: lvl } = state.current;
        const width = element.clientWidth;
        const height = element.clientHeight;
        const cam = createDioramaCamera(lvl.map, width, height);
        const T = cam.tile;
        const D = cam.depth;
        const progress = tideProgress(lvl, current);
        const flooded = sandbarFlooded(lvl, current);
        const shoalIsFlooded = shoalFlooded(lvl, current);
        const face = exposedFace(cam, progress);

        const key = `${lvl.id}|${width}x${height}|${Math.round(progress * 100)}|${flooded}|${shoalIsFlooded}`;
        if (key !== terrainKey) {
          terrainKey = key;
          terrain.clear();
          drawTerrain(terrain, lvl, cam, progress, flooded, shoalIsFlooded);
        }
        waterFx.clear();
        drawRipples(waterFx, width, height, time);

        ground.clear();
        actors.removeChildren();
        for (const ferry of lvl.ferries ?? []) {
          const points = ferry.path.map((point) => cam.project(point.x + 0.5, point.y + 0.5));
          for (let index = 1; index < points.length; index += 1) {
            const before = points[index - 1]!;
            const after = points[index]!;
            ground.moveTo(before.x, before.y).lineTo(after.x, after.y);
          }
          if (points.length > 1) ground.stroke({ color: 0x745333, width: Math.max(2, T * 0.025), alpha: 0.9 });
        }
        const carryingPlank = current?.players.some((pl) => {
          const item = current.items.find((it) => it.id === pl.carrying);
          return item?.kind === "plank";
        }) ?? false;
        const pulse = carryingPlank ? 0.5 + 0.5 * Math.sin(time / 180) : 0;

        lvl.map.forEach((row, y) => {
          [...row].forEach((tile, x) => {
            if (!isSocket(tile)) return;
            const deployed = current
              ? current.items.some((it) => it.state === "deployed" && it.x === x && it.y === y)
              : tile === "=";
            drawSocket(ground, lvl, cam, x, y, deployed, deployed ? 0 : pulse, face);
          });
        });

        const wanted = new Set<string>();
        for (const pl of current?.players ?? []) {
          const item = current?.items.find((it) => it.id === pl.carrying);
          if (!item) continue;
          for (const order of current?.orders ?? []) if (!order.fulfilled && order.itemKind === item.kind) wanted.add(order.zone);
        }
        if (wanted.size > 0) {
          const glow = 0.25 + 0.2 * Math.sin(time / 200);
          lvl.map.forEach((row, y) => {
            [...row].forEach((tile, x) => {
              if (!tile || !wanted.has(tile)) return;
              const p = cam.project(x, y);
              ground.rect(p.x + 2, p.y + 2, T - 4, D - 4).fill({ color: 0xfff3b0, alpha: glow });
              ground.rect(p.x + 2, p.y + 2, T - 4, D - 4).stroke({ color: 0xffffff, width: 2.5, alpha: 0.5 + glow });
            });
          });
        }

        type Actor = { y: number; draw: () => void };
        const queue: Actor[] = [];

        lvl.map.forEach((row, y) => {
          [...row].forEach((tile, x) => {
            if (tile !== "#") return;
            queue.push({
              y: y + 0.9,
              draw: () => {
                const p = cam.project(x + 0.5, y + 0.9);
                const g = pooledGraphics(`cottage-${x}-${y}`);
                drawCottage(g, p.x, p.y, T, D);
                actors.addChild(g);
              },
            });
          });
        });

        for (const ferry of current?.ferries ?? []) {
          queue.push({
            y: ferry.y / 1000,
            draw: () => {
              const p = cam.project(ferry.x / 1000, ferry.y / 1000);
              const g = pooledGraphics(`ferry-${ferry.id}`);
              const width = T * 0.9;
              const height = D * 0.72;
              g.roundRect(p.x - width / 2, p.y - height / 2, width, height, D * 0.12).fill({ color: 0x8e5c35 });
              for (let board = 1; board < 5; board += 1) {
                const boardX = p.x - width / 2 + (width * board) / 5;
                g.moveTo(boardX, p.y - height * 0.42).lineTo(boardX, p.y + height * 0.42).stroke({ color: 0x5d3a24, width: 2 });
              }
              g.roundRect(p.x - width / 2, p.y - height / 2, width, height, D * 0.12)
                .stroke({ color: 0x412919, width: 2 });
              actors.addChild(g);
            },
          });
        }

        const zoneDone = new Map<string, boolean>();
        for (const order of current?.orders ?? []) {
          zoneDone.set(order.zone, (zoneDone.get(order.zone) ?? true) && order.fulfilled);
        }
        const zoneEntries: Array<{ tile: string; x: number; y: number }> = [];
        const seenZones = new Set<string>();
        const exitEntries: Array<{ x: number; y: number }> = [];
        lvl.map.forEach((row, y) => {
          [...row].forEach((tile, x) => {
            if (tile === "X") exitEntries.push({ x, y });
            if (!isZone(tile) || seenZones.has(tile)) return;
            seenZones.add(tile);
            zoneEntries.push({ tile, x, y });
          });
        });
        type ScreenRect = { left: number; top: number; right: number; bottom: number };
        const intersects = (a: ScreenRect, b: ScreenRect): boolean =>
          a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const exitLabelRects: ScreenRect[] = exitEntries.map(({ x, y }) => {
          const tag = label(`exit-${x}-${y}`, "EXIT", Math.max(10, T * 0.16), 0xffffff, 0x8a4a2a);
          const p = cam.project(x + 0.5, y + 0.95);
          return {
            left: p.x - tag.width / 2 - 2,
            top: p.y - tag.height - 2,
            right: p.x + tag.width / 2 + 2,
            bottom: p.y + 2,
          };
        });
        const postboxRects: ScreenRect[] = zoneEntries.map(({ x, y }) => {
          const p = cam.project(x + 0.78, y + 0.3);
          const boxHeight = T * 0.8;
          const boxWidth = boxHeight * (tex.postbox.width / tex.postbox.height);
          return {
            left: p.x - boxWidth / 2,
            top: p.y - boxHeight,
            right: p.x + boxWidth / 2,
            bottom: p.y,
          };
        });
        const placedLabelRects = [...exitLabelRects];
        const zoneLabelPositions = new Map<string, { x: number; y: number }>();
        zoneEntries.forEach(({ tile }, index) => {
          const box = postboxRects[index]!;
          const name = lvl.recipients[tile] ?? tile.toUpperCase();
          const done = zoneDone.get(tile) ?? false;
          const tag = label(`zone-${tile}`, done ? `${name} ✓` : name, Math.max(11, T * 0.17), done ? 0xe9ffe8 : 0xffffff, done ? 0x2f6b45 : 0x5a4630);
          tag.anchor.set(0, 0.5);
          const width = tag.width;
          const height = tag.height;
          const gap = 5;
          const centerY = (box.top + box.bottom) / 2;
          const centerX = (box.left + box.right) / 2;
          const candidates = [
            { x: box.right + gap, y: centerY },
            { x: centerX - width / 2, y: box.bottom + gap + height / 2 },
            { x: box.left - gap - width, y: centerY },
            { x: centerX - width / 2, y: box.top - gap - height / 2 },
          ];
          const rectFor = ({ x: left, y: center }: { x: number; y: number }): ScreenRect => ({
            left: left - 2,
            top: center - height / 2 - 2,
            right: left + width + 2,
            bottom: center + height / 2 + 2,
          });
          const position = candidates.find((candidate) => {
            const candidateRect = rectFor(candidate);
            return !postboxRects.some((other, otherIndex) => otherIndex !== index && intersects(candidateRect, other)) &&
              !placedLabelRects.some((other) => intersects(candidateRect, other));
          }) ?? candidates[0]!;
          zoneLabelPositions.set(tile, position);
          placedLabelRects.push(rectFor(position));
        });
        for (const { x, y } of exitEntries) {
          queue.push({
            y: y + 0.1,
            draw: () => {
              const g = pooledGraphics(`flag-${x}-${y}`);
              const p = cam.project(x + 0.78, y + 0.35);
              const wave = Math.sin(time / 240) * T * 0.04;
              g.rect(p.x - 1.5, p.y - T * 0.95, 3, T * 0.95).fill({ color: 0x5b4632 });
              g.poly([p.x + 1.5, p.y - T * 0.95, p.x + T * 0.42, p.y - T * 0.83 + wave, p.x + 1.5, p.y - T * 0.7]).fill({ color: 0xe0583f });
              actors.addChild(g);
              const tag = label(`exit-${x}-${y}`, "EXIT", Math.max(10, T * 0.16), 0xffffff, 0x8a4a2a);
              const c = cam.project(x + 0.5, y + 0.95);
              tag.position.set(c.x, c.y);
              actors.addChild(tag);
            },
          });
        }
        for (const { tile, x, y } of zoneEntries) {
          queue.push({
            y: y + 0.2,
            draw: () => {
              const p = cam.project(x + 0.78, y + 0.3);
              const box = sprite(`postbox-${tile}`, tex.postbox);
              box.height = T * 0.8;
              box.width = box.height * (tex.postbox.width / tex.postbox.height);
              box.position.set(p.x, p.y);
              actors.addChild(box);
              const done = zoneDone.get(tile) ?? false;
              const name = lvl.recipients[tile] ?? tile.toUpperCase();
              const tag = label(`zone-${tile}`, done ? `${name} ✓` : name, Math.max(11, T * 0.17), done ? 0xe9ffe8 : 0xffffff, done ? 0x2f6b45 : 0x5a4630);
              tag.anchor.set(0, 0.5);
              const position = zoneLabelPositions.get(tile)!;
              tag.position.set(position.x, position.y);
              actors.addChild(tag);
            },
          });
        }

        for (const item of current?.items ?? []) {
          if (item.state !== "ground") continue;
          queue.push({
            y: item.y + 0.5,
            draw: () => {
              const p = cam.project(item.x + 0.5, item.y + 0.62);
              ground.ellipse(p.x, p.y, T * 0.32, D * 0.18).fill({ color: 0x000000, alpha: 0.18 });
              if (item.kind === "lantern") {
                const g = pooledGraphics(`lantern-${item.id}`);
                drawLantern(g, p.x, p.y, T * 0.62, time);
                actors.addChild(g);
                return;
              }
              if (item.kind === "piano") {
                const g = pooledGraphics(`piano-${item.id}`);
                drawPiano(g, p.x, p.y, T * 0.9);
                actors.addChild(g);
                return;
              }
              const t = item.kind === "crate" ? tex.crate : tex.plank;
              const s = sprite(`item-${item.id}`, t);
              s.width = T * (item.kind === "crate" ? 0.78 : 0.98);
              s.height = s.width * (t.height / t.width);
              s.position.set(p.x, p.y + D * 0.08);
              actors.addChild(s);
            },
          });
        }

        const many = (current?.players.length ?? 0) > 1;
        for (const player of current?.players ?? []) {
          const ferry = current?.ferries.find((candidate) =>
            Math.abs(candidate.x - player.x) < 500 && Math.abs(candidate.y - player.y) < 500,
          );
          const target = ferry
            ? { x: ferry.x / 1000, y: ferry.y / 1000 }
            : { x: player.x / 1000, y: player.y / 1000 };
          let s = smooth.get(player.id);
          if (!s || Math.hypot(target.x - s.x, target.y - s.y) > 1.6) {
            s = { x: target.x, y: target.y, flip: 1, lastMove: 0 };
            smooth.set(player.id, s);
          }
          if (ferry) {
            s.x = target.x;
            s.y = target.y;
          } else {
            const nx = s.x + (target.x - s.x) * 0.45;
            const ny = s.y + (target.y - s.y) * 0.45;
            if (Math.abs(nx - s.x) > 0.002 || Math.abs(ny - s.y) > 0.002) s.lastMove = time;
            if (nx - s.x < -0.002) s.flip = -1;
            else if (nx - s.x > 0.002) s.flip = 1;
            s.x = nx;
            s.y = ny;
          }
          const pos = { x: s.x, y: s.y };
          const flip = s.flip;
          const moving = !ferry && time - s.lastMove < 120;
          queue.push({
            y: pos.y,
            draw: () => {
              const p = cam.project(pos.x, pos.y);
              const display = displays[player.id] ?? { name: "Courier", color: "red" };
              const color = COLORS[display.color] ?? COLORS.red!;
              if (player.state === "splash") {
                const t = 1 - player.splashTicks / SPLASH_TICKS;
                const g = pooledGraphics(`splash-${player.id}`);
                for (let ring = 0; ring < 3; ring += 1) {
                  const r = Math.max(0, t - ring * 0.15);
                  g.ellipse(p.x, p.y, T * (0.15 + r * 0.6), D * (0.1 + r * 0.4)).stroke({ color: 0xffffff, width: 2.5, alpha: Math.max(0, 0.9 - r) });
                }
                for (let drop = 0; drop < 6; drop += 1) {
                  const a = (drop / 6) * Math.PI * 2;
                  const lift = Math.sin(Math.min(1, t * 2) * Math.PI) * T * 0.45;
                  g.circle(p.x + Math.cos(a) * T * 0.3 * t, p.y - lift + Math.sin(a) * D * 0.15, 3).fill({ color: 0xe8fbf6, alpha: 1 - t });
                }
                actors.addChild(g);
                const tag = label(`splash-tag-${player.id}`, "Splash!", Math.max(11, T * 0.18), 0xffffff, 0x2c6f7a);
                tag.position.set(p.x, p.y - T * 0.6 - t * T * 0.3);
                tag.alpha = 1 - t * 0.6;
                actors.addChild(tag);
                return;
              }
              ground.ellipse(p.x, p.y, T * 0.3, D * 0.2).fill({ color: 0x000000, alpha: 0.2 });
              ground.ellipse(p.x, p.y, T * 0.34, D * 0.24).stroke({ color, width: 3, alpha: 0.95 });
              const frame = moving && Math.floor(time / 130) % 2 === 1 ? tex.walk : tex.idle;
              const body = sprite(`courier-${player.id}`, frame);
              const bodyHeight = T * 1.18;
              body.height = bodyHeight;
              body.width = bodyHeight * (frame.width / frame.height) * flip;
              const bob = moving ? Math.abs(Math.sin(time / 65)) * T * 0.05 : 0;
              body.position.set(p.x, p.y - bob);
              actors.addChild(body);

              const carried = current?.items.find((it) => it.id === player.carrying);
              const headY = p.y - bob - bodyHeight * 0.86;
              if (carried?.kind === "lantern") {
                const g = pooledGraphics(`carry-${player.id}`);
                drawLantern(g, p.x, headY, T * 0.5, time);
                actors.addChild(g);
              } else if (carried?.kind === "piano") {
                const g = pooledGraphics(`carry-${player.id}`);
                drawPiano(g, p.x, headY, T * 0.9);
                actors.addChild(g);
              } else if (carried) {
                const t = carried.kind === "crate" ? tex.crate : tex.plank;
                const c = sprite(`carry-${player.id}`, t);
                c.width = T * (carried.kind === "crate" ? 0.66 : 0.9);
                c.height = c.width * (t.height / t.width);
                c.position.set(p.x, headY + T * 0.08);
                actors.addChild(c);
              }
              if (many) {
                const tag = label(`name-${player.id}`, display.name, Math.max(10, T * 0.14), 0xffffff, color);
                if (tag.text !== display.name) tag.text = display.name;
                tag.position.set(p.x, p.y - bodyHeight - (carried ? T * 0.55 : T * 0.08));
                actors.addChild(tag);
              }
            },
          });
        }

        const solo = (current?.players.length ?? 0) === 1;
        for (const player of current?.players ?? []) {
          const plan = player.action;
          if (!plan || player.state !== "normal") continue;
          const p = cam.project(plan.x, plan.y);
          const inset = T * 0.04;
          const arm = T * 0.22;
          const breathe = 0.6 + 0.4 * Math.sin(time / 160);
          const corners: Array<[number, number, number, number]> = [
            [p.x + inset, p.y + inset, 1, 1],
            [p.x + T - inset, p.y + inset, -1, 1],
            [p.x + inset, p.y + D - inset, 1, -1],
            [p.x + T - inset, p.y + D - inset, -1, -1],
          ];
          for (const [cx, cy, sx, sy] of corners) {
            ground.moveTo(cx + sx * arm, cy).lineTo(cx, cy).lineTo(cx, cy + sy * arm * (D / T));
          }
          ground.stroke({ color: 0xffffff, width: 3, alpha: breathe });
          if (solo) {
            const words = ACTION_WORDS[plan.verb];
            const tag = label(`prompt-${player.id}`, `Space · ${words}`, Math.max(11, T * 0.16), 0xffffff, 0x2a3f3a);
            if (tag.text !== `Space · ${words}`) tag.text = `Space · ${words}`;
            const me = cam.project(player.x / 1000, player.y / 1000);
            tag.position.set(me.x, me.y - T * (player.carrying ? 1.75 : 1.3));
            queue.push({ y: 1e6, draw: () => actors.addChild(tag) });
          }
        }

        queue.sort((a, b) => a.y - b.y);
        for (const actor of queue) actor.draw();

        if (!rendered) {
          rendered = true;
          setRenderReady(true);
        }
      };

      app.ticker.add(() => draw(performance.now()));
    }).catch(() => {
      destroy();
      if (!disposed) setRenderError(true);
    });

    return () => {
      disposed = true;
      destroy();
    };
  }, []);

  return (
    <div ref={host} className="playfield-canvas" data-ready={renderReady} role="group" aria-label="Town playfield">
      {renderError && <div className="playfield-error" role="status">The playfield could not be rendered in this browser.</div>}
    </div>
  );
}
