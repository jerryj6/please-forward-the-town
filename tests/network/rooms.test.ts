/**
 * rooms.test.ts — live-server protocol tests (master §6.2 fault table).
 *
 * Real ws clients against a real server on an ephemeral port; no mocks.
 * Reconnect-window (30 min) and idle-expiry (24 h) are exercised with the
 * injected fake clock + manager.sweep(), so the literal spec values are
 * tested, not scaled-down stand-ins.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startRoomServer, type RoomServer } from '../../src/server/index.js';
import { CounterAdapter, TestClient, httpGet, sleep } from './helpers.js';
import { PROTOCOL_VERSION } from '../../src/server/protocol.js';

const MIN = 60_000;
const HOUR = 3_600_000;

interface Ctx {
  srv: RoomServer;
  clock: { t: number };
  adapter: CounterAdapter;
}

const open: TestClient[] = [];
const servers: RoomServer[] = [];

afterEach(async () => {
  while (open.length) await open.pop()!.close();
  while (servers.length) await servers.pop()!.close();
});

async function boot(opts: {
  fakeClock?: boolean;
  snapshotEvery?: number;
  reconnectWindowMs?: number;
  idleExpiryMs?: number;
  dataDir?: string | null;
} = {}): Promise<Ctx> {
  const clock = { t: 1_700_000_000_000 };
  const adapter = new CounterAdapter();
  const srv = await startRoomServer({
    adapters: [adapter],
    port: 0,
    host: '127.0.0.1',
    dataDir: opts.dataDir === undefined ? null : opts.dataDir,
    snapshotEvery: opts.snapshotEvery ?? 50,
    sweepIntervalMs: 0, // tests call srv.manager.sweep() deterministically
    heartbeatMs: 60_000,
    logger: () => {},
    ...(opts.fakeClock ? { now: () => clock.t } : {}),
    ...(opts.reconnectWindowMs !== undefined ? { reconnectWindowMs: opts.reconnectWindowMs } : {}),
    ...(opts.idleExpiryMs !== undefined ? { idleExpiryMs: opts.idleExpiryMs } : {}),
  });
  servers.push(srv);
  return { srv, clock, adapter };
}

async function client(port: number, opts: { protocolVersion?: number; noHello?: boolean } = {}): Promise<TestClient> {
  const c = await TestClient.connect(port, opts);
  open.push(c);
  return c;
}

describe('handshake', () => {
  it('requires hello first, then answers ping/pong', async () => {
    const { srv } = await boot();
    const c = await client(srv.port);
    expect(c.sessionId).toBeTruthy();
    const pong = c.waitNext('pong');
    c.send({ type: 'ping', t: 42 });
    expect((await pong).t).toBe(42);
  });

  it('rejects non-hello first messages', async () => {
    const { srv } = await boot();
    const c = await client(srv.port, { noHello: true });
    c.send({ type: 'join', room: 'NOPE' });
    const err = await c.waitNext('error');
    expect(err.code).toBe('hello_required');
  });

  it('rejects mismatched protocol versions with a clear upgrade path', async () => {
    const { srv } = await boot();
    const c = await client(srv.port, { noHello: true });
    c.send({ type: 'hello', protocolVersion: PROTOCOL_VERSION + 1 });
    const err = await c.waitNext('error');
    expect(err.code).toBe('incompatible_version');
    await new Promise<void>((r) => {
      if (c.closeCode !== null) r();
      else c.ws.once('close', () => r());
    });
    expect(c.closeCode).toBe(4002);
  });
});

describe('room lifecycle', () => {
  it('seats 1..4 across create/join and broadcasts roster', async () => {
    const { srv } = await boot();
    const a = await client(srv.port);
    const fs = await a.create({ displayName: 'alice' });
    expect(fs.seat).toBe(1);
    expect(fs.actorId).toBe('p1');
    expect(fs.room.maxSeats).toBe(4);
    const code = fs.room.roomCode;
    expect(code).toMatch(/^[A-Z2-9]{6}$/);

    const joinNotice = a.waitNext('join');
    const b = await client(srv.port);
    const fsB = await b.join(code, { displayName: 'bob' });
    expect(fsB.seat).toBe(2);
    expect(fsB.reconnected).toBe(false);
    expect((await joinNotice).actorId).toBe('p2');
    expect(fsB.members.map((m) => m.seat)).toEqual([1, 2]);

    const c = await client(srv.port);
    const fsC = await c.join(fs.room.roomId, { displayName: 'carol' }); // join by id also works
    expect(fsC.seat).toBe(3);
    const d = await client(srv.port);
    const fsD = await d.join(code);
    expect(fsD.seat).toBe(4);
    expect(fsD.members).toHaveLength(4);

    // 5th client → room_full, never an endless spinner
    const e = await client(srv.port);
    e.send({ type: 'join', room: code });
    const err = await e.waitNext('error');
    expect(err.code).toBe('room_full');
  });

  it('join of unknown room fails cleanly', async () => {
    const { srv } = await boot();
    const c = await client(srv.port);
    c.send({ type: 'join', room: 'ZZZZZZ' });
    expect((await c.waitNext('error')).code).toBe('room_not_found');
  });

  it('finished rooms reject new joiners', async () => {
    const { srv } = await boot();
    const a = await client(srv.port);
    const fs = await a.create();
    await a.command('fin', 0, { kind: 'finish' });
    const b = await client(srv.port);
    b.send({ type: 'join', room: fs.room.roomId });
    expect((await b.waitNext('error')).code).toBe('room_finished');
  });
});

describe('commands', () => {
  it('applies in revision order to all clients with identical hashes', async () => {
    const { srv } = await boot();
    const a = await client(srv.port);
    const fs = await a.create();
    const b = await client(srv.port);
    const c = await client(srv.port);
    await b.join(fs.room.roomId);
    await c.join(fs.room.roomId);

    const senders = [a, b, c];
    for (let i = 1; i <= 9; i++) {
      const s = senders[(i - 1) % 3]!;
      // ensure the sender has observed revision i-1 before basing on it
      // (rev 0 arrives as full_state on join, later revs as state_patch)
      await s.waitMatching((m) =>
        (m.type === 'state_patch' || m.type === 'full_state') && m.revision === i - 1,
      ).catch(() => {});
      const patch = await s.command(`cmd-${i}`, i - 1, { kind: 'add', n: i });
      expect(patch.type).toBe('state_patch');
      expect((patch as { revision: number }).revision).toBe(i);
    }
    for (const cl of [a, b, c]) {
      const revs = cl.patches().map((p) => p.revision);
      expect(revs).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(cl.knownRev).toBe(9);
    }
    for (let i = 1; i <= 9; i++) {
      const hs = [a, b, c].map((cl) => cl.patches().find((p) => p.revision === i)!.stateHash);
      expect(new Set(hs).size).toBe(1);
    }
  });

  it('rejects stale baseRevision without mutation', async () => {
    const { srv, adapter } = await boot();
    const a = await client(srv.port);
    await a.create();
    await a.command('c1', 0, { kind: 'add', n: 5 });
    const appliesBefore = adapter.applyCalls;
    const err = await a.command('c2', 0, { kind: 'add', n: 5 }); // rev is now 1, base 0 is stale
    expect(err.type).toBe('error');
    expect((err as { code: string }).code).toBe('stale_revision');
    expect(adapter.applyCalls).toBe(appliesBefore);
    const rooms = (await httpGet(srv.port, '/rooms')).body as { rooms: Array<{ revision: number }> };
    expect(rooms.rooms[0]!.revision).toBe(1);
  });

  it('duplicate commandId is idempotent — exactly one effect, stable ack', async () => {
    const { srv, adapter } = await boot();
    const a = await client(srv.port);
    await a.create();
    const first = await a.command('dup-1', 0, { kind: 'add', n: 7 });
    expect(first.type).toBe('state_patch');
    expect((first as { revision: number }).revision).toBe(1);
    const applies = adapter.applyCalls;

    // retry after the ack — even with a now-stale baseRevision it must be
    // recognized as the same command, not re-applied or rejected
    const dup = await a.command('dup-1', 0, { kind: 'add', n: 7 });
    expect(dup.type).toBe('state_patch');
    expect((dup as { dup?: boolean }).dup).toBe(true);
    expect((dup as { revision: number }).revision).toBe(1);
    expect((dup as { stateHash: string }).stateHash).toBe((first as { stateHash: string }).stateHash);
    expect(adapter.applyCalls).toBe(applies);
    expect(a.knownRev).toBe(1);
  });

  it('rejects invalid, adapter-rejected and crashing commands — zero partial mutation', async () => {
    const { srv, adapter } = await boot();
    const a = await client(srv.port);
    await a.create();
    await a.command('ok1', 0, { kind: 'add', n: 3 });
    const hashAfterOne = a.knownHash;

    const applies = adapter.applyCalls;
    expect((await a.command('bad1', 1, { kind: 'add', n: -2 })).type).toBe('error');
    expect((await a.command('bad2', 1, { kind: 'reject' })).type).toBe('error');
    const e3 = await a.command('bad3', 1, { kind: 'crash' });
    expect(e3.type).toBe('error');
    expect((e3 as { code: string }).code).toBe('apply_failed');

    // apply attempted once and rolled back: revision and hash unchanged
    expect(a.knownRev).toBe(1);
    const rooms = (await httpGet(srv.port, '/rooms')).body as { rooms: Array<{ stateHash: string; revision: number }> };
    expect(rooms.rooms[0]!.revision).toBe(1);
    expect(rooms.rooms[0]!.stateHash).toBe(hashAfterOne);
    expect(adapter.applyCalls).toBe(applies + 1); // only the crashing call ran
  });

  it('rejects oversized and malformed input but keeps the socket healthy', async () => {
    const { srv } = await boot();
    const a = await client(srv.port);
    await a.create();
    a.sendRaw('this is not json');
    expect((await a.waitNext('error')).code).toBe('protocol_error');
    expect((await a.command('big', 0, { kind: 'add', n: 1, note: 'x'.repeat(70 * 1024) })).type).toBe('error');
    const pong = a.waitNext('pong');
    a.send({ type: 'ping', t: 1 });
    expect((await pong).t).toBe(1);
    expect((await a.command('still-ok', 0, { kind: 'add', n: 2 })).type).toBe('state_patch');
  });

  it('records the connection-bound actor, never a spoofed payload actor', async () => {
    const { srv } = await boot();
    const a = await client(srv.port);
    const fs = await a.create();
    const b = await client(srv.port);
    await b.join(fs.room.roomId);
    // b tries to act "as" p1 via payload — server must ignore it
    const own = await b.command('spoof', 0, { kind: 'add', n: 1, actor: 'p1', as: 'p1', actorId: 'p1' });
    expect((own as { actorId: string }).actorId).toBe('p2');
    const patch = await a.waitFor('state_patch', (p) => p.commandId === 'spoof');
    expect(patch.actorId).toBe('p2');
    expect(patch.actorId).toBe(b.actorId);
  });
});

describe('reconnect + seats', () => {
  it('disconnect holds the seat; resumeToken restores seat and state', async () => {
    const { srv } = await boot({ snapshotEvery: 3 });
    const a = await client(srv.port);
    const fs = await a.create();
    const b = await client(srv.port);
    await b.join(fs.room.roomId, { displayName: 'bob' });
    for (let i = 1; i <= 4; i++) {
      await a.command(`c${i}`, i - 1, { kind: 'add', n: 1 });
    }

    // b drops; a sees a disconnected leave with a reconnect deadline
    const leaveNotice = a.waitNext('leave', (m) => m.reason === 'disconnected');
    b.drop();
    const leave = await leaveNotice;
    expect(leave.actorId).toBe(b.actorId);
    expect(leave.reconnectDeadline).toBeGreaterThan(0);

    // b resumes on a fresh socket with its token
    const joinNotice = a.waitNext('join', (m) => m.reconnected === true);
    const b2 = await client(srv.port);
    open.push(b2);
    const fsB = await b2.join(fs.room.roomId, { actorId: b.actorId, resumeToken: b.resumeToken });
    expect(fsB.reconnected).toBe(true);
    expect(fsB.seat).toBe(b.seat);
    expect(fsB.actorId).toBe(b.actorId);
    await joinNotice;

    // snapshot+history plumbing: snapshot at rev 3 (snapshotEvery=3), history=[rev4]
    expect(fsB.snapshot.revision).toBe(3);
    expect(fsB.history.map((h) => h.revision)).toEqual([4]);
    expect(fsB.revision).toBe(4);
    expect(fsB.stateHash).toBe(a.knownHash);
    expect(fsB.resumeToken).toBe(b.resumeToken);
  });

  it('rejects a bad resume token', async () => {
    const { srv } = await boot();
    const a = await client(srv.port);
    const fs = await a.create();
    const b = await client(srv.port);
    const fsB = await b.join(fs.room.roomId);
    b.drop();
    const evil = await client(srv.port);
    evil.send({ type: 'join', room: fs.room.roomId, actorId: fsB.actorId, resumeToken: 'forged' });
    expect((await evil.waitNext('error')).code).toBe('bad_resume');
  });

  it('releases the seat after the 30-minute reconnect window elapses', async () => {
    const { srv, clock } = await boot({ fakeClock: true });
    const a = await client(srv.port);
    const fs = await a.create();
    const b = await client(srv.port);
    const fsB = await b.join(fs.room.roomId);
    b.drop();
    await a.waitNext('leave', (m) => m.reason === 'disconnected' && m.actorId === fsB.actorId);
    expect(srv.manager.listRooms()[0]!.seated).toBe(2);

    // 29:59 — still held
    clock.t += 30 * MIN - 1;
    srv.manager.sweep();
    expect(srv.manager.listRooms()[0]!.seated).toBe(2);

    // 30:00 — released, other members see the expiry
    clock.t += 2;
    const expiredNotice = a.waitNext('leave', (m) => m.reason === 'reconnect_expired' && m.actorId === fsB.actorId);
    srv.manager.sweep();
    await expiredNotice;
    expect(srv.manager.listRooms()[0]!.seated).toBe(1);

    // the expired member can no longer resume; a new joiner reuses the seat
    const late = await client(srv.port);
    late.send({ type: 'join', room: fs.room.roomId, actorId: fsB.actorId, resumeToken: fsB.resumeToken });
    expect((await late.waitNext('error')).code).toBe('bad_resume');
    const newcomer = await client(srv.port);
    const fsN = await newcomer.join(fs.room.roomId);
    expect(fsN.seat).toBe(2);
  });

  it('destroys an empty room after the 24-hour idle expiry job', async () => {
    const { srv, clock } = await boot({ fakeClock: true });
    const a = await client(srv.port);
    const fs = await a.create();
    a.send({ type: 'leave' });
    await sleep(20);
    expect(srv.manager.listRooms()).toHaveLength(1);

    clock.t += 24 * HOUR - 1;
    srv.manager.sweep();
    expect(srv.manager.listRooms()).toHaveLength(1); // not yet
    clock.t += 2;
    srv.manager.sweep();
    expect(srv.manager.listRooms()).toHaveLength(0); // expired
    const c = await client(srv.port);
    c.send({ type: 'join', room: fs.room.roomId });
    expect((await c.waitNext('error')).code).toBe('room_not_found');
  });

  it('expires ephemeral (disposable) rooms on the shorter idle budget', async () => {
    const { srv, clock } = await boot({ fakeClock: true });
    const a = await client(srv.port);
    await a.create({ ephemeral: true });
    a.send({ type: 'leave' });
    await sleep(20);
    clock.t += 5 * MIN + 1; // default ephemeral idle budget
    srv.manager.sweep();
    expect(srv.manager.listRooms()).toHaveLength(0);
  });

  it('same invite on two devices: newest connection takes the seat', async () => {
    const { srv } = await boot();
    const a = await client(srv.port);
    const fs = await a.create();
    const b1 = await client(srv.port);
    const fsB = await b1.join(fs.room.roomId);
    const stolen = new Promise<number>((r) => b1.ws.once('close', (code: number) => r(code)));
    const b2 = await client(srv.port);
    open.push(b2);
    const fs2 = await b2.join(fs.room.roomId, { actorId: fsB.actorId, resumeToken: fsB.resumeToken });
    expect(fs2.seat).toBe(fsB.seat);
    expect(await stolen).toBe(4000);
  });
});

describe('no privileged host', () => {
  it('room survives the creator leaving; remaining members keep full authority', async () => {
    const { srv } = await boot();
    const creator = await client(srv.port);
    const fs = await creator.create();
    const member = await client(srv.port);
    await member.join(fs.room.roomId);

    const leaveSeen = member.waitNext('leave', (m) => m.actorId === creator.actorId);
    creator.send({ type: 'leave' });
    expect((await leaveSeen).reason).toBe('left');

    // the non-creator can still mutate authoritative state
    const patch = await member.command('m1', 0, { kind: 'add', n: 9 });
    expect(patch.type).toBe('state_patch');
    expect((patch as { actorId: string }).actorId).toBe(member.actorId);
    expect((patch as { revision: number }).revision).toBe(1);
    // and a brand-new joiner can too
    const late = await client(srv.port);
    await late.join(fs.room.roomId);
    late.command('m2', 1, { kind: 'add', n: 1 });
    const p2 = await member.waitNext('state_patch', (m) => m.revision === 2);
    expect(p2.actorId).toBe(late.actorId);
  });
});

describe('ops surface', () => {
  it('serves /healthz and /rooms', async () => {
    const { srv } = await boot();
    const a = await client(srv.port);
    const fs = await a.create();
    await a.command('x', 0, { kind: 'add', n: 1 });

    const health = await httpGet(srv.port, '/healthz');
    expect(health.status).toBe(200);
    const hb = health.body as { ok: boolean; rooms: number; connections: number; version: string };
    expect(hb.ok).toBe(true);
    expect(hb.rooms).toBe(1);
    expect(hb.connections).toBe(1);

    const rooms = await httpGet(srv.port, '/rooms');
    const list = (rooms.body as { rooms: Array<{ roomId: string; seated: number; revision: number; roomCode: string }> }).rooms;
    expect(list[0]!.roomId).toBe(fs.room.roomId);
    expect(list[0]!.roomCode).toBe(fs.room.roomCode);
    expect(list[0]!.revision).toBe(1);
    expect(list[0]!.seated).toBe(1);

    const one = await httpGet(srv.port, `/rooms/${fs.room.roomCode}`);
    expect(one.status).toBe(200);
    const missing = await httpGet(srv.port, '/rooms/NOPE');
    expect(missing.status).toBe(404);
  });
});

describe('durable recovery', () => {
  it('rebuilds rooms from snapshot+history across a server restart', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'roomstore-'));
    const first = await boot({ dataDir: dir, snapshotEvery: 2 });
    const a = await client(first.srv.port);
    const fs = await a.create();
    const b = await client(first.srv.port);
    const fsB = await b.join(fs.room.roomId);
    for (let i = 1; i <= 3; i++) {
      await a.command(`r${i}`, i - 1, { kind: 'add', n: i });
    }
    const hashBefore = a.knownHash;
    await first.srv.close(); // sockets die; rooms persist on disk

    const second = await boot({ dataDir: dir, snapshotEvery: 2 });
    expect(second.srv.manager.listRooms()).toHaveLength(1);
    const listed = second.srv.manager.listRooms()[0]!;
    expect(listed.revision).toBe(3);
    expect(listed.stateHash).toBe(hashBefore);

    // member b reconnects with its persisted token; seat is restored
    const c = await client(second.srv.port);
    const fsC = await c.join(fs.room.roomId, { actorId: fsB.actorId, resumeToken: fsB.resumeToken });
    expect(fsC.reconnected).toBe(true);
    expect(fsC.seat).toBe(fsB.seat);
    expect(fsC.stateHash).toBe(hashBefore);
    // and the room keeps accepting commands at the right revision
    const patch = await c.command('r4', 3, { kind: 'add', n: 4 });
    expect(patch.type).toBe('state_patch');
    expect((patch as { revision: number }).revision).toBe(4);
  });
});
