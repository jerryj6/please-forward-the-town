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
