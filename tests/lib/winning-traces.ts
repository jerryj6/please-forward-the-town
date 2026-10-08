/**
 * winning-traces.ts — verified winning action plans for all PFT levels,
 * mechanically extracted verbatim from the authored unit-test traces
 * (tests/unit/*.test.ts) so the campaign/depth/perf suites replay the
 * same proofs. Each entry is a raw PftAction[] driven through
 * PftEngine.begin → propose → commit until completed.
 */
import type { PftAction } from "../../src/engine/pft/types.js";
import {
  PFT11_TRACE,
  PFT12_TRACE_A,
  PFT12_TRACE_B,
} from "./pft11-12-traces.js";

export interface WinningTrace {
  readonly name: string;
  readonly actions: readonly PftAction[];
}

/** Courier/ferry shorthands preserved verbatim from the source test files. */
const C = 'courier-1';
const C3 = 'courier-1';
const W = 'courier-1';
const W5 = 'courier-1';
const W4 = 'courier-1';
const L = 'courier-2';
const L5 = 'courier-2';
const L4 = 'courier-2';
const F3 = 'courier-3';
const S = 'courier-4';
const F = 'ferry-1';

export const WINNING_TRACES: Record<string, readonly WinningTrace[]> = {
  "PFT-01": [
    { name: "TRACE_A", actions: [
  { type: 'travel', courierId: C, path: ['west'] },
  { type: 'pickup', courierId: C, itemId: 'lantern' },
  { type: 'travel', courierId: C, path: ['middle'] },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C, itemId: 'lantern', recipientId: 'orchard' },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: C, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C, itemId: 'bridge-1', recipientId: 'museum' },
] },
    { name: "TRACE_B", actions: [
  { type: 'travel', courierId: C, path: ['west'] },
  { type: 'pickup', courierId: C, itemId: 'lantern' },
  { type: 'travel', courierId: C, path: ['middle'] },
  { type: 'drop', courierId: C, itemId: 'lantern' },
  { type: 'pack', courierId: C, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: C, itemId: 'lantern' },
  { type: 'ride_ferry', courierId: C, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C, itemId: 'lantern', recipientId: 'orchard' },
] },
  ],
  "PFT-02": [
    { name: "PFT02_TRACE_A", actions: [
  { type: 'travel', courierId: W, path: ['west'] },
  { type: 'pickup', courierId: W, itemId: 'lantern' },
  { type: 'travel', courierId: W, path: ['middle'] },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'lantern', recipientId: 'orchard' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'pickup', courierId: L, itemId: 'crate' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'ride_ferry', courierId: L, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: L, itemId: 'crate', recipientId: 'greenhouse' },
  { type: 'ride_ferry', courierId: L, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // Lark home
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
] },
    { name: "PFT02_TRACE_B", actions: [
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'pickup', courierId: L, itemId: 'crate' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'drop', courierId: L, itemId: 'crate' }, // the handoff: staged on Middle
  { type: 'travel', courierId: W, path: ['west'] },
  { type: 'pickup', courierId: W, itemId: 'lantern' },
  { type: 'travel', courierId: W, path: ['middle'] },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // Lark home
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'lantern', recipientId: 'orchard' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: W, itemId: 'crate' }, // Wren takes the staged crate
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'crate', recipientId: 'greenhouse' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
] },
  ],
  "PFT-03": [
    { name: "PFT03_TRACE", actions: [
  { type: 'travel', courierId: C3, path: ['west'] },
  { type: 'pickup', courierId: C3, itemId: 'lantern' },
  { type: 'travel', courierId: C3, path: ['middle'] },
  { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C3, itemId: 'lantern', recipientId: 'orchard' },
  { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: C3, pieceId: 'bridge-1' }, // lift off the West creek
  { type: 'deploy', courierId: C3, pieceId: 'bridge-1', siteId: 'socket-north-middle' },
  { type: 'travel', courierId: C3, path: ['north'] },
  { type: 'pickup', courierId: C3, itemId: 'crate' },
  { type: 'travel', courierId: C3, path: ['middle'] },
  { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C3, itemId: 'crate', recipientId: 'boathouse' },
  { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: C3, pieceId: 'bridge-1' }, // lift off the North creek
  { type: 'ride_ferry', courierId: C3, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: C3, itemId: 'bridge-1', recipientId: 'museum' },
] },
  ],
  "PFT-04": [
    { name: "PFT04_TRACE_A", actions: [
  { type: 'pickup', courierId: L4, itemId: 'books' },
  { type: 'travel', courierId: L4, path: ['west', 'loft'] },
  { type: 'deliver', courierId: L4, itemId: 'books', recipientId: 'loft-tenant' },
  { type: 'travel', courierId: W4, path: ['west', 'loft'] },
  { type: 'pickup', courierId: W4, itemId: 'gramophone' },
  { type: 'travel', courierId: W4, path: ['west', 'middle'] },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'gramophone', recipientId: 'music-hall' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: W4, path: ['west'] },
  { type: 'pack', courierId: W4, pieceId: 'stair-1' },
  { type: 'travel', courierId: W4, path: ['middle'] },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'stair-1', recipientId: 'promenade' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W4, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'bridge-1', recipientId: 'museum' },
] },
    { name: "PFT04_TRACE_B", actions: [
  { type: 'travel', courierId: W4, path: ['west'] },
  { type: 'pack', courierId: W4, pieceId: 'stair-1' }, // lift it off the cliff foot
  { type: 'travel', courierId: W4, path: ['middle'] },
  { type: 'deploy', courierId: W4, pieceId: 'stair-1', siteId: 'socket-middle-loft' },
  { type: 'pickup', courierId: L4, itemId: 'books' },
  { type: 'travel', courierId: L4, path: ['loft'] }, // straight up the hoist
  { type: 'deliver', courierId: L4, itemId: 'books', recipientId: 'loft-tenant' },
  { type: 'travel', courierId: W4, path: ['loft'] },
  { type: 'pickup', courierId: W4, itemId: 'gramophone' },
  { type: 'travel', courierId: W4, path: ['middle'] },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'gramophone', recipientId: 'music-hall' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W4, pieceId: 'stair-1' }, // pack from the hoist's Middle end
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'stair-1', recipientId: 'promenade' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W4, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W4, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W4, itemId: 'bridge-1', recipientId: 'museum' },
] },
  ],
  "PFT-05": [
    { name: "PFT05_TRACE_A", actions: [
  { type: 'travel', courierId: L5, path: ['west'] },
  { type: 'pickup', courierId: L5, itemId: 'registry' },
  { type: 'travel', courierId: L5, path: ['north'] },
  { type: 'drop', courierId: L5, itemId: 'registry' }, // stage on the post
  { type: 'send', courierId: L5, linkId: 'link-north-east', parcelId: 'registry' },
  { type: 'pack', courierId: L5, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L5, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L5, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'pack', courierId: L5, pieceId: 'bridge-1' },
  { type: 'deliver', courierId: L5, itemId: 'bridge-1', recipientId: 'depot' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'pickup', courierId: W5, itemId: 'registry' },
  { type: 'deliver', courierId: W5, itemId: 'registry', recipientId: 'archives' },
] },
    { name: "PFT05_TRACE_B", actions: [
  { type: 'travel', courierId: L5, path: ['west'] },
  { type: 'pickup', courierId: L5, itemId: 'registry' },
  { type: 'travel', courierId: L5, path: ['north'] },
  { type: 'drop', courierId: L5, itemId: 'registry' },
  { type: 'send', courierId: L5, linkId: 'link-north-east', parcelId: 'registry' },
  { type: 'travel', courierId: L5, path: ['west', 'middle'] },
  { type: 'travel', courierId: W5, path: ['west', 'north'] },
  { type: 'pack', courierId: W5, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: W5, path: ['west', 'middle'] },
  { type: 'deliver', courierId: W5, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'pack', courierId: L5, pieceId: 'bridge-1' },
  { type: 'deliver', courierId: L5, itemId: 'bridge-1', recipientId: 'depot' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'pickup', courierId: W5, itemId: 'registry' },
  { type: 'deliver', courierId: W5, itemId: 'registry', recipientId: 'archives' },
] },
  ],
  "PFT-06": [
    { name: "PFT06_TRACE_A", actions: [
  { type: 'travel', courierId: L5, path: ['west', 'north'] },
  { type: 'pickup', courierId: L5, itemId: 'crate' },
  { type: 'travel', courierId: L5, path: ['west', 'middle'] },
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: L5, itemId: 'crate', recipientId: 'boathouse' },
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: L5, path: ['west'] },
  { type: 'pickup', courierId: L5, itemId: 'piano' },
  { type: 'travel', courierId: L5, path: ['middle'] },
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: L5, itemId: 'piano', recipientId: 'conservatory' },
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: L5, path: ['west'] }, // home by land
  { type: 'pack', courierId: W5, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W5, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'hand_over_ferry', courierId: W5, ferryId: F, recipientId: 'harbor-master' },
] },
    { name: "PFT06_TRACE_B", actions: [
  { type: 'travel', courierId: L5, path: ['west', 'north'] },
  { type: 'pickup', courierId: L5, itemId: 'crate' },
  { type: 'travel', courierId: L5, path: ['west', 'middle'] },
  { type: 'load_ferry', courierId: L5, ferryId: F, itemId: 'crate' }, // crate waits in the hold
  { type: 'travel', courierId: L5, path: ['west'] },
  { type: 'pickup', courierId: L5, itemId: 'piano' },
  { type: 'travel', courierId: L5, path: ['middle'] },
  { type: 'drop', courierId: L5, itemId: 'piano' }, // staged on the dock
  { type: 'travel', courierId: L5, path: ['west'] }, // home by land
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' }, // hold rides across
  { type: 'unload_ferry', courierId: W5, ferryId: F, itemId: 'crate' },
  { type: 'pickup', courierId: W5, itemId: 'crate' },
  { type: 'deliver', courierId: W5, itemId: 'crate', recipientId: 'boathouse' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: W5, itemId: 'piano' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W5, itemId: 'piano', recipientId: 'conservatory' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W5, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W5, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'hand_over_ferry', courierId: W5, ferryId: F, recipientId: 'harbor-master' },
] },
  ],
  "PFT-07": [
    { name: "PFT07_TRACE", actions: [
  { type: 'travel', courierId: L5, path: ['west'] },
  { type: 'pack', courierId: L5, pieceId: 'sign-1' }, // the old address goes dark
  { type: 'travel', courierId: L5, path: ['middle'] },
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'east' },
  { type: 'deploy', courierId: L5, pieceId: 'sign-1', siteId: 'signpost-new' }, // the new address stands
  { type: 'ride_ferry', courierId: L5, ferryId: F, to: 'middle' },
  { type: 'travel', courierId: L5, path: ['west'] }, // home through the West gate
  { type: 'travel', courierId: W5, path: ['west', 'north'] },
  { type: 'pickup', courierId: W5, itemId: 'tea' },
  { type: 'travel', courierId: W5, path: ['west', 'middle'] },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'travel', courierId: W5, path: ['new-lot'] }, // up the new lane
  { type: 'deliver', courierId: W5, itemId: 'tea', recipientId: 'greene-new' },
  { type: 'travel', courierId: W5, path: ['east'] },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W5, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W5, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W5, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'pack', courierId: W5, pieceId: 'sign-1' }, // new lane retired, sign is cargo again
  { type: 'deliver', courierId: W5, itemId: 'sign-1', recipientId: 'registry' },
] },
  ],
  "PFT-08": [
    { name: "PFT08_TRACE", actions: [
  { type: 'travel', courierId: W, path: ['west', 'north'] },
  { type: 'pickup', courierId: W, itemId: 'sunstone' },
  { type: 'travel', courierId: W, path: ['west', 'middle'] },
  { type: 'travel', courierId: W, path: ['east'] }, // walks the Town Span
  { type: 'deliver', courierId: W, itemId: 'sunstone', recipientId: 'archives' },
  { type: 'travel', courierId: L, path: ['west'] },
  { type: 'pickup', courierId: L, itemId: 'ledger' },
  { type: 'travel', courierId: L, path: ['middle', 'east', 'slip'] },
  { type: 'deliver', courierId: L, itemId: 'ledger', recipientId: 'annex' },
  { type: 'travel', courierId: L, path: ['east', 'middle'] },
  { type: 'pack', courierId: L, pieceId: 'bridge-1' },
  { type: 'travel', courierId: L, path: ['east'] }, // carries the plank over the span
  { type: 'deliver', courierId: L, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'travel', courierId: L, path: ['slip'] },
  { type: 'pickup', courierId: F3, itemId: 'engine' },
  { type: 'ride_ferry', courierId: F3, ferryId: F, to: 'east' },
  { type: 'travel', courierId: F3, path: ['slip'] },
  { type: 'deliver', courierId: F3, itemId: 'engine', recipientId: 'drydock' },
  { type: 'hand_over_ferry', courierId: S, ferryId: F, recipientId: 'harbor-master' },
  { type: 'pack', courierId: S, pieceId: 'bridge-2' }, // span lifted at its East foot
  { type: 'deliver', courierId: S, itemId: 'bridge-2', recipientId: 'foundry' },
] },
  ],
  "PFT-09": [
    { name: "PFT09_TRACE", actions: [
  // Lark — the postal leg.
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'records' },
  { type: 'pack', courierId: L, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // home at the North post
  // Finch — the stair leg.
  { type: 'travel', courierId: F3, path: ['west', 'loft'] },
  { type: 'pickup', courierId: F3, itemId: 'tapestry' },
  { type: 'travel', courierId: F3, path: ['west', 'middle'] },
  { type: 'drop', courierId: F3, itemId: 'tapestry' }, // staged for the boat
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pack', courierId: F3, pieceId: 'stair-1' }, // loft empty — legal
  { type: 'travel', courierId: F3, path: ['middle'] },
  { type: 'drop', courierId: F3, itemId: 'stair-1' },
  // Wren — the market leg.
  { type: 'travel', courierId: W, path: ['west'] },
  { type: 'pickup', courierId: W, itemId: 'tea' },
  { type: 'travel', courierId: W, path: ['middle'] },
  { type: 'drop', courierId: W, itemId: 'tea' },
  { type: 'travel', courierId: W, path: ['west'] }, // home at the West gate
  // Sparrow — the ferryman and closer.
  { type: 'pickup', courierId: S, itemId: 'tea' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: S, itemId: 'tea', recipientId: 'conservatory' },
  { type: 'pickup', courierId: S, itemId: 'records' },
  { type: 'deliver', courierId: S, itemId: 'records', recipientId: 'archives' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: S, itemId: 'tapestry' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'travel', courierId: S, path: ['slip'] },
  { type: 'deliver', courierId: S, itemId: 'tapestry', recipientId: 'gallery' },
  { type: 'travel', courierId: S, path: ['east'] },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: S, itemId: 'stair-1' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: S, itemId: 'stair-1', recipientId: 'observatory' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: S, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: S, itemId: 'bridge-1', recipientId: 'museum' },
] },
  ],
  "PFT-10": [
    { name: "PFT10_TRACE_A", actions: [
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pickup', courierId: F3, itemId: 'cider' },
  { type: 'travel', courierId: F3, path: ['middle'] },
  { type: 'drop', courierId: F3, itemId: 'cider' },
  { type: 'travel', courierId: F3, path: ['west'] }, // West gate
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'deeds' },
  { type: 'pack', courierId: L, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // North post
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'pickup', courierId: S, itemId: 'deeds' },
  { type: 'deliver', courierId: S, itemId: 'deeds', recipientId: 'registry' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' }, // dock office
  { type: 'pickup', courierId: W, itemId: 'cider' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'cider', recipientId: 'tavern' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: W, itemId: 'granite' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'travel', courierId: W, path: ['slip'] },
  { type: 'deliver', courierId: W, itemId: 'granite', recipientId: 'monument' },
  { type: 'travel', courierId: W, path: ['east'] },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
] },
    { name: "PFT10_TRACE_B", actions: [
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pickup', courierId: F3, itemId: 'cider' },
  { type: 'travel', courierId: F3, path: ['north'] },
  { type: 'drop', courierId: F3, itemId: 'cider' },
  { type: 'send', courierId: F3, linkId: 'link-north-east', parcelId: 'cider' },
  { type: 'travel', courierId: F3, path: ['west'] }, // West gate
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'deeds' },
  { type: 'pack', courierId: L, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // North post
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deploy', courierId: W, pieceId: 'bridge-1', siteId: 'socket-town-span' },
  { type: 'travel', courierId: W, path: ['middle'] }, // walks the span it just set
  { type: 'pickup', courierId: W, itemId: 'granite' },
  { type: 'travel', courierId: W, path: ['east', 'slip'] },
  { type: 'deliver', courierId: W, itemId: 'granite', recipientId: 'monument' },
  { type: 'travel', courierId: W, path: ['east'] },
  { type: 'pickup', courierId: W, itemId: 'cider' },
  { type: 'deliver', courierId: W, itemId: 'cider', recipientId: 'tavern' },
  { type: 'travel', courierId: S, path: ['east'] }, // Sparrow walks the span too
  { type: 'pickup', courierId: S, itemId: 'deeds' },
  { type: 'deliver', courierId: S, itemId: 'deeds', recipientId: 'registry' },
  { type: 'travel', courierId: S, path: ['middle'] }, // back over it — dock office
  { type: 'pack', courierId: W, pieceId: 'bridge-1' }, // the span lifted at its East foot
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
] },
    /** Plan C — "Both parcels down the wire": mail cider AND deeds, ferry
     * granite + the bridge sale only (27 moves — discovered in pass-3
     * automated playtest, one under the reference par). */
    { name: "PFT10_TRACE_C", actions: [
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pickup', courierId: F3, itemId: 'cider' },
  { type: 'travel', courierId: F3, path: ['north'] },
  { type: 'drop', courierId: F3, itemId: 'cider' },
  { type: 'send', courierId: F3, linkId: 'link-north-east', parcelId: 'cider' },
  { type: 'travel', courierId: F3, path: ['west'] }, // West gate
  { type: 'travel', courierId: L, path: ['west', 'north'] },
  { type: 'send', courierId: L, linkId: 'link-north-east', parcelId: 'deeds' },
  { type: 'pack', courierId: L, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L, path: ['west', 'north'] }, // North post
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'pickup', courierId: S, itemId: 'cider' },
  { type: 'deliver', courierId: S, itemId: 'cider', recipientId: 'tavern' },
  { type: 'pickup', courierId: S, itemId: 'deeds' },
  { type: 'deliver', courierId: S, itemId: 'deeds', recipientId: 'registry' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' }, // dock office
  { type: 'pickup', courierId: W, itemId: 'granite' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'travel', courierId: W, path: ['slip'] },
  { type: 'deliver', courierId: W, itemId: 'granite', recipientId: 'monument' },
  { type: 'travel', courierId: W, path: ['east'] },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
] },
  ],
  "PFT-11": [
    { name: "PFT11_TRACE", actions: PFT11_TRACE },
  ],
  "PFT-12": [
    { name: "PFT12_TRACE_A", actions: PFT12_TRACE_A },
    { name: "PFT12_TRACE_B", actions: PFT12_TRACE_B },
  ],
};

export const SEED = "pft-verify-seed";

import { simulate } from "../../src/engine/pft/sim.js";
import { PftEngine } from "../../src/engine/pft/engine.js";
import type { PftLevel } from "../../src/engine/pft/types.js";

/** Fast path: whole-plan simulate. */
export function replay(level: PftLevel, actions: readonly PftAction[], seed = SEED) {
  return simulate(level, [...actions], seed);
}

/** Full session-engine path: begin → propose/commit per action. */
export function committedRun(eng: PftEngine, level: PftLevel, actions: readonly PftAction[], seed = SEED) {
  eng.begin(level, seed);
  for (let i = 0; i < actions.length; i++) {
    const res = eng.commit(eng.propose("suite", `c-${i}`, actions[i]!));
    if (!res.ok) return { state: eng.currentState, error: res.reason ?? "rejected" };
  }
  return { state: eng.currentState };
}
