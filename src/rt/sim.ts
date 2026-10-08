import type {
  Facing,
  Input,
  Item,
  ItemKind,
  LevelDefinition,
  Player,
  Point,
  SimEvent,
  World,
} from "./types.js";

export const TICKS_PER_SECOND = 20;
export const TILE = 1000;
export const PLAYER_SPEED = 200;
const ACTION_REACH = 600;

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

function isSocket(world: World, x: number, y: number): boolean {
  const tile = charAt(world, x, y);
  return tile === "=" || tile === "-";
}

function isWalkable(world: World, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return false;
  const tile = charAt(world, x, y);
  if (tile === "=" || tile === "-") return world.sockets.has(key(x, y));
  return tile !== "~" && tile !== undefined;
}

function isGround(world: World, x: number, y: number): boolean {
  const tile = charAt(world, x, y);
  return tile !== undefined && tile !== "~" && tile !== "=" && tile !== "-";
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
    const tile = tileAt(player.pos);
    if (isWalkable(world, tile.x, tile.y)) continue;
    restoreItem(world, player);
    player.state = "splash";
    player.splashTicks = 40;
    events.push({ type: "splash", playerId: player.id });
  }
}

function deliverAtZone(world: World, player: Player, tile: Point, events: SimEvent[]): boolean {
  const zone = charAt(world, tile.x, tile.y);
  if (!zone || zone < "a" || zone > "z" || !player.carrying) return false;
  const item = world.items.get(player.carrying);
  if (!item) return false;
  const order = world.orders.find((candidate) =>
    !candidate.fulfilled && candidate.itemKind === item.kind && candidate.zone === zone,
  );
  if (!order) return false;
  item.state = "delivered";
  order.fulfilled = true;
  player.carrying = null;
  events.push({ type: "deliver", playerId: player.id, itemId: item.id, orderId: order.id, label: order.label });
  return true;
}

function doAction(world: World, player: Player, events: SimEvent[]): void {
  const forward = facingVector(player.facing);
  const target = {
    x: Math.floor((player.pos.x + forward.x * ACTION_REACH) / TILE),
    y: Math.floor((player.pos.y + forward.y * ACTION_REACH) / TILE),
  };
  const underfoot = tileAt(player.pos);

  if (player.carrying) {
    const carried = world.items.get(player.carrying);
    if (!carried) {
      player.carrying = null;
      return;
    }
    if (carried.kind === "plank" && isSocket(world, target.x, target.y) && !world.sockets.has(key(target.x, target.y))) {
      carried.state = "deployed";
      carried.pos = target;
      world.sockets.set(key(target.x, target.y), carried.id);
      player.carrying = null;
      events.push({ type: "deploy", playerId: player.id, itemId: carried.id, x: target.x, y: target.y });
      return;
    }
    if (deliverAtZone(world, player, underfoot, events)) return;
    if (
      isGround(world, target.x, target.y) &&
      !findItemAt(world, target.x, target.y, "ground")
    ) {
      carried.state = "ground";
      carried.pos = target;
      player.carrying = null;
      return;
    }
    return;
  }

  const groundItem = findItemAt(world, target.x, target.y, "ground")
    ?? findItemAt(world, underfoot.x, underfoot.y, "ground");
  if (groundItem) {
    groundItem.state = "carried";
    player.carrying = groundItem.id;
    events.push({ type: "pickup", playerId: player.id, itemId: groundItem.id, itemKind: groundItem.kind });
    return;
  }

  const deployedId = world.sockets.get(key(target.x, target.y));
  const deployed = deployedId ? world.items.get(deployedId) : undefined;
  if (
    deployed &&
    deployed.kind === "plank" &&
    deployed.state === "deployed" &&
    (underfoot.x !== target.x || underfoot.y !== target.y)
  ) {
    world.sockets.delete(key(target.x, target.y));
    deployed.state = "carried";
    player.carrying = deployed.id;
    events.push({ type: "pickup", playerId: player.id, itemId: deployed.id, itemKind: deployed.kind });
  }
}

export function createWorld(level: LevelDefinition, playerIds: string[]): World {
  const height = level.map.length;
  const width = Math.max(...level.map.map((row) => row.length));
  if (level.map.some((row) => row.length !== width)) throw new Error(`Level ${level.id} has uneven map rows`);
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
    phase: "playing",
    stars: 0,
    players,
    items,
    orders: level.orders.map((order, index) => ({ ...order, id: `${level.id}-order-${index + 1}`, fulfilled: false })),
    spawns,
    sockets,
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
  for (const player of [...world.players.values()].sort((a, b) => a.id.localeCompare(b.id))) {
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
      const moveX = Math.trunc((dx * PLAYER_SPEED) / length);
      const moveY = Math.trunc((dy * PLAYER_SPEED) / length);
      const nextX = player.pos.x + moveX;
      if (isWalkable(world, Math.floor(nextX / TILE), Math.floor(player.pos.y / TILE))) player.pos.x = nextX;
      const nextY = player.pos.y + moveY;
      if (isWalkable(world, Math.floor(player.pos.x / TILE), Math.floor(nextY / TILE))) player.pos.y = nextY;
    }
    if (input.action) doAction(world, player, events);
  }

  checkSplash(world, events);
  world.timeRemainingTicks -= 1;
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

export function snapshot(world: World) {
  return {
    levelId: world.level.id,
    tick: world.tick,
    timeRemainingTicks: world.timeRemainingTicks,
    phase: world.phase,
    stars: world.stars,
    players: [...world.players.values()].map((player) => ({
      id: player.id,
      x: player.pos.x,
      y: player.pos.y,
      facing: player.facing,
      carrying: player.carrying,
      state: player.state,
      splashTicks: player.splashTicks,
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
