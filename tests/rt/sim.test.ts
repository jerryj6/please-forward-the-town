import { describe, expect, it } from "vitest";
import { LEVELS } from "../../src/rt/levels/index.js";
import { addPlayer, createWorld, removePlayer, snapshot, step } from "../../src/rt/sim.js";
import type { Input, World } from "../../src/rt/types.js";

function input(dx = 0, dy = 0, action = false): Input {
  return { dx, dy, action };
}

function moveTo(world: World, playerId: string, targetX: number, targetY: number): void {
  const player = world.players.get(playerId)!;
  const targetWorldX = targetX * 1000 + 500;
  const targetWorldY = targetY * 1000 + 500;
  let budget = 1000;
  while ((player.pos.x !== targetWorldX || player.pos.y !== targetWorldY) && budget > 0 && world.phase === "playing") {
    const dx = Math.sign(targetWorldX - player.pos.x) * 100;
    const dy = Math.sign(targetWorldY - player.pos.y) * 100;
    step(world, new Map([[playerId, input(dx, dy)]]));
    budget -= 1;
  }
  if (budget === 0 && world.phase === "playing") throw new Error(`Could not walk ${playerId} to ${targetX},${targetY}`);
}

function press(world: World, playerId: string, dx = 0, dy = 0) {
  return step(world, new Map([[playerId, input(dx, dy, true)]]));
}

function completeL1(): World {
  const world = createWorld(LEVELS[0]!, ["solo"]);
  moveTo(world, "solo", 2, 3);
  press(world, "solo");
  moveTo(world, "solo", 6, 3);
  moveTo(world, "solo", 10, 3);
  press(world, "solo");
  moveTo(world, "solo", 6, 3);
  moveTo(world, "solo", 5, 3);
  press(world, "solo", -100);
  moveTo(world, "solo", 12, 3);
  press(world, "solo");
  moveTo(world, "solo", 13, 3);
  step(world, new Map());
  return world;
}

function completeL2(): World {
  const world = createWorld(LEVELS[1]!, ["solo"]);
  moveTo(world, "solo", 6, 2);
  moveTo(world, "solo", 5, 2);
  press(world, "solo", -100);
  moveTo(world, "solo", 9, 2);
  press(world, "solo", 100);
  moveTo(world, "solo", 13, 2);
  press(world, "solo");
  moveTo(world, "solo", 14, 2);
  press(world, "solo");
  moveTo(world, "solo", 9, 2);
  press(world, "solo", 100);
  moveTo(world, "solo", 5, 2);
  press(world, "solo", -100);
  moveTo(world, "solo", 6, 2);
  press(world, "solo", 100);
  moveTo(world, "solo", 1, 2);
  press(world, "solo");
  moveTo(world, "solo", 2, 2);
  step(world, new Map());
  return world;
}

function completeL3(): World {
  const world = createWorld(LEVELS[2]!, ["solo"]);
  moveTo(world, "solo", 1, 2);
  press(world, "solo");
  moveTo(world, "solo", 13, 2);
  press(world, "solo");
  moveTo(world, "solo", 12, 2);
  press(world, "solo");
  moveTo(world, "solo", 3, 2);
  press(world, "solo");
  moveTo(world, "solo", 8, 2);
  press(world, "solo", 100);
  moveTo(world, "solo", 3, 2);
  press(world, "solo");
  moveTo(world, "solo", 2, 2);
  step(world, new Map());
  return world;
}

describe("real-time simulation", () => {
  it.each([
    ["L1", completeL1],
    ["L2", completeL2],
    ["L3", completeL3],
  ])("%s scripted waypoint bot completes through step", (_id, runBot) => {
    const world = runBot();
    expect(world.phase).toBe("completed");
    expect(world.orders.every((order) => order.fulfilled)).toBe(true);
    expect(world.timeRemainingTicks).toBeGreaterThan(0);
  });

  it("removing the east plank first leaves the courier stranded from the objectives", () => {
    const world = createWorld(LEVELS[0]!, ["solo"]);
    moveTo(world, "solo", 7, 3);
    press(world, "solo", 100);
    expect([...world.items.values()].find((item) => item.kind === "plank" && item.state === "carried")).toBeDefined();
    for (let tick = 0; tick < 15; tick += 1) step(world, new Map([["solo", input(100)]]));
    expect(Math.floor(world.players.get("solo")!.pos.x / 1000)).toBe(7);
    expect(world.orders.every((order) => !order.fulfilled)).toBe(true);
  });

  it("splash returns carried cargo to its authored spawn and respawns after 40 ticks", () => {
    const world = createWorld(LEVELS[0]!, ["a", "b"]);
    moveTo(world, "a", 2, 3);
    press(world, "a");
    const lantern = [...world.items.values()].find((item) => item.kind === "lantern")!;
    expect(lantern.state).toBe("carried");
    moveTo(world, "a", 8, 3);
    moveTo(world, "b", 7, 3);
    const events = press(world, "b", 100);
    expect(events).toContainEqual({ type: "splash", playerId: "a" });
    expect(lantern.state).toBe("ground");
    expect(lantern.pos).toEqual(lantern.spawn);
    expect(world.players.get("a")!.state).toBe("splash");
    for (let tick = 0; tick < 39; tick += 1) step(world, new Map());
    expect(world.players.get("a")!.state).toBe("splash");
    expect(step(world, new Map())).toContainEqual({ type: "respawn", playerId: "a" });
    expect(world.players.get("a")!.state).toBe("normal");
    expect(world.players.get("a")!.pos).toEqual({ x: 6500, y: 3500 });
  });

  it("restores a disconnected courier's cargo and supports deterministic late joins", () => {
    const world = createWorld(LEVELS[0]!, ["host"]);
    const player = addPlayer(world, "guest");
    expect(player.pos).toEqual({ x: 6500, y: 3500 });
    moveTo(world, "host", 2, 3);
    press(world, "host");
    const lantern = [...world.items.values()].find((item) => item.kind === "lantern")!;
    removePlayer(world, "host");
    expect(lantern.state).toBe("ground");
    expect(world.players.has("host")).toBe(false);
    expect(snapshot(world).players.map((entry) => entry.id)).toEqual(["guest"]);
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
