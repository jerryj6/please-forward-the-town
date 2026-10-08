/**
 * soak.test.ts — randomized multi-client soak against the live server.
 *
 * Four clients, 200 accepted commands, seeded faults: duplicate replays,
 * adapter rejections, apply crashes, stale base revisions and
 * disconnect/reconnect cycles. Invariants checked at the end:
 *   - revision sequence is contiguous 1..200 with unique commandIds,
 *   - every accepted command applied exactly once (server log + game state),
 *   - every client converges to the same canonical state hash,
 *   - no divergence persists after resynchronization (§6.2 policy).
 * Run is fully seeded (SEED) — failures replay identically.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { startRoomServer, type RoomServer } from '../../src/server/index.js';
import { CounterAdapter, TestClient, mulberry32, pick, sleep } from './helpers.js';
import type { CounterState } from './helpers.js';
import type { StatePatch } from '../../src/server/protocol.js';

const SEED = 0x5eeded;
const TOTAL_ACCEPTED = 200;

const clients: TestClient[] = [];
const servers: RoomServer[] = [];

afterEach(async () => {
  while (clients.length) await clients.pop()!.close();
  while (servers.length) await servers.pop()!.close();
});

async function freshClient(port: number): Promise<TestClient> {
  const c = await TestClient.connect(port);
  clients.push(c);
  return c;
}

describe('soak', () => {
  it('200 randomized commands across 4 clients converge to one canonical state', async () => {
    const adapter = new CounterAdapter();
    const srv = await startRoomServer({
      adapters: [adapter],
      port: 0,
      host: '127.0.0.1',
      dataDir: null,
      snapshotEvery: 1_000_000, // keep the full in-memory log for contiguity evidence
      sweepIntervalMs: 0,
      heartbeatMs: 60_000,
      logger: () => {},
    });
    servers.push(srv);
    const rng = mulberry32(SEED);

    // seat 4 clients; index 0 is the never-disconnected anchor.
    // `live` is the pickable set — reconnected replacements swap in, dropped
    // victims are never picked again (they stay in `clients` only for cleanup).
    const room = (await (await freshClient(srv.port)).create()).room;
    while (clients.length < 4) {
      const c = await freshClient(srv.port);
      await c.join(room.roomId);
    }
    const live = clients.slice(0, 4);
    const anchor = live[0]!;

    let accepted = 0;
    let expectedScore = 0;
    let expectedOps = 0;
    let lastAcceptedRev = 0;
    let sends = 0;
    const acceptedIds = new Set<string>();
    let dupReplies = 0;
    let staleRejections = 0;
    let validationRejections = 0;
    let applyFailures = 0;
    let reconnects = 0;

    while (accepted < TOTAL_ACCEPTED && sends < 1_200) {
      const roll = rng();
      const c = pick(rng, live);

      if (roll < 0.60) {
        // valid command — catch the sender up, then base on the latest revision
        if (c.knownRev < lastAcceptedRev) {
          await c.waitFor('state_patch', (m) => m.revision >= lastAcceptedRev, 3_000).catch(() => {});
        }
        const cid = `s-${sends++}`;
        const n = 1 + Math.floor(rng() * 9);
        const res = await c.command(cid, c.knownRev, { kind: 'add', n });
        if (res.type === 'state_patch') {
          const p = res as StatePatch;
          expect(p.dup ?? false).toBe(false);
          expect(p.revision).toBe(lastAcceptedRev + 1);
          accepted++;
          acceptedIds.add(cid);
          expectedScore += n;
          expectedOps++;
          lastAcceptedRev = p.revision;
        } else {
          expect((res as { code: string }).code).toBe('stale_revision');
          staleRejections++;
        }
      } else if (roll < 0.70 && acceptedIds.size > 0) {
        // duplicate replay of an already-accepted id → recorded patch, no re-apply
        const cid = pick(rng, [...acceptedIds]);
        const res = await c.command(cid, 0, { kind: 'add', n: 999 });
        expect(res.type).toBe('state_patch');
        expect((res as StatePatch).dup).toBe(true);
        dupReplies++;
      } else if (roll < 0.78) {
        // adapter-level rejection — catch up first so we hit validate, not stale
        const cid = `bad-${sends++}`;
        if (c.knownRev < lastAcceptedRev) {
          await c.waitFor('state_patch', (m) => m.revision >= lastAcceptedRev, 3_000).catch(() => {});
        }
        const res = await c.command(cid, c.knownRev, { kind: 'add', n: -1 });
        expect(res.type).toBe('error');
        if ((res as { code: string }).code === 'validation_failed') {
          validationRejections++;
        } else {
          expect((res as { code: string }).code).toBe('stale_revision');
          staleRejections++;
        }
      } else if (roll < 0.84) {
        // apply-time crash → rolled back, no mutation
        const cid = `crash-${sends++}`;
        // ensure fresh baseRevision so we exercise apply, not the stale path
        if (c.knownRev < lastAcceptedRev) {
          await c.waitFor('state_patch', (m) => m.revision >= lastAcceptedRev, 3_000).catch(() => {});
        }
        const res = await c.command(cid, c.knownRev, { kind: 'crash' });
        if (res.type === 'error') {
          const code = (res as { code: string }).code;
          if (code === 'apply_failed') {
            applyFailures++;
          } else {
            expect(code).toBe('stale_revision'); // raced base; counts as a stale rejection
            staleRejections++;
          }
        } else {
          accepted++;
          expectedOps++;
          lastAcceptedRev = (res as StatePatch).revision;
        }
      } else if (roll < 0.90) {
        // deliberate stale base revision
        const cid = `stale-${sends++}`;
        const staleBase = Math.max(0, c.knownRev - 1 - Math.floor(rng() * 3));
        const res = await c.command(cid, staleBase, { kind: 'add', n: 1 });
        if (res.type === 'error') {
          expect((res as { code: string }).code).toBe('stale_revision');
          staleRejections++;
        } else {
          // knownRev genuinely lagged to the current revision — legal accept
          const p = res as StatePatch;
          accepted++;
          acceptedIds.add(cid);
          expectedScore += 1;
          expectedOps++;
          lastAcceptedRev = p.revision;
        }
      } else if (roll < 0.97) {
        // drop + reconnect within the window on a non-anchor seat
        const idx = 1 + Math.floor(rng() * (live.length - 1));
        const victim = live[idx]!;
        victim.drop();
        const revived = await freshClient(srv.port);
        const fs = await revived.join(victim.roomId, { actorId: victim.actorId, resumeToken: victim.resumeToken });
        expect(fs.reconnected).toBe(true);
        expect(fs.seat).toBe(victim.seat);
        live[idx] = revived;
        reconnects++;
      } else {
        await sleep(2); // small pause slice
      }
    }

    expect(accepted).toBe(TOTAL_ACCEPTED);
    expect(dupReplies).toBeGreaterThan(0);
    expect(reconnects).toBeGreaterThan(0);
    expect(validationRejections).toBeGreaterThan(0);
    expect(applyFailures).toBeGreaterThan(0);
    expect(staleRejections).toBeGreaterThan(0);

    /* -------- invariants -------- */
    const roomObj = srv.manager.findRoom(room.roomId)!;

    // 1. authoritative revision sequence is contiguous 1..200, unique ids
    const logRevs = roomObj.log.map((e) => e.revision);
    expect(logRevs).toEqual(Array.from({ length: TOTAL_ACCEPTED }, (_, i) => i + 1));
    expect(new Set(roomObj.log.map((e) => e.commandId)).size).toBe(TOTAL_ACCEPTED);
    expect(roomObj.revision).toBe(TOTAL_ACCEPTED);

    // 2. every accepted command applied exactly once (game state tally)
    const state = roomObj.state as CounterState;
    expect(state.ops).toBe(expectedOps);
    expect(state.score).toBe(expectedScore);
    //   + adapters applied exactly accepted + intentionally-crashed times
    expect(adapter.applyCalls).toBe(TOTAL_ACCEPTED + applyFailures);

    // 3. the anchor's broadcast stream is the same contiguous sequence
    const anchorPatches = anchor.patches().filter((p) => p.dup !== true);
    expect(anchorPatches.map((p) => p.revision)).toEqual(Array.from({ length: TOTAL_ACCEPTED }, (_, i) => i + 1));

    // 4. all live clients converge to the same canonical state hash
    //    (final broadcasts may still be in flight — wait for delivery first)
    const listed = srv.manager.listRooms().find((r) => r.roomId === room.roomId)!;
    expect(anchor.knownHash).toBe(listed.stateHash);
    for (const c of live) {
      await c.waitFor('state_patch', (m) => m.revision >= TOTAL_ACCEPTED, 10_000);
      expect(c.knownRev).toBe(TOTAL_ACCEPTED);
      expect(c.knownHash).toBe(listed.stateHash);
    }

    // 5. a re-synced member reconstructs the same hash from snapshot+history
    const victim = live[1]!;
    victim.drop();
    const revived = await freshClient(srv.port);
    const fs = await revived.join(victim.roomId, { actorId: victim.actorId, resumeToken: victim.resumeToken });
    expect(fs.revision).toBe(TOTAL_ACCEPTED);
    expect(fs.stateHash).toBe(listed.stateHash);
    expect(fs.snapshot.revision).toBe(0); // snapshotEvery disabled → genesis snapshot + full history
    expect(fs.history).toHaveLength(TOTAL_ACCEPTED);
  }, 60_000);

  it('multi-room: five rooms x four clients stay independent and bounded', async () => {
    const adapter = new CounterAdapter();
    const srv = await startRoomServer({
      adapters: [adapter],
      port: 0,
      host: '127.0.0.1',
      dataDir: null,
      sweepIntervalMs: 0,
      heartbeatMs: 60_000,
      logger: () => {},
    });
    servers.push(srv);
    const rng = mulberry32(0xBEEF);

    const roomIds: string[] = [];
    const roomClients: TestClient[][] = [];
    for (let r = 0; r < 5; r++) {
      const host = await freshClient(srv.port);
      const fs = await host.create();
      roomIds.push(fs.room.roomId);
      const group = [host];
      for (let i = 0; i < 3; i++) {
        const c = await freshClient(srv.port);
        await c.join(fs.room.roomId);
        group.push(c);
      }
      roomClients.push(group);
    }

    // 25 accepted commands per room, interleaved across rooms
    for (let i = 0; i < 25; i++) {
      for (const group of roomClients) {
        const c = pick(rng, group);
        const cid = `mr-${i}-${c.actorId}`;
        if (c.knownRev < i) {
          await c.waitFor('state_patch', (m) => m.revision >= i, 3_000).catch(() => {});
        }
        const res = await c.command(cid, c.knownRev, { kind: 'add', n: 1 });
        expect(res.type).toBe('state_patch');
        expect((res as StatePatch).revision).toBe(i + 1);
      }
    }

    const listed = srv.manager.listRooms();
    expect(listed).toHaveLength(5);
    for (const id of roomIds) {
      const meta = listed.find((r) => r.roomId === id)!;
      expect(meta.revision).toBe(25);
      for (const c of roomClients[roomIds.indexOf(id)]!) {
        // last broadcasts may still be in flight — wait for delivery first
        await c.waitFor('state_patch', (m) => m.revision >= 25, 10_000);
        expect(c.knownRev).toBe(25);
        expect(c.knownHash).toBe(meta.stateHash);
      }
    }
    expect(srv.manager.stats().connections).toBe(20);
  }, 60_000);
});
