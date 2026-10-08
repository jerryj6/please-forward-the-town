/**
 * PFT-01 "The Last Crossing" — mandatory tutorial contract (master §II PFT-C).
 *
 * West: lantern. Middle: courier + ferry dock + bridge handle.
 * East: orchard recipient, museum recipient, final exit.
 * Bridge connects West–Middle (handle on Middle). Ferry Middle–East carries
 * exactly 1 courier + 1 parcel and is a fixed service in this contract —
 * it is not yet a delivery item.
 *
 * Orders: lantern -> East orchard; bridge -> East museum; courier -> East exit.
 * Both reference delivery orders A (lantern first) and B (bridge first, lantern
 * staged on Middle) must succeed; the necessary dependency is retrieval before
 * bridge handover, not a prescribed delivery script.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT01_LAST_CROSSING: PftLevel = {
  levelId: 'pft-01',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft01-last-crossing/1.0.0',
  title: 'The Last Crossing',

  nodes: [
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'middle', name: 'Middle Landing', height: 0 },
    { id: 'east', name: 'East Shore', height: 0 },
  ],

  // No permanent cross-water path: all connectivity is infrastructure.
  edges: [],

  sites: [
    {
      id: 'socket-west-middle',
      name: 'West–Middle crossing',
      handlingNode: 'middle', // bridge handle is on Middle (PFT-005)
      connects: ['west', 'middle'],
      accepts: ['bridge'],
    },
  ],

  postalLinks: [],

  ferries: [
    {
      id: 'ferry-1',
      name: 'Harbor Ferry',
      docks: ['middle', 'east'],
      courierCapacity: 1,
      parcelCapacity: 1, // exactly 1 courier + 1 parcel (PFT-C)
      startsAt: 'middle',
      // no handlingNode: the ferry is a fixed service in this tutorial, not cargo
    },
  ],

  couriers: [{ id: 'courier-1', name: 'Courier Wren', at: 'middle', cargoCapacity: 1 }],

  parcels: [{ id: 'lantern', name: 'Harbor Lantern', at: { type: 'node', nodeId: 'west' } }],

  pieces: [
    {
      id: 'bridge-1',
      kind: 'bridge',
      name: 'Plank Bridge',
      handlingNodes: ['middle'],
      initial: { status: 'deployed', siteId: 'socket-west-middle' },
    },
  ],

  recipients: [
    { id: 'orchard', name: 'East Orchard', node: 'east' },
    { id: 'museum', name: 'East Museum', node: 'east' },
  ],

  exits: [{ id: 'east-exit', name: 'East Exit', node: 'east' }],

  orders: [
    {
      id: 'order-lantern',
      label: 'Deliver the lantern to the East orchard',
      subject: { type: 'parcel', parcelId: 'lantern' },
      recipientId: 'orchard',
    },
    {
      id: 'order-bridge',
      label: 'Deliver the bridge itself to the East museum',
      subject: { type: 'piece', pieceId: 'bridge-1' },
      recipientId: 'museum',
    },
    {
      id: 'order-courier',
      label: 'Courier Wren finishes at the East exit',
      subject: { type: 'courier', courierId: 'courier-1' },
      exitId: 'east-exit',
    },
  ],

  // Trace A (lantern delivered first) commits 9 actions; trace B commits 11.
  par: 9,
};

/**
 * Level card — PFT-01 is the teach level of the PFT arc (bible §9.9): one
 * courier, one parcel, one bridge that is both the road and the cargo.
 * The whole game is here in miniature: fetch, cross, deliver, extract.
 */
export const PFT01_CARD = {
  levelId: 'pft-01',

  solutionPolicy:
    'hybrid — several deliveries orders work; two are verified (A: lantern ' +
    'first, 9 moves; B: bridge first with the lantern staged on Middle, 11)',

  naiveApproach:
    'Lift the plank bridge at once — it is a thing, things go in hands, and ' +
    'the water needs a boat anyway.',

  insight:
    'The bridge is owed to the museum — it is cargo, and it is also the ' +
    'only way back from the West Bank. Whatever still needs the creek must ' +
    'be settled before the plank leaves its socket.',

  winningTraceSummary:
    'A — "Lantern first" (9 moves, par): Wren walks the bridge west, ' +
    'fetches the lantern, walks back, rides the ferry east and delivers ' +
    'the orchard, rides back, packs the bridge, rides east once more and ' +
    'delivers the museum — then clocks out. B — "Bridge first" (11 moves): ' +
    'the lantern is staged (drop) on Middle, the bridge ships east, and ' +
    'Wren returns for the staged parcel.',

  wrongApproaches: [
    'Lift the bridge before fetching — the lantern is stranded on the ' +
      'West Bank, recoverable by re-setting the carried bridge (' +
      "'redeploy'); once the bridge ships east it is undo-only ('undo').",
    'Clock out at the East exit early — the courier order ticks but ' +
      'nothing else completes: exit orders are live positions, not ' +
      'checkpoints banked forever.',
    'Deliver the bridge to the orchard (or the lantern to the museum) — ' +
      'orders pin item to recipient: "no open order".',
  ],

  hints: [
    'The bridge is both the road to the West Bank and cargo owed to the ' +
      'museum — one thing doing two jobs tonight.',
    '`pack` lifts a piece into your hands; the ferry carries you — and ' +
      'whatever you are holding — across the water.',
    'Lift the bridge last: every errand that still needs the creek must ' +
      'already be settled east of it.',
  ],
} as const;
