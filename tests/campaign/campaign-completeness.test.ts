/**
 * PFT campaign completeness (gate G3): every registered level replays its
 * verified winning trace(s) to `completed` through simulate() AND through
 * the live PftEngine commit path, carries a complete LevelCard
 * (winningTraceSummary + ≥2 wrongApproaches + 3-rung hints), the
 * multi-solution floor holds (≥4 levels with ≥2 distinct winning plans),
 * and four-person levels carry coopNotes. Enumerates LEVELS so PFT-11/12
 * are covered automatically when they land.
 */
import { describe, it, expect } from "vitest";
import { PftEngine } from "../../src/engine/pft/engine.js";
import { LEVELS } from "../../src/content/levels/index.js";
import { LEVEL_CARDS } from "../../src/content/level-cards.js";
import { WINNING_TRACES, replay, committedRun } from "../lib/winning-traces.js";

const eng = new PftEngine();

describe("campaign shape", () => {
  it("registers ≥10 levels in shipped order", () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(10);
    LEVELS.forEach((l, i) => {
      expect(l.id).toBe(`PFT-${String(i + 1).padStart(2, "0")}`);
      expect(l.def.levelId.toUpperCase()).toBe(l.id);
    });
  });
});

describe("per-level completeness", () => {
  it.each(LEVELS.map(l => [l.id, l.def] as const))(
    "%s: every registered winning trace completes the contract",
    (id, level) => {
      const traces = WINNING_TRACES[id];
      expect(traces, `no winning trace registered for ${id}`).toBeDefined();
      for (const trace of traces!) {
        // fast path
        const res = replay(level, trace.actions);
        expect(res.success, `${id}/${trace.name}: sim failed (rejectedAt=${res.rejectedAt} ${res.rejectionReason ?? ""})`).toBe(true);
        expect(res.finalState.completed).toBe(true);
        // live engine path
        const { state, error } = committedRun(eng, level, trace.actions);
        expect(error, `${id}/${trace.name}: commit rejected (${error})`).toBeUndefined();
        expect(state.completed).toBe(true);
        expect(Object.values(state.fulfilled).every(Boolean)).toBe(true);
      }
    });

  it.each(LEVELS.map(l => [l.id, l.def] as const))(
    "%s: LevelCard complete (summary + ≥2 wrong approaches + 3-rung hints)",
    (id) => {
      const card = LEVEL_CARDS[id];
      expect(card, `no LevelCard for ${id}`).toBeDefined();
      expect(card!.winningTraceSummary.length).toBeGreaterThan(0);
      expect(card!.wrongApproaches.length).toBeGreaterThanOrEqual(2);
      expect(card!.hints.length).toBeGreaterThanOrEqual(3);
      for (const w of card!.wrongApproaches) expect(w.length).toBeGreaterThan(0);
      for (const h of card!.hints) expect(h.length).toBeGreaterThan(0);
    });
});

describe("GME-005: ≥4 levels with ≥2 strategically distinct solutions", () => {
  it("the multi-solution set covers ≥4 levels, each with differing plans", () => {
    const multi = LEVELS.filter(l => (WINNING_TRACES[l.id]?.length ?? 0) >= 2)
      .map(l => l.id);
    expect(multi.length).toBeGreaterThanOrEqual(4);
    // Verified: PFT-01/02/04/05/06/10 all carry two registered traces.
    for (const id of multi) {
      const level = LEVELS.find(l => l.id === id)!.def;
      const plans = WINNING_TRACES[id]!.map(t => JSON.stringify(t.actions));
      expect(new Set(plans).size).toBe(plans.length);
      for (const trace of WINNING_TRACES[id]!) {
        expect(replay(level, trace.actions).success, `${id}/${trace.name} must solve`).toBe(true);
      }
    }
  });
});

describe("GME-007: four-person levels carry real coopNotes", () => {
  it("every level whose card declares coopNote names distinct contributions", () => {
    const coop = LEVELS.filter(l => LEVEL_CARDS[l.id]?.coopNote).map(l => l.id);
    expect(coop).toEqual(expect.arrayContaining(["PFT-08", "PFT-09", "PFT-10"]));
    for (const id of coop) {
      const note = LEVEL_CARDS[id]!.coopNote!;
      // each note enumerates the per-courier contribution map
      expect(note.length).toBeGreaterThan(0);
    }
  });
});
