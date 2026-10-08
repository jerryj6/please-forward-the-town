import { describe, expect, it } from "vitest";
import { LEVELS } from "../../src/rt/levels/index.js";
import { addPlayer, createWorld, removePlayer, snapshot, step } from "../../src/rt/sim.js";
import type { Input, LevelDefinition, World } from "../../src/rt/types.js";

type Tile = [number, number];
type Bot = [string, () => World];

function input(dx = 0, dy = 0, action = false): Input {
  return { dx, dy, action };
}

function moveTo(world: World, playerId: string, targetX: number, targetY: number): void {
  const player = world.players.get(playerId)!;
  const targetWorldX = targetX * 1000 + 500;
  const targetWorldY = targetY * 1000 + 500;
  let budget = 5000;
  while (
    (player.pos.x !== targetWorldX || player.pos.y !== targetWorldY) &&
    budget > 0 &&
    world.phase === "playing"
  ) {
    const dx = player.pos.x === targetWorldX ? 0 : Math.sign(targetWorldX - player.pos.x) * 100;
    const dy = dx === 0 && player.pos.y !== targetWorldY
      ? Math.sign(targetWorldY - player.pos.y) * 100
      : 0;
    const before = { ...player.pos };
    step(world, new Map([[playerId, input(dx, dy)]]));
    if (player.pos.x === before.x && player.pos.y === before.y && world.phase === "playing") {
      throw new Error(`Could not walk ${playerId} to ${targetX},${targetY}`);
    }
    budget -= 1;
  }
  if (budget === 0 && world.phase === "playing") {
    throw new Error(`Could not walk ${playerId} to ${targetX},${targetY}`);
  }
}

function moveThrough(world: World, playerId: string, ...waypoints: Tile[]): void {
  for (const [x, y] of waypoints) moveTo(world, playerId, x, y);
}

function press(world: World, playerId: string, dx = 0, dy = 0) {
  return step(world, new Map([[playerId, input(dx, dy, true)]]));
}

function completeL1(): World {
  const world = createWorld(LEVELS[0]!, ["solo"]);
  moveThrough(world, "solo", [3, 3], [3, 2]);
  press(world, "solo");
  moveThrough(world, "solo", [3, 3], [14, 3], [14, 2]);
  press(world, "solo");
  moveThrough(world, "solo", [14, 3], [7, 3]);
  press(world, "solo");
  moveThrough(world, "solo", [11, 3], [14, 3], [14, 4]);
  press(world, "solo");
  moveThrough(world, "solo", [15, 4], [15, 5]);
  return world;
}

function deliverL2PlankAndExit(world: World): World {
  moveThrough(world, "solo", [3, 5], [11, 5], [11, 2], [15, 2], [14, 2]);
  press(world, "solo", -100);
  moveThrough(world, "solo", [15, 2], [15, 3]);
  press(world, "solo");
  moveTo(world, "solo", 16, 3);
  return world;
}

function completeL2Sandbar(): World {
  const world = createWorld(LEVELS[1]!, ["solo"]);
  moveThrough(world, "solo", [9, 2], [8, 2]);
  press(world, "solo");
  moveTo(world, "solo", 9, 2);
  press(world, "solo");
  moveThrough(world, "solo", [11, 2], [11, 5], [3, 5], [3, 2], [3, 5], [11, 5], [11, 2]);
  press(world, "solo", -100);
  moveTo(world, "solo", 12, 2);
  press(world, "solo");
  moveTo(world, "solo", 15, 2);
  press(world, "solo");
  moveThrough(world, "solo", [12, 2], [12, 4], [11, 4], [11, 5], [3, 5], [3, 2], [2, 2]);
  press(world, "solo");
  return deliverL2PlankAndExit(world);
}

function completeL2Leapfrog(): World {
  const world = createWorld(LEVELS[1]!, ["solo"]);
  moveTo(world, "solo", 5, 2);
  press(world, "solo", -100);
  moveTo(world, "solo", 9, 2);
  press(world, "solo");
  moveTo(world, "solo", 8, 2);
  press(world, "solo");
  moveThrough(world, "solo", [9, 2], [12, 2]);
  press(world, "solo");
  moveTo(world, "solo", 15, 2);
  press(world, "solo");
  moveThrough(world, "solo", [12, 2], [12, 4]);
  press(world, "solo");
  moveThrough(world, "solo", [11, 2], [11, 5], [3, 5], [3, 2]);
  press(world, "solo", 100);
  moveThrough(world, "solo", [3, 5], [11, 5], [11, 4], [12, 4]);
  press(world, "solo");
  moveThrough(world, "solo", [11, 4], [11, 5], [3, 5], [3, 2], [2, 2]);
  press(world, "solo");
  return deliverL2PlankAndExit(world);
}

