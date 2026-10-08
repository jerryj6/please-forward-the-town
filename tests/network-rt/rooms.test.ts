import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { startRtRoomServer } from "../../src/server/rt/manager.js";

interface Message {
  type: string;
  [key: string]: unknown;
}

class TestClient {
  readonly socket: WebSocket;
  readonly messages: Message[] = [];

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.socket.on("message", (data) => this.messages.push(JSON.parse(data.toString()) as Message));
  }

  async open(name: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.socket.once("open", resolve);
      this.socket.once("error", reject);
    });
    this.send({ type: "hello", v: 1, name });
  }

  send(message: unknown): void {
    this.socket.send(JSON.stringify(message));
  }

  async waitFor<T extends Message>(type: string, predicate: (message: Message) => boolean = () => true): Promise<T> {
    const existing = this.messages.find((message) => message.type === type && predicate(message));
    if (existing) return existing as T;
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.socket.off("message", listener);
        reject(new Error(`Timed out waiting for ${type}`));
      }, 3000);
      const listener = (data: Buffer) => {
        const message = JSON.parse(data.toString()) as Message;
        if (message.type !== type || !predicate(message)) return;
        clearTimeout(timeout);
        this.socket.off("message", listener);
        resolve(message as T);
      };
      this.socket.on("message", listener);
    });
  }

  close(): Promise<void> {
    if (this.socket.readyState === WebSocket.CLOSED) return Promise.resolve();
    return new Promise((resolve) => {
      this.socket.once("close", () => resolve());
      this.socket.close();
    });
  }
}

