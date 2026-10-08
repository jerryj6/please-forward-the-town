// Human-readable renderers + stable UI slugs for PFT actions and events.

import type { GameEvent } from "../engine/contracts.js";
import type { PftAction, PftLevel } from "../engine/pft/types.js";

const NAMES: Record<string, string> = {
  west: "the west bank",
  middle: "Middle Landing",
  east: "East Shore",
  "ferry-1": "the ferry",
  lantern: "the Harbor Lantern",
  "bridge-1": "the plank bridge",
  "courier-1": "Courier Wren",
  orchard: "the East Orchard",
  museum: "the East Museum",
  "east-exit": "the east exit",
  "socket-west-middle": "the west socket",
  "order-lantern": "the lantern reaches the East Orchard",
  "order-bridge": "the bridge stands in the East Museum",
  "order-courier": "Courier Wren leaves by the east exit",
};

export function nameOf(id: string): string {
  return NAMES[id] ?? id.replace(/^[-a-z]+-/, "").replace(/-/g, " ");
}

/** Stable, readable key for a PftAction — used for DOM test ids + dedupe. */
export function actionSlug(a: PftAction): string {
  switch (a.type) {
    case "travel":
      return `travel-to-${a.path[a.path.length - 1]}`;
    case "pickup":
      return `pickup-${a.itemId}`;
    case "drop":
      return `drop-${a.itemId}`;
    case "load_ferry":
      return `load-${a.itemId}-on-${a.ferryId}`;
    case "unload_ferry":
      return `unload-${a.itemId}-from-${a.ferryId}`;
    case "ride_ferry":
      return `ride-${a.ferryId}-to-${a.to}`;
    case "pack":
      return `pack-${a.pieceId}`;
    case "deploy":
      return `deploy-${a.pieceId}-at-${a.siteId}`;
    case "deliver":
      return `deliver-${a.itemId}-to-${a.recipientId}`;
    case "send":
      return `send-${a.parcelId}-via-${a.linkId}`;
    case "hand_over_ferry":
      return `handover-${a.ferryId}-to-${a.recipientId}`;
    case "wait":
      return `wait-${a.courierId}`;
  }
}

export function describeAction(a: PftAction): string {
  switch (a.type) {
    case "travel": {
      const dest = a.path[a.path.length - 1] ?? "";
      return a.path.length > 1
        ? `Walk to ${nameOf(dest)} via ${a.path.slice(0, -1).map(nameOf).join(", ")}`
        : `Walk to ${nameOf(dest)}`;
    }
    case "pickup":
      return `Pick up ${nameOf(a.itemId)}`;
    case "drop":
      return `Set down ${nameOf(a.itemId)}`;
    case "load_ferry":
      return `Load ${nameOf(a.itemId)} aboard the ferry`;
    case "unload_ferry":
      return `Unload ${nameOf(a.itemId)} from the ferry`;
    case "ride_ferry":
      return `Ride the ferry to ${nameOf(a.to)}`;
    case "pack":
      return `Pack up ${nameOf(a.pieceId)}`;
    case "deploy":
      return `Deploy ${nameOf(a.pieceId)} at ${nameOf(a.siteId)}`;
    case "deliver":
      return `Deliver ${nameOf(a.itemId)} to ${nameOf(a.recipientId)}`;
    case "send":
      return `Send ${nameOf(a.parcelId)} by post`;
    case "hand_over_ferry":
      return `Hand the ferry over to ${nameOf(a.recipientId)}`;
    case "wait":
      return "Wait";
  }
}

export function describeEvent(e: GameEvent): string {
  const d = (e.data ?? {}) as Record<string, unknown>;
  switch (e.type) {
    case "courier.moved":
      return `${nameOf(String(d.courierId ?? ""))} walked to ${nameOf(String(d.to ?? ""))}.`;
    case "item.picked_up":
      return `${nameOf(String(d.itemId ?? ""))} is aboard.`;
    case "item.staged":
      return `${nameOf(String(d.itemId ?? ""))} set down at ${nameOf(String(d.nodeId ?? ""))}.`;
    case "ferry.loaded":
      return `${nameOf(String(d.itemId ?? ""))} loaded onto the ferry.`;
    case "ferry.unloaded":
      return `${nameOf(String(d.itemId ?? ""))} unloaded from the ferry.`;
    case "ferry.ridden":
      return `The ferry crossed to ${nameOf(String(d.to ?? ""))}.`;
    case "piece.packed":
      return `${nameOf(String(d.pieceId ?? ""))} packed — its connection is gone.`;
    case "piece.deployed":
      return `${nameOf(String(d.pieceId ?? ""))} deployed at ${nameOf(String(d.siteId ?? ""))}.`;
    case "item.delivered":
      return `${nameOf(String(d.itemId ?? ""))} delivered to ${nameOf(String(d.recipientId ?? ""))}.`;
    case "parcel.sent":
      return `${nameOf(String(d.parcelId ?? ""))} sent by post.`;
    case "ferry.handed_over":
      return `The ferry was handed over to ${nameOf(String(d.recipientId ?? ""))}.`;
    case "order.fulfilled":
      return `Order fulfilled — ${nameOf(String(d.orderId ?? ""))}.`;
    case "order.stranded":
      return `Order stranded — ${nameOf(String(d.orderId ?? ""))}${d.reason ? `: ${d.reason}` : ""}.`;
    case "order.unstranded":
      return `Order recoverable again — ${nameOf(String(d.orderId ?? ""))}.`;
    case "contract.completed":
      return "Every order is fulfilled — the contract is complete.";
    case "plan.undo":
      return "The last order was undone.";
    case "action.rejected":
      return `Refused: ${String(d.reason ?? "invalid")}.`;
    default:
      return e.type.replace(/[._]/g, " ");
  }
}

export function describeOrder(orderId: string, level: PftLevel): string {
  const o = level.orders.find((x) => x.id === orderId);
  return o?.label ?? nameOf(orderId);
}
