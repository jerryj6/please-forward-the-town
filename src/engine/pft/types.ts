/**
 * PFT domain types — "Please Forward the Town" deterministic engine.
 *
 * Spec: DEVIN-CLOUD-MASTER-HANDOFF.md §II PFT-B (PFT-001..012), PFT-C,
 * §IV.5.1/5.5, §I.3.3.
 *
 * Terminology follows the master: landings/locations (nodes), compatible
 * infrastructure sockets (deploy sites), couriers, parcels, infrastructure
 * pieces in exactly one of { packed, deployed, delivered } (PFT-002).
 */

import type { Beat, CommittedAction, EntityId } from '../contracts.js';

export type NodeId = string;

/** Infrastructure kinds. PFT-01 uses only 'bridge'; the rest are defined for the curriculum (PFT-04..12). */
export type PieceKind = 'bridge' | 'stair' | 'mailbox' | 'sign' | 'ferry-craft';

/** A named landing/location on the finite graph (PFT-001). */
export interface PftNode {
  id: NodeId;
  name: string;
  /** Declared height level; stairs only connect sockets whose declared heights differ (PFT-009). */
  height: number;
  /**
   * If set, this node is physically on the infrastructure piece (e.g. a bridge midpoint).
   * Packing that piece while a courier or parcel sits here is rejected (PFT-006: packing
   * cannot delete or teleport an occupant).
   */
  mountedOn?: EntityId;
}

/** A permanent natural path that is always traversable. */
export interface NaturalEdge {
  a: NodeId;
  b: NodeId;
  label?: string;
}

/**
 * A marked compatible socket where a packed piece may be temporarily deployed (PFT-007).
 * Deployment shows exactly which nodes it connects (`connects`).
 */
export interface DeploySite {
  id: EntityId;
  name: string;
  /** The handling endpoint: a courier must stand here to deploy or pack the piece (PFT-005). */
  handlingNode: NodeId;
  /** The two nodes the deployed piece links. */
  connects: [NodeId, NodeId];
  /** Compatible piece kinds (PFT-007/PFT-009); unsupported placement is rejected. */
  accepts: PieceKind[];
}

/** Ferry service definition (level data). The ferry is a transport service with dock endpoints (PFT-004). */
export interface FerryDef {
  id: EntityId;
  name: string;
  docks: [NodeId, NodeId];
  courierCapacity: number;
  parcelCapacity: number;
  /** Shore-side handling node for pack/hand-over of a deliverable ferry (PFT-005). */
  handlingNode?: NodeId;
  startsAt: NodeId;
}

/** Where loose cargo (a parcel or a packed piece) currently is. Exactly one location per item. */
export type CargoLocation =
  | { type: 'courier'; courierId: EntityId }
  | { type: 'node'; nodeId: NodeId } // staged at a named reachable node (PFT-004)
  | { type: 'ferry'; ferryId: EntityId } // inside the ferry's cargo hold
  | { type: 'delivered'; recipientId: EntityId }; // consumed by a contract order (PFT-002)

/** Packed pieces live wherever cargo can live, but never in 'delivered'. */
export type PackedLocation = Exclude<CargoLocation, { type: 'delivered' }>;

/** Piece lifecycle — exactly one state at a time (PFT-002). */
export type PieceState =
  | { status: 'deployed'; siteId: EntityId }
  | { status: 'packed'; location: PackedLocation }
  | { status: 'delivered'; recipientId: EntityId };

export interface PieceDef {
  id: EntityId;
  kind: PieceKind;
  name: string;
  /** Marked handling endpoints where packing is legal (PFT-005). */
  handlingNodes: NodeId[];
  initial:
    | { status: 'deployed'; siteId: EntityId }
    | { status: 'packed'; location: PackedLocation };
}

export interface CourierDef {
  id: EntityId;
  name: string;
  at: NodeId;
  /** Declared cargo capacity, usually one parcel (PFT-004). */
  cargoCapacity: number;
}

export interface ParcelDef {
  id: EntityId;
  name: string;
  at: PackedLocation;
}

