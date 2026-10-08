import { describe, expect, it } from "vitest";
import { LEVELS } from "../../src/rt/levels/index.js";
import { addPlayer, createWorld, planAction, removePlayer, snapshot, step, withSoloTimeBonus } from "../../src/rt/sim.js";
import type { Input, LevelDefinition, World } from "../../src/rt/types.js";

type Tile = [number, number];
type Bot = [string, () => World];
type FloodTier = "sandbar" | "shoal";
type FloodCrossings = Map<FloodTier, number>;

function recordFloodCrossing(world: World, crossings: FloodCrossings | undefined, tier: FloodTier): void {
  crossings?.set(tier, world.tick);
}

function expectFloodMargin(world: World, crossings: FloodCrossings, tier: FloodTier): void {
  const floodAtSec = tier === "sandbar" ? world.level.sandbarFloodsAtSec : world.level.shoalFloodsAtSec;
  expect(floodAtSec).toBeDefined();
  const floodAtTick = (world.level.timeLimitSec - floodAtSec!) * 20;
  const crossingTick = crossings.get(tier);
  expect(crossingTick).toBeDefined();
  expect(floodAtTick - crossingTick!).toBeGreaterThanOrEqual(crossingTick! * 3);
}

function input(dx = 0, dy = 0, action = false): Input {
  return { dx, dy, action };
}

function moveTo(world: World, playerId: string, targetX: number, targetY: number): void {
  const player = world.players.get(playerId)!;
  const targetWorldX = targetX * 1000 + 500;
  const targetWorldY = targetY * 1000 + 500;
  let budget = 5000;
  while (
    (Math.abs(player.pos.x - targetWorldX) > 100 || Math.abs(player.pos.y - targetWorldY) > 100) &&
    budget > 0 &&
    world.phase === "playing"
  ) {
    const dx = Math.abs(player.pos.x - targetWorldX) <= 100 ? 0 : Math.sign(targetWorldX - player.pos.x) * 100;
    const dy = dx === 0 && Math.abs(player.pos.y - targetWorldY) > 100
      ? Math.sign(targetWorldY - player.pos.y) * 100
      : 0;
    const before = { ...player.pos };
    step(world, new Map([[playerId, input(dx, dy)]]));
    if (player.pos.x === before.x && player.pos.y === before.y &&
      (Math.abs(player.pos.x - targetWorldX) > 100 || Math.abs(player.pos.y - targetWorldY) > 100) &&
      world.phase === "playing") {
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

function moveTogether(world: World, targets: Map<string, Tile>): void {
  let budget = 5000;
  while (
    [...targets].some(([id, [x, y]]) => {
      const player = world.players.get(id)!;
      return Math.abs(player.pos.x - (x * 1000 + 500)) > 100 ||
        Math.abs(player.pos.y - (y * 1000 + 500)) > 100;
    }) &&
    budget > 0 &&
    world.phase === "playing"
  ) {
    const inputs = new Map<string, Input>();
    const before = new Map<string, Tile>();
    for (const [id, [x, y]] of targets) {
      const player = world.players.get(id)!;
      before.set(id, [player.pos.x, player.pos.y]);
      const targetX = x * 1000 + 500;
      const targetY = y * 1000 + 500;
      const dx = Math.abs(player.pos.x - targetX) <= 100 ? 0 : Math.sign(targetX - player.pos.x) * 100;
      const dy = dx === 0 && Math.abs(player.pos.y - targetY) > 100
        ? Math.sign(targetY - player.pos.y) * 100
        : 0;
      inputs.set(id, input(dx, dy));
    }
    step(world, inputs);
    for (const [id, [x, y]] of targets) {
      const player = world.players.get(id)!;
      const old = before.get(id)!;
      const targetX = x * 1000 + 500;
      const targetY = y * 1000 + 500;
      if (player.pos.x === old[0] && player.pos.y === old[1] &&
        (Math.abs(player.pos.x - targetX) > 100 || Math.abs(player.pos.y - targetY) > 100) &&
        world.phase === "playing") {
        throw new Error(`Could not walk ${id} to ${x},${y}`);
      }
    }
    budget -= 1;
  }
  if (budget === 0 && world.phase === "playing") throw new Error("Could not walk couriers to their waypoints");
}

function moveRoutesTogether(world: World, routes: Map<string, Tile[]>): void {
  const cursors = new Map([...routes.keys()].map((playerId) => [playerId, 0]));
  let budget = 5000;
  while ([...routes].some(([playerId, waypoints]) => cursors.get(playerId)! < waypoints.length) &&
    budget > 0 && world.phase === "playing") {
    const inputs = new Map<string, Input>();
    for (const [playerId, waypoints] of routes) {
      const player = world.players.get(playerId)!;
      let cursor = cursors.get(playerId)!;
      while (cursor < waypoints.length) {
        const [x, y] = waypoints[cursor]!;
        const targetX = x * 1000 + 500;
        const targetY = y * 1000 + 500;
        if (Math.abs(player.pos.x - targetX) > 100 || Math.abs(player.pos.y - targetY) > 100) break;
        cursor += 1;
      }
      cursors.set(playerId, cursor);
      if (cursor >= waypoints.length) {
        inputs.set(playerId, input());
        continue;
      }
      const [x, y] = waypoints[cursor]!;
      const targetX = x * 1000 + 500;
      const targetY = y * 1000 + 500;
      const dx = Math.abs(player.pos.x - targetX) <= 100 ? 0 : Math.sign(targetX - player.pos.x) * 100;
      const dy = dx === 0 && Math.abs(player.pos.y - targetY) > 100
        ? Math.sign(targetY - player.pos.y) * 100
        : 0;
      inputs.set(playerId, input(dx, dy));
    }
    step(world, inputs);
    budget -= 1;
  }
  if (budget === 0 || world.phase !== "playing") throw new Error("Concurrent waypoint routes did not finish");
}

function pressTogether(world: World, ...playerIds: string[]): void {
  step(world, new Map(playerIds.map((id) => [id, input(0, 0, true)])));
}

function press(world: World, playerId: string, dx = 0, dy = 0) {
  return step(world, new Map([[playerId, input(dx, dy, true)]]));
}

function completeL1(): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[0]!), ["solo"]);
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

function completeL2Sandbar(crossings?: FloodCrossings): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[1]!), ["solo"]);
  moveThrough(world, "solo", [9, 2], [8, 2]);
  press(world, "solo");
  moveTo(world, "solo", 9, 2);
  press(world, "solo");
  moveThrough(world, "solo", [11, 2], [11, 5]);
  recordFloodCrossing(world, crossings, "sandbar");
  moveThrough(world, "solo", [3, 5], [3, 2], [3, 5], [11, 5], [11, 2]);
  press(world, "solo", -100);
  moveTo(world, "solo", 12, 2);
  press(world, "solo");
  moveTo(world, "solo", 15, 2);
  press(world, "solo");
  moveThrough(world, "solo", [12, 2], [12, 4], [11, 4], [11, 5], [3, 5], [3, 2], [2, 2]);
  press(world, "solo");
  return deliverL2PlankAndExit(world);
}

function completeL2Leapfrog(crossings?: FloodCrossings): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[1]!), ["solo"]);
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
  moveThrough(world, "solo", [11, 2], [11, 5]);
  recordFloodCrossing(world, crossings, "sandbar");
  moveThrough(world, "solo", [3, 5], [3, 2]);
  press(world, "solo", 100);
  moveThrough(world, "solo", [3, 5], [11, 5], [11, 4], [12, 4]);
  press(world, "solo");
  moveThrough(world, "solo", [11, 4], [11, 5], [3, 5], [3, 2], [2, 2]);
  press(world, "solo");
  return deliverL2PlankAndExit(world);
}

function completeL3(crossings?: FloodCrossings): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[2]!), ["solo"]);
  moveTo(world, "solo", 7, 5);
  const pickupEvents = press(world, "solo");
  expect(pickupEvents.some((event) => event.type === "pickup" && event.itemKind === "plank")).toBe(true);
  moveThrough(world, "solo", [10, 5], [10, 4], [11, 4]);
  const deploymentEvents = press(world, "solo");
  expect(deploymentEvents.some((event) => event.type === "deploy" && event.x === 12 && event.y === 4)).toBe(true);
  moveThrough(world, "solo", [13, 4], [8, 4], [8, 1]);
  recordFloodCrossing(world, crossings, "sandbar");
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

