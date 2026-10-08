/**
 * PFT-09 "Three Useful Parcels" — several infrastructure obligations
 * interact (master §II PFT-D, chapter-3 interdependence).
 *
 * Card: bridge, stairs, and relay used as tools before their deliveries;
 * finite graph with a solvable dependency order. Author a complete
 * dependency graph and winning route. Detect apparent cycles and provide a
 * taught temporary deployment/staging solution, never hidden teleportation.
 *
 * Map: the usual town plus the Slip boardwalk, the relay post on North
 * Field (postal link North -> East), and the cliff-stair socket climbing
 * West Bank to the Cliff Loft (height 1; the loft only exists while the
 * stair stands).
 *
 * Three parcels, three tools, three obligations:
 *
 * - The RECORDS sit staged on North Field — their only way East is the
 *   relay post (the foot ferry is for people and carried freight; the
 *   mailbox is the mail). Lark hikes out, sends them, then packs the relay
 *   mailbox itself for the Middle depot. The mailbox must keep working
 *   until it is asked to be cargo — pack it early and the records never
 *   move.
 * - The TAPESTRY hangs in the Cliff Loft — Finch climbs the stair to fetch
 *   it, stages it at Middle for the ferry, then packs the staircase itself
 *   (which ships East to the observatory). Packing the stair with anyone —
 *   or anything — still aloft is refused outright (PFT-006).
 * - The TEA SET waits on West Bank — Wren fetches it and stages it at
 *   Middle for the ferry. The plank bridge owed to the East museum is the
 *   same bridge every west errand needs: it is packed LAST, at Middle, by
 *   the courier who carries it onto the boat.
 *
 * Dependency order (the "apparent cycle" that resolves):
 *   records staged -> Lark sends via live link -> mailbox packable ->
 *   tapestry down -> stair packable -> west errands done -> plank bridge
 *   packable -> carried onto the last ferry.
 * Every tool earns its keep BEFORE it becomes cargo; the bridge sells only
 * when the west bank needs it no longer.
 *
 * Crew: Lark owns the postal leg (exits the North post); Finch owns the
 * stair fetch (exits the dock office); Wren owns the West Market fetch
 * (exits the West gate); Sparrow is the ferryman — four freight runs and
 * the bridge delivery (exits the East exit).
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT09_THREE_USEFUL_PARCELS: PftLevel = {
  levelId: 'pft-09',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft09-three-useful-parcels/1.0.0',
  title: 'Three Useful Parcels',

  nodes: [
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'north', name: 'North Field', height: 0 },
    { id: 'middle', name: 'Middle Landing', height: 0 },
    { id: 'east', name: 'East Shore', height: 0 },
    { id: 'slip', name: 'Slip', height: 0 },
    // The loft only exists while the elm staircase stands (PFT-006/010 idiom).
    { id: 'loft', name: 'Cliff Loft', height: 1, mountedOn: 'stair-1' },
  ],

  edges: [
    { a: 'west', b: 'north', label: 'the orchard path' },
    { a: 'east', b: 'slip', label: 'the boardwalk' },
  ],

  sites: [
    {
      id: 'socket-west-middle',
      name: 'West–Middle crossing',
      handlingNode: 'middle',
      connects: ['west', 'middle'],
      // The flat span would take a stair shape-wise — a designed temptation
      // for the declared-heights rejection (PFT-009).
      accepts: ['bridge', 'stair'],
    },
    {
      id: 'socket-north-post',
      name: 'North Field relay post',
      handlingNode: 'north',
      connects: ['north', 'west'],
      accepts: ['mailbox'],
    },
    {
      id: 'socket-west-loft',
      name: 'West cliff stair socket',
      handlingNode: 'west',
      connects: ['west', 'loft'],
      accepts: ['stair'],
    },
  ],

  postalLinks: [
    {
      id: 'link-north-east',
      from: 'north',
      to: 'east',
      mailboxPieceId: 'mailbox-1',
    },
  ],

  ferries: [
    {
      id: 'ferry-1',
      name: 'Harbor Ferry',
      docks: ['middle', 'east'],
      courierCapacity: 1,
      parcelCapacity: 1,
      startsAt: 'middle',
    },
  ],

  couriers: [
    { id: 'courier-1', name: 'Courier Wren', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-2', name: 'Courier Lark', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-3', name: 'Courier Finch', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-4', name: 'Courier Sparrow', at: 'middle', cargoCapacity: 1 },
  ],

  parcels: [
    { id: 'tea', name: 'Tea Set', at: { type: 'node', nodeId: 'west' } },
    // Staged on the post at level start — one send, no fetch needed.
    { id: 'records', name: 'Town Records', at: { type: 'node', nodeId: 'north' } },
    { id: 'tapestry', name: 'Weaver\'s Tapestry', at: { type: 'node', nodeId: 'loft' } },
  ],

  pieces: [
    {
      id: 'bridge-1',
      kind: 'bridge',
      name: 'Plank Bridge',
      handlingNodes: ['middle'],
      initial: { status: 'deployed', siteId: 'socket-west-middle' },
    },
    {
      id: 'stair-1',
      kind: 'stair',
      name: 'Elm Staircase',
      handlingNodes: ['west'],
      initial: { status: 'deployed', siteId: 'socket-west-loft' },
    },
    {
      id: 'mailbox-1',
      kind: 'mailbox',
      name: 'Relay Mailbox',
      handlingNodes: ['north'],
      initial: { status: 'deployed', siteId: 'socket-north-post' },
    },
  ],

  recipients: [
    { id: 'conservatory', name: 'East Conservatory', node: 'east' },
    { id: 'archives', name: 'East Archives', node: 'east' },
    { id: 'museum', name: 'East Museum', node: 'east' },
    { id: 'observatory', name: 'East Observatory', node: 'east' },
    { id: 'gallery', name: 'Slip Gallery', node: 'slip' },
    { id: 'depot', name: 'Middle Depot', node: 'middle' },
  ],

  exits: [
    { id: 'west-gate', name: 'West Gate', node: 'west' },
    { id: 'north-post', name: 'North Post', node: 'north' },
    { id: 'dock-office', name: 'Dock Office', node: 'middle' },
    { id: 'east-exit', name: 'East Exit', node: 'east' },
  ],

  orders: [
    {
      id: 'order-tea',
      label: 'Deliver the tea set to the East conservatory',
      subject: { type: 'parcel', parcelId: 'tea' },
      recipientId: 'conservatory',
    },
    {
      id: 'order-records',
      label: 'Deliver the town records to the East archives',
      subject: { type: 'parcel', parcelId: 'records' },
      recipientId: 'archives',
    },
    {
      id: 'order-tapestry',
      label: 'Deliver the tapestry to the Slip gallery',
      subject: { type: 'parcel', parcelId: 'tapestry' },
      recipientId: 'gallery',
    },
    {
      id: 'order-bridge',
      label: 'Deliver the plank bridge to the East museum',
      subject: { type: 'piece', pieceId: 'bridge-1' },
      recipientId: 'museum',
    },
    {
      id: 'order-stair',
      label: 'Deliver the elm staircase to the East observatory',
      subject: { type: 'piece', pieceId: 'stair-1' },
      recipientId: 'observatory',
    },
    {
      id: 'order-mailbox',
      label: 'Deliver the relay mailbox to the Middle depot',
      subject: { type: 'piece', pieceId: 'mailbox-1' },
      recipientId: 'depot',
    },
    {
      id: 'order-wren-exit',
      label: 'Courier Wren finishes at the West gate',
      subject: { type: 'courier', courierId: 'courier-1' },
      exitId: 'west-gate',
    },
    {
      id: 'order-lark-exit',
      label: 'Courier Lark finishes at the North post',
      subject: { type: 'courier', courierId: 'courier-2' },
      exitId: 'north-post',
    },
    {
      id: 'order-finch-exit',
      label: 'Courier Finch finishes at the dock office',
      subject: { type: 'courier', courierId: 'courier-3' },
      exitId: 'dock-office',
    },
    {
      id: 'order-sparrow-exit',
      label: 'Courier Sparrow finishes at the East exit',
      subject: { type: 'courier', courierId: 'courier-4' },
      exitId: 'east-exit',
    },
  ],

  // Verified trace: 38 moves (see tests/unit/pft08-10.test.ts).
  par: 38,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT09_CARD = {
  winningTraceSummary:
    '"Tools first, cargo after" (38 moves): Lark hikes the orchard path to the ' +
    'relay post, sends the staged records East, packs the relay mailbox and files ' +
    'it at the Middle depot, then walks back to the North post; Finch climbs the ' +
    'elm staircase for the tapestry, stages it at Middle, packs the staircase at ' +
    'its West foot and stages it for the boat; Wren fetches the tea set and stages ' +
    'it at Middle, exits the West gate; Sparrow runs four freight legs — tea to ' +
    'the conservatory, records from the quay to the archives, tapestry to the Slip ' +
    'gallery, staircase to the observatory — then packs the plank bridge, sails it ' +
    'to the museum, and closes the East exit.',
  wrongApproaches: [
    'The apparent cycle: pack the plank bridge while the loft runner is still ' +
      'west-side and the mail is dead — the tea and the runner\'s exit strand ' +
      'together (redeploy while carried, undo once it is at the museum).',
    'Occupied structure: the staircase cannot be packed while a courier or the ' +
      'tapestry is still on the loft (PFT-006).',
    'Dead link: send after the mailbox is packed — "link inactive".',
    'Wrong socket: the elm staircase on the flat West–Middle frame is refused ' +
      'on declared heights (PFT-009); the mailbox on a bridge frame is refused ' +
      'on kind.',
    'Capacity: a second parcel aboard the harbor ferry is refused; a carried ' +
      'parcel will not mail — it must be staged at the post.',
  ],
  hints: [
    'Every tool becomes cargo tonight — but only after it has finished being ' +
      'a tool. Send before packing the post, fetch before packing the stair, ' +
      'empty the west bank before selling the bridge.',
    'The records are already staged on the relay post: one send, no fetch. ' +
      'The loft only exists while the staircase stands — bring everything ' +
      'down before you lift it.',
    'Lark: post -> send -> mailbox to the depot -> North post. Finch: loft -> ' +
      'tapestry down -> pack the stair -> stage it -> dock office. Wren: tea -> ' +
      'Middle -> West gate. Sparrow: tea, records, tapestry, stair by ferry, ' +
      'then the bridge — East exit.',
  ],
  coopNote:
    'Four distinct contributions: Lark is the postal courier (send + relay ' +
      'decommission), Finch is the climber (stair fetch + stair packing), ' +
      'Wren is the market runner (west fetch + staging), Sparrow is the ' +
      'ferryman and closer (every freight leg + the bridge sale). Exits are ' +
      'divergent by design — only the last rider ends East.',
} as const;