function completeL3(): World {
  const world = createWorld(LEVELS[2]!, ["solo"]);
  moveTo(world, "solo", 7, 5);
  const pickupEvents = press(world, "solo");
  expect(pickupEvents.some((event) => event.type === "pickup" && event.itemKind === "plank")).toBe(true);
  moveThrough(world, "solo", [10, 5], [10, 4], [11, 4]);
  const deploymentEvents = press(world, "solo");
  expect(deploymentEvents.some((event) => event.type === "deploy" && event.x === 12 && event.y === 4)).toBe(true);
  moveThrough(world, "solo", [13, 4], [8, 4], [8, 1]);
  press(world, "solo");
  moveThrough(world, "solo", [8, 4], [13, 4], [14, 4]);
  press(world, "solo");
  moveTo(world, "solo", 14, 5);
  press(world, "solo");
  moveThrough(world, "solo", [14, 4], [2, 4]);
  press(world, "solo");
  moveThrough(world, "solo", [15, 4], [15, 6]);
  press(world, "solo");
  moveThrough(world, "solo", [15, 4], [2, 4]);
  press(world, "solo");
  moveTo(world, "solo", 10, 4);
  press(world, "solo");
  moveTo(world, "solo", 2, 4);
  press(world, "solo");
  moveTo(world, "solo", 3, 4);
  return world;
}

const BOTS: Bot[] = [
  ["L1", completeL1],
  ["L2 sandbar", completeL2Sandbar],
  ["L2 leapfrog", completeL2Leapfrog],
  ["L3", completeL3],
];

const ADJACENT_DELIVERY_LEVEL: LevelDefinition = {
  id: "adjacent-delivery",
  title: "Adjacent delivery",
  timeLimitSec: 30,
  stars: { three: 20, two: 10 },
  map: [
    "~~~~~",
    "~LoX~",
    "~S..~",
    "~~~~~",
  ],
  orders: [{ itemKind: "lantern", zone: "o", label: "Orchard" }],
  recipients: { o: "Orchard" },
};

const FLOOD_TEST_LEVEL: LevelDefinition = {
  id: "flood-test",
  title: "Flood test",
  timeLimitSec: 3,
  stars: { three: 2, two: 1 },
  sandbarFloodsAtSec: 2,
  map: [
    "~~~~~~",
    "~....~",
    "~S,,,~",
    "~....~",
    "~~~~~~",
  ],
  orders: [],
  recipients: {},
};

const DROP_TEST_LEVEL: LevelDefinition = {
  id: "drop-test",
  title: "Drop test",
  timeLimitSec: 30,
  stars: { three: 20, two: 10 },
  map: [
    "~~~~~~",
    "~S.C.~",
    "~,...~",
    "~~~~~~",
  ],
  orders: [],
  recipients: {},
};