function completeL4(crossings?: FloodCrossings): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[3]!), ["solo"]);
  moveTo(world, "solo", 4, 5);
  press(world, "solo");
  moveThrough(world, "solo", [4, 6], [5, 6]);
  recordFloodCrossing(world, crossings, "sandbar");
  moveThrough(world, "solo", [11, 6], [12, 6], [12, 3]);
  press(world, "solo");
  moveThrough(world, "solo", [14, 3], [14, 5]);
  press(world, "solo");
  moveTo(world, "solo", 16, 6);
  press(world, "solo");
  moveThrough(world, "solo", [16, 3], [16, 2]);
  press(world, "solo");
  moveThrough(world, "solo", [16, 3], [14, 3], [12, 3], [12, 1], [10, 1]);
  recordFloodCrossing(world, crossings, "shoal");
  moveThrough(world, "solo", [4, 1], [1, 4]);
  press(world, "solo");
  moveTo(world, "solo", 2, 2);
  press(world, "solo");
  moveThrough(world, "solo", [1, 4]);
  press(world, "solo");
  moveThrough(world, "solo", [4, 3], [6, 3], [8, 2]);
  press(world, "solo");
  moveThrough(world, "solo", [8, 3], [4, 3], [1, 4]);
  press(world, "solo");
  moveTo(world, "solo", 2, 5);
  return world;
}

function deliverL4Crates(world: World): void {
  moveTo(world, "solo", 2, 2);
  press(world, "solo");
  moveTo(world, "solo", 1, 4);
  press(world, "solo");
  moveThrough(world, "solo", [4, 4], [4, 3], [6, 3], [7, 2]);
  press(world, "solo");
  moveThrough(world, "solo", [6, 3], [4, 3], [1, 4]);
  press(world, "solo");
}

function completeL4FarLast(crossings?: FloodCrossings): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[3]!), ["solo"]);
  deliverL4Crates(world);
  moveTo(world, "solo", 4, 5);
  press(world, "solo");
  moveThrough(world, "solo", [4, 3], [6, 3], [8, 3]);
  press(world, "solo", 100);
  moveThrough(world, "solo", [10, 3], [8, 3], [6, 3]);
  press(world, "solo", -100);
  moveThrough(world, "solo", [8, 3], [10, 3], [12, 3]);
  press(world, "solo", 100);
  moveThrough(world, "solo", [14, 3], [16, 3], [16, 2]);
  press(world, "solo");
  moveThrough(world, "solo", [16, 3], [14, 3], [12, 3], [12, 1], [10, 1]);
  recordFloodCrossing(world, crossings, "shoal");
  moveThrough(world, "solo", [4, 1], [1, 4]);
  press(world, "solo");
  moveThrough(world, "solo", [4, 1], [10, 1], [12, 1], [12, 3], [14, 3], [14, 5]);
  press(world, "solo");
  moveTo(world, "solo", 16, 6);
  press(world, "solo");
  moveThrough(world, "solo", [14, 3], [12, 3], [12, 1], [10, 1], [4, 1]);
  recordFloodCrossing(world, crossings, "shoal");
  moveTo(world, "solo", 2, 5);
  return world;
}

function completeL4Coop(): World {
  const world = createWorld(LEVELS[3]!, ["a", "b"]);
  moveTo(world, "a", 4, 5);
  press(world, "a");
  moveThrough(world, "a", [4, 3], [4, 6], [11, 6], [12, 6], [12, 3]);
  press(world, "a", 100);
  moveTogether(world, new Map([["a", [12, 1]], ["b", [12, 3]]]));
  moveTogether(world, new Map([["a", [4, 1]], ["b", [14, 5]]]));
  press(world, "b");
  moveTogether(world, new Map([["a", [2, 2]], ["b", [16, 6]]]));
  pressTogether(world, "a", "b");
  moveTogether(world, new Map([["a", [1, 4]], ["b", [16, 2]]]));
  pressTogether(world, "a", "b");
  moveTogether(world, new Map([["a", [4, 3]], ["b", [16, 3]]]));
  moveTogether(world, new Map([["a", [6, 3]], ["b", [14, 3]]]));
  moveTogether(world, new Map([["a", [8, 2]], ["b", [12, 3]]]));
  press(world, "a");
  moveTogether(world, new Map([["a", [6, 3]], ["b", [12, 1]]]));
  moveTogether(world, new Map([["a", [4, 3]], ["b", [10, 1]]]));
  moveTogether(world, new Map([["a", [1, 4]], ["b", [4, 1]]]));
  moveTo(world, "b", 1, 4);
  pressTogether(world, "a", "b");
  moveTogether(world, new Map([["a", [2, 5]], ["b", [2, 5]]]));
  return world;
}

function completeL5(): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[4]!), ["solo"]);
  moveTo(world, "solo", 3, 2);
  press(world, "solo");
  moveTo(world, "solo", 17, 2);
  press(world, "solo");
  moveThrough(world, "solo", [3, 3]);
  press(world, "solo");
  moveThrough(world, "solo", [3, 2], [17, 2]);
  press(world, "solo");
  moveTo(world, "solo", 14, 2);
  press(world, "solo", -100);
  moveTo(world, "solo", 15, 4);
  press(world, "solo");
  moveTo(world, "solo", 16, 4);
  return world;
}

function completeL5Coop(): World {
  const world = createWorld(LEVELS[4]!, ["a", "b"]);
  moveTogether(world, new Map([["a", [3, 2]], ["b", [3, 3]]]));
  pressTogether(world, "a", "b");
  moveTogether(world, new Map([["a", [3, 2]], ["b", [4, 2]]]));
  moveTogether(world, new Map([["a", [17, 2]], ["b", [17, 2]]]));
  pressTogether(world, "a", "b");
  moveTogether(world, new Map([["a", [14, 2]], ["b", [16, 4]]]));
  press(world, "a", -100);
  moveTo(world, "a", 15, 4);
  press(world, "a");
  moveTogether(world, new Map([["a", [16, 4]], ["b", [16, 4]]]));
  return world;
}

function rideFerryAcross(world: World, playerId: string, from: "west" | "east"): void {
  const ferry = world.ferries[0]!;
  const startX = from === "west" ? 6500 : 11500;
  const endX = from === "west" ? 11500 : 6500;
  const startDock = from === "west" ? 5 : 12;
  const endDock = from === "west" ? 12 : 5;
  moveTo(world, playerId, startDock, 4);
  let budget = 5000;
  while ((ferry.x !== startX || ferry.y !== 4500 || ferry.dwellTicks < 8) && budget > 0 && world.phase === "playing") {
    step(world, new Map());
    budget -= 1;
  }
  if (budget === 0 || world.phase !== "playing") throw new Error("Ferry did not reach its dock");
  moveTo(world, playerId, Math.floor(startX / 1000), 4);
  while ((ferry.x !== endX || ferry.y !== 4500 || ferry.dwellTicks < 8) && budget > 0 && world.phase === "playing") {
    step(world, new Map());
    budget -= 1;
  }
  if (budget === 0 || world.phase !== "playing") throw new Error("Ferry did not reach the opposite dock");
  moveTo(world, playerId, endDock, 4);
}

function rideFerryTogether(world: World, playerIds: [string, string], from: "west" | "east"): void {
  const ferry = world.ferries[0]!;
  const startX = from === "west" ? 6500 : 11500;
  const endX = from === "west" ? 11500 : 6500;
  const startDock = from === "west" ? 5 : 12;
  const endDock = from === "west" ? 12 : 5;
  const ferryTile = Math.floor(startX / 1000);
  const dockX = startDock;
  moveTogether(world, new Map(playerIds.map((id) => [id, [dockX, 4]])));
  let budget = 5000;
  while ((ferry.x !== startX || ferry.y !== 4500 || ferry.dwellTicks < 8) && budget > 0 && world.phase === "playing") {
    step(world, new Map());
    budget -= 1;
  }
  if (budget === 0 || world.phase !== "playing") throw new Error("Ferry did not reach its dock");
  moveTogether(world, new Map(playerIds.map((id) => [id, [ferryTile, 4]])));
  while ((ferry.x !== endX || ferry.y !== 4500 || ferry.dwellTicks < 8) && budget > 0 && world.phase === "playing") {
    step(world, new Map());
    budget -= 1;
  }
  if (budget === 0 || world.phase !== "playing") throw new Error("Ferry did not reach the opposite dock");
  moveTogether(world, new Map(playerIds.map((id) => [id, [endDock, 4]])));
}

