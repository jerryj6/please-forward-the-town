/**
 * PFT engine property tests (gate G3/G4 port): invariants that must hold
 * for ANY action sequence on ANY level.
 *
 *  - determinism: same action list → identical finalHash + events.
 *  - idempotency: the engine returns the ORIGINAL commit for a repeated
 *    actionId without re-applying (§3.4), and the room layer re-acks a
 *    resubmitted commandId with dup:true.
 *  - undo integrity: undo() restores the exact pre-commit checkpoint hash.
 *  - legality: random legal-vocabulary actions never corrupt state — every
 *    reachable field stays consistent (parcels have a location, couriers a
 *    node, fulfilled map covers every order).
 *  - well-formedness: level declarations reference only declared ids
 *    (edges→nodes, sites→nodes, ferries→docks, orders→parcels/pieces/
 *    recipients/links/ferries, postal links→mailbox sockets).
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { PftEngine } from "../../src/engine/pft/engine.js";
import { simulate } from "../../src/engine/pft/sim.js";
import { LEVELS } from "../../src/content/levels/index.js";
import { pftAdapter } from "../../src/server/pft-adapter.js";
import { RoomManager, type RoomTransport } from "../../src/server/rooms.js";
import type { ServerMessage } from "../../src/server/protocol.js";
import type { PftAction, PftLevel } from "../../src/engine/pft/types.js";

/** Random action over declared ids — legal-vocabulary fuzz. */
function arbAction(level: PftLevel): fc.Arbitrary<PftAction> {
  const couriers = level.couriers.map(c => c.id);
  const nodes = level.nodes.map(n => n.id);
  const items = [...level.parcels.map(p => p.id), ...level.pieces.map(p => p.id)];
  const ferries = level.ferries.map(f => f.id);
  const sites = level.sites.map(s => s.id);
  const links = level.postalLinks.map(l => l.id);
  const recipients = level.recipients.map(r => r.id);
  const alts: fc.Arbitrary<PftAction>[] = [
    fc.record({
      type: fc.constant("travel" as const),
      courierId: fc.constantFrom(...couriers),
      path: fc.array(fc.constantFrom(...nodes), { minLength: 1, maxLength: 4 }),
    }),
    fc.record({
      type: fc.constant("pickup" as const),
      courierId: fc.constantFrom(...couriers),
      itemId: fc.constantFrom(...items),
    }),
    fc.record({
      type: fc.constant("drop" as const),
      courierId: fc.constantFrom(...couriers),
      itemId: fc.constantFrom(...items),
    }),
    fc.record({
      type: fc.constant("pack" as const),
      courierId: fc.constantFrom(...couriers),
      pieceId: fc.constantFrom(...level.pieces.map(p => p.id)),
    }),
    fc.record({
      type: fc.constant("deploy" as const),
      courierId: fc.constantFrom(...couriers),
      pieceId: fc.constantFrom(...level.pieces.map(p => p.id)),
      siteId: fc.constantFrom(...(sites.length ? sites : ["none"])),
    }),
    fc.record({
      type: fc.constant("deliver" as const),
      courierId: fc.constantFrom(...couriers),
      itemId: fc.constantFrom(...items),
      recipientId: fc.constantFrom(...recipients),
    }),
    fc.record({
      type: fc.constant("wait" as const),
      courierId: fc.constantFrom(...couriers),
    }),
  ];
  if (ferries.length) {
    alts.push(
      fc.record({
        type: fc.constant("ride_ferry" as const),
        courierId: fc.constantFrom(...couriers),
        ferryId: fc.constantFrom(...ferries),
        to: fc.constantFrom(...nodes),
      }),
      fc.record({
        type: fc.constant("load_ferry" as const),
        courierId: fc.constantFrom(...couriers),
        ferryId: fc.constantFrom(...ferries),
        itemId: fc.constantFrom(...items),
      }),
      fc.record({
        type: fc.constant("unload_ferry" as const),
        courierId: fc.constantFrom(...couriers),
        ferryId: fc.constantFrom(...ferries),
        itemId: fc.constantFrom(...items),
      }),
    );
  }
  if (links.length) {
    alts.push(fc.record({
      type: fc.constant("send" as const),
      courierId: fc.constantFrom(...couriers),
      linkId: fc.constantFrom(...links),
      parcelId: fc.constantFrom(...level.parcels.map(p => p.id)),
    }));
  }
  return fc.oneof(...alts);
}

