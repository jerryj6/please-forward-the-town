/**
 * store.ts — durable snapshot + command-history persistence.
 *
 * Purpose (master handoff §3.4): "Recover server restarts from durable
 * snapshots/action history." Each room is one JSONL file under the data dir:
 *
 *   {"kind":"meta", ...}            roster, tokens, room meta (rewritten whole)
 *   {"kind":"snapshot", ...}        latest adapter snapshot (base64) + hash
 *   {"kind":"cmd", ...}             every committed command after the snapshot
 *
 * A `snapshot` record is written by rewriting the whole file (meta + snapshot
 * + post-snapshot command tail), which keeps files bounded at ~snapshotEvery
 * commands; `cmd` records are cheap appends between snapshots. On boot the
 * manager restores state = snapshot + deterministic re-application of the
 * tail commands.
 *
 * Writes are synchronous: files are small, ordering is trivially correct, and
 * a crash between writes leaves at most one torn trailing line — the reader
 * discards unparseable trailing records.
 */
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync, unlinkSync, appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { HistoryEntry } from './protocol.js';
import { b64decode, b64encode } from './protocol.js';

export interface StoredMember {
  actorId: string;
  seat: number;
  displayName: string;
  resumeToken: string;
  joinedAt: number;
}

export interface RoomMetaRecord {
  roomId: string;
  roomCode: string;
  gameType: string;
  rulesVersion: string;
  contentHash: string;
  createdAt: number;
  maxSeats: number;
  ephemeral: boolean;
  seed?: string;
  nextActorSeq: number;
  members: StoredMember[];
}

export interface StoredSnapshot {
  revision: number;
  bytes: Uint8Array;
  stateHash: string;
}

export interface StoredRoom {
  meta: RoomMetaRecord;
  snapshot: StoredSnapshot;
  /** Committed commands with revision > snapshot.revision. */
  commands: HistoryEntry[];
}

export interface RoomStore {
  createRoom(meta: RoomMetaRecord, snapshot: StoredSnapshot): void;
  saveMeta(meta: RoomMetaRecord): void;
  appendCommand(roomId: string, entry: HistoryEntry): void;
  /** Rewrite the room file as meta + snapshot + the given post-snapshot tail. */
  saveSnapshot(meta: RoomMetaRecord, snapshot: StoredSnapshot, tail: HistoryEntry[]): void;
  deleteRoom(roomId: string): void;
  listRooms(): StoredRoom[];
}

export class FileRoomStore implements RoomStore {
  private dir: string;

  constructor(dir: string) {
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
  }

  private file(roomId: string): string {
    return join(this.dir, `${encodeURIComponent(roomId)}.jsonl`);
  }

  createRoom(meta: RoomMetaRecord, snapshot: StoredSnapshot): void {
    this.writeFile(meta, snapshot, []);
  }

  saveMeta(meta: RoomMetaRecord): void {
    const room = this.readFile(this.file(meta.roomId));
    if (!room) return;
    this.writeFile(meta, room.snapshot, room.commands);
  }

  appendCommand(roomId: string, entry: HistoryEntry): void {
    const f = this.file(roomId);
    if (!existsSync(f)) return;
    appendFileSync(f, JSON.stringify({ kind: 'cmd', entry }) + '\n', 'utf8');
  }

  saveSnapshot(meta: RoomMetaRecord, snapshot: StoredSnapshot, tail: HistoryEntry[]): void {
    this.writeFile(meta, snapshot, tail);
  }

  deleteRoom(roomId: string): void {
    const f = this.file(roomId);
    if (existsSync(f)) unlinkSync(f);
  }

  listRooms(): StoredRoom[] {
    const out: StoredRoom[] = [];
    if (!existsSync(this.dir)) return out;
    for (const name of readdirSync(this.dir)) {
      if (!name.endsWith('.jsonl')) continue;
      const room = this.readFile(join(this.dir, name));
      if (room) out.push(room);
    }
    return out;
  }

  /* ---------------------------------------------------------------- */

  private writeFile(meta: RoomMetaRecord, snap: StoredSnapshot, tail: HistoryEntry[]): void {
    const lines = [
      JSON.stringify({ kind: 'meta', meta }),
      JSON.stringify({
        kind: 'snapshot',
        revision: snap.revision,
        stateHash: snap.stateHash,
        data: b64encode(snap.bytes),
      }),
      ...tail.map((entry) => JSON.stringify({ kind: 'cmd', entry })),
    ];
    const f = this.file(meta.roomId);
    const tmp = `${f}.tmp`;
    writeFileSync(tmp, lines.join('\n') + '\n', 'utf8');
    renameSync(tmp, f); // atomic-ish replace
  }

  private readFile(path: string): StoredRoom | null {
    if (!existsSync(path)) return null;
    let meta: RoomMetaRecord | null = null;
    let snap: StoredSnapshot | null = null;
    const commands: HistoryEntry[] = [];
    const text = readFileSync(path, 'utf8');
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      let rec: Record<string, unknown>;
      try {
        rec = JSON.parse(line) as Record<string, unknown>;
      } catch {
        continue; // torn tail record — drop it
      }
      if (rec.kind === 'meta') {
        meta = rec.meta as RoomMetaRecord;
      } else if (rec.kind === 'snapshot') {
        snap = {
          revision: rec.revision as number,
          stateHash: rec.stateHash as string,
          bytes: b64decode(rec.data as string),
        };
        // A later snapshot supersedes earlier commands on read.
        commands.length = 0;
      } else if (rec.kind === 'cmd') {
        commands.push(rec.entry as HistoryEntry);
      }
    }
    if (!meta || !snap) return null;
    return { meta, snapshot: snap, commands };
  }
}
