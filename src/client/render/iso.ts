export interface Point2D {
  x: number;
  y: number;
}

export interface IsoCamera {
  tileWidth: number;
  tileHeight: number;
  offsetX: number;
  offsetY: number;
  project: (x: number, y: number) => Point2D;
}

export function createIsoCamera(
  width: number,
  height: number,
  viewWidth: number,
  viewHeight: number,
): IsoCamera {
  const margin = 96;
  const scale = Math.max(0.45, Math.min(
    (viewWidth - margin * 2) / (width + height) / 64,
    (viewHeight - margin * 2) / (width + height) / 32,
    1.35,
  ));
  const tileWidth = 64 * scale;
  const tileHeight = 32 * scale;
  const project = (x: number, y: number): Point2D => ({
    x: (x - y) * tileWidth / 2,
    y: (x + y) * tileHeight / 2,
  });
  const left = project(0, height);
  const right = project(width, 0);
  const top = project(0, 0);
  const bottom = project(width, height);
  const minX = Math.min(left.x, right.x);
  const maxX = Math.max(left.x, right.x);
  const minY = Math.min(top.y, right.y);
  const maxY = Math.max(bottom.y, left.y);
  const offsetX = viewWidth / 2 - (minX + maxX) / 2;
  const offsetY = viewHeight / 2 - (minY + maxY) / 2;

  return {
    tileWidth,
    tileHeight,
    offsetX,
    offsetY,
    project: (x, y) => {
      const point = project(x, y);
      return { x: point.x + offsetX, y: point.y + offsetY };
    },
  };
}

export function screenToWorld(screenX: number, screenY: number): Point2D {
  const dx = screenX / 2 + screenY;
  const dy = screenY - screenX / 2;
  const magnitude = Math.max(Math.abs(dx), Math.abs(dy), 1);
  return { x: Math.round(dx / magnitude * 100), y: Math.round(dy / magnitude * 100) };
}
