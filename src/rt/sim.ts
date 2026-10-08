import type {
  ActionPlan,
  FerryDefinition,
  FerryState,
  Facing,
  Input,
  Item,
  ItemKind,
  LevelDefinition,
  Player,
  Point,
  SimEvent,
  World,
  WorldSnapshot,
} from "./types.js";

export const TICKS_PER_SECOND = 20;
export const TILE = 1000;
export const PLAYER_SPEED = 200;
const ACTION_REACH = 600;
const CORNER_CORRECTION = 60;

function key(x: number, y: number): string {
  return `${x},${y}`;
}

function integerSqrt(value: number): number {
  if (value < 2) return value;
  let x = value;
  let y = Math.floor((x + 1) / 2);
  while (y < x) {
    x = y;
    y = Math.floor((x + Math.floor(value / x)) / 2);
  }
  return x * x === value ? x : x + 1;
}

function facingFor(dx: number, dy: number, previous: Facing): Facing {
  if (dx === 0 && dy === 0) return previous;
  const x = Math.sign(dx);
  const y = Math.sign(dy);
  if (x === 0) return y < 0 ? "n" : "s";
  if (y === 0) return x < 0 ? "w" : "e";
  if (x > 0) return y < 0 ? "ne" : "se";
  return y < 0 ? "nw" : "sw";
}

function facingVector(facing: Facing): Point {
  switch (facing) {
    case "n": return { x: 0, y: -1 };
    case "ne": return { x: 1, y: -1 };
    case "e": return { x: 1, y: 0 };
    case "se": return { x: 1, y: 1 };
    case "s": return { x: 0, y: 1 };
    case "sw": return { x: -1, y: 1 };
    case "w": return { x: -1, y: 0 };
    case "nw": return { x: -1, y: -1 };
  }
}

function tileAt(pos: Point): Point {
  return { x: Math.floor(pos.x / TILE), y: Math.floor(pos.y / TILE) };
}

function charAt(world: World, x: number, y: number): string | undefined {
  return world.level.map[y]?.[x];
}

function isPianoCarrier(world: World, player: Player): boolean {
  return player.carrying !== null && world.items.get(player.carrying)?.kind === "piano";
}

function isFerryAt(world: World, pos: Point): FerryState | undefined {
  return world.ferries.find((ferry) =>
    pos.x >= ferry.x - TILE / 2 &&
    pos.x < ferry.x + TILE / 2 &&
    pos.y >= ferry.y - TILE / 2 &&
    pos.y < ferry.y + TILE / 2,
  );
}

function isSocket(world: World, x: number, y: number): boolean {
  const tile = charAt(world, x, y);
  return tile === "=" || tile === "-";
}

function isWalkable(world: World, x: number, y: number, carryingPiano = false): boolean {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return false;
  const tile = charAt(world, x, y);
  if (carryingPiano && (tile === "," || tile === ";")) return false;
  if (tile === "#") return false;
  if (tile === "=" || tile === "-") return world.sockets.has(key(x, y));
  if (tile === ",") return !world.sandbarFlooded;
  if (tile === ";") return !world.shoalFlooded;
  return tile !== "~" && tile !== undefined;
}

function isPositionWalkable(world: World, pos: Point, carryingPiano = false): boolean {
  if (!carryingPiano && isFerryAt(world, pos)) return true;
  const tile = tileAt(pos);
  return isWalkable(world, tile.x, tile.y, carryingPiano);
}

function isGround(world: World, x: number, y: number): boolean {
  const tile = charAt(world, x, y);
  return tile !== undefined && tile !== "~" && tile !== "#" && tile !== "=" && tile !== "-" && tile !== "," && tile !== ";";
}

function isBodyWalkable(world: World, pos: Point, carryingPiano = false): boolean {
  const radius = 250;
  return [
    { x: pos.x - radius, y: pos.y - radius },
    { x: pos.x + radius, y: pos.y - radius },
    { x: pos.x - radius, y: pos.y + radius },
    { x: pos.x + radius, y: pos.y + radius },
  ].every((corner) => isPositionWalkable(world, corner, carryingPiano));
}

