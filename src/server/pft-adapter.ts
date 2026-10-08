import { PftEngine } from "../engine/pft/engine.js";
import type { PftAction, PftLevel, PftPlayState } from "../engine/pft/types.js";
import { LEVELS } from "../content/levels/index.js";
import { sha256Hex } from "../engine/hash.js";
import type { GameAdapter, RoomDraft, RoomInitContext, RoomView, ValidationResult } from "./adapter.js";

const engine = new PftEngine();

export interface PftRoomState { levelId: string; state: PftPlayState }

function levelOf(id: string) {
  const l = LEVELS.find(x => x.id === id);
  if (!l) throw new Error(`unknown level ${id}`);
  return l.def as PftLevel;
}

function stable(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${stable(o[k])}`).join(",")}}`;
}

export const pftAdapter: GameAdapter<PftRoomState> = {
  gameType: "pft",
  rulesVersion: "pft-rules/1.0.0",

  initRoomState(ctx: RoomInitContext): PftRoomState {
    const levelId = ctx.seed?.match(/^PFT-\d+/) ? ctx.seed : "PFT-01";
    return { levelId, state: engine.createInitialState(levelOf(levelId)) };
  },

  validateCommand(room: RoomView<PftRoomState>, _actorId: string, cmd: unknown): ValidationResult {
    const a = cmd as PftAction;
    if (!a || typeof a !== "object" || !("type" in a)) return { ok: false, reason: "malformed action" };
    const r = engine.validateAction(levelOf(room.state.levelId), room.state.state, a);
    return r.ok ? { ok: true } : { ok: false, reason: r.reason ?? "illegal action" };
  },

  applyCommand(room: RoomDraft<PftRoomState>, _actorId: string, cmd: unknown): unknown[] {
    const res = engine.applyAction(levelOf(room.state.levelId), room.state.state, cmd as PftAction);
    room.state.state = res.state;
    return res.events;
  },

  snapshot(room: RoomView<PftRoomState>): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(room.state));
  },
  restore(draft: { state: PftRoomState }, bytes: Uint8Array): void {
    draft.state = JSON.parse(new TextDecoder().decode(bytes)) as PftRoomState;
  },
  hashState(room: RoomView<PftRoomState>): string {
    return sha256Hex(stable(room.state));
  },
  isFinished(room: RoomView<PftRoomState>): boolean {
    return (room.state.state as { completed?: boolean }).completed === true;
  },
};
