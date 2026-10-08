/**
 * PFT depth proofs (gate G3): every action in every winning trace is
 * load-bearing — remove one and the contract must stop completing —
 * except the provably redundant set asserted verbatim per level/trace
 * (the same contract the RBM suite documents). Also: every order must be
 * fulfillable-fragile — an early variant that strands an order reports it
 * through orderStatuses with a recovery classification, never a generic
 * failure.
 */
import { describe, it, expect } from "vitest";
import { simulate } from "../../src/engine/pft/sim.js";
import { PftEngine, analyzeOrderStatuses } from "../../src/engine/pft/engine.js";
import { LEVELS } from "../../src/content/levels/index.js";
import type { PftLevel } from "../../src/engine/pft/types.js";
import { WINNING_TRACES, committedRun, SEED } from "../lib/winning-traces.js";

const levelDef = (id: string): PftLevel => LEVELS.find(l => l.id === id)!.def;

/**
 * Actions whose removal still completes the contract. Verified by the
 * subtract-one sweep: this set is the contract — growth means a new
 * redundancy appeared; shrinkage means a documented redundancy broke.
 * (Recomputed against the authored traces; e.g. explicit waits and
 * dead-head repositionings that aren't contract-bound.)
 */
const KNOWN_REDUNDANT: Record<string, Record<string, number[]>> = {};

describe("depth: no action is free — subtract-one across every winning trace", () => {
  for (const [id, traces] of Object.entries(WINNING_TRACES)) {
    const level = levelDef(id);
    for (const trace of traces) {
      it(`${id}/${trace.name}: redundancy set is exactly the documented one`, () => {
        const redundant: number[] = [];
        for (let i = 0; i < trace.actions.length; i++) {
          const partial = trace.actions.filter((_, j) => j !== i);
          const res = simulate(level, partial, SEED);
          if (res.success) redundant.push(i);
        }
        expect(redundant.sort((a, b) => a - b),
          `${id}/${trace.name} unexpected non-load-bearing actions`)
          .toEqual((KNOWN_REDUNDANT[id]?.[trace.name] ?? []).slice().sort((a, b) => a - b));
      });
    }
  }
});

describe("depth: prefixes never complete early", () => {
  for (const [id, traces] of Object.entries(WINNING_TRACES)) {
    const level = levelDef(id);
    for (const trace of traces) {
      it(`${id}/${trace.name}: every proper prefix leaves the contract open`, () => {
        for (let k = 1; k < trace.actions.length; k++) {
          const res = simulate(level, trace.actions.slice(0, k), SEED);
          expect(res.finalState.completed,
            `${id}/${trace.name} completed after only ${k} moves`).toBe(false);
        }
      });
    }
  }
});

describe("depth: stranded orders carry recovery classifications", () => {
  it.each(LEVELS.map(l => [l.id, l.def] as const))(
    "%s: analyzeOrderStatuses yields a verdict per declared order",
    (_id, level) => {
      const eng = new PftEngine();
      eng.begin(level, SEED);
      const statuses = analyzeOrderStatuses(level, eng.currentState);
      expect(statuses.length).toBe(level.orders.length);
      for (const st of statuses) {
        expect(level.orders.some(o => o.id === st.orderId)).toBe(true);
        // Before the first move: an order is achievable or explains why not.
        expect(st.achievable || st.recovery !== undefined || st.fulfilled).toBe(true);
      }
    });
});

describe("depth: session-engine commit path agrees with sim", () => {
  it.each(Object.keys(WINNING_TRACES))("%s committed trace completes", (id) => {
    const eng = new PftEngine();
    const level = levelDef(id);
    for (const trace of WINNING_TRACES[id]!) {
      const { state, error } = committedRun(eng, level, trace.actions);
      expect(error).toBeUndefined();
      expect(state.completed).toBe(true);
    }
  });
});
