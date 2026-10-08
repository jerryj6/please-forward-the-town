export interface Point2D {
  x: number;
  y: number;
}

/** Axis-aligned 3/4 diorama camera: world x → screen x, world y → screen y (squashed). */
export interface DioramaCamera {
  tile: number;
  depth: number;
  face: number;
  project: (wx: number, wy: number) => Point2D;
}

const DEPTH_RATIO = 0.64;
const FACE_RATIO = 0.42;

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function landBounds(map: readonly string[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  map.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      if (tile === "~") return;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: (map[0]?.length ?? 1) - 1, maxY: map.length - 1 };
  return { minX, minY, maxX, maxY };
}

export function createDioramaCamera(
  map: readonly string[],
  viewWidth: number,
  viewHeight: number,
  insets = { top: 104, bottom: 72, side: 32 },
): DioramaCamera {
  const bounds = landBounds(map);
  const cols = bounds.maxX - bounds.minX + 1 + 1.2;
  const rows = bounds.maxY - bounds.minY + 1 + 1.2;
  const availableW = Math.max(200, viewWidth - insets.side * 2);
  const availableH = Math.max(160, viewHeight - insets.top - insets.bottom);
  const tile = Math.max(24, Math.min(availableW / cols, availableH / (rows * DEPTH_RATIO + FACE_RATIO), 132));
  const depth = tile * DEPTH_RATIO;
  const face = tile * FACE_RATIO;
  const centerX = (bounds.minX + bounds.maxX + 1) / 2;
  const centerY = (bounds.minY + bounds.maxY + 1) / 2;
  const screenCenterX = viewWidth / 2;
  const screenCenterY = insets.top + availableH / 2 - face / 2;
  return {
    tile,
    depth,
    face,
    project: (wx, wy) => ({
      x: screenCenterX + (wx - centerX) * tile,
      y: screenCenterY + (wy - centerY) * depth,
    }),
  };
}

/** Screen-space stick/keys map directly onto world axes in the diorama view. */
export function screenToWorld(screenX: number, screenY: number): Point2D {
  const magnitude = Math.max(Math.abs(screenX), Math.abs(screenY), 1);
  return { x: Math.round(screenX / magnitude * 100), y: Math.round(screenY / magnitude * 100) };
}