/** A delivery destination attached to a node (e.g. orchard, museum). */
export interface Recipient {
  id: EntityId;
  name: string;
  node: NodeId;
}

/** A courier extraction point (e.g. the East exit, later the moved post office — PFT-011). */
export interface ExitPoint {
  id: EntityId;
  name: string;
  node: NodeId;
}

/** A relay mailbox postal link: transfers parcels only, never couriers (PFT-008). */
export interface PostalLink {
  id: EntityId;
  from: NodeId;
  to: NodeId;
  /** The relay mailbox piece that must be deployed for the link to be active (PFT-008). */
  mailboxPieceId: EntityId;
}

export type OrderSubject =
  | { type: 'parcel'; parcelId: EntityId }
  | { type: 'piece'; pieceId: EntityId }
  | { type: 'courier'; courierId: EntityId }
  /** A ferry service itself as the delivery item (PFT-06 direction; unused in PFT-01). */
  | { type: 'ferry'; ferryId: EntityId };

/** A contract order: deliver item X to recipient R, or get courier C to exit E (PFT-C, PFT-011). */
export interface PftOrder {
  id: EntityId;
  label: string;
  subject: OrderSubject;
  recipientId?: EntityId;
  exitId?: EntityId;
}

/** Versioned level definition (§I.3.3). */
export interface PftLevel {
  levelId: string;
  rulesVersion: string;
  contentVersion: string;
  title: string;
  nodes: PftNode[];
  edges: NaturalEdge[];
  sites: DeploySite[];
  postalLinks: PostalLink[];
  ferries: FerryDef[];
  couriers: CourierDef[];
  parcels: ParcelDef[];
  pieces: PieceDef[];
  recipients: Recipient[];
  exits: ExitPoint[];
  orders: PftOrder[];
  /**
   * Optional par: a soft move-count target for mastery feedback. PFT planning is
   * untimed (GME-003, PFT-E); exceeding par is reported as an exact lateness
   * penalty (moves - par) and never fails the contract.
   */
  par?: number;
}

// ---------------------------------------------------------------------------
// Play state — plain JSON-serializable data only (deterministic, cloneable).
// ---------------------------------------------------------------------------

export interface CourierState {
  at: NodeId;
  /** Carried cargo: parcel ids and packed piece ids. Bounded by courier capacity (PFT-004). */
  cargo: EntityId[];
}

export interface ParcelState {
  location: CargoLocation;
}

export interface FerryState {
  /** The dock the ferry is currently at. */
  at: NodeId;
  /** Parcel/piece ids in the ferry's own cargo hold (bounded by parcelCapacity, PFT-004). */
  cargo: EntityId[];
  /** True once the ferry itself has been handed over (PFT-06 direction; false in PFT-01). */
  handedOver: boolean;
}

