import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle, Texture } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import type { LevelDefinition, WorldSnapshot } from "../../rt/types.js";
import { createIsoCamera } from "./iso.js";

const COURIER_IDLE = "/assets/sprites/courier/pft-courier-parcels-00.png";
const COURIER_WALK = "/assets/sprites/courier/pft-courier-parcels-01.png";
const CRATE = "/assets/sprites/courier/pft-courier-parcels-04.png";
const PLANK = "/assets/sprites/courier/pft-courier-parcels-05.png";
const COLORS: Record<string, number> = {
  red: 0xe26955,
  blue: 0x547da4,
  gold: 0xe3ac4d,
  green: 0x67a27b,
};

export interface PlayerDisplay {
  name: string;
  color: string;
}

interface Props {
  level: LevelDefinition;
  world: WorldSnapshot | null;
  players: Record<string, PlayerDisplay>;
}

function diamond(graphics: Graphics, x: number, y: number, tw: number, th: number, color: number, alpha = 1): void {
  graphics
    .moveTo(x, y - th / 2)
    .lineTo(x + tw / 2, y)
    .lineTo(x, y + th / 2)
    .lineTo(x - tw / 2, y)
    .closePath()
    .fill({ color, alpha });
}

function polygon(graphics: Graphics, points: number[], color: number, alpha = 1): void {
  graphics.poly(points).fill({ color, alpha });
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
    let scene: Container | null = null;
    let lastDraw = 0;
    const lastPositions = new Map<string, string>();
    const destroy = (): void => {
      if (!initialized || destroyed) return;
      destroyed = true;
      app.destroy({ removeView: true }, { children: true });
    };

    void app.init({ resizeTo: element, background: "#b7d5cb", antialias: true, preserveDrawingBuffer: true }).then(async () => {
      initialized = true;
      if (disposed) {
        destroy();
        return;
      }
      element.appendChild(app.canvas);
      scene = new Container();
      app.stage.addChild(scene);
      const [idle, walking, crate, plank] = await Promise.all([
        Assets.load<Texture>(COURIER_IDLE),
        Assets.load<Texture>(COURIER_WALK),
        Assets.load<Texture>(CRATE),
        Assets.load<Texture>(PLANK),
      ]);
      if (disposed) return;

      const drawScene = (timestamp: number): void => {
        if (timestamp - lastDraw < 50 || !scene) return;
        lastDraw = timestamp;
        for (const child of scene.removeChildren()) child.destroy({ children: true });
        const { world: current, players: playerDisplays, level: currentLevel } = state.current;
        const width = element.clientWidth;
        const height = element.clientHeight;
        const camera = createIsoCamera(currentLevel.map[0]?.length ?? 1, currentLevel.map.length, width, height);
        const tw = camera.tileWidth;
        const th = camera.tileHeight;
        const elapsed = current?.tick ?? 0;
        const tiles = new Graphics();

        for (let y = 0; y < currentLevel.map.length; y += 1) {
          const row = currentLevel.map[y]!;
          for (let x = 0; x < row.length; x += 1) {
            const tile = row[x]!;
            const { x: sx, y: sy } = camera.project(x + 0.5, y + 0.5);
            if (tile === "~") {
              const wave = Math.sin(elapsed / 9 + x * 0.7 + y * 0.4) * 0.04;
              diamond(tiles, sx, sy, tw, th, wave > 0 ? 0x79b9c0 : 0x72b2ba, 1);
              diamond(tiles, sx, sy - th * 0.12, tw * 0.76, th * 0.55, 0xb5d8d0, 0.12);
              continue;
            }

            const zone = tile >= "a" && tile <= "z";
            const isExit = tile === "X";
            const topColor = zone ? 0xd7c892 : isExit ? 0xe2a86f : (x + y) % 3 === 0 ? 0x8eb489 : 0x9abd8e;
            const downTile = currentLevel.map[y + 1]?.[x];
            const depth = Math.max(5, th * 0.25);
            if (downTile === "~" || downTile === undefined) {
              const bottomX = sx;
              const bottomY = sy + th / 2;
              polygon(tiles, [
                bottomX - tw / 2, bottomY,
                bottomX, bottomY + th / 2,
                bottomX, bottomY + th / 2 + depth,
                bottomX - tw / 2, bottomY + depth,
              ], 0x526d68);
              polygon(tiles, [
                bottomX, bottomY + th / 2,
                bottomX + tw / 2, bottomY,
                bottomX + tw / 2, bottomY + depth,
                bottomX, bottomY + th / 2 + depth,
              ], 0x405e5b);
            }
            diamond(tiles, sx, sy, tw, th, topColor);

            if (zone || isExit) {
              const badge = new Graphics();
              diamond(badge, sx, sy - th * 0.08, tw * 0.62, th * 0.62, isExit ? 0xf4c58c : 0xf0dfaa, 0.38);
              badge.stroke({ color: isExit ? 0x9e603b : 0x9b8757, width: 1.5, alpha: 0.75 });
              scene.addChild(badge);
              if (zone) {
                const text = new Text({
                  text: currentLevel.recipients[tile] ?? tile.toUpperCase(),
                  style: new TextStyle({
                    fontFamily: "Georgia, serif",
                    fontSize: Math.max(8, 9 * Math.min(1.2, tw / 64)),
                    fill: 0x71634a,
                    fontWeight: "600",
                  }),
                });
                text.anchor.set(0.5);
                text.position.set(sx, sy - th * 0.02);
                scene.addChild(text);
              }
            }
            if (tile === "=" || tile === "-") {
              const deployed = current?.items.some((item) => item.state === "deployed" && item.x === x && item.y === y);
              if (deployed) {
                const board = new Graphics();
                diamond(board, sx, sy - th * 0.04, tw * 0.8, th * 0.64, 0x9a633c);
                board.stroke({ color: 0x62412f, width: 2 });
                board.moveTo(sx - tw * 0.2, sy).lineTo(sx + tw * 0.2, sy).stroke({ color: 0xc58b56, width: 1.2 });
                scene.addChild(board);
              } else {
                const outline = new Graphics();
                for (let segment = 0; segment < 8; segment += 1) {
                  const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
                  const from = angles[Math.floor(segment / 2)]! + (segment % 2) * Math.PI / 8;
                  const to = from + Math.PI / 8;
                  outline.moveTo(sx + Math.cos(from) * tw * 0.35, sy + Math.sin(from) * th * 0.35)
                    .lineTo(sx + Math.cos(to) * tw * 0.35, sy + Math.sin(to) * th * 0.35);
                }
                outline.stroke({ color: 0xe9e0bd, width: 1.5, alpha: 0.75 });
                scene.addChild(outline);
              }
            }
          }
        }
        scene.addChildAt(tiles, 0);

        if (current) {
          const actors = [
            ...current.items
              .filter((item) => item.state === "ground")
              .map((item) => ({ kind: "item" as const, item, depth: item.x + item.y + 0.34 })),
            ...current.players
              .map((player) => ({ kind: "player" as const, player, depth: (player.x + player.y) / 1000 })),
          ].sort((a, b) => a.depth - b.depth);

          for (const actor of actors) {
            if (actor.kind === "item") {
              const { item } = actor;
              const point = camera.project(item.x + 0.5, item.y + 0.34);
              if (item.kind === "lantern") {
                const icon = new Graphics();
                icon.circle(point.x, point.y - 13, 10).fill({ color: 0xf1c45f });
                icon.circle(point.x, point.y - 13, 15).fill({ color: 0xffe49d, alpha: 0.18 });
                scene.addChild(icon);
              } else {
                const sprite = new Sprite(item.kind === "crate" ? crate : plank);
                sprite.anchor.set(0.5, 1);
                sprite.width = item.kind === "crate" ? tw * 0.54 : tw * 0.62;
                sprite.height = item.kind === "crate" ? th * 1.12 : th * 0.58;
                sprite.position.set(point.x, point.y);
                scene.addChild(sprite);
              }
              continue;
            }

            const player = actor.player;
            const wx = player.x / 1000;
            const wy = player.y / 1000;
            const point = camera.project(wx, wy);
            const display = playerDisplays[player.id] ?? { name: "Courier", color: "red" };
            const color = COLORS[display.color] ?? COLORS.red!;
            const previous = lastPositions.get(player.id);
            const positionKey = `${player.x}:${player.y}`;
            const moving = previous !== undefined && previous !== positionKey;
            lastPositions.set(player.id, positionKey);
            const shadow = new Graphics();
            shadow.ellipse(point.x, point.y + th * 0.1, tw * 0.23, th * 0.16).fill({ color, alpha: 0.7 });
            scene.addChild(shadow);

            if (player.state === "splash") {
              const splash = new Graphics();
              splash.circle(point.x, point.y - th * 0.28, tw * 0.14).fill({ color: 0xd5f0e7, alpha: 0.7 });
              scene.addChild(splash);
            } else {
              const courier = new Sprite(moving ? walking : idle);
              courier.anchor.set(0.5, 1);
              courier.width = tw * 0.68;
              courier.height = th * 1.72;
              courier.position.set(point.x, point.y + Math.sin(elapsed / 4 + point.x) * 1.2);
              scene.addChild(courier);

              if (player.carrying) {
                const carried = current.items.find((item) => item.id === player.carrying);
                if (carried?.kind === "lantern") {
                  const light = new Graphics();
                  light.circle(point.x, point.y - th * 1.55, 7).fill({ color: 0xffd576 });
                  scene.addChild(light);
                } else if (carried) {
                  const carrySprite = new Sprite(carried.kind === "crate" ? crate : plank);
                  carrySprite.anchor.set(0.5, 1);
                  carrySprite.width = tw * 0.42;
                  carrySprite.height = th * 0.68;
                  carrySprite.position.set(point.x, point.y - th * 1.15);
                  scene.addChild(carrySprite);
                }
              }
            }

            const name = new Text({
              text: display.name,
              style: new TextStyle({
                fontFamily: "Arial, sans-serif",
                fontSize: 10,
                fill: 0xffffff,
                stroke: { color: 0x40564e, width: 3 },
                fontWeight: "700",
              }),
            });
            name.anchor.set(0.5, 1);
            name.position.set(point.x, point.y - th * 1.7);
            scene.addChild(name);
          }
        }
        if (!rendered) {
          rendered = true;
          setRenderReady(true);
        }
      };

      app.ticker.add((ticker) => drawScene(ticker.lastTime));
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
    <div ref={host} className="playfield-canvas" data-ready={renderReady} role="group" aria-label="Isometric town playfield">
      {renderError && <div className="playfield-error" role="status">The playfield could not be rendered in this browser.</div>}
    </div>
  );
}
