/**
 * PftEngine — deterministic rules engine for "Please Forward the Town".
 *
 * Spec: DEVIN-CLOUD-MASTER-HANDOFF.md §II PFT-B/PFT-C, §I.3.3 (canonical
 * actions, history, saves), §IV.5.1 (engine is ground truth), §IV.5.5.
 *
 * Properties implemented:
 *  - Integer beats, stable entity ids, explicit event ordering, pure JSON state.
 *  - Atomic commands: an action validates completely before any mutation; a
 *    rejected action produces no partial state (PFT-006).
 *  - Plan/commit phases with base revisions and idempotent command ids (§3.4).
 *  - Undo restores a complete prior checkpoint (PFT-002, §IV.5.1).
 *  - canonicalHash: sha256 over stable-sorted canonical JSON of every
 *    gameplay-relevant field (shared sha256).
 *  - Versioned Replay / SaveEnvelope records; restore rejects version mismatch.
 */

import { sha256Hex } from '../hash.js';
import type {
  CommittedAction,
  GameEvent,
  PredicateResult,
  ProposedAction,
  Revision,
  RunEvaluation,
} from '../contracts.js';
import type { EntityId } from '../contracts.js';
import {
  ENGINE_PHASE,
  PftEvent,
  type CargoLocation,
  type NodeId,
  type OrderStatus,
  type PackedLocation,
  type PftAction,
  type PftLevel,
  type PftOrder,
  type PftPlayState,
  type PftReplay,
  type PftSaveEnvelope,
  type PieceState,
  type RecoveryKind,
} from './types.js';

export const PFT_RULES_VERSION = 'pft-rules/1.0.0';

export interface Validation {
  ok: boolean;
  reason?: string;
}

export interface CommitResult {
  ok: boolean;
  committed?: CommittedAction;
  events?: GameEvent[];
  reason?: string;
}

/** Returned by acceptResult(); a run is accepted only when the contract completed. */
export interface AcceptResult {
  accepted: boolean;
  finalHash: string;
  evaluation: RunEvaluation;
  reason?: string;
}

const ok: Validation = { ok: true };
const fail = (reason: string): Validation => ({ ok: false, reason });

// ---------------------------------------------------------------------------
// Canonical JSON: recursive key sorting so unordered collections hash stably
// (§IV.5.1 "Fix unordered collection serialization"). Cargo arrays are kept
// sorted by the mutators below so array order is canonical as well.
// ---------------------------------------------------------------------------

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const rec = value as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(rec[k])}`).join(',')}}`;
}