function moveAxisWithCornerCorrection(
  world: World,
  player: Player,
  axis: "x" | "y",
  delta: number,
  carryingPiano: boolean,
): void {
  if (delta === 0) return;
  const perpendicular = axis === "x" ? "y" : "x";
  const target = { ...player.pos, [axis]: player.pos[axis] + delta };
  if (isBodyWalkable(world, target, carryingPiano)) {
    player.pos[axis] = target[axis];
    return;
  }
  if (!isPositionWalkable(world, target, carryingPiano)) return;

  const laneCenter = Math.floor(player.pos[perpendicular] / TILE) * TILE + TILE / 2;
  const correction = Math.sign(laneCenter - player.pos[perpendicular]) *
    Math.min(CORNER_CORRECTION, Math.abs(laneCenter - player.pos[perpendicular]));
  if (correction === 0) return;

  const corrected = { ...player.pos, [perpendicular]: player.pos[perpendicular] + correction };
  if (!isBodyWalkable(world, corrected, carryingPiano)) return;
  player.pos[perpendicular] = corrected[perpendicular];

  const correctedTarget = { ...player.pos, [axis]: target[axis] };
  if (isBodyWalkable(world, correctedTarget, carryingPiano)) player.pos[axis] = correctedTarget[axis];
}

function findItemAt(world: World, x: number, y: number, state: Item["state"]): Item | undefined {
  return [...world.items.values()].find((item) => item.state === state && item.pos.x === x && item.pos.y === y);
}

function restoreItem(world: World, player: Player): void {
  if (!player.carrying) return;
  const item = world.items.get(player.carrying);
  if (item) {
    item.pos = { ...item.spawn };
    item.state = item.initialState;
    if (item.initialState === "deployed") world.sockets.set(key(item.spawn.x, item.spawn.y), item.id);
  }
  player.carrying = null;
}

function checkSplash(world: World, events: SimEvent[]): void {
  for (const player of world.players.values()) {
    if (player.state !== "normal") continue;
    if (isPositionWalkable(world, player.pos, isPianoCarrier(world, player))) continue;
    restoreItem(world, player);
    player.state = "splash";
    player.splashTicks = 40;
    events.push({ type: "splash", playerId: player.id });
  }
}

function ferrySpeed(definition: FerryDefinition): number {
  return Math.max(1, Math.round((definition.speedTilesPerSec * TILE) / TICKS_PER_SECOND));
}

function ferryCenter(point: Point): Point {
  return { x: point.x * TILE + TILE / 2, y: point.y * TILE + TILE / 2 };
}

function ferryDwellTicks(definition: FerryDefinition): number {
  return Math.max(0, Math.round(definition.dwellSec * TICKS_PER_SECOND));
}

function advanceFerry(world: World, ferry: FerryState): void {
  const definition = world.level.ferries?.find((candidate) => candidate.id === ferry.id);
  if (!definition) return;
  if (ferry.dwellTicks > 0) {
    ferry.dwellTicks -= 1;
    return;
  }
  const nextIndex = ferry.pathIndex + ferry.direction;
  const destination = definition.path[nextIndex];
  if (!destination) return;
  const target = ferryCenter(destination);
  const dx = target.x - ferry.x;
  const dy = target.y - ferry.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  const speed = ferrySpeed(definition);
  if (distance <= speed) {
    ferry.x = target.x;
    ferry.y = target.y;
    ferry.pathIndex = nextIndex;
    if (nextIndex === 0 || nextIndex === definition.path.length - 1) {
      ferry.direction = ferry.direction === 1 ? -1 : 1;
      ferry.dwellTicks = ferryDwellTicks(definition);
    }
    return;
  }
  ferry.x += Math.sign(dx) * Math.min(Math.abs(dx), speed);
  ferry.y += Math.sign(dy) * Math.min(Math.abs(dy), speed);
}

