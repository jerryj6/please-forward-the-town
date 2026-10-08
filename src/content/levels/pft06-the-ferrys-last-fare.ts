/**
 * PFT-06 "The Ferry's Last Fare" — a transport service itself has a final
 * handover (master §II PFT-D).
 *
 * Card: ferry becomes deliverable at a reachable shore-side recipient;
 * multiple jobs need earlier crossings. Finish necessary trips, disembark,
 * hand over the ferry legally, and extract. Verify a second strategy using
 * different staging or an alternate usable crossing.
 *
 * Map: the usual town — West Bank over the plank bridge, the orchard path on
 * to North Field, the ferry Middle–East. Tonight the skiff itself is sold:
 * the harbor-master's office is on the East quay and the ferry is handed over
 * from the East shore — boat tied up, hold empty, papers signed. Every crate
 * that still needs the crossing must already be across: once the service is
 * signed away there is no water route at all.
 *
 * The exit contract splits the crew: Lark ends at the West gate (she walks
 * home by land), Wren ends at the East exit (he sails the last fare in and
 * stays to close up). Handing the ferry over from Middle is refused — the
 * handling is shore-side at East — and the hold must ride in empty.
 *
 * Orders: piano -> conservatory; tea crate -> boathouse; bridge -> museum;
 * ferry -> harbor-master; Wren -> East exit; Lark -> West gate.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT06_THE_FERRYS_LAST_FARE: PftLevel = {
  levelId: 'pft-06',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft06-the-ferrys-last-fare/1.0.0',
  title: "The Ferry's Last Fare",

  nodes: [
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'north', name: 'North Field', height: 0 },
    { id: 'middle', name: 'Middle Landing', height: 0 },
    { id: 'east', name: 'East Shore', height: 0 },
  ],

  edges: [{ a: 'west', b: 'north', label: 'the orchard path' }],

  sites: [
    {
      id: 'socket-west-middle',
      name: 'West–Middle crossing',
      handlingNode: 'middle',
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
      parcelCapacity: 1,
      // The sale is shore-side at East: the last fare ties up at the far dock
      // and is signed over there, hold empty (PFT-005).
      handlingNode: 'east',
      startsAt: 'middle',
    },
  ],

  couriers: [
    { id: 'courier-1', name: 'Courier Wren', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-2', name: 'Courier Lark', at: 'middle', cargoCapacity: 1 },
  ],

  parcels: [
    { id: 'piano', name: 'Upright Piano', at: { type: 'node', nodeId: 'west' } },
    { id: 'crate', name: 'Tea Crate', at: { type: 'node', nodeId: 'north' } },
  ],

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
    { id: 'conservatory', name: 'East Conservatory', node: 'east' },
    { id: 'boathouse', name: 'East Boathouse', node: 'east' },
    { id: 'museum', name: 'East Museum', node: 'east' },
    { id: 'harbor-master', name: "Harbor-Master's Office", node: 'east' },
  ],

  exits: [
    { id: 'east-exit', name: 'East Exit', node: 'east' },
    { id: 'west-gate', name: 'West Gate', node: 'west' },
  ],

  orders: [
    {
      id: 'order-piano',
      label: 'Deliver the piano to the East conservatory',
      subject: { type: 'parcel', parcelId: 'piano' },
      recipientId: 'conservatory',
    },
    {
      id: 'order-crate',
      label: 'Deliver the tea crate to the East boathouse',
      subject: { type: 'parcel', parcelId: 'crate' },
      recipientId: 'boathouse',
    },
    {
      id: 'order-bridge',
      label: 'Deliver the bridge itself to the East museum',
      subject: { type: 'piece', pieceId: 'bridge-1' },
      recipientId: 'museum',
    },
    {
      id: 'order-ferry',
      label: 'Sign the harbor ferry over to the harbor-master',
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
      label: 'Courier Lark finishes at the West gate',
      subject: { type: 'courier', courierId: 'courier-2' },
      exitId: 'west-gate',
    },
  ],

  // Verified trace A (Lark sails each parcel herself) commits 17 moves;
  // trace B (Lark stages both parcels into town-side staging; Wren shuttles)
  // commits 22.
  par: 17,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT06_CARD = {
  winningTraceSummary:
    'A — "Lark sails the freight": Lark ferries the tea crate to the boathouse and the ' +
    'piano to the conservatory herself, then walks home through West gate; Wren packs ' +
    'the bridge, sails it to the museum, and signs the ferry over at the harbor-master\'s ' +
    'quay (17 moves). ' +
    'B — "Dockside staging": Lark hauls both parcels to the Middle dock — crate into the ' +
    'ferry hold, piano staged on the planks — and walks home; Wren shuttles the cargo ' +
    'piecemeal (unload, deliver, return), packs the bridge, sails it across, then signs ' +
    'the service over (22 moves). Same orders, different staging signature.',
  wrongApproaches: [
    'Missing cargo: sign the ferry over before the freight lands — every East order ' +
      'strands with no recovery at all; the service edge is gone and no piece restores it.',
    'Hold must ride in empty: hand-over with a parcel still in the hold is refused.',
    'Handling endpoint: the sale is shore-side at East — signing the boat over from ' +
      'Middle is refused ("shore-side handling is at east").',
    'Identity: the harbor-master holds the ferry contract — offering the boat to the ' +
      'museum is "no open order".',
    'No service after the sale: riding a signed-over ferry is refused.',
  ],
  hints: [
    'Once the ferry is signed away, nothing crosses the water — every boat job must ' +
      'already be done. The ferry handover is the last act of the night.',
    'The skiff can carry one courier plus one parcel — a rider brings her cargo. The ' +
      'hold also takes freight in advance for a courier to pick up on the far shore.',
    'Lark ferries both parcels herself and walks home by the West gate. Wren packs ' +
      'the bridge, sails it to the museum, and hands the boat over at the East quay — ' +
      'hold empty.',
  ],
  coopNote:
    'The question to settle before anyone packs a thing: what still needs the boat? ' +
      'Split the freight between couriers — one sailing with cargo each way — and ' +
      'agree that whoever signs the boat over is the last one East.',
} as const;