describe("property: determinism", () => {
  it.each(LEVELS.map(l => l.def))("%s: same action list → identical result", (level) => {
    fc.assert(
      fc.property(
        fc.array(arbAction(level), { minLength: 0, maxLength: 10 }),
        (plan) => {
          const a = simulate(level, plan, "p");
          const b = simulate(level, plan, "p");
          expect(a.finalHash).toBe(b.finalHash);
          expect(a.success).toBe(b.success);
          expect(a.rejectedAt).toBe(b.rejectedAt);
          expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
        },
      ),
      { numRuns: 15 },
    );
  });
});

describe("property: state coherence under legal-vocabulary fuzz", () => {
  it.each(LEVELS.map(l => l.def))("%s: every accepted-prefix state is self-consistent", (level) => {
    fc.assert(
      fc.property(
        fc.array(arbAction(level), { minLength: 0, maxLength: 12 }),
        (plan) => {
          const res = simulate(level, plan, "p");
          const s = res.finalState;
          // Every courier sits on a declared node.
          const nodeIds = new Set(level.nodes.map(n => n.id));
          for (const c of Object.values(s.couriers)) {
            expect(nodeIds.has(c.at), `courier at undeclared ${c.at}`).toBe(true);
          }
          // fulfilled map covers every order.
          for (const o of level.orders) {
            expect(Object.keys(s.fulfilled)).toContain(o.id);
          }
          // Every parcel has a location.
          for (const [pid, p] of Object.entries(s.parcels)) {
            expect(p.location, `parcel ${pid} has no location`).toBeDefined();
          }
        },
      ),
      { numRuns: 15 },
    );
  });
});

describe("property: engine-level actionId idempotency", () => {
  it.each(LEVELS.map(l => l.def))("%s: a repeated actionId returns the original commit, applied once", (level) => {
    const eng = new PftEngine();
    eng.begin(level, "idem");
    const c = level.couriers[0]!;
    const proposal = eng.propose("p", "act-x", { type: "wait", courierId: c.id });
    const r1 = eng.commit(proposal);
    expect(r1.ok).toBe(true);
    const rev = eng.currentRevision;
    // Re-commit the same actionId — must not re-apply.
    const r2 = eng.commit({ ...proposal });
    expect(r2.ok).toBe(true);
    expect(eng.currentRevision).toBe(rev);
    expect(r2.committed).toBe(r1.committed); // same recorded commit
  });
});