function deliveryOrder(world: World, item: Item, tile: Point) {
  const zone = charAt(world, tile.x, tile.y);
  if (!zone || zone < "a" || zone > "z") return undefined;
  return world.orders.find((candidate) =>
    !candidate.fulfilled && candidate.itemKind === item.kind && candidate.zone === zone,
  );
}

function actionCandidates(player: Player): Point[] {
  const forward = facingVector(player.facing);
  const underfoot = tileAt(player.pos);
  const facingTile = {
    x: Math.floor((player.pos.x + forward.x * ACTION_REACH) / TILE),
    y: Math.floor((player.pos.y + forward.y * ACTION_REACH) / TILE),
  };
  const orthogonal = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ]
    .map((offset, index) => ({
      point: { x: underfoot.x + offset.x, y: underfoot.y + offset.y },
      order: index,
      dot: offset.x * forward.x + offset.y * forward.y,
    }))
    .sort((a, b) => b.dot - a.dot || a.order - b.order);
  const diagonal = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
  ]
    .map((offset, index) => ({
      point: { x: underfoot.x + offset.x, y: underfoot.y + offset.y },
      order: index,
      dot: offset.x * forward.x + offset.y * forward.y,
    }))
    .sort((a, b) => b.dot - a.dot || a.order - b.order);
  const candidates = [
    facingTile,
    underfoot,
    ...orthogonal.map(({ point }) => point),
    ...diagonal.map(({ point }) => point),
  ];
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const candidateKey = key(candidate.x, candidate.y);
    if (seen.has(candidateKey)) return false;
    seen.add(candidateKey);
    return true;
  });
}

export function planAction(world: World, player: Player): ActionPlan | null {
  const underfoot = tileAt(player.pos);
  const candidates = actionCandidates(player);
  const carried = player.carrying ? world.items.get(player.carrying) : undefined;
  if (player.carrying && !carried) return null;

  if (carried) {
    for (const target of candidates) {
      if (
        carried.kind === "plank" &&
        isSocket(world, target.x, target.y) &&
        !world.sockets.has(key(target.x, target.y))
      ) {
        return { verb: "deploy", x: target.x, y: target.y, itemId: carried.id };
      }
      if (deliveryOrder(world, carried, target)) {
        return { verb: "deliver", x: target.x, y: target.y, itemId: carried.id };
      }
    }
    for (const target of candidates) {
      if (
        isGround(world, target.x, target.y) &&
        !findItemAt(world, target.x, target.y, "ground")
      ) {
        return { verb: "drop", x: target.x, y: target.y, itemId: carried.id };
      }
    }
    return null;
  }

  for (const target of candidates) {
    const groundItem = findItemAt(world, target.x, target.y, "ground");
    if (!groundItem) continue;
    return { verb: "pickup", x: target.x, y: target.y, itemId: groundItem.id };
  }

  for (const target of candidates) {
    if (underfoot.x === target.x && underfoot.y === target.y) continue;
    const deployedId = world.sockets.get(key(target.x, target.y));
    const deployed = deployedId ? world.items.get(deployedId) : undefined;
    if (!deployed || deployed.kind !== "plank" || deployed.state !== "deployed") continue;
    return { verb: "lift", x: target.x, y: target.y, itemId: deployed.id };
  }
  return null;
}