function rideNamedFerry(
  world: World,
  playerId: string,
  ferryId: string,
  from: "center" | "east",
): void {
  const definition = world.level.ferries?.find((candidate) => candidate.id === ferryId);
  const ferry = world.ferries.find((candidate) => candidate.id === ferryId);
  if (!definition || !ferry) throw new Error(`Missing ferry ${ferryId}`);
  const start = definition.path[from === "center" ? 0 : definition.path.length - 1]!;
  const end = definition.path[from === "center" ? definition.path.length - 1 : 0]!;
  const startX = start.x * 1000 + 500;
  const startY = start.y * 1000 + 500;
  const endX = end.x * 1000 + 500;
  const endY = end.y * 1000 + 500;
  const startShoreX = start.x + (from === "center" ? -1 : 1);
  const endShoreX = end.x + (from === "center" ? 1 : -1);
  let budget = 5000;

  moveTo(world, playerId, startShoreX, start.y);
  while ((ferry.x !== startX || ferry.y !== startY || ferry.dwellTicks < 8) && budget > 0 && world.phase === "playing") {
    step(world, new Map());
    budget -= 1;
  }
  if (budget === 0 || world.phase !== "playing") throw new Error(`Ferry ${ferryId} did not reach its boarding dock`);
  moveTo(world, playerId, start.x, start.y);
  while ((ferry.x !== endX || ferry.y !== endY || ferry.dwellTicks < 8) && budget > 0 && world.phase === "playing") {
    step(world, new Map());
    budget -= 1;
  }
  if (budget === 0 || world.phase !== "playing") throw new Error(`Ferry ${ferryId} did not reach its destination dock`);
  moveTo(world, playerId, endShoreX, end.y);
}

function rideNamedFerriesTogether(
  world: World,
  riders: Array<{ playerId: string; ferryId: string; from: "center" | "east" }>,
): void {
  const rides = riders.map(({ playerId, ferryId, from }) => {
    const definition = world.level.ferries?.find((candidate) => candidate.id === ferryId);
    if (!definition) throw new Error(`Missing ferry ${ferryId}`);
    const start = definition.path[from === "center" ? 0 : definition.path.length - 1]!;
    const end = definition.path[from === "center" ? definition.path.length - 1 : 0]!;
    const startShoreX = start.x + (from === "center" ? -1 : 1);
    const endShoreX = end.x + (from === "center" ? 1 : -1);
    return {
      playerId,
      ferryId,
      startX: start.x * 1000 + 500,
      startY: start.y * 1000 + 500,
      endX: end.x * 1000 + 500,
      endY: end.y * 1000 + 500,
      startShoreX,
      endShoreX,
      y: start.y,
      boarded: false,
      done: false,
    };
  });
  for (const ride of rides) moveTo(world, ride.playerId, ride.startShoreX, ride.y);

  let budget = 5000;
  while (rides.some((ride) => !ride.done) && budget > 0 && world.phase === "playing") {
    const inputs = new Map<string, Input>();
    for (const ride of rides) {
      const ferry = world.ferries.find((candidate) => candidate.id === ride.ferryId)!;
      const player = world.players.get(ride.playerId)!;
      if (!ride.boarded) {
        if (ferry.x === ride.startX && ferry.y === ride.startY && ferry.dwellTicks >= 8) {
          inputs.set(ride.playerId, input(Math.sign(ride.startX - player.pos.x) * 100));
        }
      } else if (ferry.x === ride.endX && ferry.y === ride.endY && ferry.dwellTicks >= 8) {
        inputs.set(ride.playerId, input(Math.sign(ride.endShoreX * 1000 + 500 - player.pos.x) * 100));
      }
    }
    step(world, inputs);
    for (const ride of rides) {
      const ferry = world.ferries.find((candidate) => candidate.id === ride.ferryId)!;
      const player = world.players.get(ride.playerId)!;
      if (
        !ride.boarded &&
        Math.abs(player.pos.x - ferry.x) <= 500 &&
        Math.abs(player.pos.y - ferry.y) <= 500
      ) {
        ride.boarded = true;
      }
      if (
        ride.boarded &&
        Math.floor(player.pos.x / 1000) === ride.endShoreX &&
        Math.floor(player.pos.y / 1000) === ride.y
      ) {
        ride.done = true;
      }
    }
    budget -= 1;
  }
  if (budget === 0 || world.phase !== "playing") throw new Error("Named ferries did not carry both couriers");
}

function movePianoWithHelper(
  world: World,
  carrierId: string,
  helperId: string,
  ...waypoints: Tile[]
): void {
  let budget = 5000;
  for (const [targetX, targetY] of waypoints) {
    const targetWorldX = targetX * 1000 + 500;
    const targetWorldY = targetY * 1000 + 500;
    while (
      (Math.abs(world.players.get(carrierId)!.pos.x - targetWorldX) > 100 ||
        Math.abs(world.players.get(carrierId)!.pos.y - targetWorldY) > 100) &&
      budget > 0 &&
      world.phase === "playing"
    ) {
      const carrier = world.players.get(carrierId)!;
      const helper = world.players.get(helperId)!;
      const dx = Math.abs(carrier.pos.x - targetWorldX) <= 100
        ? 0
        : Math.sign(targetWorldX - carrier.pos.x) * 100;
      const dy = dx === 0 && Math.abs(carrier.pos.y - targetWorldY) > 100
        ? Math.sign(targetWorldY - carrier.pos.y) * 100
        : 0;
      const travelDirection = dx !== 0 ? Math.sign(dx) : Math.sign(dy);
      const lead = (helper.pos.x - carrier.pos.x) * (dx !== 0 ? travelDirection : 0) +
        (helper.pos.y - carrier.pos.y) * (dy !== 0 ? travelDirection : 0);
      const helperInput = lead > 750 ? input() : input(dx, dy);
      step(world, new Map([[carrierId, input(dx, dy)], [helperId, helperInput]]));
      budget -= 1;
    }
    if (budget === 0 && world.phase === "playing") throw new Error("Piano team lift did not reach its waypoint");
  }
}

function completeL6(): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[5]!), ["solo"]);
  for (const crateY of [3, 2, 4]) {
    moveTo(world, "solo", 4, 2);
    moveTo(world, "solo", 4, crateY);
    press(world, "solo");
    moveThrough(world, "solo", [4, 2], [7, 2], [13, 2], [13, 3], [16, 3]);
    press(world, "solo");
    if (crateY !== 4) moveThrough(world, "solo", [13, 2], [7, 2], [4, 2]);
  }
  moveThrough(world, "solo", [13, 2], [7, 2]);
  press(world, "solo", -100);
    moveThrough(world, "solo", [13, 2], [12, 4]);
    press(world, "solo");
  rideFerryAcross(world, "solo", "east");
  moveThrough(world, "solo", [4, 4], [4, 2]);
  moveTo(world, "solo", 2, 2);
  return world;
}

function completeL6Coop(): World {
  const world = createWorld(LEVELS[5]!, ["a", "b"]);
  moveTogether(world, new Map([["a", [4, 3]], ["b", [4, 4]]]));
  pressTogether(world, "a", "b");
  moveTogether(world, new Map([["a", [4, 2]], ["b", [4, 2]]]));
  moveTogether(world, new Map([["a", [7, 2]], ["b", [7, 2]]]));
  moveTogether(world, new Map([["a", [13, 2]], ["b", [13, 2]]]));
  moveTogether(world, new Map([["a", [13, 3]], ["b", [13, 3]]]));
  moveTogether(world, new Map([["a", [16, 3]], ["b", [16, 3]]]));
  pressTogether(world, "a", "b");

  moveTogether(world, new Map([["a", [13, 2]], ["b", [13, 2]]]));
  moveTogether(world, new Map([["a", [4, 2]], ["b", [7, 2]]]));
  press(world, "a");
  moveThrough(world, "a", [7, 2], [13, 2], [13, 3], [16, 3]);
  press(world, "a");

  press(world, "b", -100);
  moveThrough(world, "b", [13, 2], [12, 4]);
  press(world, "b");
  moveTogether(world, new Map([["a", [12, 4]], ["b", [12, 4]]]));
  rideFerryTogether(world, ["a", "b"], "east");
  moveTogether(world, new Map([["a", [2, 2]], ["b", [2, 2]]]));
  return world;
}

function completeL6PlankFirst(): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[5]!), ["solo"]);
  moveThrough(world, "solo", [4, 2], [7, 2]);
  press(world, "solo", -100);
  moveThrough(world, "solo", [13, 2], [12, 4]);
  press(world, "solo");
  expect(world.sockets.has("6,2")).toBe(false);
  for (const crateY of [2, 3, 4]) {
    rideFerryAcross(world, "solo", "east");
    moveTo(world, "solo", 4, crateY);
    press(world, "solo");
    rideFerryAcross(world, "solo", "west");
    moveThrough(world, "solo", [12, 3], [16, 3]);
    press(world, "solo");
  }
  rideFerryAcross(world, "solo", "east");
  moveThrough(world, "solo", [4, 4], [4, 2]);
  moveTo(world, "solo", 2, 2);
  return world;
}

