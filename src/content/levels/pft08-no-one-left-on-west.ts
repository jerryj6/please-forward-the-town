/**
 * PFT-08 "No One Left on West" — infrastructure removal affects several
 * couriers (master §II PFT-D).
 *
 * Card: fixed four couriers, geographically separated work, shared finite
 * routes. Coordinate retrieval, handoff, and return before handover; all
 * couriers must extract. Give each participant a useful role, not four
 * repeated walks.
 *
 * Map: the usual town plus the boardwalk East–Slip, and tonight's twist —
 * the Town Span, a second bridge standing deployed over the channel
 * (Middle–East) that couriers simply walk. Finite routes: the West plank
 * bridge and the foot passenger ferry. Four jobs, four couriers:
 *
 * - Wren runs the Upland errand: sunstone from North Field to the East
 *   archives (plank bridge, orchard path, Town Span).
 * - Lark runs the Market leg: the ledger West Bank -> annex on Slip, then
 *   packs the plank bridge at Middle and carries it over the span to the
 *   museum.
 * - Finch sails the freight: the engine rides with him on the last ferry
 *   run, delivered at the Slip drydock.
 * - Sparrow holds the far shore: she signs the ferry over at the
 *   harbor-master's quay, then lifts the Town Span from its East endpoint
 *   and files it at the foundry — the last act, once everyone is across.
 *
 * The whole crew exits on the far shore: east-exit for Wren and Sparrow,
 * slip-exit for Lark and Finch. The title is the trap: pack either bridge
 * early and somebody is left on West.
 *
 * Orders: sunstone -> archives; ledger -> annex; engine -> drydock;
 * plank bridge -> museum; town span -> foundry; ferry -> harbor-master;
 * exits x4.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT08_NO_ONE_LEFT_ON_WEST: PftLevel = {
  levelId: 'pft-08',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft08-no-one-left-on-west/1.0.0',
  title: 'No One Left on West',

  nodes: [
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'north', name: 'North Field', height: 0 },
    { id: 'middle', name: 'Middle Landing', height: 0 },
    { id: 'east', name: 'East Shore', height: 0 },
    { id: 'slip', name: 'Slip', height: 0 },
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
      accepts: ['bridge'],
    },
    {
      id: 'socket-town-span',
      name: 'Channel span',
      // The span is lifted from its East foot — the last act once the crew
      // is across (PFT-005).
      handlingNode: 'east',
      connects: ['middle', 'east'],
      accepts: ['bridge'],
    },
  ],

  postalLinks: [],

  ferries: [
    {
      id: 'ferry-1',
      name: 'Packet Ferry',
      docks: ['middle', 'east'],
      courierCapacity: 1,
      parcelCapacity: 1,
      // Shore-side signing at East, hold empty (PFT-005).
      handlingNode: 'east',
      startsAt: 'middle',
    },
  ],

  couriers: [
    { id: 'courier-1', name: 'Courier Wren', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-2', name: 'Courier Lark', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-3', name: 'Courier Finch', at: 'middle', cargoCapacity: 1 },
    // Sparrow is already posted on the East quay — the receiving post.
    { id: 'courier-4', name: 'Courier Sparrow', at: 'east', cargoCapacity: 1 },
  ],

  parcels: [
    { id: 'sunstone', name: 'Sunstone', at: { type: 'node', nodeId: 'north' } },
    { id: 'ledger', name: 'Market Ledger', at: { type: 'node', nodeId: 'west' } },
    { id: 'engine', name: 'Dockside Engine', at: { type: 'node', nodeId: 'middle' } },
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
      id: 'bridge-2',
      kind: 'bridge',
      name: 'Town Span',
      // Lifted at the East endpoint, shipped on to the foundry.
      handlingNodes: ['east'],
      initial: { status: 'deployed', siteId: 'socket-town-span' },
    },
  ],

  recipients: [
    { id: 'archives', name: 'East Archives', node: 'east' },
    { id: 'museum', name: 'East Museum', node: 'east' },
    { id: 'foundry', name: 'East Foundry', node: 'east' },
    { id: 'harbor-master', name: "Harbor-Master's Office", node: 'east' },
    { id: 'annex', name: 'Slip Annex', node: 'slip' },
    { id: 'drydock', name: 'Slip Drydock', node: 'slip' },
  ],

  exits: [
    { id: 'east-exit', name: 'East Exit', node: 'east' },
    { id: 'slip-exit', name: 'Slip Exit', node: 'slip' },
  ],

  orders: [
    {
      id: 'order-sunstone',
      label: 'Deliver the sunstone to the East archives',
      subject: { type: 'parcel', parcelId: 'sunstone' },
      recipientId: 'archives',
    },
    {
      id: 'order-ledger',
      label: 'Deliver the market ledger to the Slip annex',
      subject: { type: 'parcel', parcelId: 'ledger' },
      recipientId: 'annex',
    },
    {
      id: 'order-engine',
      label: 'Deliver the dockside engine to the Slip drydock',
      subject: { type: 'parcel', parcelId: 'engine' },
      recipientId: 'drydock',
    },
    {
      id: 'order-bridge',
      label: 'Deliver the plank bridge to the East museum',
      subject: { type: 'piece', pieceId: 'bridge-1' },
      recipientId: 'museum',
    },
    {
      id: 'order-span',
      label: 'Deliver the town span to the East foundry',
      subject: { type: 'piece', pieceId: 'bridge-2' },
      recipientId: 'foundry',
    },
    {
      id: 'order-ferry',
      label: 'Sign the packet ferry over to the harbor-master',
      subject: { type: 'ferry', ferryId: 'ferry-1' },
      recipientId: 'harbor-master',
    },
    {
      id: 'order-wren-exit',
      label: 'Courier Wren finishes at the East exit',
      subject: { type: 'courier', courierId: 'courier-1' },
      exitId: 'east-exit',
    },
    {
      id: 'order-lark-exit',
      label: 'Courier Lark finishes at the Slip exit',
      subject: { type: 'courier', courierId: 'courier-2' },
      exitId: 'slip-exit',
    },
    {
      id: 'order-finch-exit',
      label: 'Courier Finch finishes at the Slip exit',
      subject: { type: 'courier', courierId: 'courier-3' },
      exitId: 'slip-exit',
    },
    {
      id: 'order-sparrow-exit',
      label: 'Courier Sparrow finishes at the East exit',
      subject: { type: 'courier', courierId: 'courier-4' },
      exitId: 'east-exit',
    },
  ],

  // Verified trace: 21 moves (see tests/unit/pft08-10.test.ts).
  par: 21,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT08_CARD = {
  solutionPolicy:
    'hybrid — the extraction order is constrained but the assignment of ' +
    'errands to couriers admits several verified schedules (21 moves)',
  naiveApproach:
    'Everyone rides the ferry out — it is the obvious way across. (One ' +
    'rider per ferry: the other three need a different crossing.)',
  insight:
    'The Town Span is how four couriers end on the far shore of a ' +
    'one-rider ferry — it must outlive every eastbound errand. The plank ' +
    'bridge and the boat are cargo and can leave first.',
  winningTraceSummary:
    '"Everyone across before the sale" (21 moves): Wren runs the Upland fetch ' +
    '(plank bridge, orchard path) and walks the sunstone over the Town Span to the ' +
    'archives; Lark carries the market ledger to the Slip annex, walks back, packs ' +
    'the plank bridge at Middle and ships it across the span to the museum; Finch ' +
    'rides the engine over on the packet ferry and closes the drydock on Slip; ' +
    'Sparrow — already posted East — signs the ferry over to the harbor-master, ' +
    'then lifts the Town Span at its East foot and files it at the foundry. ' +
    'Nobody is left on West.',
  wrongApproaches: [
    'Pack the plank bridge while couriers are still on the west bank — Wren\'s ' +
      'exit and the sunstone both strand (redeploy while it is carried, undo once ' +
      'it is at the museum).',
    'Sell the span early: hand the ferry over AND lift the Town Span while Lark ' +
      'is still at Middle — her Slip exit strands; the water has no route left.',
    'The hold must ride in empty — signing the ferry over with the engine still ' +
      'aboard is refused.',
    'Shore-side handling is at East — signing the boat over from Middle is ' +
      'refused; offering it to the museum is no open order.',
    'The sold boat stops sailing — riding after hand-over is refused.',
  ],
  hints: [
    'The Town Span is the crossing that lets four couriers end on the far ' +
      'shore — a ferry only ever leaves one rider there. Count who still ' +
      'needs the west bank before anyone packs a thing.',
    'Work west to east: Upland and Market errands first, then the bridge ' +
      'carried over the span, then the ferry run — and only then the ' +
      'paperwork.',
    'Keep the Town Span standing until everyone who needs the far shore ' +
      'is there — it is the crossing for whoever does not ride. Everything ' +
      'else can leave before it; it is the last piece to go.',
  ],
  coopNote:
    'Four distinct jobs, one shared spine: Wren owns the Upland fetch, Lark ' +
      'owns the Market leg and the plank bridge, Finch owns the ferry freight ' +
      'run, Sparrow owns the far-shore paperwork (ferry sale, span lift). ' +
      'The agreement that matters: nobody lifts a bridge while a teammate ' +
      'still needs it — extraction is a shared resource.',
} as const;