function applyAction(world: World, player: Player, plan: ActionPlan, events: SimEvent[]): void {
  const item = world.items.get(plan.itemId);
  if (!item) return;

  if (plan.verb === "deploy") {
    item.state = "deployed";
    item.pos = { x: plan.x, y: plan.y };
    world.sockets.set(key(plan.x, plan.y), item.id);
    player.carrying = null;
    events.push({ type: "deploy", playerId: player.id, itemId: item.id, x: plan.x, y: plan.y });
    return;
  }

  if (plan.verb === "deliver") {
    const order = deliveryOrder(world, item, { x: plan.x, y: plan.y });
    if (!order) return;
    item.state = "delivered";
    order.fulfilled = true;
    player.carrying = null;
    events.push({ type: "deliver", playerId: player.id, itemId: item.id, orderId: order.id, label: order.label });
    return;
  }

  if (plan.verb === "drop") {
    item.state = "ground";
    item.pos = { x: plan.x, y: plan.y };
    player.carrying = null;
    return;
  }

  if (plan.verb === "pickup") {
    item.state = "carried";
    player.carrying = item.id;
    events.push({ type: "pickup", playerId: player.id, itemId: item.id, itemKind: item.kind });
    return;
  }

  world.sockets.delete(key(plan.x, plan.y));
  item.state = "carried";
  player.carrying = item.id;
  events.push({ type: "pickup", playerId: player.id, itemId: item.id, itemKind: item.kind });
}

function doAction(world: World, player: Player, events: SimEvent[]): void {
  if (player.carrying && !world.items.has(player.carrying)) {
    player.carrying = null;
    return;
  }
  const plan = planAction(world, player);
  if (plan) applyAction(world, player, plan, events);
}

export function createWorld(level: LevelDefinition, playerIds: string[]): World {
  const height = level.map.length;
  const width = Math.max(...level.map.map((row) => row.length));
  if (level.map.some((row) => row.length !== width)) throw new Error(`Level ${level.id} has uneven map rows`);
  const ferryIds = new Set<string>();
  for (const ferry of level.ferries ?? []) {
    if (!ferry.id || ferryIds.has(ferry.id)) throw new Error(`Level ${level.id} has an invalid ferry id`);
    ferryIds.add(ferry.id);
    if (ferry.path.length < 2 || !Number.isFinite(ferry.speedTilesPerSec) || ferry.speedTilesPerSec <= 0 || ferry.speedTilesPerSec > TICKS_PER_SECOND) {
      throw new Error(`Level ${level.id} has an invalid ferry path or speed`);
    }
    if (!Number.isFinite(ferry.dwellSec) || ferry.dwellSec < 0) throw new Error(`Level ${level.id} has an invalid ferry dwell`);
    ferry.path.forEach((point, index) => {
      if (!Number.isInteger(point.x) || !Number.isInteger(point.y) || level.map[point.y]?.[point.x] !== "~") {
        throw new Error(`Ferry ${ferry.id} path must use water tiles`);
      }
      const previous = ferry.path[index - 1];
      if (previous && Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y) !== 1) {
        throw new Error(`Ferry ${ferry.id} path must be orthogonally contiguous`);
      }
    });
  }
  const spawns: Point[] = [];
  const items = new Map<string, Item>();
  const sockets = new Map<string, string>();
  let itemSequence = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = level.map[y]![x]!;
      if (tile === "S") spawns.push({ x, y });
      const kind: ItemKind | undefined =
        tile === "L" ? "lantern" :
        tile === "C" ? "crate" :
        tile === "K" ? "piano" :
        tile === "P" || tile === "=" ? "plank" :
        undefined;
      if (!kind) continue;
      const id = `${level.id}-${kind}-${++itemSequence}`;
      const deployed = tile === "=";
      const item: Item = {
        id,
        kind,
        state: deployed ? "deployed" : "ground",
        pos: { x, y },
        spawn: { x, y },
        initialState: deployed ? "deployed" : "ground",
      };
      items.set(id, item);
      if (deployed) sockets.set(key(x, y), id);
    }
  }
  if (spawns.length === 0) throw new Error(`Level ${level.id} has no spawn`);

  const players = new Map<string, Player>();
  playerIds.forEach((id, index) => {
    const spawn = spawns[index % spawns.length]!;
    players.set(id, {
      id,
      pos: { x: spawn.x * TILE + TILE / 2, y: spawn.y * TILE + TILE / 2 },
      facing: "e",
      carrying: null,
      state: "normal",
      splashTicks: 0,
      spawn: { ...spawn },
    });
  });

  return {
    level,
    width,
    height,
    tick: 0,
    timeRemainingTicks: level.timeLimitSec * TICKS_PER_SECOND,
    sandbarFlooded: false,
    shoalFlooded: false,
    phase: "playing",
    stars: 0,
    players,
    items,
    orders: level.orders.map((order, index) => ({ ...order, id: `${level.id}-order-${index + 1}`, fulfilled: false })),
    spawns,
    sockets,
    ferries: (level.ferries ?? []).map((definition) => ({
      id: definition.id,
      ...ferryCenter(definition.path[0]!),
      pathIndex: 0,
      direction: 1,
      dwellTicks: ferryDwellTicks(definition),
    })),
  };
}