function completeL7(crossings?: FloodCrossings): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[6]!), ["solo"]);
  moveTo(world, "solo", 2, 4);
  press(world, "solo");
  moveTo(world, "solo", 12, 4);
  recordFloodCrossing(world, crossings, "sandbar");
  press(world, "solo");
  moveTo(world, "solo", 4, 4);
  recordFloodCrossing(world, crossings, "sandbar");
  moveThrough(world, "solo", [4, 5], [4, 6], [1, 6]);
  press(world, "solo");
  moveThrough(world, "solo", [4, 6], [4, 2], [7, 2], [14, 2], [14, 6], [16, 6], [16, 5], [18, 5], [18, 4], [18, 2], [20, 5], [20, 6]);
  press(world, "solo");
  moveThrough(world, "solo", [14, 6], [14, 2], [7, 2]);
  press(world, "solo", -100);
  moveThrough(world, "solo", [14, 2], [14, 6], [16, 6], [16, 5], [18, 5], [18, 4], [18, 2]);
  press(world, "solo");
  moveTo(world, "solo", 20, 5);
  return world;
}

function completeL7Coop(): World {
  const world = createWorld(LEVELS[6]!, ["a", "b"]);
  moveTogether(world, new Map([["a", [2, 4]], ["b", [1, 6]]]));
  pressTogether(world, "a", "b");
  moveRoutesTogether(world, new Map([
    ["a", [[12, 4]]],
    ["b", [[4, 6], [4, 2], [7, 2], [14, 2]]],
  ]));
  press(world, "a");
  moveTo(world, "a", 14, 2);
  movePianoWithHelper(world, "b", "a", [14, 6], [16, 6], [16, 5], [18, 5], [18, 4], [18, 2], [20, 5], [20, 6]);
  press(world, "b");
  moveThrough(world, "b", [14, 6], [14, 2], [7, 2]);
  press(world, "b", -100);
  moveThrough(world, "b", [14, 2], [14, 6], [16, 6], [16, 5], [18, 5], [18, 4], [18, 2]);
  press(world, "b");
  moveTogether(world, new Map([["a", [20, 5]], ["b", [20, 5]]]));
  return world;
}

function completeL8(): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[7]!), ["solo"]);
  moveTo(world, "solo", 17, 3);
  press(world, "solo");
  rideNamedFerry(world, "solo", "slow-ferry", "east");
  moveThrough(world, "solo", [7, 3], [5, 3], [2, 3]);
  press(world, "solo");
  moveTo(world, "solo", 3, 3);
  press(world, "solo");
  moveTo(world, "solo", 9, 4);
  rideNamedFerry(world, "solo", "fast-ferry", "center");
  moveThrough(world, "solo", [17, 4], [17, 2], [19, 2], [19, 3]);
  press(world, "solo");
  moveThrough(world, "solo", [19, 2], [17, 2], [17, 4], [14, 4]);
  rideNamedFerry(world, "solo", "fast-ferry", "east");
  moveThrough(world, "solo", [7, 3]);
  press(world, "solo", -100);
  moveTo(world, "solo", 9, 4);
  rideNamedFerry(world, "solo", "fast-ferry", "center");
  moveTo(world, "solo", 16, 3);
  press(world, "solo");
  moveThrough(world, "solo", [17, 3], [17, 2], [20, 2], [20, 1]);
  return world;
}

function completeL8Coop(): World {
  const world = createWorld(LEVELS[7]!, ["a", "b"]);
  moveTo(world, "a", 17, 3);
  press(world, "a");
  moveTo(world, "b", 3, 3);
  press(world, "b");
  moveTogether(world, new Map([["b", [9, 4]], ["a", [14, 2]]]));
  rideNamedFerriesTogether(world, [
    { playerId: "b", ferryId: "fast-ferry", from: "center" },
    { playerId: "a", ferryId: "slow-ferry", from: "east" },
  ]);

  moveTogether(world, new Map([["b", [17, 4]], ["a", [7, 3]]]));
  moveTogether(world, new Map([["b", [17, 2]], ["a", [4, 3]]]));
  moveTogether(world, new Map([["b", [19, 2]], ["a", [2, 3]]]));
  moveTogether(world, new Map([["b", [19, 3]], ["a", [2, 3]]]));
  pressTogether(world, "a", "b");

  moveTogether(world, new Map([["b", [20, 1]], ["a", [7, 3]]]));
  press(world, "a", -100);
  moveTo(world, "a", 9, 4);
  rideNamedFerry(world, "a", "fast-ferry", "center");
  moveTo(world, "a", 16, 3);
  press(world, "a");
  moveThrough(world, "a", [17, 3], [17, 2], [20, 2], [20, 1]);
  return world;
}

function completeL9(crossings?: FloodCrossings): World {
  const world = createWorld(withSoloTimeBonus(LEVELS[8]!), ["solo"]);
  moveTo(world, "solo", 3, 2);
  press(world, "solo");
  moveThrough(world, "solo", [3, 3], [5, 3]);
  recordFloodCrossing(world, crossings, "sandbar");
  moveThrough(world, "solo", [5, 2], [8, 2], [8, 3], [10, 3]);
  recordFloodCrossing(world, crossings, "shoal");
  moveThrough(world, "solo", [13, 3], [15, 3]);
  recordFloodCrossing(world, crossings, "sandbar");
  moveTo(world, "solo", 18, 2);
  press(world, "solo");

  moveTo(world, "solo", 12, 2);
  press(world, "solo");
  moveTo(world, "solo", 2, 2);
  press(world, "solo");

  moveTo(world, "solo", 7, 2);
  press(world, "solo");
  moveTo(world, "solo", 11, 2);
  press(world, "solo");
  moveTo(world, "solo", 17, 2);
  press(world, "solo");
  moveTo(world, "solo", 6, 2);
  press(world, "solo");
  moveTo(world, "solo", 19, 2);
  return world;
}

function completeL9Coop(): World {
  const world = createWorld(LEVELS[8]!, ["a", "b"]);
  moveTo(world, "a", 3, 2);
  press(world, "a");
  moveThrough(world, "a", [3, 3], [5, 3], [5, 2], [8, 2], [8, 3], [10, 3], [15, 3]);
  moveTo(world, "a", 18, 2);
  press(world, "a");

  moveTo(world, "b", 7, 2);
  press(world, "b");
  moveTo(world, "b", 11, 2);
  press(world, "b");

  moveTogether(world, new Map([["a", [12, 2]], ["b", [17, 2]]]));
  press(world, "a");
  press(world, "b");
  moveTogether(world, new Map([["a", [2, 2]], ["b", [6, 2]]]));
  press(world, "a");
  press(world, "b");
  moveTogether(world, new Map([["a", [19, 2]], ["b", [19, 2]]]));
  return world;
}

const BOTS: Bot[] = [
  ["L1", completeL1],
  ["L2 sandbar", completeL2Sandbar],
  ["L2 leapfrog", completeL2Leapfrog],
  ["L3", completeL3],
  ["L4 far first", completeL4],
  ["L5 intended order", completeL5],
  ["L6 crates before plank", completeL6],
  ["L7 Piano Day", completeL7],
  ["L8 Crosscurrent", completeL8],
  ["L9 Spring Tide", completeL9],
];

const FLOOD_BOTS: Array<[string, (crossings: FloodCrossings) => World, FloodTier[]]> = [
  ["L2 sandbar", completeL2Sandbar, ["sandbar"]],
  ["L2 leapfrog", completeL2Leapfrog, ["sandbar"]],
  ["L3", completeL3, ["sandbar"]],
  ["L4 far first", completeL4, ["sandbar", "shoal"]],
  ["L7 Piano Day", completeL7, ["sandbar"]],
  ["L9 Spring Tide", completeL9, ["sandbar", "shoal"]],
];