export interface PftPlayState {
  rulesVersion: string;
  levelId: string;
  contentVersion: string;
  /** Reserved for future seeded content; carried into the hash for version honesty (§IV.5.1). */
  seed: string;
  beat: Beat;
  couriers: Record<EntityId, CourierState>;
  parcels: Record<EntityId, ParcelState>;
  pieces: Record<EntityId, PieceState>;
  ferries: Record<EntityId, FerryState>;
  /** orderId -> fulfilled. */
  fulfilled: Record<EntityId, boolean>;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Actions — the legal verb vocabulary. Commands execute at shared planning
// boundaries (PFT-012); every action is atomic: it validates fully, then applies.
// ---------------------------------------------------------------------------

export type PftAction =
  /** Walk a courier along a path of adjacent nodes across active connections. Atomic. */
  | { type: 'travel'; courierId: EntityId; path: NodeId[] }
  /** Take a staged parcel or packed piece at the courier's node into cargo. */
  | { type: 'pickup'; courierId: EntityId; itemId: EntityId }
  /** Stage a carried item at the courier's node. */
  | { type: 'drop'; courierId: EntityId; itemId: EntityId }
  /** Move a parcel or packed piece into the ferry's cargo hold (dock staging or courier cargo). */
  | { type: 'load_ferry'; courierId: EntityId; ferryId: EntityId; itemId: EntityId }
  /** Move an item from the ferry's hold to staging at its current dock. */
  | { type: 'unload_ferry'; courierId: EntityId; ferryId: EntityId; itemId: EntityId }
  /** Ride the ferry to its other dock. Passengers' carried parcels count against parcel capacity (PFT-004). */
  | { type: 'ride_ferry'; courierId: EntityId; ferryId: EntityId; to: NodeId }
  /** Pack a deployed piece from a marked handling endpoint into cargo (PFT-005). Removes its connection (PFT-002). */
  | { type: 'pack'; courierId: EntityId; pieceId: EntityId }
  /** Deploy a packed piece at a compatible marked socket (PFT-007). Consumes the packed object into a connection. */
  | { type: 'deploy'; courierId: EntityId; pieceId: EntityId; siteId: EntityId }
  /** Hand a carried parcel or packed piece to a recipient, fulfilling its order (PFT-002: final). */
  | { type: 'deliver'; courierId: EntityId; itemId: EntityId; recipientId: EntityId }
  /** Send a staged parcel over an active relay-mailbox postal link (PFT-008; cargo only). */
  | { type: 'send'; courierId: EntityId; linkId: EntityId; parcelId: EntityId }
  /** Hand over a docked ferry itself via shore-side handling with all passengers disembarked (PFT-005/PFT-06). */
  | { type: 'hand_over_ferry'; courierId: EntityId; ferryId: EntityId; recipientId: EntityId }
  /** Idle a courier for one beat (PFT-012: idle couriers wait automatically). */
  | { type: 'wait'; courierId: EntityId };

// ---------------------------------------------------------------------------
// Stranded-order / recovery analysis (PFT-C failure/recovery, §IV.5.5).
// ---------------------------------------------------------------------------

/**
 * How a stranded order may still be recovered:
 *  - 'redeploy': a still-owned piece can be redeployed at a compatible socket to restore the route
 *    (packing a bridge early — recoverable per the master).
 *  - 'undo': the blocking cause was a final handover; only the engine's undo path restores it
 *    (delivering the bridge early — "impossible without undo" per PFT-C).
 *  - 'none': no in-world or undo recovery found within the analyzed hypotheses.
 */
export type RecoveryKind = 'redeploy' | 'undo' | 'none';

export interface StrandedOrder {
  orderId: EntityId;
  label: string;
  reason: string;
  recovery: RecoveryKind;
  recoverable: boolean;
}

/** Per-order reachability verdict used for events, evaluation detail, and tests. */
export interface OrderStatus {
  orderId: EntityId;
  fulfilled: boolean;
  achievable: boolean;
  recovery?: RecoveryKind;
  reason?: string;
}

export const ENGINE_PHASE = 'commit' as const;

/** Canonical engine event type names (GameEvent.type). */
export const PftEvent = {
  CourierMoved: 'courier.moved',
  ItemPickedUp: 'item.picked_up',
  ItemStaged: 'item.staged',
  FerryLoaded: 'ferry.loaded',
  FerryUnloaded: 'ferry.unloaded',
  FerryRidden: 'ferry.ridden',
  PiecePacked: 'piece.packed',
  PieceDeployed: 'piece.deployed',
  ItemDelivered: 'item.delivered',
  ParcelSent: 'parcel.sent',
  FerryHandedOver: 'ferry.handed_over',
  OrderFulfilled: 'order.fulfilled',
  OrderStranded: 'order.stranded',
  OrderUnstranded: 'order.unstranded',
  ContractCompleted: 'contract.completed',
  PlanUndo: 'plan.undo',
} as const;

/** PFT save envelope: embeds full state for checkpoint restore (adapter conforms to SaveEnvelope at the room layer). */
export interface PftSaveEnvelope {
  rulesVersion: string;
  levelId: string;
  checkpointHash: string;
  state: PftPlayState;
}
/** PFT replay record (§IV.5.1): bounded to the fields the deterministic verifier needs. */
export interface PftReplay {
  rulesVersion: string;
  levelId: string;
  seed: string;
  actions: CommittedAction[];
  finalHash: string;
}