export function canonicalHashOf(value: unknown): string {
  return sha256Hex(canonicalize(value));
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

function sortedInsert(list: EntityId[], id: EntityId): void {
  list.push(id);
  list.sort();
}

function removeItem(list: EntityId[], id: EntityId): boolean {
  const i = list.indexOf(id);
  if (i < 0) return false;
  list.splice(i, 1);
  return true;
}

// ---------------------------------------------------------------------------
// Graph helpers. Walking uses natural edges + deployed pieces. Ferries are a
// separate service edge: a courier crosses water only via ride_ferry, but for
// reachability analysis the ferry link counts as traversable-by-courier
// (PFT-004: empty return trips are legal while the service remains available).
// ---------------------------------------------------------------------------

function addEdge(map: Map<NodeId, Set<NodeId>>, a: NodeId, b: NodeId): void {
  (map.get(a) ?? map.set(a, new Set()).get(a)!).add(b);
  (map.get(b) ?? map.set(b, new Set()).get(b)!).add(a);
}

function addDirected(map: Map<NodeId, Set<NodeId>>, a: NodeId, b: NodeId): void {
  (map.get(a) ?? map.set(a, new Set()).get(a)!).add(b);
}

/** Active walk edges: permanent paths plus deployed pieces at their sockets. */
export function walkGraph(level: PftLevel, state: PftPlayState): Map<NodeId, Set<NodeId>> {
  const g = new Map<NodeId, Set<NodeId>>();
  for (const e of level.edges) addEdge(g, e.a, e.b);
  for (const piece of level.pieces) {
    const ps = state.pieces[piece.id];
    if (ps?.status !== 'deployed') continue; // packed/delivered pieces contribute no edge (PFT-002/003)
    const site = level.sites.find((s) => s.id === ps.siteId);
    if (site) addEdge(g, site.connects[0], site.connects[1]);
  }
  return g;
}

/** Courier reachability: walk edges plus live ferry links (docks) while not handed over. */
export function courierGraph(level: PftLevel, state: PftPlayState): Map<NodeId, Set<NodeId>> {
  const g = walkGraph(level, state);
  for (const f of level.ferries) {
    const fs = state.ferries[f.id];
    if (!fs || fs.handedOver) continue;
    addEdge(g, f.docks[0], f.docks[1]);
  }
  return g;
}

/** Parcel reachability: courier graph plus active postal links (directed, PFT-008). */
export function parcelGraph(level: PftLevel, state: PftPlayState): Map<NodeId, Set<NodeId>> {
  const g = courierGraph(level, state);
  for (const link of level.postalLinks) {
    const mb = state.pieces[link.mailboxPieceId];
    if (mb?.status !== 'deployed') continue; // a packed/delivered mailbox keeps no invisible link
    addDirected(g, link.from, link.to);
  }
  return g;
}

export function reachable(graph: Map<NodeId, Set<NodeId>>, from: NodeId): Set<NodeId> {
  const seen = new Set<NodeId>([from]);
  const queue = [from];
  while (queue.length) {
    const n = queue.pop()!;
    for (const m of graph.get(n) ?? []) {
      if (!seen.has(m)) {
        seen.add(m);
        queue.push(m);
      }
    }
  }
  return seen;
}

function hasPath(graph: Map<NodeId, Set<NodeId>>, from: NodeId, to: NodeId): boolean {
  return reachable(graph, from).has(to);
}

function shortestWalkPath(
  graph: Map<NodeId, Set<NodeId>>,
  from: NodeId,
  to: NodeId,
): NodeId[] | null {
  if (from === to) return [];
  const prev = new Map<NodeId, NodeId>();
  const seen = new Set<NodeId>([from]);
  const queue = [from];
  while (queue.length) {
    const n = queue.shift()!;
    for (const m of [...(graph.get(n) ?? [])].sort()) {
      if (seen.has(m)) continue;
      seen.add(m);
      prev.set(m, n);
      if (m === to) {
        const path = [m];
        let cur = m;
        while (prev.get(cur) !== undefined) {
          cur = prev.get(cur)!;
          if (cur !== from) path.unshift(cur);
        }
        return path;
      }
      queue.push(m);
    }
  }
  return null;
}

/** The node an item is currently at, if it is still in the world (delivered items have none). */
export function itemNode(state: PftPlayState, loc: CargoLocation): NodeId | null {
  switch (loc.type) {
    case 'courier':
      return state.couriers[loc.courierId]?.at ?? null;
    case 'node':
      return loc.nodeId;
    case 'ferry':
      return state.ferries[loc.ferryId]?.at ?? null;
    case 'delivered':
      return null;
  }
}

// ---------------------------------------------------------------------------
// Order / stranded analysis (PFT-C; §IV.5.5).
// ---------------------------------------------------------------------------

function recipientNode(level: PftLevel, recipientId: EntityId | undefined): NodeId | null {
  return level.recipients.find((r) => r.id === recipientId)?.node ?? null;
}

function exitNode(level: PftLevel, exitId: EntityId | undefined): NodeId | null {
  return level.exits.find((e) => e.id === exitId)?.node ?? null;
}

/**
 * Is this order still achievable from `state`? A coarse but exact-for-PFT-01
 * reachability check: can a courier fetch and bring the subject to its target?
 */
function orderAchievable(level: PftLevel, state: PftPlayState, order: PftOrder): boolean {
  const cg = courierGraph(level, state);
  const courierReach = new Set<NodeId>();
  for (const c of level.couriers) {
    const cs = state.couriers[c.id];
    if (!cs) continue;
    for (const n of reachable(cg, cs.at)) courierReach.add(n);
  }

  const subj = order.subject;
  if (subj.type === 'courier') {
    const cs = state.couriers[subj.courierId];
    const dest = exitNode(level, order.exitId);
    if (!cs || !dest) return false;
    return hasPath(cg, cs.at, dest);
  }

  const dest = subj.type === 'ferry' ? recipientNode(level, order.recipientId) : recipientNode(level, order.recipientId);
  if (!dest) return false;

  if (subj.type === 'parcel') {
    const p = state.parcels[subj.parcelId];
    if (!p || p.location.type === 'delivered') return false;
    const at = itemNode(state, p.location);
    if (at === null) return false;
    // A courier must reach the parcel, and the parcel graph must connect it to the recipient.
    const pg = parcelGraph(level, state);
    return courierReach.has(at) && hasPath(pg, at, dest);
  }

  if (subj.type === 'piece') {
    const ps = state.pieces[subj.pieceId];
    if (!ps) return false;
    if (ps.status === 'delivered') return ps.recipientId === order.recipientId;
    if (ps.status === 'packed') {
      const at = itemNode(state, ps.location);
      return at !== null && courierReach.has(at) && hasPath(cg, at, dest);
    }
    // deployed: a courier must reach a marked handling endpoint, then carry it to the recipient.
    const piece = level.pieces.find((p) => p.id === subj.pieceId)!;
    const handle = piece.handlingNodes.find((h) => courierReach.has(h));
    return handle !== undefined && hasPath(cg, handle, dest);
  }

  if (subj.type === 'ferry') {
    const fs = state.ferries[subj.ferryId];
    const fd = level.ferries.find((f) => f.id === subj.ferryId);
    if (!fs || !fd || fs.handedOver) return false;
    const handle = fd.handlingNode;
    return handle !== undefined && courierReach.has(handle);
  }
  return false;
}

/** Is `pieceId` available for a hypothetical redeployment (still owned, reachable)? */
function pieceAvailable(
  level: PftLevel,
  state: PftPlayState,
  pieceId: EntityId,
  courierReach: Set<NodeId>,
): boolean {
  const ps = state.pieces[pieceId];
  if (!ps || ps.status === 'delivered') return false;
  if (ps.status === 'packed') {
    const loc = ps.location;
    if (loc.type === 'courier') return true; // already in someone's cargo
    const at = itemNode(state, loc);
    return at !== null && courierReach.has(at);
  }
  // deployed: reachable iff a courier can reach a handling endpoint
  const def = level.pieces.find((p) => p.id === pieceId)!;
  return def.handlingNodes.some((h) => courierReach.has(h));
}

/**
 * Classify recovery for a stranded order (PFT-C):
 *  - 'redeploy': some still-owned piece, hypothetically deployed at a compatible
 *    socket its courier can reach, restores the order.
 *  - 'undo': some delivered piece, hypothetically restored, restores the order —
 *    in-world impossible; only the engine undo path recovers it.
 *  - 'none': no single-piece hypothesis recovers it.
 */
function classifyRecovery(
  level: PftLevel,
  state: PftPlayState,
  order: PftOrder,
): RecoveryKind {
  const cg = courierGraph(level, state);
  const courierReach = new Set<NodeId>();
  for (const c of level.couriers) {
    const cs = state.couriers[c.id];
    if (cs) for (const n of reachable(cg, cs.at)) courierReach.add(n);
  }

  // Hypothesis 1: redeploy an owned piece at a compatible socket.
  for (const piece of level.pieces) {
    if (!pieceAvailable(level, state, piece.id, courierReach)) continue;
    const ps = state.pieces[piece.id]!;
    for (const site of level.sites) {
      if (!site.accepts.includes(piece.kind)) continue;
      if (ps.status === 'deployed' && ps.siteId === site.id) continue;
      if (occupiedSite(state, site.id)) continue;
      // The courier must be able to bring the piece to this socket's handling node.
      const carrying = ps.status === 'packed' && ps.location.type === 'courier';
      const pieceAt =
        ps.status === 'packed' ? itemNode(state, ps.location) : null;
      const canGetThere =
        courierReach.has(site.handlingNode) || (carrying && pieceAt === site.handlingNode);
      if (!canGetThere) continue;
      const hypo = clone(state);
      hypo.pieces[piece.id] = { status: 'deployed', siteId: site.id };
      // If the piece was carried/staged its cargo slot frees; keep it simple — deployment
      // consumes the packed object, which the hypothetical state reflects.
      if (ps.status === 'packed' && ps.location.type === 'courier') {
        const cr = hypo.couriers[(ps.location as { courierId: string }).courierId];
        if (cr) removeItem(cr.cargo, piece.id);
      }
      if (orderAchievable(level, hypo, order)) return 'redeploy';
    }
  }

  // Hypothesis 2: restore a delivered piece (the undo path).
  for (const piece of level.pieces) {
    const ps = state.pieces[piece.id];
    if (ps?.status !== 'delivered') continue;
    for (const site of level.sites) {
      if (!site.accepts.includes(piece.kind)) continue;
      if (occupiedSite(state, site.id)) continue;
      const hypo = clone(state);
      hypo.pieces[piece.id] = { status: 'deployed', siteId: site.id };
      if (orderAchievable(level, hypo, order)) return 'undo';
    }
  }
  return 'none';
}

function occupiedSite(state: PftPlayState, siteId: EntityId): boolean {
  return Object.values(state.pieces).some((p) => p.status === 'deployed' && p.siteId === siteId);
}

/** Per-order status: fulfilled / achievable / stranded-with-recovery. */
export function analyzeOrders(level: PftLevel, state: PftPlayState): OrderStatus[] {
  return level.orders.map((order) => {
    const st: OrderStatus = { orderId: order.id, fulfilled: !!state.fulfilled[order.id], achievable: false };
    if (st.fulfilled) {
      st.achievable = true;
      return st;
    }
    st.achievable = orderAchievable(level, state, order);
    if (!st.achievable) {
      const recovery = classifyRecovery(level, state, order);
      st.recovery = recovery;
      st.reason = strandedReason(level, state, order, recovery);
    }
    return st;
  });
}

function strandedReason(
  level: PftLevel,
  state: PftPlayState,
  order: PftOrder,
  recovery: RecoveryKind,
): string {
  const subj = order.subject;
  const name =
    subj.type === 'parcel'
      ? (level.parcels.find((p) => p.id === subj.parcelId)?.name ?? subj.parcelId)
      : subj.type === 'piece'
        ? (level.pieces.find((p) => p.id === subj.pieceId)?.name ?? subj.pieceId)
        : subj.type === 'ferry'
          ? (level.ferries.find((f) => f.id === subj.ferryId)?.name ?? subj.ferryId)
          : (level.couriers.find((c) => c.id === subj.courierId)?.name ?? subj.courierId);
  const dest =
    subj.type === 'courier'
      ? (level.exits.find((e) => e.id === order.exitId)?.name ?? 'the exit')
      : (level.recipients.find((r) => r.id === order.recipientId)?.name ?? 'its recipient');
  const at =
    subj.type === 'parcel'
      ? describeParcelWhere(level, state, subj.parcelId)
      : subj.type === 'courier'
        ? `at ${state.couriers[subj.courierId]?.at ?? '?'}`
        : subj.type === 'piece'
          ? describePieceWhere(level, state, subj.pieceId)
          : 'in service';
  const tail =
    recovery === 'redeploy'
      ? 'recoverable: redeploy the still-owned piece at a compatible socket'
      : recovery === 'undo'
        ? 'recoverable only via undo: the needed piece was delivered (final handover)'
        : 'no recovery hypothesis found';
  return `${name} (${at}) cannot reach ${dest} — ${tail}`;
}

function describeParcelWhere(_level: PftLevel, state: PftPlayState, id: EntityId): string {
  const p = state.parcels[id];
  if (!p) return 'missing';
  const loc = p.location;
  if (loc.type === 'node') return `staged at ${loc.nodeId}`;
  if (loc.type === 'courier') return `carried by ${loc.courierId}`;
  if (loc.type === 'ferry') return `aboard ${loc.ferryId}`;
  return `delivered to ${loc.recipientId}`;
}

function describePieceWhere(_level: PftLevel, state: PftPlayState, id: EntityId): string {
  const ps = state.pieces[id];
  if (!ps) return 'missing';
  if (ps.status === 'deployed') return `deployed at ${ps.siteId}`;
  if (ps.status === 'delivered') return `delivered to ${ps.recipientId}`;
  const loc = ps.location;
  if (loc.type === 'node') return `packed, staged at ${loc.nodeId}`;
  if (loc.type === 'courier') return `packed, carried by ${loc.courierId}`;
  return `packed, aboard ${loc.ferryId}`;
}

// ---------------------------------------------------------------------------
// The engine.
// ---------------------------------------------------------------------------

// Adapter conformance to DeterministicEngine lands with the room-server layer (NET-001);
// the API below already implements the same contract semantics with PFT-local commit/replay plumbing.
export class PftEngine {
  // ---- session state (plan/commit journal + undo checkpoints) ----
  private level: PftLevel | null = null;
  private seed = '';
  private state: PftPlayState | null = null;
  private revision: Revision = 0;
  private checkpoints: PftPlayState[] = [];
  private journal: CommittedAction[] = [];
  private committedIds = new Map<string, CommittedAction>();

  // ==================== DeterministicEngine contract (pure) ====================

  createInitialState(level: PftLevel): PftPlayState {
    const state: PftPlayState = {
      rulesVersion: level.rulesVersion,
      levelId: level.levelId,
      contentVersion: level.contentVersion,
      seed: this.seed,
      beat: 0,
      couriers: {},
      parcels: {},
      pieces: {},
      ferries: {},
      fulfilled: {},
      completed: false,
    };
    for (const c of level.couriers) state.couriers[c.id] = { at: c.at, cargo: [] };
    for (const p of level.parcels) state.parcels[p.id] = { location: clone(p.at) };
    for (const piece of level.pieces) {
      state.pieces[piece.id] =
        piece.initial.status === 'deployed'
          ? { status: 'deployed', siteId: piece.initial.siteId }
          : { status: 'packed', location: clone(piece.initial.location) };
    }
    for (const f of level.ferries) {
      state.ferries[f.id] = { at: f.startsAt, cargo: [], handedOver: false };
    }
    for (const o of level.orders) state.fulfilled[o.id] = false;
    return state;
  }

  getLegalActions(level: PftLevel, state: PftPlayState): PftAction[] {
    const actions: PftAction[] = [];
    const walk = walkGraph(level, state);
    for (const c of level.couriers) {
      const cs = state.couriers[c.id];
      if (!cs) continue;
      actions.push({ type: 'wait', courierId: c.id });

      // travel: one action per reachable node (shortest path)
      for (const node of level.nodes) {
        if (node.id === cs.at) continue;
        const path = shortestWalkPath(walk, cs.at, node.id);
        if (path && path.length > 0) actions.push({ type: 'travel', courierId: c.id, path });
      }

      // pickup: staged parcels and packed pieces at this node
      if (cs.cargo.length < c.cargoCapacity) {
        for (const p of level.parcels) {
          const ps = state.parcels[p.id];
          if (ps?.location.type === 'node' && ps.location.nodeId === cs.at) {
            actions.push({ type: 'pickup', courierId: c.id, itemId: p.id });
          }
        }
        for (const piece of level.pieces) {
          const ps = state.pieces[piece.id];
          if (
            ps?.status === 'packed' &&
            ps.location.type === 'node' &&
            ps.location.nodeId === cs.at
          ) {
            actions.push({ type: 'pickup', courierId: c.id, itemId: piece.id });
          }
        }
      }

      // drop anything carried
      for (const itemId of cs.cargo) actions.push({ type: 'drop', courierId: c.id, itemId });

      // pack: deployed piece, courier at a marked handling endpoint, capacity free
      for (const piece of level.pieces) {
        const ps = state.pieces[piece.id];
        if (ps?.status !== 'deployed') continue;
        if (this.validateAction(level, state, { type: 'pack', courierId: c.id, pieceId: piece.id }).ok) {
          actions.push({ type: 'pack', courierId: c.id, pieceId: piece.id });
        }
      }

      // deploy: packed piece carried or staged here -> compatible free socket at this node
      for (const piece of level.pieces) {
        const ps = state.pieces[piece.id];
        if (ps?.status !== 'packed') continue;
        const accessible =
          (ps.location.type === 'courier' && ps.location.courierId === c.id) ||
          (ps.location.type === 'node' && ps.location.nodeId === cs.at);
        if (!accessible) continue;
        for (const site of level.sites) {
          const a: PftAction = { type: 'deploy', courierId: c.id, pieceId: piece.id, siteId: site.id };
          if (this.validateAction(level, state, a).ok) actions.push(a);
        }
      }

      // deliver: carried item whose pending order recipient sits at this node
      for (const itemId of cs.cargo) {
        for (const order of level.orders) {
          if (state.fulfilled[order.id] || !order.recipientId) continue;
          const match =
            (order.subject.type === 'parcel' && order.subject.parcelId === itemId) ||
            (order.subject.type === 'piece' && order.subject.pieceId === itemId);
          if (!match) continue;
          const a: PftAction = {
            type: 'deliver',
            courierId: c.id,
            itemId,
            recipientId: order.recipientId,
          };
          if (this.validateAction(level, state, a).ok) actions.push(a);
        }
      }

      // ferries docked here
      for (const f of level.ferries) {
        const fs = state.ferries[f.id];
        if (!fs || fs.handedOver || fs.at !== cs.at) continue;
        for (const p of level.parcels) {
          const ps = state.parcels[p.id];
          const eligible =
            (ps?.location.type === 'node' && ps.location.nodeId === cs.at) ||
            (ps?.location.type === 'courier' && ps.location.courierId === c.id);
          if (eligible) {
            const a: PftAction = { type: 'load_ferry', courierId: c.id, ferryId: f.id, itemId: p.id };
            if (this.validateAction(level, state, a).ok) actions.push(a);
          }
        }
        for (const piece of level.pieces) {
          const ps = state.pieces[piece.id];
          if (ps?.status !== 'packed') continue;
          const eligible =
            (ps.location.type === 'node' && ps.location.nodeId === cs.at) ||
            (ps.location.type === 'courier' && ps.location.courierId === c.id);
          if (eligible) {
            const a: PftAction = { type: 'load_ferry', courierId: c.id, ferryId: f.id, itemId: piece.id };
            if (this.validateAction(level, state, a).ok) actions.push(a);
          }
        }
        for (const itemId of fs.cargo) {
          actions.push({ type: 'unload_ferry', courierId: c.id, ferryId: f.id, itemId });
        }
        const to = f.docks[0] === fs.at ? f.docks[1] : f.docks[0];
        const ride: PftAction = { type: 'ride_ferry', courierId: c.id, ferryId: f.id, to };
        if (this.validateAction(level, state, ride).ok) actions.push(ride);
        if (f.handlingNode === cs.at) {
          for (const order of level.orders) {
            if (
              order.subject.type === 'ferry' &&
              order.subject.ferryId === f.id &&
              order.recipientId &&
              !state.fulfilled[order.id]
            ) {
              const a: PftAction = {
                type: 'hand_over_ferry',
                courierId: c.id,
                ferryId: f.id,
                recipientId: order.recipientId,
              };
              if (this.validateAction(level, state, a).ok) actions.push(a);
            }
          }
        }
      }

      // relay mailbox: send staged parcels along active postal links (cargo only, PFT-008)
      for (const link of level.postalLinks) {
        if (link.from !== cs.at) continue;
        if (state.pieces[link.mailboxPieceId]?.status !== 'deployed') continue;
        for (const p of level.parcels) {
          const ps = state.parcels[p.id];
          if (ps?.location.type === 'node' && ps.location.nodeId === cs.at) {
            actions.push({ type: 'send', courierId: c.id, linkId: link.id, parcelId: p.id });
          }
        }
      }
    }
    return actions;
  }

  validateAction(level: PftLevel, state: PftPlayState, action: PftAction): Validation {
    const courier = (id: EntityId) => {
      const c = state.couriers[id];
      return c && level.couriers.some((d) => d.id === id) ? c : undefined;
    };
    const cap = (id: EntityId) => level.couriers.find((d) => d.id === id)?.cargoCapacity ?? 0;

    switch (action.type) {
      case 'wait': {
        return courier(action.courierId) ? ok : fail(`unknown courier ${action.courierId}`);
      }

      case 'travel': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        if (!action.path.length) return fail('travel path is empty');
        const walk = walkGraph(level, state);
        let prev = cs.at;
        for (const hop of action.path) {
          if (!walk.get(prev)?.has(hop)) {
            return fail(`no active connection ${prev} -> ${hop}`); // halts safely, atomically (PFT-012/006)
          }
          prev = hop;
        }
        return ok;
      }

      case 'pickup': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        if (cs.cargo.length >= cap(action.courierId)) {
          return fail(`courier ${action.courierId} cargo capacity ${cap(action.courierId)} reached`);
        }
        const staged =
          this.itemLocation(state, action.itemId)?.type === 'node' &&
          (this.itemLocation(state, action.itemId) as { nodeId: NodeId }).nodeId === cs.at;
        if (!staged) return fail(`item ${action.itemId} is not staged at ${cs.at}`);
        return ok;
      }

      case 'drop': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        if (!cs.cargo.includes(action.itemId)) return fail(`item ${action.itemId} not carried`);
        return ok;
      }

      case 'load_ferry': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        const f = level.ferries.find((x) => x.id === action.ferryId);
        const fs = state.ferries[action.ferryId];
        if (!f || !fs) return fail(`unknown ferry ${action.ferryId}`);
        if (fs.handedOver) return fail(`ferry ${f.name} has been handed over`);
        if (fs.at !== cs.at) return fail(`ferry is docked at ${fs.at}, not ${cs.at}`);
        if (fs.cargo.length >= f.parcelCapacity) {
          return fail(`ferry parcel capacity ${f.parcelCapacity} reached`); // PFT-004
        }
        const loc = this.itemLocation(state, action.itemId);
        const eligible =
          (loc?.type === 'node' && loc.nodeId === cs.at) ||
          (loc?.type === 'courier' && loc.courierId === action.courierId);
        if (!eligible) return fail(`item ${action.itemId} not at dock ${cs.at}`);
        return ok;
      }

      case 'unload_ferry': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        const fs = state.ferries[action.ferryId];
        if (!fs) return fail(`unknown ferry ${action.ferryId}`);
        if (fs.at !== cs.at) return fail(`ferry is docked at ${fs.at}, not ${cs.at}`);
        if (!fs.cargo.includes(action.itemId)) return fail(`item ${action.itemId} not aboard`);
        return ok;
      }

      case 'ride_ferry': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        const f = level.ferries.find((x) => x.id === action.ferryId);
        const fs = state.ferries[action.ferryId];
        if (!f || !fs) return fail(`unknown ferry ${action.ferryId}`);
        if (fs.handedOver) return fail(`ferry ${f.name} has been handed over`);
        if (fs.at !== cs.at) return fail(`ferry is docked at ${fs.at}, not ${cs.at}`);
        const other = f.docks[0] === fs.at ? f.docks[1] : f.docks[0];
        if (action.to !== other) return fail(`ferry at ${fs.at} only serves ${other}`);
        if (f.courierCapacity < 1) return fail('ferry courier capacity reached');
        // Parcels aboard = hold + parcels the riding courier carries: carrying a parcel
        // does not grant an extra invisible ferry slot (PFT-004).
        const aboard = fs.cargo.length + cs.cargo.length;
        if (aboard > f.parcelCapacity) {
          return fail(
            `ferry parcel capacity ${f.parcelCapacity} exceeded: ${aboard} parcels would be aboard`,
          );
        }
        return ok;
      }

      case 'pack': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        const piece = level.pieces.find((p) => p.id === action.pieceId);
        const ps = state.pieces[action.pieceId];
        if (!piece || !ps) return fail(`unknown piece ${action.pieceId}`);
        if (ps.status !== 'deployed') return fail(`piece ${piece.name} is not deployed`);
        const site = level.sites.find((s) => s.id === (ps as { siteId: string }).siteId);
        if (!site) return fail('piece deployed at unknown socket');
        // PFT-005: packing only from a marked handling endpoint of the piece.
        if (!piece.handlingNodes.includes(cs.at)) {
          return fail(
            `piece ${piece.name} can only be packed from its marked handling endpoint (${piece.handlingNodes.join('/')})`,
          );
        }
        if (!site.connects.includes(cs.at)) {
          return fail(`courier must be at the piece's endpoint to pack it`);
        }
        // PFT-006: packing cannot delete/teleport a courier or parcel occupying the structure.
        for (const node of level.nodes) {
          if (node.mountedOn !== piece.id) continue;
          const occupant = level.couriers.find((c) => state.couriers[c.id]?.at === node.id);
          if (occupant) return fail(`cannot pack: ${occupant.name} is on ${piece.name}`);
          const cargo = level.parcels.find((p) => {
            const l = state.parcels[p.id]?.location;
            return l?.type === 'node' && l.nodeId === node.id;
          });
          if (cargo) return fail(`cannot pack: ${cargo.name} is on ${piece.name}`);
        }
        if (cs.cargo.length >= cap(action.courierId)) {
          return fail(`courier ${action.courierId} cargo capacity ${cap(action.courierId)} reached`);
        }
        return ok;
      }

      case 'deploy': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        const piece = level.pieces.find((p) => p.id === action.pieceId);
        const ps = state.pieces[action.pieceId];
        if (!piece || !ps) return fail(`unknown piece ${action.pieceId}`);
        if (ps.status !== 'packed') return fail(`piece ${piece.name} is not packed cargo`);
        const accessible =
          (ps.location.type === 'courier' && ps.location.courierId === action.courierId) ||
          (ps.location.type === 'node' && ps.location.nodeId === cs.at);
        if (!accessible) return fail(`piece ${piece.name} is not at ${cs.at}`);
        const site = level.sites.find((s) => s.id === action.siteId);
        if (!site) return fail(`unknown socket ${action.siteId}`);
        if (!site.accepts.includes(piece.kind)) {
          return fail(`socket ${site.name} does not accept ${piece.kind}`); // PFT-007/009
        }
        if (site.handlingNode !== cs.at) {
          return fail(`socket ${site.name} is handled from ${site.handlingNode}, not ${cs.at}`);
        }
        if (occupiedSite(state, site.id)) return fail(`socket ${site.name} is occupied`);
        if (piece.kind === 'stair') {
          const h0 = level.nodes.find((n) => n.id === site.connects[0])?.height ?? 0;
          const h1 = level.nodes.find((n) => n.id === site.connects[1])?.height ?? 0;
          if (h0 === h1) return fail(`stairs need differing declared heights (PFT-009)`);
        }
        return ok;
      }

      case 'deliver': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        if (!cs.cargo.includes(action.itemId)) return fail(`item ${action.itemId} not carried`);
        const recipient = level.recipients.find((r) => r.id === action.recipientId);
        if (!recipient) return fail(`unknown recipient ${action.recipientId}`);
        if (cs.at !== recipient.node) {
          return fail(`recipient ${recipient.name} is at ${recipient.node}, not ${cs.at}`);
        }
        const order = level.orders.find(
          (o) =>
            !state.fulfilled[o.id] &&
            o.recipientId === action.recipientId &&
            ((o.subject.type === 'parcel' && o.subject.parcelId === action.itemId) ||
              (o.subject.type === 'piece' && o.subject.pieceId === action.itemId)),
        );
        if (!order) return fail(`no open order for ${action.itemId} at ${recipient.name}`);
        return ok;
      }

      case 'send': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        const link = level.postalLinks.find((l) => l.id === action.linkId);
        if (!link) return fail(`unknown postal link ${action.linkId}`);
        if (cs.at !== link.from) return fail(`link origin is ${link.from}, not ${cs.at}`);
        if (state.pieces[link.mailboxPieceId]?.status !== 'deployed') {
          return fail('relay mailbox is not deployed — link inactive (PFT-008)');
        }
        const loc = this.itemLocation(state, action.parcelId);
        const piece = state.pieces[action.parcelId];
        if (piece) return fail('only parcels travel postal links (PFT-008)');
        if (loc?.type !== 'node' || loc.nodeId !== link.from) {
          return fail(`parcel ${action.parcelId} not staged at ${link.from}`);
        }
        return ok;
      }

      case 'hand_over_ferry': {
        const cs = courier(action.courierId);
        if (!cs) return fail(`unknown courier ${action.courierId}`);
        const f = level.ferries.find((x) => x.id === action.ferryId);
        const fs = state.ferries[action.ferryId];
        if (!f || !fs) return fail(`unknown ferry ${action.ferryId}`);
        if (fs.handedOver) return fail('ferry already handed over');
        if (!f.handlingNode) return fail('ferry is not a delivery item in this contract');
        if (cs.at !== f.handlingNode || fs.at !== f.handlingNode) {
          return fail(`shore-side handling is at ${f.handlingNode} (PFT-005)`);
        }
        if (fs.cargo.length) return fail('ferry hold must be empty for hand-over (PFT-005)');
        const order = level.orders.find(
          (o) =>
            !state.fulfilled[o.id] &&
            o.subject.type === 'ferry' &&
            o.subject.ferryId === action.ferryId &&
            o.recipientId === action.recipientId,
        );
        if (!order) return fail(`no open order for ${f.name} at ${action.recipientId}`);
        const recipient = level.recipients.find((r) => r.id === action.recipientId);
        if (!recipient || recipient.node !== cs.at) {
          return fail(`recipient is not at ${cs.at}`);
        }
        return ok;
      }
    }
  }

  applyAction(level: PftLevel, state: PftPlayState, action: PftAction): { state: PftPlayState; events: GameEvent[] } {
    const v = this.validateAction(level, state, action);
    if (!v.ok) throw new Error(`illegal action ${action.type}: ${v.reason}`);

    const before = analyzeOrders(level, state);
    const next = clone(state);
    next.beat = state.beat + 1;
    const events: GameEvent[] = [];
    const ev = (type: string, entityId: EntityId | undefined, data?: Record<string, unknown>) => {
      events.push({ beat: next.beat, phase: ENGINE_PHASE, type, ...(entityId ? { entityId } : {}), ...(data ? { data } : {}) });
    };

    const cs = next.couriers[(action as { courierId?: EntityId }).courierId ?? ''];

    switch (action.type) {
      case 'wait':
        break;

      case 'travel': {
        const from = cs!.at;
        cs!.at = action.path[action.path.length - 1]!;
        ev(PftEvent.CourierMoved, action.courierId, { from, to: cs!.at, path: [...action.path] });
        break;
      }

      case 'pickup': {
        removeItem(cs!.cargo, action.itemId); // no-op safeguard
        sortedInsert(cs!.cargo, action.itemId);
        this.setItemLocation(next, action.itemId, { type: 'courier', courierId: action.courierId });
        ev(PftEvent.ItemPickedUp, action.itemId, { courierId: action.courierId, at: cs!.at });
        break;
      }

      case 'drop': {
        removeItem(cs!.cargo, action.itemId);
        this.setItemLocation(next, action.itemId, { type: 'node', nodeId: cs!.at });
        ev(PftEvent.ItemStaged, action.itemId, { courierId: action.courierId, at: cs!.at });
        break;
      }

      case 'load_ferry': {
        const fs = next.ferries[action.ferryId]!;
        const loc = this.itemLocation(next, action.itemId)!;
        if (loc.type === 'courier') {
          const holder = next.couriers[loc.courierId];
          if (holder) removeItem(holder.cargo, action.itemId);
        }
        this.setItemLocation(next, action.itemId, { type: 'ferry', ferryId: action.ferryId });
        sortedInsert(fs.cargo, action.itemId);
        ev(PftEvent.FerryLoaded, action.ferryId, { itemId: action.itemId, dock: fs.at });
        break;
      }

      case 'unload_ferry': {
        const fs = next.ferries[action.ferryId]!;
        removeItem(fs.cargo, action.itemId);
        this.setItemLocation(next, action.itemId, { type: 'node', nodeId: fs.at });
        ev(PftEvent.FerryUnloaded, action.ferryId, { itemId: action.itemId, dock: fs.at });
        break;
      }

      case 'ride_ferry': {
        const fs = next.ferries[action.ferryId]!;
        const from = fs.at;
        fs.at = action.to;
        cs!.at = action.to;
        ev(PftEvent.FerryRidden, action.ferryId, {
          courierId: action.courierId,
          from,
          to: action.to,
          parcelsAboard: fs.cargo.length + cs!.cargo.length,
        });
        break;
      }

      case 'pack': {
        const ps = next.pieces[action.pieceId]! as { status: 'deployed'; siteId: string };
        next.pieces[action.pieceId] = {
          status: 'packed',
          location: { type: 'courier', courierId: action.courierId },
        };
        sortedInsert(cs!.cargo, action.pieceId);
        ev(PftEvent.PiecePacked, action.pieceId, {
          courierId: action.courierId,
          fromSite: ps.siteId,
          at: cs!.at,
        });
        break;
      }

      case 'deploy': {
        const ps = next.pieces[action.pieceId]!;
        if (ps.status === 'packed' && ps.location.type === 'courier') {
          const holder = next.couriers[ps.location.courierId];
          if (holder) removeItem(holder.cargo, action.pieceId);
        }
        const site = level.sites.find((s) => s.id === action.siteId)!;
        next.pieces[action.pieceId] = { status: 'deployed', siteId: site.id };
        ev(PftEvent.PieceDeployed, action.pieceId, {
          courierId: action.courierId,
          siteId: site.id,
          connects: [...site.connects],
        });
        break;
      }

      case 'deliver': {
        removeItem(cs!.cargo, action.itemId);
        const order = level.orders.find(
          (o) =>
            !next.fulfilled[o.id] &&
            o.recipientId === action.recipientId &&
            ((o.subject.type === 'parcel' && o.subject.parcelId === action.itemId) ||
              (o.subject.type === 'piece' && o.subject.pieceId === action.itemId)),
        )!;
        this.setItemDelivered(next, action.itemId, action.recipientId);
        next.fulfilled[order.id] = true;
        ev(PftEvent.ItemDelivered, action.itemId, {
          courierId: action.courierId,
          recipientId: action.recipientId,
        });
        ev(PftEvent.OrderFulfilled, order.id, { label: order.label });
        break;
      }

      case 'send': {
        const link = level.postalLinks.find((l) => l.id === action.linkId)!;
        this.setItemLocation(next, action.parcelId, { type: 'node', nodeId: link.to });
        ev(PftEvent.ParcelSent, action.parcelId, { linkId: link.id, from: link.from, to: link.to });
        break;
      }

      case 'hand_over_ferry': {
        const fs = next.ferries[action.ferryId]!;
        fs.handedOver = true;
        const order = level.orders.find(
          (o) =>
            !next.fulfilled[o.id] &&
            o.subject.type === 'ferry' &&
            o.subject.ferryId === action.ferryId &&
            o.recipientId === action.recipientId,
        )!;
        next.fulfilled[order.id] = true;
        ev(PftEvent.FerryHandedOver, action.ferryId, { recipientId: action.recipientId });
        ev(PftEvent.OrderFulfilled, order.id, { label: order.label });
        break;
      }
    }

    // Courier extraction orders are state-based and non-sticky (PFT-011): a
    // courier order holds only while the courier stands at the exit. Item
    // deliveries are final (PFT-002) and stay fulfilled once set.
    for (const order of level.orders) {
      if (order.subject.type !== 'courier') continue;
      const exit = level.exits.find((e) => e.id === order.exitId);
      const cstate = next.couriers[order.subject.courierId];
      const now = !!exit && cstate?.at === exit.node;
      if (now && !next.fulfilled[order.id]) {
        ev(PftEvent.OrderFulfilled, order.id, { label: order.label });
      }
      next.fulfilled[order.id] = now;
    }

    // Route-severance feedback: orders that just became stranded / recovered (PFT-E).
    const after = analyzeOrders(level, next);
    for (let i = 0; i < after.length; i++) {
      const b = before[i]!;
      const a = after[i]!;
      if (!b.fulfilled && !a.fulfilled) {
        if (b.achievable && !a.achievable) {
          ev(PftEvent.OrderStranded, a.orderId, {
            recovery: a.recovery ?? 'none',
            recoverable: (a.recovery ?? 'none') !== 'none',
            reason: a.reason ?? '',
          });
        } else if (!b.achievable && a.achievable) {
          ev(PftEvent.OrderUnstranded, a.orderId, {});
        } else if (!a.achievable && !b.achievable && a.recovery !== b.recovery) {
          // Still stranded, but the recovery path changed (e.g. packed -> delivered
          // turns a 'redeploy' recovery into an 'undo'-only stranding).
          ev(PftEvent.OrderStranded, a.orderId, {
            recovery: a.recovery ?? 'none',
            recoverable: (a.recovery ?? 'none') !== 'none',
            reason: a.reason ?? '',
          });
        }
      }
    }

    // Completion is a live predicate over all orders (PFT-011: every courier must
    // be at the final location and every order fulfilled — simultaneously).
    const allDone = level.orders.every((o) => next.fulfilled[o.id]);
    if (allDone && !next.completed) {
      ev(PftEvent.ContractCompleted, level.levelId, { beat: next.beat });
    }
    next.completed = allDone;

    return { state: next, events };
  }

  canonicalHash(level: PftLevel, state: PftPlayState): string {
    // Every gameplay-relevant field, nothing presentation-only (§IV.5.1).
    return canonicalHashOf({
      rulesVersion: state.rulesVersion,
      levelId: state.levelId,
      contentVersion: state.contentVersion,
      seed: state.seed,
      beat: state.beat,
      couriers: state.couriers,
      parcels: state.parcels,
      pieces: state.pieces,
      ferries: state.ferries,
      fulfilled: state.fulfilled,
      completed: state.completed,
      content: {
        nodes: level.nodes.map((n) => n.id),
        edges: level.edges,
        sites: level.sites,
        postalLinks: level.postalLinks,
        ferries: level.ferries,
        orders: level.orders,
      },
    });
  }

  serialize(level: PftLevel, state: PftPlayState): string {
    const envelope: PftSaveEnvelope = {
      rulesVersion: state.rulesVersion,
      levelId: state.levelId,
      checkpointHash: this.canonicalHash(level, state),
      state,
    };
    return JSON.stringify(envelope);
  }

  restore(level: PftLevel, blob: string): PftPlayState {
    const envelope = JSON.parse(blob) as PftSaveEnvelope;
    if (envelope.rulesVersion !== level.rulesVersion) {
      throw new Error(
        `save rules version ${envelope.rulesVersion} != level ${level.rulesVersion} — no silent migration (§IV.5.1)`,
      );
    }
    if (envelope.levelId !== level.levelId) {
      throw new Error(`save is for level ${envelope.levelId}, not ${level.levelId}`);
    }
    return clone(envelope.state) as PftPlayState;
  }

  // ==================== plan/commit session API ====================

  /** Begin a session: initial state, revision 0, journal and checkpoint stack seeded. */
  begin(level: PftLevel, seed = ''): PftPlayState {
    this.level = level;
    this.seed = seed;
    this.state = this.createInitialState(level);
    this.revision = 0;
    this.checkpoints = [clone(this.state)];
    this.journal = [];
    this.committedIds = new Map();
    return this.state;
  }

  get currentState(): PftPlayState {
    if (!this.state) throw new Error('engine session not begun');
    return this.state;
  }

  get currentRevision(): Revision {
    return this.revision;
  }

  /** Draft a proposal bound to the current revision (planning phase). */
  propose(actorId: string, actionId: string, action: PftAction): ProposedAction {
    return { actorId, actionId, baseRevision: this.revision, action: action };
  }

  /**
   * Commit a proposal (commit phase): validates base revision and payload, then
   * applies atomically. Repeating an accepted actionId is idempotent — it
   * returns the original commit without applying twice (§IV.5.1, §3.4).
   */
  commit(proposal: ProposedAction): CommitResult {
    if (!this.level || !this.state) return { ok: false, reason: 'session not begun' };
    const prior = this.committedIds.get(proposal.actionId);
    if (prior) return { ok: true, committed: prior, events: [] };
    if (proposal.baseRevision !== this.revision) {
      return {
        ok: false,
        reason: `stale base revision ${proposal.baseRevision} (current ${this.revision})`,
      };
    }
    const action = proposal.action as PftAction;
    const v = this.validateAction(this.level, this.state, action);
    if (!v.ok) return { ok: false, reason: v.reason ?? 'invalid action' };
    const { state: next, events } = this.applyAction(this.level, this.state, action);
    this.state = next;
    const committed: CommittedAction = { ...proposal, revision: this.revision, committedAtBeat: this.state.beat };
    this.revision += 1;
    this.journal.push(committed);
    this.committedIds.set(proposal.actionId, committed);
    this.checkpoints.push(clone(next));
    return { ok: true, committed, events };
  }

  /**
   * Undo one committed action, restoring the complete prior checkpoint
   * (PFT-002; §IV.5.1 undo(apply(s,a)) == s). Returns false when nothing to undo.
   */
  undo(): { ok: boolean; events: GameEvent[] } {
    if (this.journal.length === 0 || this.checkpoints.length < 2) {
      return { ok: false, events: [] };
    }
    this.checkpoints.pop();
    const last = this.journal.pop()!;
    this.committedIds.delete(last.actionId);
    this.state = clone(this.checkpoints[this.checkpoints.length - 1]!);
    const ev: GameEvent = {
      beat: this.state.beat,
      phase: 'plan',
      type: PftEvent.PlanUndo,
      data: { undid: last.actionId, revision: last.revision },
    };
    return { ok: true, events: [ev] };
  }

  /** Versioned replay record (§I.3.3): level, rules, seed, ordered actions, final hash. */
  makeReplay(): PftReplay {
    if (!this.level || !this.state) throw new Error('session not begun');
    return {
      rulesVersion: this.state.rulesVersion,
      levelId: this.level.levelId,
      seed: this.seed,
      actions: [...this.journal],
      finalHash: this.canonicalHash(this.level, this.state),
    };
  }

  /** Replay a recorded run through the production engine and compare final hashes. */
  replayRun(
    level: PftLevel,
    replay: PftReplay,
  ): { ok: boolean; finalHash: string; expectedHash: string; rejectedAt?: number } {
    if (replay.rulesVersion !== level.rulesVersion || replay.levelId !== level.levelId) {
      throw new Error('replay version mismatch — refusing to silently replay under other rules');
    }
    this.begin(level, replay.seed);
    for (let i = 0; i < replay.actions.length; i++) {
      const a = replay.actions[i]!;
      const res = this.commit({
        actorId: a.actorId,
        actionId: a.actionId,
        baseRevision: a.baseRevision,
        action: a.action,
      });
      if (!res.ok) {
        return {
          ok: false,
          finalHash: this.canonicalHash(level, this.currentState),
          expectedHash: replay.finalHash,
          rejectedAt: i,
        };
      }
    }
    const finalHash = this.canonicalHash(level, this.currentState);
    return { ok: finalHash === replay.finalHash, finalHash, expectedHash: replay.finalHash };
  }

  /** Versioned save record (§I.3.3): rules/level + checkpoint hash + full state. */
  makeSave(): string {
    if (!this.level || !this.state) throw new Error('session not begun');
    return this.serialize(this.level, this.state);
  }

  /** Restore a save into this session: keeps the journal up to the checkpoint. */
  loadSave(level: PftLevel, blob: string): PftPlayState {
    const state = this.restore(level, blob);
    this.level = level;
    this.seed = state.seed;
    this.state = state;
    this.revision = 0;
    this.checkpoints = [clone(state)];
    this.journal = [];
    this.committedIds = new Map();
    return state;
  }

  /** AcceptResult only on success (contract complete); otherwise a rejection with reason. */
  acceptResult(): AcceptResult {
    if (!this.level || !this.state) throw new Error('session not begun');
    const level = this.level;
    const state = this.state;
    const evaluation = this.evaluate(level, state);
    const finalHash = this.canonicalHash(level, state);
    if (!state.completed || !evaluation.success) {
      const open = level0penOrders(level, state);
      return {
        accepted: false,
        finalHash,
        evaluation,
        reason: `contract incomplete: ${open.join(', ') || 'evaluation failed'}`,
      };
    }
    return { accepted: true, finalHash, evaluation };
  }

  /**
   * Goal evaluation (§3.3 evaluateGoals): outcomes are the contract's orders;
   * observations are engine invariants (conservation, single-state pieces,
   * no delivered-infrastructure ghost routes — PFT-F/§IV.5.5).
   */
  evaluate(level: PftLevel, state: PftPlayState): RunEvaluation {
    const outcomes: PredicateResult[] = level.orders.map((o) => ({
      predicateId: `order:${o.id}`,
      passed: !!state.fulfilled[o.id],
      ...(state.fulfilled[o.id] ? {} : { detail: `${o.label} — unfulfilled` }),
    }));

    const observations: PredicateResult[] = [];

    // Conservation: every parcel/piece exists in exactly one place/state.
    const parcelIds = new Set(level.parcels.map((p) => p.id));
    const pieceIds = new Set(level.pieces.map((p) => p.id));
    const seen = new Map<EntityId, string>();
    let conserved = true;
    const claim = (id: EntityId, where: string) => {
      if (seen.has(id)) conserved = false;
      seen.set(id, where);
    };
    for (const c of level.couriers) for (const id of state.couriers[c.id]?.cargo ?? []) claim(id, `courier ${c.id}`);
    for (const p of level.parcels) {
      const loc = state.parcels[p.id]?.location;
      if (!loc) {
        conserved = false;
        continue;
      }
      if (loc.type === 'node') claim(p.id, `node ${loc.nodeId}`);
      else if (loc.type === 'courier') claim(p.id, `courier ${loc.courierId}`);
      else if (loc.type === 'ferry') claim(p.id, `ferry ${loc.ferryId}`);
      else claim(p.id, `delivered ${loc.recipientId}`);
    }
    for (const piece of level.pieces) {
      const ps = state.pieces[piece.id];
      if (!ps) {
        conserved = false;
        continue;
      }
      if (ps.status === 'deployed') claim(piece.id, `site ${ps.siteId}`);
      else if (ps.status === 'delivered') claim(piece.id, `delivered ${ps.recipientId}`);
      else {
        const loc = ps.location;
        if (loc.type === 'node') claim(piece.id, `node ${loc.nodeId}`);
        else if (loc.type === 'courier') claim(piece.id, `courier ${loc.courierId}`);
        else claim(piece.id, `ferry ${loc.ferryId}`);
      }
    }
    for (const id of [...parcelIds, ...pieceIds]) if (!seen.has(id)) conserved = false;
    observations.push({
      predicateId: 'invariant:conservation',
      passed: conserved,
      ...(conserved ? {} : { detail: 'an item is missing or duplicated' }),
    });

    // Single-state pieces: packed/deployed/delivered are mutually exclusive by construction;
    // assert every piece sits in a legal state at a legal place (PFT-002).
    let statesLegal = true;
    for (const piece of level.pieces) {
      const ps = state.pieces[piece.id];
      if (!ps) {
        statesLegal = false;
        break;
      }
      if (ps.status === 'deployed' && !level.sites.some((s) => s.id === ps.siteId)) statesLegal = false;
      if (ps.status === 'packed') {
        const loc = ps.location as PackedLocation;
        const legal =
          (loc.type === 'courier' && !!state.couriers[loc.courierId]?.cargo.includes(piece.id)) ||
          (loc.type === 'node' && level.nodes.some((n) => n.id === loc.nodeId)) ||
          (loc.type === 'ferry' && !!state.ferries[loc.ferryId]?.cargo.includes(piece.id));
        if (!legal) statesLegal = false;
      }
    }
    observations.push({
      predicateId: 'invariant:piece-states',
      passed: statesLegal,
      ...(statesLegal ? {} : { detail: 'a piece is in an illegal state/place' }),
    });

    // No ghost route: delivered or packed pieces contribute no active connection (PFT-003).
    const activePieceSites = new Set(
      Object.entries(state.pieces)
        .filter(([, ps]) => ps.status === 'deployed')
        .map(([id, ps]) => `${id}@${(ps as { siteId: string }).siteId}`),
    );
    let ghostFree = true;
    for (const piece of level.pieces) {
      const ps = state.pieces[piece.id];
      if (ps && ps.status !== 'deployed') {
        for (const site of level.sites) {
          if (site.accepts.includes(piece.kind) && activePieceSites.has(`${piece.id}@${site.id}`)) {
            ghostFree = false;
          }
        }
      }
    }
    observations.push({
      predicateId: 'invariant:no-ghost-routes',
      passed: ghostFree,
      ...(ghostFree ? {} : { detail: 'a non-deployed piece still provides a route' }),
    });

    const allOutcomesPass = outcomes.every((o) => o.passed);
    const allObservationsPass = observations.every((o) => o.passed);
    return {
      success: allOutcomesPass && allObservationsPass,
      allObservationsPass,
      allOutcomesPass,
      observations,
      outcomes,
    };
  }

  // ---- item location plumbing ----

  itemLocation(state: PftPlayState, itemId: EntityId): CargoLocation | null {
    const p = state.parcels[itemId];
    if (p) return p.location;
    const piece = state.pieces[itemId];
    if (piece) {
      if (piece.status === 'packed') return piece.location;
      if (piece.status === 'delivered') return { type: 'delivered', recipientId: piece.recipientId };
      return null; // deployed pieces are not loose cargo
    }
    return null;
  }

  private setItemLocation(state: PftPlayState, itemId: EntityId, loc: PackedLocation): void {
    const p = state.parcels[itemId];
    if (p) {
      p.location = loc;
      return;
    }
    const piece = state.pieces[itemId];
    if (piece && piece.status === 'packed') {
      piece.location = loc;
      return;
    }
    if (piece && piece.status === 'deployed') {
      state.pieces[itemId] = { status: 'packed', location: loc };
    }
  }

  private setItemDelivered(state: PftPlayState, itemId: EntityId, recipientId: EntityId): void {
    const p = state.parcels[itemId];
    if (p) {
      p.location = { type: 'delivered', recipientId };
      return;
    }
    state.pieces[itemId] = { status: 'delivered', recipientId };
  }
}

function level0penOrders(level: PftLevel, state: PftPlayState): string[] {
  return level.orders.filter((o) => !state.fulfilled[o.id]).map((o) => o.id);
}

export { analyzeOrders as analyzeOrderStatuses };
export type { PieceState };