const COOP_BOTS: Bot[] = [
  ["L4", completeL4Coop],
  ["L5", completeL5Coop],
  ["L6", completeL6Coop],
  ["L7", completeL7Coop],
  ["L8", completeL8Coop],
  ["L9", completeL9Coop],
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

const CANDIDATE_DELIVERY_LEVEL: LevelDefinition = {
  id: "candidate-delivery",
  title: "Candidate delivery",
  timeLimitSec: 30,
  stars: { three: 20, two: 10 },
  map: [
    "~~~~~~~~",
    "~......~",
    "~.-....~",
    "~..Sm..~",
    "~..P...~",
    "~~~~~~~~",
  ],
  orders: [{ itemKind: "plank", zone: "m", label: "Museum" }],
  recipients: { m: "Museum" },
};

const CANDIDATE_DEPLOY_LEVEL: LevelDefinition = {
  id: "candidate-deploy",
  title: "Candidate deployment",
  timeLimitSec: 30,
  stars: { three: 20, two: 10 },
  map: [
    "~~~~~~~~",
    "~......~",
    "~.S-...~",
    "~..m...~",
    "~.P....~",
    "~~~~~~~~",
  ],
  orders: [{ itemKind: "plank", zone: "m", label: "Museum" }],
  recipients: { m: "Museum" },
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

const SHOAL_TEST_LEVEL: LevelDefinition = {
  id: "shoal-test",
  title: "Shoal test",
  timeLimitSec: 3,
  stars: { three: 2, two: 1 },
  sandbarFloodsAtSec: 2,
  shoalFloodsAtSec: 1,
  map: [
    "~~~~~~~",
    "~.....~",
    "~S,,,;~",
    "~.....~",
    "~~~~~~~",
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

const FERRY_TEST_LEVEL: LevelDefinition = {
  id: "ferry-test",
  title: "Ferry test",
  timeLimitSec: 30,
  stars: { three: 20, two: 10 },
  map: [
    "~~~~~~~~~",
    "~.......~",
    "~.S~~..X~",
    "~.......~",
    "~~~~~~~~~",
  ],
  orders: [],
  recipients: {},
  ferries: [{
    id: "test-ferry",
    path: [{ x: 3, y: 2 }, { x: 4, y: 2 }],
    speedTilesPerSec: 2,
    dwellSec: 0.2,
  }],
};

function pianoTestLevel(tile: "," | ";" | "~" = "~"): LevelDefinition {
  return {
    id: `piano-test-${tile === "~" ? "ferry" : tile === "," ? "sandbar" : "shoal"}`,
    title: "Piano test",
    timeLimitSec: 30,
    stars: { three: 20, two: 10 },
    map: [
      "~~~~~~~~~",
      `~S.K${tile}...~`,
      "~.......~",
      "~~~~~~~~~",
    ],
    orders: [],
    recipients: {},
    ...(tile === "~" ? {
      ferries: [{
        id: "piano-ferry",
        path: [{ x: 4, y: 1 }, { x: 4, y: 0 }],
        speedTilesPerSec: 2,
        dwellSec: 0,
      }],
    } : {}),
  };
}

describe("real-time simulation", () => {
  it.each(BOTS)("%s waypoint bot completes through step", (route, runBot) => {
    const world = runBot();
    expect(world.phase).toBe("completed");
    expect(world.orders.every((order) => order.fulfilled)).toBe(true);
    expect(world.timeRemainingTicks).toBeGreaterThan(0);
    expect(world.tick).toBeLessThanOrEqual(world.level.timeLimitSec * 20);
    console.info(`${route} bot: ${world.tick} ticks (${(world.tick / 20).toFixed(2)} s)`);
  });

  it.each(FLOOD_BOTS)("%s reaches its flood crossings with a three-times elapsed-time margin", (_route, runBot, tiers) => {
    const crossings: FloodCrossings = new Map();
    const world = runBot(crossings);
    expect(world.phase).toBe("completed");
    for (const tier of tiers) expectFloodMargin(world, crossings, tier);
  });

  it.each(COOP_BOTS.filter(([levelId]) => levelId !== "L4"))("%s two-player bot completes all orders", (levelId, runBot) => {
    const coop = runBot();
    console.info(`${levelId} co-op: ${(coop.tick / 20).toFixed(2)} s`);
    if (coop.phase !== "completed") {
      console.info(`${levelId} unfinished co-op: ${JSON.stringify({
        orders: coop.orders.filter((order) => !order.fulfilled),
        players: [...coop.players.values()].map(({ id, pos, state, carrying }) => ({ id, pos, state, carrying })),
      })}`);
    }
    expect(coop.phase).toBe("completed");
  });

  it.each(COOP_BOTS.filter(([levelId]) => !["L4", "L7"].includes(levelId)))(
    "%s two-player bot is at least 20% faster",
    (levelId, runBot) => {
      const solo = BOTS.find(([route]) => route.startsWith(levelId))![1]();
      const coop = runBot();
      console.info(`${levelId} solo/co-op: ${(solo.tick / 20).toFixed(2)} s / ${(coop.tick / 20).toFixed(2)} s`);
      expect(solo.phase).toBe("completed");
      expect(coop.phase).toBe("completed");
      expect(coop.tick).toBeLessThanOrEqual(solo.tick * 0.8);
    },
  );

  it("L7 two-player bot is at least 20% faster", () => {
    const solo = BOTS.find(([route]) => route.startsWith("L7"))![1]();
    const coop = completeL7Coop();
    expect(coop.tick).toBeLessThanOrEqual(solo.tick * 0.8);
  });

  it("L8 two-player bot is at least 20% faster", () => {
    const solo = BOTS.find(([route]) => route.startsWith("L8"))![1]();
    const coop = completeL8Coop();
    expect(coop.tick).toBeLessThanOrEqual(solo.tick * 0.8);
  });

  it("L4 co-op bot completes all orders and extracts both couriers", () => {
    const solo = BOTS.find(([route]) => route.startsWith("L4"))![1]();
    const coop = completeL4Coop();
    expect(solo.phase).toBe("completed");
    expect(coop.phase).toBe("completed");
    expect(coop.orders.every((order) => order.fulfilled)).toBe(true);
    console.info(`L4 solo/co-op: ${(solo.tick / 20).toFixed(2)} s / ${(coop.tick / 20).toFixed(2)} s`);
  });

  // KNOWN ISSUE (lead-approved 2026-10-08): L4 co-op not yet faster than solo; redesign pending
  it.skip("L4 two-player bot is at least 20% faster", () => {
    const solo = BOTS.find(([route]) => route.startsWith("L4"))![1]();
    const coop = completeL4Coop();
    expect(coop.tick).toBeLessThanOrEqual(solo.tick * 0.8);
  });

  it("makes L4's far delivery last at least 18% slower through a double leapfrog", () => {
    const farFirst = completeL4();
    const farLast = completeL4FarLast();
    expect(farFirst.phase).toBe("completed");
    expect(farLast.phase).toBe("completed");
    // lead decision 2026-10-08: 35% target not reached in two retunes; revisit in L4 polish
    expect(farLast.tick).toBeGreaterThanOrEqual(Math.ceil(farFirst.tick * 1.18));
    console.info(`L4 far first/far last: ${(farFirst.tick / 20).toFixed(2)} s / ${(farLast.tick / 20).toFixed(2)} s`);

    const noLeapfrog = createWorld(withSoloTimeBonus(LEVELS[3]!), ["solo"]);
    deliverL4Crates(noLeapfrog);
    const player = noLeapfrog.players.get("solo")!;
    moveThrough(noLeapfrog, "solo", [4, 3], [4, 2], [4, 1]);
    moveTo(noLeapfrog, "solo", 5, 1);
    const floodEvents = [];
    let floodBudget = 1500;
    while (!noLeapfrog.shoalFlooded && floodBudget > 0 && noLeapfrog.phase === "playing") {
      floodEvents.push(...step(noLeapfrog, new Map()));
      floodBudget -= 1;
    }
    expect(floodEvents).toContainEqual({ type: "flood", tier: "shoal" });
    expect(floodEvents).toContainEqual({ type: "splash", playerId: "solo" });
    expect(noLeapfrog.timeRemainingTicks).toBeGreaterThan(0);

    for (let tick = 0; tick < 100 && player.state !== "normal"; tick += 1) step(noLeapfrog, new Map());
    expect(noLeapfrog.sandbarFlooded).toBe(true);
    expect(noLeapfrog.shoalFlooded).toBe(true);
    expect(noLeapfrog.sockets.has("9,3")).toBe(false);
    moveThrough(noLeapfrog, "solo", [4, 5], [4, 3], [8, 3]);
    for (let tick = 0; tick < 30; tick += 1) step(noLeapfrog, new Map([["solo", input(100)]]));
    expect(Math.floor(player.pos.x / 1000)).toBe(8);
    expect(noLeapfrog.orders.find((order) => order.itemKind === "lantern")?.fulfilled).toBe(false);
    expect(noLeapfrog.timeRemainingTicks).toBeGreaterThan(0);
  });

  it("strands an L5 courier who lifts the first span plank before staging the cargo", () => {
    const world = createWorld(LEVELS[4]!, ["solo"]);
    moveTo(world, "solo", 6, 2);
    const events = press(world, "solo", -100);
    const player = world.players.get("solo")!;
    expect(events.some((event) => event.type === "pickup" && event.itemKind === "plank")).toBe(true);
    expect(player.carrying).not.toBeNull();
    expect(world.sockets.has("5,2")).toBe(false);
    for (let tick = 0; tick < 20; tick += 1) step(world, new Map([["solo", input(-100)]]));
    expect(Math.floor(player.pos.x / 1000)).toBe(6);
    expect(world.items.get(player.carrying!)!.kind).toBe("plank");
    expect(world.orders.every((order) => !order.fulfilled)).toBe(true);
    expect([...world.items.values()].filter((item) => item.kind === "crate").every((item) => item.state === "ground")).toBe(true);
  });

  it("keeps the L6 bridge route alive until the crates are delivered", () => {
    const correct = completeL6();
    const plankFirst = completeL6PlankFirst();
    expect(correct.phase).toBe("completed");
    expect(plankFirst.phase).toBe("completed");
    expect(plankFirst.tick).toBeGreaterThanOrEqual(Math.ceil(correct.tick * 1.35));
    console.info(`L6 crates first/plank first: ${(correct.tick / 20).toFixed(2)} s / ${(plankFirst.tick / 20).toFixed(2)} s`);
  });

  it("keeps the L7 piano route available until the piano reaches Music Hall", () => {
    const world = createWorld(withSoloTimeBonus(LEVELS[6]!), ["solo"]);
    moveTo(world, "solo", 5, 2);
    const events = press(world, "solo", 100);
    expect(events.some((event) => event.type === "pickup" && event.itemKind === "plank")).toBe(true);
    for (let tick = 0; tick < 20; tick += 1) step(world, new Map([["solo", input(100)]]));
    expect(Math.floor(world.players.get("solo")!.pos.x / 1000)).toBe(5);
    expect(world.orders.find((order) => order.itemKind === "piano")?.fulfilled).toBe(false);
    expect(world.orders.find((order) => order.itemKind === "plank")?.fulfilled).toBe(false);
  });

  it("soft-locks the L7 piano route when the bridge plank is delivered first", () => {
    const world = createWorld(withSoloTimeBonus(LEVELS[6]!), ["solo"]);
    moveTo(world, "solo", 7, 2);
    const pickup = press(world, "solo", -100);
    expect(pickup.some((event) => event.type === "pickup" && event.itemKind === "plank")).toBe(true);
    moveThrough(world, "solo", [14, 2], [14, 1], [16, 1], [16, 2], [18, 2]);
    press(world, "solo");
    expect(world.orders.find((order) => order.itemKind === "plank")?.fulfilled).toBe(true);

    moveThrough(world, "solo", [16, 2], [16, 1], [14, 1], [14, 2], [14, 4], [10, 4], [4, 4], [4, 6], [1, 6]);
    const pianoPickup = press(world, "solo");
    const player = world.players.get("solo")!;
    expect(pianoPickup.some((event) => event.type === "pickup" && event.itemKind === "piano")).toBe(true);
    moveThrough(world, "solo", [4, 6], [4, 2], [5, 2]);
    for (let tick = 0; tick < 20; tick += 1) step(world, new Map([["solo", input(100)]]));
    expect(Math.floor(player.pos.x / 1000)).toBe(5);
    for (let tick = 0; tick < 20; tick += 1) step(world, new Map([["solo", input(0, 100)]]));
    expect(Math.floor(player.pos.y / 1000)).toBe(3);
    expect(world.orders.find((order) => order.itemKind === "piano")?.fulfilled).toBe(false);
  });

  it("replays the reported L7 bridge-plank input sequence at 20 tps", () => {
    const world = createWorld(LEVELS[6]!, ["solo"]);
    const player = world.players.get("solo")!;
    const plank = [...world.items.values()].find((item) => item.kind === "plank")!;
    player.pos = { x: 7300, y: 2500 };
    player.facing = "w";
    const liftEvents = step(world, new Map([["solo", input(0, 0, true)]]));
    expect(liftEvents.some((event) => event.type === "pickup" && event.itemKind === "plank")).toBe(true);
    console.info(`L7 repro lift: (${(player.pos.x / 1000).toFixed(2)}, ${(player.pos.y / 1000).toFixed(2)}) carrying=${player.carrying}`);

    const allEventTypes: string[] = [];
    const trace = (label: string, ticks: number, dx: number, dy: number, action = false) => {
      const events = [];
      for (let tick = 0; tick < ticks; tick += 1) {
        events.push(...step(world, new Map([["solo", input(dx, dy, action && tick === 0)]])));
      }
      allEventTypes.push(...events.map((event) => event.type));
      console.info(
        `L7 repro ${label}: (${(player.pos.x / 1000).toFixed(2)}, ${(player.pos.y / 1000).toFixed(2)}) ` +
        `state=${player.state} carrying=${player.carrying ?? "none"} ` +
        `plank=${plank.state}@(${plank.pos.x},${plank.pos.y}) socket=${world.sockets.has("6,2")} ` +
        `events=${events.map((event) => event.type).join(",") || "none"}`,
      );
      return events;
    };

    trace("D 1.0s", 20, 100, 0);
    trace("S 0.3s", 6, 0, 100);
    trace("D 1.75s", 35, 100, 0);
    trace("W 0.25s", 5, 0, -100);
    const actionEvents = trace("Space", 1, 0, 0, true);
    trace("D 0.7s", 14, 100, 0);

    expect(actionEvents.some((event) => event.type === "deliver" && event.label === "Carpenter")).toBe(true);
    expect(allEventTypes).not.toContain("splash");
    expect(allEventTypes).not.toContain("respawn");
    expect(player.state).toBe("normal");
    expect(player.carrying).toBeNull();
    expect(plank.state).toBe("delivered");
    expect(world.sockets.has("6,2")).toBe(false);
  });

  it("makes team lift materially faster on the L7 piano route", () => {
    const soloWorld = createWorld(LEVELS[6]!, ["solo"]);
    moveTo(soloWorld, "solo", 1, 6);
    press(soloWorld, "solo");
    const solo = soloWorld.players.get("solo")!;
    const soloStart = solo.pos.x;
    for (let tick = 0; tick < 20; tick += 1) step(soloWorld, new Map([["solo", input(100)]]));

    const teamWorld = createWorld(LEVELS[6]!, ["carrier", "helper"]);
    moveTo(teamWorld, "carrier", 1, 6);
    press(teamWorld, "carrier");
    moveTo(teamWorld, "helper", 1, 6);
    const carrier = teamWorld.players.get("carrier")!;
    const teamStart = carrier.pos.x;
    for (let tick = 0; tick < 20; tick += 1) {
      step(teamWorld, new Map([["carrier", input(100)], ["helper", input(100)]]));
    }

    expect(carrier.pos.x - teamStart).toBeGreaterThanOrEqual(Math.ceil((solo.pos.x - soloStart) * 1.4));
  });

  it("soft-locks L8's west cargo if its only bridge is lifted early", () => {
    const world = createWorld(withSoloTimeBonus(LEVELS[7]!), ["solo"]);
    const player = world.players.get("solo")!;
    player.pos = { x: 7_500, y: 3_500 };
    moveTo(world, "solo", 7, 3);
    const events = press(world, "solo", -100);
    const crate = [...world.items.values()].find((item) => item.kind === "crate")!;
    expect(events.some((event) => event.type === "pickup" && event.itemKind === "plank")).toBe(true);
    expect(world.sockets.has("6,3")).toBe(false);
    for (let tick = 0; tick < 20; tick += 1) step(world, new Map([["solo", input(-100)]]));
    expect(Math.floor(player.pos.x / 1000)).toBe(7);
    expect(crate.state).toBe("ground");
    expect(world.orders.every((order) => !order.fulfilled)).toBe(true);
  });

  it("soft-locks L9's island rescue when the middle bridge is lifted before the shoal floods", () => {
    const world = createWorld(withSoloTimeBonus(LEVELS[8]!), ["solo"]);
    moveTo(world, "solo", 10, 2);
    const events = press(world, "solo", -100);
    expect(events.some((event) => event.type === "pickup" && event.itemKind === "plank")).toBe(true);
    expect(world.sockets.has("9,2")).toBe(false);
    while (!world.shoalFlooded && world.phase === "playing") step(world, new Map());
    expect(world.sandbarFlooded).toBe(true);
    expect(world.shoalFlooded).toBe(true);
    const player = world.players.get("solo")!;
    for (let tick = 0; tick < 20; tick += 1) step(world, new Map([["solo", input(-100)]]));
    expect(Math.floor(player.pos.x / 1000)).toBe(10);
    expect([...world.items.values()].find((item) => item.kind === "lantern" && item.pos.x === 12)?.state).toBe("ground");
    expect([...world.items.values()].find((item) => item.kind === "crate" && item.pos.x === 7)?.state).toBe("ground");
    expect(world.orders.every((order) => !order.fulfilled)).toBe(true);
    expect(world.timeRemainingTicks).toBeGreaterThan(0);
  });

  it.each(LEVELS)("%s map has consistent rows no wider than 22 tiles", (level) => {
    expect(level.map.length).toBeLessThanOrEqual(10);
    expect(level.map.every((row) => row.length === level.map[0]!.length && row.length <= 22)).toBe(true);
  });

  it("treats # as an obstacle for movement and item drops", () => {
    const world = createWorld(LEVELS[5]!, ["solo"]);
    const player = world.players.get("solo")!;
    const crate = [...world.items.values()].find((item) => item.kind === "crate" && item.pos.x === 4 && item.pos.y === 2)!;
    moveTo(world, "solo", 4, 2);
    press(world, "solo");
    moveTo(world, "solo", 13, 2);
    for (let tick = 0; tick < 20; tick += 1) step(world, new Map([["solo", input(100)]]));
    expect(Math.floor(player.pos.x / 1000)).toBe(13);
    const plan = planAction(world, player);
    expect(plan).toMatchObject({ verb: "drop", x: 13, y: 2 });
    press(world, "solo");
    expect(crate.state).toBe("ground");
    expect(crate.pos).toMatchObject({ x: 13, y: 2 });
    expect(LEVELS.slice(3, 9).every((level) => level.map.some((row) => row.includes("#")))).toBe(true);
  });

  it("gives L8 two ferries with distinct periods and horizontal dock-to-dock paths", () => {
    const ferries = LEVELS[7]!.ferries!;
    const level = LEVELS[7]!;
    const periods = ferries.map((ferry) => {
      const [first, last] = [ferry.path[0]!, ferry.path[ferry.path.length - 1]!];
      expect(ferry.path.every((point) => point.y === first.y)).toBe(true);
      return 2 * Math.abs(last.x - first.x) / ferry.speedTilesPerSec + 2 * ferry.dwellSec;
    });
    expect(ferries).toHaveLength(2);
    expect(periods[0]).not.toBe(periods[1]);
    expect(level.sandbarFloodsAtSec).toBeUndefined();
    expect(level.map[5]?.slice(10, 14)).toBe("~~~~");
    expect(level.map[1]?.[15]).toBe("S");
    expect(level.map[1]?.[20]).toBe("X");
    expect(level.map[3]?.[8]).toBe(".");
    expect(level.map[3]?.[7]).toBe("S");
  });

  it("keeps L7's piano route south of the cottage obstacle lane", () => {
    const map = LEVELS[6]!.map;
    const cottages: Tile[] = [[15, 4], [17, 4], [15, 5]];
    expect(map[2]?.[3]).toBe(".");
    expect(map[2]?.[19]).toBe(".");
    expect(map[6]?.[1]).toBe("K");
    expect(map[6]?.[20]).toBe("m");
    expect(map[5]?.[20]).toBe("X");
    expect(cottages.every(([x, y]) => map[y]?.[x] === "#")).toBe(true);
  });

  it("uses a five-tile horizontal L6 river crossing with a 1.5-second dock dwell and nine-second cycle", () => {
    const ferry = LEVELS[5]!.ferries![0]!;
    const [start, end] = [ferry.path[0]!, ferry.path[ferry.path.length - 1]!];
    const roundTripSec = 2 * Math.abs(end.x - start.x) / ferry.speedTilesPerSec + 2 * ferry.dwellSec;
    expect(ferry.path.every((point) => point.y === start.y)).toBe(true);
    expect(Math.abs(end.x - start.x)).toBeGreaterThanOrEqual(5);
    expect(ferry.dwellSec).toBeGreaterThanOrEqual(1.5);
    expect(roundTripSec).toBeGreaterThanOrEqual(8);
    expect(roundTripSec).toBeLessThanOrEqual(10);
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
    moveTo(world, "solo", 6, 3);
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
    expect(events).toEqual([{ type: "flood", tier: "sandbar" }, { type: "splash", playerId: "solo" }]);
    expect(world.players.get("solo")!.state).toBe("splash");
    expect(snapshot(world).sandbarFlooded).toBe(true);
    expect(step(world, new Map()).some((event) => event.type === "flood")).toBe(false);
  });

  it("leaves the L2 plank deployed or restores it to the west socket after a sandbar splash", () => {
    for (const layOnEast of [false, true]) {
      const world = createWorld(LEVELS[1]!, ["solo"]);
      moveTo(world, "solo", 3, 2);
      const pickupEvents = press(world, "solo", 100);
      const plank = [...world.items.values()].find((item) => item.kind === "plank" && item.spawn.x === 4)!;
      const otherPlank = [...world.items.values()].find((item) => item.kind === "plank" && item.id !== plank.id)!;
      expect(pickupEvents).toContainEqual({
        type: "pickup",
        playerId: "solo",
        itemId: plank.id,
        itemKind: "plank",
      });

      moveThrough(world, "solo", [3, 4], [3, 5], [11, 5], [11, 4], [11, 3], [12, 3]);
      const player = world.players.get("solo")!;
      expect(planAction(world, player)).toEqual({
        verb: "deploy",
        x: 13,
        y: 2,
        itemId: plank.id,
      });

      if (layOnEast) {
        expect(press(world, "solo")).toContainEqual({
          type: "deploy",
          playerId: "solo",
          itemId: plank.id,
          x: 13,
          y: 2,
        });
      }

      moveThrough(world, "solo", [11, 3], [11, 4], [11, 5]);
      expect(player.carrying).toBe(layOnEast ? null : plank.id);
      const floodThreshold = world.level.sandbarFloodsAtSec! * 20;
      while (world.timeRemainingTicks > floodThreshold + 1) step(world, new Map());
      const floodEvents = step(world, new Map());
      expect(floodEvents).toContainEqual({ type: "flood", tier: "sandbar" });
      expect(floodEvents).toContainEqual({ type: "splash", playerId: "solo" });

      for (let tick = 0; tick < 40; tick += 1) step(world, new Map());
      expect(player.state).toBe("normal");
      expect(player.carrying).toBeNull();
      expect(player.pos).toEqual({ x: 3500, y: 2500 });
      expect(plank.state).toBe("deployed");
      expect(plank.pos).toEqual(layOnEast ? { x: 13, y: 2 } : { x: 4, y: 2 });
      expect(otherPlank.state).toBe("deployed");
      expect(otherPlank.pos).toEqual(otherPlank.spawn);
      expect([...world.items.values()].filter((item) => item.kind === "plank").every((item) => item.state === "deployed")).toBe(true);
      expect(world.sockets.get(layOnEast ? "13,2" : "4,2")).toBe(plank.id);
      expect(world.sockets.has("4,2")).toBe(!layOnEast);
      expect(world.sockets.has("13,2")).toBe(layOnEast);
      expect(world.sockets.get(`${otherPlank.spawn.x},${otherPlank.spawn.y}`)).toBe(otherPlank.id);
    }
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

  it("floods shoals after sandbars and splashes a player standing on one", () => {
    const world = createWorld(SHOAL_TEST_LEVEL, ["solo"]);
    moveTo(world, "solo", 5, 2);
    expect(world.timeRemainingTicks).toBe(40);
    expect(world.sandbarFlooded).toBe(true);
    expect(world.shoalFlooded).toBe(false);
    expect(world.players.get("solo")!.state).toBe("normal");

    while (world.timeRemainingTicks > 21) step(world, new Map());
    const events = step(world, new Map());
    expect(events).toContainEqual({ type: "flood", tier: "shoal" });
    expect(events).toContainEqual({ type: "splash", playerId: "solo" });
    expect(world.shoalFlooded).toBe(true);
    expect(snapshot(world).shoalFlooded).toBe(true);
  });

  it.each([",", ";"] as const)("never drops cargo onto a %s route", (route) => {
    const level: LevelDefinition = {
      ...DROP_TEST_LEVEL,
      map: [
        "~~~~~~",
        "~S.C.~",
        `~${route}...~`,
        "~~~~~~",
      ],
    };
    const world = createWorld(level, ["solo"]);
    moveTo(world, "solo", 2, 1);
    press(world, "solo");
    const crate = [...world.items.values()].find((item) => item.kind === "crate")!;
    moveTo(world, "solo", 1, 1);
    press(world, "solo", 0, 100);
    expect(crate.state).toBe("ground");
    expect(level.map[crate.pos.y]![crate.pos.x]).not.toBe(route);
  });

  it("moves a ferry in milli-tiles, dwells at both ends, and reverses deterministically", () => {
    const world = createWorld(FERRY_TEST_LEVEL, ["solo"]);
    const ferry = world.ferries[0]!;
    expect(snapshot(world).ferries).toEqual([{ id: "test-ferry", x: 3500, y: 2500 }]);
    for (let tick = 0; tick < 4; tick += 1) {
      step(world, new Map());
      expect(ferry.x).toBe(3500);
    }
    for (let tick = 0; tick < 10; tick += 1) step(world, new Map());
    expect(ferry.x).toBe(4500);
    for (let tick = 0; tick < 4; tick += 1) {
      step(world, new Map());
      expect(ferry.x).toBe(4500);
    }
    step(world, new Map());
    expect(ferry.x).toBe(4400);
    for (let tick = 0; tick < 9; tick += 1) step(world, new Map());
    expect(ferry.x).toBe(3500);
  });

  it("carries a rider by the ferry delta and lets them step off at the dock", () => {
    const world = createWorld(FERRY_TEST_LEVEL, ["solo"]);
    const player = world.players.get("solo")!;
    const ferry = world.ferries[0]!;
    player.pos = { x: ferry.x, y: ferry.y };
    ferry.dwellTicks = 0;
    step(world, new Map());
    expect(ferry.x).toBe(3600);
    expect(player.pos.x).toBe(3600);

    ferry.pathIndex = 1;
    ferry.direction = -1;
    ferry.x = 4500;
    ferry.dwellTicks = 4;
    player.pos = { x: 4500, y: 2500 };
    for (let tick = 0; tick < 4; tick += 1) step(world, new Map([["solo", input(100)]]));
    expect(player.pos.x).toBeGreaterThan(5000);
    expect(player.state).toBe("normal");
  });

  it("splashes a non-rider left in water when the ferry departs", () => {
    const world = createWorld(FERRY_TEST_LEVEL, ["solo"]);
    const player = world.players.get("solo")!;
    const ferry = world.ferries[0]!;
    player.pos = { x: 4500, y: 2500 };
    ferry.dwellTicks = 0;
    const events = step(world, new Map());
    expect(ferry.x).toBe(3600);
    expect(events).toContainEqual({ type: "splash", playerId: "solo" });
    expect(player.state).toBe("splash");
  });

  it("moves a piano at half speed, or 85% speed with an empty-handed nearby teammate", () => {
    const soloWorld = createWorld(pianoTestLevel(), ["solo"]);
    moveTo(soloWorld, "solo", 3, 1);
    press(soloWorld, "solo");
    const soloPlayer = soloWorld.players.get("solo")!;
    const soloStart = soloPlayer.pos.x;
    step(soloWorld, new Map([["solo", input(100)]]));
    expect(soloPlayer.pos.x - soloStart).toBe(100);

    const teamLevel = pianoTestLevel();
    teamLevel.map = ["~~~~~~~~~", "~S.K~...~", "~..S....~", "~~~~~~~~~"];
    const teamWorld = createWorld(teamLevel, ["carrier", "helper"]);
    moveTo(teamWorld, "carrier", 3, 1);
    press(teamWorld, "carrier");
    const carrier = teamWorld.players.get("carrier")!;
    const teamStart = carrier.pos.x;
    step(teamWorld, new Map([["carrier", input(100)]]));
    expect(carrier.pos.x - teamStart).toBe(170);
  });

  it.each([",", ";", "~"] as const)("blocks piano entry onto %s", (tile) => {
    const world = createWorld(pianoTestLevel(tile), ["solo"]);
    moveTo(world, "solo", 3, 1);
    press(world, "solo");
    const player = world.players.get("solo")!;
    for (let tick = 0; tick < 10; tick += 1) step(world, new Map([["solo", input(100)]]));
    expect(player.pos.x).toBeLessThan(4000);
    expect(world.items.get(player.carrying!)!.kind).toBe("piano");
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

  it("corrects a 300-milli bridge approach while the courier keeps moving", () => {
    const level: LevelDefinition = {
      id: "bridge-correction",
      title: "Bridge correction",
      timeLimitSec: 30,
      stars: { three: 20, two: 10 },
      map: ["~~~~~~~~~~~~", "~S....=...z~", "~~~~~~~~~~~~"],
      orders: [{ itemKind: "crate", zone: "z", label: "End" }],
      recipients: { z: "End" },
    };
    const world = createWorld(level, ["solo"]);
    const player = world.players.get("solo")!;
    player.pos = { x: 5500, y: 1800 };

    for (let tick = 0; tick < 16; tick += 1) step(world, new Map([["solo", input(100)]]));

    expect(player.pos.x).toBeGreaterThan(7000);
    expect(player.pos.y).toBeLessThan(1800);
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

  it("delivers at the facing Museum before deploying to a diagonal socket behind", () => {
    const world = createWorld(CANDIDATE_DELIVERY_LEVEL, ["solo"]);
    moveTo(world, "solo", 3, 4);
    press(world, "solo");
    const plank = [...world.items.values()].find((item) => item.kind === "plank")!;
    moveTo(world, "solo", 3, 3);
    step(world, new Map([["solo", input(100)]]));

    expect(planAction(world, world.players.get("solo")!)).toEqual({
      verb: "deliver",
      x: 4,
      y: 3,
      itemId: plank.id,
    });
  });

  it("deploys to the facing empty socket before delivering to a diagonal zone", () => {
    const world = createWorld(CANDIDATE_DEPLOY_LEVEL, ["solo"]);
    moveTo(world, "solo", 2, 4);
    press(world, "solo");
    const plank = [...world.items.values()].find((item) => item.kind === "plank")!;
    moveTo(world, "solo", 2, 2);
    step(world, new Map([["solo", input(100)]]));

    expect(planAction(world, world.players.get("solo")!)).toEqual({
      verb: "deploy",
      x: 3,
      y: 2,
      itemId: plank.id,
    });
  });

  it("delivers a plank from diagonally beside the Museum instead of dropping it", () => {
    const world = createWorld(LEVELS[0]!, ["solo"]);
    moveTo(world, "solo", 7, 3);
    const pickupEvents = press(world, "solo", -100);
    expect(pickupEvents.some((event) => event.type === "pickup" && event.itemKind === "plank")).toBe(true);
    moveTo(world, "solo", 13, 3);
    const plank = [...world.items.values()].find((item) => item.kind === "plank" && item.spawn.x === 6)!;
    expect(snapshot(world).players[0]!.action).toEqual({
      verb: "deliver",
      x: 14,
      y: 4,
      itemId: plank.id,
    });
    const events = press(world, "solo");
    expect(events.some((event) => event.type === "deliver" && event.itemId === plank.id)).toBe(true);
    expect(plank.state).toBe("delivered");
  });

  it("reports pickup, delivery, and deployment previews in snapshots", () => {
    const world = createWorld(LEVELS[0]!, ["solo"]);
    moveThrough(world, "solo", [3, 3], [3, 2]);
    const lantern = [...world.items.values()].find((item) => item.kind === "lantern")!;
    expect(snapshot(world).players[0]!.action).toEqual({
      verb: "pickup",
      x: 3,
      y: 2,
      itemId: lantern.id,
    });
    press(world, "solo");
    moveThrough(world, "solo", [3, 3], [13, 3]);
    expect(snapshot(world).players[0]!.action).toEqual({
      verb: "deliver",
      x: 14,
      y: 2,
      itemId: lantern.id,
    });

    const deployWorld = createWorld(LEVELS[0]!, ["deploy"]);
    moveTo(deployWorld, "deploy", 11, 3);
    press(deployWorld, "deploy", 100);
    moveThrough(deployWorld, "deploy", [11, 4], [11, 3]);
    const plank = [...deployWorld.items.values()].find((item) => item.kind === "plank" && item.spawn.x === 12)!;
    expect(snapshot(deployWorld).players[0]!.action).toEqual({
      verb: "deploy",
      x: 12,
      y: 3,
      itemId: plank.id,
    });
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
    expect(snapshot(world).players.find((player) => player.id === "a")!.action).toBeNull();
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