describe("real-time simulation", () => {
  it.each(BOTS)("%s waypoint bot completes through step", (route, runBot) => {
    const world = runBot();
    expect(world.phase).toBe("completed");
    expect(world.orders.every((order) => order.fulfilled)).toBe(true);
    expect(world.timeRemainingTicks).toBeGreaterThan(0);
    expect(world.tick).toBeLessThanOrEqual(world.level.timeLimitSec * 20);
    console.info(`${route} bot: ${world.tick} ticks (${(world.tick / 20).toFixed(2)} s)`);
  });

  it.each(LEVELS)("%s map has 18-character rows", (level) => {
    expect(level.map.every((row) => row.length === 18)).toBe(true);
  });

  it("lifting the east plank in L1 strands the courier from the east objectives", () => {
    const world = createWorld(LEVELS[0]!, ["solo"]);
    moveTo(world, "solo", 11, 3);
    press(world, "solo");
    for (let tick = 0; tick < 20; tick += 1) step(world, new Map([["solo", input(100)]]));
    expect(Math.floor(world.players.get("solo")!.pos.x / 1000)).toBe(11);
    expect(world.orders.every((order) => !order.fulfilled)).toBe(true);
  });

  it("lifting the west plank from the L3 hub strands the courier away from X", () => {
    const world = createWorld(LEVELS[2]!, ["solo"]);
    moveTo(world, "solo", 6, 4);
    const events = press(world, "solo");
    expect(events.some((event) => event.type === "pickup" && event.itemKind === "plank")).toBe(true);
    for (let tick = 0; tick < 20; tick += 1) step(world, new Map([["solo", input(-100)]]));
    expect(Math.floor(world.players.get("solo")!.pos.x / 1000)).toBe(6);
    expect(world.players.get("solo")!.state).toBe("normal");
    expect(world.orders.every((order) => !order.fulfilled)).toBe(true);
  });

  it("floods the sandbar at its threshold and splashes a player standing on it", () => {
    const world = createWorld(FLOOD_TEST_LEVEL, ["solo"]);
    moveTo(world, "solo", 2, 2);
    for (let tick = 0; tick < 14; tick += 1) step(world, new Map());
    expect(world.timeRemainingTicks).toBe(41);
    expect(world.sandbarFlooded).toBe(false);
    const events = step(world, new Map());
    expect(world.timeRemainingTicks).toBe(40);
    expect(events).toEqual([{ type: "flood" }, { type: "splash", playerId: "solo" }]);
    expect(world.players.get("solo")!.state).toBe("splash");
    expect(snapshot(world).sandbarFlooded).toBe(true);
    expect(step(world, new Map()).some((event) => event.type === "flood")).toBe(false);
  });

  it("does not place a dropped item on a sandbar", () => {
    const world = createWorld(DROP_TEST_LEVEL, ["solo"]);
    moveTo(world, "solo", 2, 1);
    press(world, "solo");
    const crate = [...world.items.values()].find((item) => item.kind === "crate")!;
    expect(crate.state).toBe("carried");
    moveTo(world, "solo", 1, 1);
    press(world, "solo", 0, 100);
    expect(crate.state).toBe("ground");
    expect(DROP_TEST_LEVEL.map[crate.pos.y]![crate.pos.x]).not.toBe(",");
  });

  it("keeps all body corners on walkable tiles while hugging a water edge", () => {
    const world = createWorld(LEVELS[0]!, ["solo"]);
    moveTo(world, "solo", 7, 3);
    for (let tick = 0; tick < 5; tick += 1) step(world, new Map([["solo", input(0, -100)]]));
    const player = world.players.get("solo")!;
    expect(player.pos.y).toBe(3300);
    expect(Math.floor(player.pos.y / 1000)).toBe(3);
    expect(player.state).toBe("normal");
  });

  it("deploys a plank to an adjacent socket even when the player faces away", () => {
    const world = createWorld(LEVELS[0]!, ["solo"]);
    moveTo(world, "solo", 11, 3);
    press(world, "solo");
    moveThrough(world, "solo", [11, 4], [11, 3]);
    const events = press(world, "solo");
    expect(events).toContainEqual({
      type: "deploy",
      playerId: "solo",
      itemId: "L1-plank-3",
      x: 12,
      y: 3,
    });
  });

  it("delivers to an adjacent matching zone before dropping the carried item", () => {
    const world = createWorld(ADJACENT_DELIVERY_LEVEL, ["solo"]);
    moveTo(world, "solo", 1, 1);
    press(world, "solo");
    const lantern = [...world.items.values()].find((item) => item.kind === "lantern")!;
    expect(lantern.state).toBe("carried");
    const events = press(world, "solo");
    expect(events.some((event) => event.type === "deliver" && event.itemId === lantern.id)).toBe(true);
    expect(lantern.state).toBe("delivered");
    expect(world.orders[0]!.fulfilled).toBe(true);
  });

  it("splash returns carried cargo to its authored spawn and respawns after 40 ticks", () => {
    const world = createWorld(LEVELS[0]!, ["a", "b"]);
    moveThrough(world, "a", [3, 3], [3, 2]);
    press(world, "a");
    const lantern = [...world.items.values()].find((item) => item.kind === "lantern")!;
    expect(lantern.state).toBe("carried");
    moveThrough(world, "a", [3, 3], [11, 3], [12, 3]);
    moveTo(world, "b", 11, 3);
    const events = press(world, "b", 100);
    expect(events).toContainEqual({ type: "splash", playerId: "a" });
    expect(lantern.state).toBe("ground");
    expect(lantern.pos).toEqual(lantern.spawn);
    expect(world.players.get("a")!.state).toBe("splash");
    for (let tick = 0; tick < 39; tick += 1) step(world, new Map());
    expect(world.players.get("a")!.state).toBe("splash");
    expect(step(world, new Map())).toContainEqual({ type: "respawn", playerId: "a" });
    expect(world.players.get("a")!.state).toBe("normal");
    expect(world.players.get("a")!.pos).toEqual({ x: 9500, y: 3500 });
  });

  it("restores a disconnected courier's cargo and supports deterministic late joins", () => {
    const world = createWorld(LEVELS[0]!, ["host"]);
    const player = addPlayer(world, "guest");
    expect(player.pos).toEqual({ x: 9500, y: 3500 });
    moveThrough(world, "host", [3, 3], [3, 2]);
    press(world, "host");
    const lantern = [...world.items.values()].find((item) => item.kind === "lantern")!;
    removePlayer(world, "host");
    expect(lantern.state).toBe("ground");
    expect(world.players.has("host")).toBe(false);
    expect(snapshot(world).players.map((entry) => entry.id)).toEqual(["guest"]);
    expect(snapshot(world).sandbarFlooded).toBe(false);
  });

  it("times out with the required tide message", () => {
    const world = createWorld({ ...LEVELS[0]!, timeLimitSec: 1 }, ["solo"]);
    let events: ReturnType<typeof step> = [];
    for (let tick = 0; tick < 20; tick += 1) events = step(world, new Map());
    expect(world.phase).toBe("failed");
    expect(world.timeRemainingTicks).toBe(0);
    expect(events).toContainEqual({ type: "failed", message: "The tide's in" });
  });
});