export function withSoloTimeBonus(level: LevelDefinition): LevelDefinition {
  return {
    ...level,
    timeLimitSec: level.timeLimitSec * 1.25,
    ...(level.sandbarFloodsAtSec === undefined ? {} : { sandbarFloodsAtSec: level.sandbarFloodsAtSec * 1.25 }),
    ...(level.shoalFloodsAtSec === undefined ? {} : { shoalFloodsAtSec: level.shoalFloodsAtSec * 1.25 }),
  };
}

export function addPlayer(world: World, playerId: string): Player {
  const existing = world.players.get(playerId);
  if (existing) return existing;
  const spawn = world.spawns[world.players.size % world.spawns.length]!;
  const player: Player = {
    id: playerId,
    pos: { x: spawn.x * TILE + TILE / 2, y: spawn.y * TILE + TILE / 2 },
    facing: "e",
    carrying: null,
    state: "normal",
    splashTicks: 0,
    spawn: { ...spawn },
  };
  world.players.set(playerId, player);
  return player;
}

export function removePlayer(world: World, playerId: string): void {
  const player = world.players.get(playerId);
  if (!player) return;
  restoreItem(world, player);
  world.players.delete(playerId);
}

export function step(world: World, inputs: Map<string, Input>): SimEvent[] {
  if (world.phase !== "playing") return [];
  const events: SimEvent[] = [];
  world.tick += 1;
  const ferryOrigins = new Map(world.ferries.map((ferry) => [ferry.id, { x: ferry.x, y: ferry.y }]));
  const riders = new Map<string, string>();
  for (const player of world.players.values()) {
    if (player.state === "normal" && !isPianoCarrier(world, player)) {
      const ferry = world.ferries.find((candidate) => {
        const origin = ferryOrigins.get(candidate.id)!;
        return player.pos.x >= origin.x - TILE / 2 &&
          player.pos.x < origin.x + TILE / 2 &&
          player.pos.y >= origin.y - TILE / 2 &&
          player.pos.y < origin.y + TILE / 2;
      });
      if (ferry) riders.set(player.id, ferry.id);
    }
  }
  for (const ferry of world.ferries) advanceFerry(world, ferry);

  const playersAtStart = [...world.players.values()].sort((a, b) => a.id.localeCompare(b.id));
  for (const player of playersAtStart) {
    const ferryId = riders.get(player.id);
    const ferry = ferryId ? world.ferries.find((candidate) => candidate.id === ferryId) : undefined;
    const ferryOrigin = ferryId ? ferryOrigins.get(ferryId) : undefined;
    if (ferry && ferryOrigin) {
      player.pos.x += ferry.x - ferryOrigin.x;
      player.pos.y += ferry.y - ferryOrigin.y;
    }
  }
  const positionsAtStart = new Map(playersAtStart.map((player) => [player.id, { ...player.pos }]));
  for (const player of playersAtStart) {
    if (player.state === "splash") {
      player.splashTicks -= 1;
      if (player.splashTicks <= 0) {
        player.pos = { x: player.spawn.x * TILE + TILE / 2, y: player.spawn.y * TILE + TILE / 2 };
        player.state = "normal";
        player.splashTicks = 0;
        events.push({ type: "respawn", playerId: player.id });
      }
      continue;
    }

    const input = inputs.get(player.id) ?? { dx: 0, dy: 0, action: false };
    const dx = Math.max(-100, Math.min(100, Math.trunc(input.dx)));
    const dy = Math.max(-100, Math.min(100, Math.trunc(input.dy)));
    player.facing = facingFor(dx, dy, player.facing);
    const length = integerSqrt(dx * dx + dy * dy);
    if (length > 0) {
      const piano = isPianoCarrier(world, player);
      const playerPosition = positionsAtStart.get(player.id)!;
      const teamLift = piano && playersAtStart.some((other) =>
        other.id !== player.id &&
        other.state === "normal" &&
        other.carrying === null &&
        (positionsAtStart.get(other.id)!.x - playerPosition.x) ** 2 +
          (positionsAtStart.get(other.id)!.y - playerPosition.y) ** 2 <= 1500 ** 2,
      );
      const speed = piano ? Math.trunc(PLAYER_SPEED * (teamLift ? 0.85 : 0.5)) : PLAYER_SPEED;
      const moveX = Math.trunc((dx * speed) / length);
      const moveY = Math.trunc((dy * speed) / length);
      moveAxisWithCornerCorrection(world, player, "x", moveX, piano);
      moveAxisWithCornerCorrection(world, player, "y", moveY, piano);
    }
    if (input.action) doAction(world, player, events);
  }

  world.timeRemainingTicks -= 1;
  if (
    !world.sandbarFlooded &&
    world.level.sandbarFloodsAtSec !== undefined &&
    world.timeRemainingTicks <= world.level.sandbarFloodsAtSec * TICKS_PER_SECOND
  ) {
    world.sandbarFlooded = true;
    events.push({ type: "flood", tier: "sandbar" });
  }
  if (
    !world.shoalFlooded &&
    world.level.shoalFloodsAtSec !== undefined &&
    world.timeRemainingTicks <= world.level.shoalFloodsAtSec * TICKS_PER_SECOND
  ) {
    world.shoalFlooded = true;
    events.push({ type: "flood", tier: "shoal" });
  }
  checkSplash(world, events);
  if (world.players.size > 0 && world.orders.every((order) => order.fulfilled) && [...world.players.values()].every((player) => {
    const tile = tileAt(player.pos);
    return charAt(world, tile.x, tile.y) === "X";
  })) {
    world.phase = "completed";
    const remainingSec = Math.floor(world.timeRemainingTicks / TICKS_PER_SECOND);
    world.stars = remainingSec >= world.level.stars.three ? 3 : remainingSec >= world.level.stars.two ? 2 : 1;
    events.push({ type: "complete", stars: world.stars });
  } else if (world.timeRemainingTicks <= 0) {
    world.timeRemainingTicks = 0;
    world.phase = "failed";
    events.push({ type: "failed", message: "The tide's in" });
  }
  return events;
}

export function snapshot(world: World): WorldSnapshot {
  return {
    levelId: world.level.id,
    tick: world.tick,
    timeRemainingTicks: world.timeRemainingTicks,
    sandbarFlooded: world.sandbarFlooded,
    shoalFlooded: world.shoalFlooded,
    phase: world.phase,
    stars: world.stars,
    ferries: world.ferries.map(({ id, x, y }) => ({ id, x, y })),
    players: [...world.players.values()].map((player) => ({
      id: player.id,
      x: player.pos.x,
      y: player.pos.y,
      facing: player.facing,
      carrying: player.carrying,
      state: player.state,
      splashTicks: player.splashTicks,
      action: player.state === "normal" ? planAction(world, player) : null,
    })),
    items: [...world.items.values()].map((item) => ({
      id: item.id,
      kind: item.kind,
      state: item.state,
      x: item.pos.x,
      y: item.pos.y,
    })),
    orders: world.orders.map((order) => ({ ...order })),
  };
}