describe("real-time WebSocket rooms", () => {
  const clients: TestClient[] = [];
  let server: ReturnType<typeof createServer> | undefined;
  let rooms: Awaited<ReturnType<typeof startRtRoomServer>> | undefined;

  afterEach(async () => {
    await Promise.all(clients.splice(0).map((client) => client.close()));
    if (rooms) await rooms.close();
    rooms = undefined;
    if (server?.listening) await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  });

  it("shares authoritative ticks, restricts inputs, and resumes stable seats", async () => {
    server = createServer();
    rooms = startRtRoomServer(server);
    await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected ephemeral TCP address");
    const url = `ws://127.0.0.1:${address.port}/rt`;
    const host = new TestClient(url);
    const guest = new TestClient(url);
    const third = new TestClient(url);
    const fourth = new TestClient(url);
    clients.push(host, guest, third, fourth);
    await Promise.all([host.open("Harbor"), guest.open("Blue"), third.open("Gold"), fourth.open("Green")]);

    host.send({ type: "create" });
    const hostWelcome = await host.waitFor<Message & { playerId: string; resumeToken: string; code: string; seat: number; color: string }>("welcome");
    guest.send({ type: "join", code: hostWelcome.code });
    const guestWelcome = await guest.waitFor<Message & { playerId: string; resumeToken: string; seat: number; color: string }>("welcome");
    third.send({ type: "join", code: hostWelcome.code });
    const thirdWelcome = await third.waitFor<Message & { playerId: string }>("welcome");
    fourth.send({ type: "join", code: hostWelcome.code });
    await fourth.waitFor<Message & { type: string }>("welcome");
    await Promise.all([host, guest, third, fourth].map((client) => client.waitFor("lobby", (msg) =>
      Array.isArray(msg.players) && (msg.players as unknown[]).length === 4,
    )));
    expect(hostWelcome.seat).toBe(0);
    expect(guestWelcome.color).toBe("blue");

    guest.send({ type: "start" });
    expect((await guest.waitFor<Message & { reason: string }>("error", (msg) => msg.reason === "not_host")).reason).toBe("not_host");
    host.send({ type: "select", levelId: "L1" });
    await host.waitFor("lobby", (msg) => msg.levelId === "L1");
    host.send({ type: "start" });
    await Promise.all([host, guest, third, fourth].map((client) => client.waitFor("lobby", (msg) => msg.phase === "playing")));

    const guestBefore = (await guest.waitFor<Message & { tick: number; world: { players: Array<{ id: string; x: number; y: number }> } }>(
      "snap",
      (msg) => (msg.tick as number) >= 2,
    ));
    guest.send({ type: "input", seq: 1, dx: 100, dy: 0, action: false });
    const moved = await guest.waitFor<Message & { tick: number; world: { players: Array<{ id: string; x: number; y: number }> } }>(
      "snap",
      (msg) => {
        const player = (msg.world as { players: Array<{ id: string; x: number }> }).players.find((entry) => entry.id === guestWelcome.playerId);
        return (msg.tick as number) > guestBefore.tick && Boolean(player && player.x > 9500);
      },
    );
    const guestsPlayer = moved.world.players.find((player) => player.id === guestWelcome.playerId)!;
    const hostPlayer = moved.world.players.find((player) => player.id === hostWelcome.playerId)!;
    const thirdPlayer = moved.world.players.find((player) => player.id === thirdWelcome.playerId)!;
    expect(guestsPlayer.x).toBeGreaterThan(9500);
    expect(hostPlayer.x).toBe(9500);
    expect(thirdPlayer.x).toBe(9500);
    for (const client of [host, third, fourth]) {
      await client.waitFor("snap", (message) => message.tick === moved.tick);
    }

    await guest.close();
    const disconnected = await host.waitFor("lobby", (message) =>
      (message.players as Array<{ playerId: string; connected: boolean }>).some(
        (player) => player.playerId === guestWelcome.playerId && !player.connected,
      ),
    );
    expect(disconnected.hostId).toBe(hostWelcome.playerId);
    const lastTickBeforeResume = moved.tick;
    const resumed = new TestClient(url);
    clients.push(resumed);
    await resumed.open("Blue");
    resumed.send({ type: "join", code: hostWelcome.code, resumeToken: guestWelcome.resumeToken });
    const resumedWelcome = await resumed.waitFor<Message & { playerId: string; seat: number; color: string; lastSeq: number }>("welcome");
    expect(resumedWelcome.playerId).toBe(guestWelcome.playerId);
    expect(resumedWelcome.seat).toBe(guestWelcome.seat);
    expect(resumedWelcome.color).toBe(guestWelcome.color);
    expect(resumedWelcome.lastSeq).toBe(1);
    const resumedSnapshot = await resumed.waitFor<Message & { tick: number; world: { players: Array<{ id: string }> } }>(
      "snap",
      (message) => (message.tick as number) > lastTickBeforeResume &&
        (message.world as { players: Array<{ id: string }> }).players.some((player) => player.id === guestWelcome.playerId),
    );
    expect(resumedSnapshot.world.players.some((player) => player.id === guestWelcome.playerId)).toBe(true);
    resumed.send({ type: "input", seq: resumedWelcome.lastSeq + 1, dx: 100, dy: 0, action: false });
    const resumedMovement = await resumed.waitFor<Message & { tick: number; world: { players: Array<{ id: string; x: number }> } }>(
      "snap",
      (message) => (message.tick as number) > resumedSnapshot.tick &&
        Boolean((message.world as { players: Array<{ id: string; x: number }> }).players.find((player) => player.id === guestWelcome.playerId && player.x > 6500)),
    );
    expect(resumedMovement.world.players.find((player) => player.id === guestWelcome.playerId)!.x).toBeGreaterThan(6500);
  });

  it("serializes ferry positions in authoritative snapshots", async () => {
    server = createServer();
    rooms = startRtRoomServer(server);
    await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected ephemeral TCP address");
    const host = new TestClient(`ws://127.0.0.1:${address.port}/rt`);
    clients.push(host);
    await host.open("Harbor");
    host.send({ type: "create" });
    await host.waitFor("welcome");
    host.send({ type: "select", levelId: "L6" });
    await host.waitFor("lobby", (message) => message.levelId === "L6");
    host.send({ type: "start" });
    await host.waitFor("lobby", (message) => message.phase === "playing");
    const update = await host.waitFor<Message & {
      world: { ferries: Array<{ id: string; x: number; y: number }> };
    }>("snap", (message) => {
      const state = message.world as { ferries?: Array<{ id: string; x: number; y: number }> };
      return Array.isArray(state.ferries) && state.ferries.length === 1;
    });
    expect(update.world.ferries[0]).toMatchObject({ id: "ferry", x: 6500, y: 4500 });
  });
});