describe("property: command-id idempotency (room layer)", () => {
  it("resubmitted commandId re-acks dup:true, applied exactly once", () => {
    const sent: ServerMessage[] = [];
    const transport: RoomTransport = {
      send: (_c, m) => { sent.push(m); },
      closeConn: () => {},
    };
    const manager = new RoomManager({ adapters: [pftAdapter], transport, sweepIntervalMs: 0 });
    const created = manager.createRoom("c-1", { ephemeral: true, seed: "PFT-01" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const level = LEVELS.find(l => l.id === "PFT-01")!.def;
    const payload = { type: "wait", courierId: level.couriers[0]!.id };
    const first = manager.submitCommand("c-1", {
      commandId: "cmd-1", baseRevision: created.room.revision, payload,
    });
    expect(first.ok && !first.duplicate).toBe(true);
    const rev = created.room.revision;
    const again = manager.submitCommand("c-1", {
      commandId: "cmd-1", baseRevision: 0, payload,
    });
    expect(again.ok && again.duplicate).toBe(true);
    expect(created.room.revision).toBe(rev);
    expect(created.room.log).toHaveLength(1);
  });
});

describe("property: undo integrity", () => {
  it.each(LEVELS.map(l => l.def))("%s: undo after any accepted action restores the exact prior hash", (level) => {
    const eng = new PftEngine();
    eng.begin(level, "undo");
    const h0 = eng.canonicalHash(level, eng.currentState);
    fc.assert(
      fc.property(arbAction(level), (action) => {
        const before = eng.canonicalHash(level, eng.currentState);
        const res = eng.commit(eng.propose("u", `u-${Math.random()}`, action));
        if (!res.ok) return; // rejections don't disturb the hash
        const u = eng.undo();
        expect(u.ok).toBe(true);
        expect(eng.canonicalHash(level, eng.currentState)).toBe(before);
        void h0;
      }),
      { numRuns: 15 },
    );
  });
});

describe("property: level well-formedness", () => {
  it.each(LEVELS.map(l => [l.id, l.def] as const))("%s: every declared reference resolves", (_id, level) => {
    const nodeIds = new Set(level.nodes.map(n => n.id));
    const courierIds = new Set(level.couriers.map(c => c.id));
    const parcelIds = new Set(level.parcels.map(p => p.id));
    const pieceIds = new Set(level.pieces.map(p => p.id));
    const ferryIds = new Set(level.ferries.map(f => f.id));
    const siteIds = new Set(level.sites.map(s => s.id));
    const linkIds = new Set(level.postalLinks.map(l => l.id));
    const recipientIds = new Set(level.recipients.map(r => r.id));

    for (const e of level.edges) {
      expect(nodeIds.has(e.a) && nodeIds.has(e.b), `edge ${e.a}~${e.b} off-map`).toBe(true);
    }
    const exitIds = new Set(level.exits.map(x => x.id));
    for (const s of level.sites) {
      expect(nodeIds.has(s.handlingNode), `site ${s.id} handle off-map`).toBe(true);
      for (const n of s.connects) {
        expect(nodeIds.has(n), `site ${s.id} endpoint off-map`).toBe(true);
      }
    }
    for (const f of level.ferries) {
      for (const n of f.docks) {
        expect(nodeIds.has(n), `ferry ${f.id} dock off-map`).toBe(true);
      }
      if (f.handlingNode !== undefined) {
        expect(nodeIds.has(f.handlingNode), `ferry ${f.id} handle`).toBe(true);
      }
    }
    for (const c of level.couriers) {
      expect(nodeIds.has(c.at), `courier ${c.id} starts off-map`).toBe(true);
    }
    for (const p of level.pieces) {
      for (const n of p.handlingNodes) {
        expect(nodeIds.has(n), `piece ${p.id} handle off-map`).toBe(true);
      }
    }
    for (const l of level.postalLinks) {
      expect(nodeIds.has(l.from) && nodeIds.has(l.to), `link ${l.id} endpoint off-map`).toBe(true);
      expect(pieceIds.has(l.mailboxPieceId), `link ${l.id} relay not a piece`).toBe(true);
    }
    for (const r of level.recipients) {
      expect(nodeIds.has(r.node), `recipient ${r.id} off-map`).toBe(true);
    }
    for (const x of level.exits) {
      expect(nodeIds.has(x.node), `exit ${x.id} off-map`).toBe(true);
    }
    for (const o of level.orders) {
      const sub = o.subject;
      if (sub.type === "parcel") expect(parcelIds.has(sub.parcelId), o.id).toBe(true);
      if (sub.type === "piece") expect(pieceIds.has(sub.pieceId), o.id).toBe(true);
      if (sub.type === "courier") expect(courierIds.has(sub.courierId), o.id).toBe(true);
      if (sub.type === "ferry") expect(ferryIds.has(sub.ferryId), o.id).toBe(true);
      const dest = o.recipientId;
      if (dest !== undefined) {
        expect(recipientIds.has(dest) || exitIds.has(dest), `${o.id}: undeclared destination`).toBe(true);
      }
    }
    void siteIds;
    void linkIds;
  });
});
