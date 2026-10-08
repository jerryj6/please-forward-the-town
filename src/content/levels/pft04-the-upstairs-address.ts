/**
 * PFT-04 "The Upstairs Address" — height connections become cargo obligations
 * (master §II PFT-D).
 *
 * Card: introduce stairs with compatible height sockets, a bridge, and a safe
 * return route. Use the stairs to retrieve/deliver an upper parcel before
 * handing stairs over. Final courier extraction cannot rely on the removed
 * stair.
 *
 * Map: Middle Landing (low) is the hub — couriers, the ferry dock, the bridge
 * handle. The bridge crosses to West Bank (low), where the cliff stair's foot
 * socket climbs to the Cliff Loft (high). A second marked stair socket climbs
 * straight from Middle to the Loft. East Shore holds the music hall, the
 * promenade, the museum, and Wren's exit. Lark's contract is upstairs: she
 * ends at the Loft postbox, so the stair may leave once she is settled.
 *
 * Upstairs work: the books go UP to the loft tenant; the gramophone comes
 * DOWN to the music hall. The elm staircase itself ships to the promenade
 * and the bridge to the museum — both after the upstairs errands are done,
 * because packing the stair strands whoever and whatever is still aloft
 * (PFT-002/006).
 *
 * Orders: books -> loft tenant; gramophone -> music hall; stair -> promenade;
 * bridge -> museum; Wren -> East exit; Lark -> Loft postbox.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT04_THE_UPSTAIRS_ADDRESS: PftLevel = {
  levelId: 'pft-04',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft04-the-upstairs-address/1.0.0',
  title: 'The Upstairs Address',

  nodes: [
    { id: 'middle', name: 'Middle Landing', height: 0 },
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'loft', name: 'Cliff Loft', height: 1 },
    { id: 'east', name: 'East Shore', height: 0 },
  ],

  // No permanent paths: every connection is a deployed piece or the ferry.
  edges: [],

  sites: [
    {
      id: 'socket-west-middle',
      name: 'West–Middle crossing',
      handlingNode: 'middle',
      connects: ['west', 'middle'],
      // The frame would take a stair, but the span is flat: deploying one is
      // rejected on the declared heights (PFT-009) — a designed temptation.
      accepts: ['bridge', 'stair'],
    },
    {
      id: 'socket-west-loft',
      name: 'West cliff stair socket',
      handlingNode: 'west', // worked from the foot of the cliff
      connects: ['west', 'loft'],
      accepts: ['stair'],
    },
    {
      id: 'socket-middle-loft',
      name: 'Middle hoist socket',
      handlingNode: 'middle',
      connects: ['middle', 'loft'],
      accepts: ['stair'],
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
      startsAt: 'middle',
      // fixed service
    },
  ],

  couriers: [
    { id: 'courier-1', name: 'Courier Wren', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-2', name: 'Courier Lark', at: 'middle', cargoCapacity: 1 },
  ],

  parcels: [
    { id: 'books', name: 'Crate of Books', at: { type: 'node', nodeId: 'middle' } },
    { id: 'gramophone', name: 'Brass Gramophone', at: { type: 'node', nodeId: 'loft' } },
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
      handlingNodes: ['west', 'middle'], // the low ends of both stair sockets
      initial: { status: 'deployed', siteId: 'socket-west-loft' },
    },
  ],

  recipients: [
    { id: 'loft-tenant', name: 'Loft Tenant', node: 'loft' },
    { id: 'music-hall', name: 'East Music Hall', node: 'east' },
    { id: 'promenade', name: 'East Promenade', node: 'east' },
    { id: 'museum', name: 'East Museum', node: 'east' },
  ],

  exits: [
    { id: 'east-exit', name: 'East Exit', node: 'east' },
    { id: 'loft-post', name: 'Cliff Loft postbox', node: 'loft' },
  ],

  orders: [
    {
      id: 'order-books',
      label: 'Deliver the books to the loft tenant',
      subject: { type: 'parcel', parcelId: 'books' },
      recipientId: 'loft-tenant',
    },
    {
      id: 'order-gramophone',
      label: 'Deliver the gramophone to the East music hall',
      subject: { type: 'parcel', parcelId: 'gramophone' },
      recipientId: 'music-hall',
    },
    {
      id: 'order-stair',
      label: 'Deliver the elm staircase to the East promenade',
      subject: { type: 'piece', pieceId: 'stair-1' },
      recipientId: 'promenade',
    },
    {
      id: 'order-bridge',
      label: 'Deliver the bridge itself to the East museum',
      subject: { type: 'piece', pieceId: 'bridge-1' },
      recipientId: 'museum',
    },
    {
      id: 'order-wren-exit',
      label: 'Courier Wren finishes at the East exit',
      subject: { type: 'courier', courierId: 'courier-1' },
      exitId: 'east-exit',
    },
    {
      id: 'order-lark-exit',
      label: 'Courier Lark finishes at the Cliff Loft postbox',
      subject: { type: 'courier', courierId: 'courier-2' },
      exitId: 'loft-post',
    },
  ],

  // Verified trace A (stair left at the cliff foot) commits 18 moves;
  // trace B (stair re-set on the Middle hoist) commits 20.
  par: 18,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT04_CARD = {
  solutionPolicy:
    'open — two verified plans: the stair stays at the West cliff socket ' +
    '(18 moves) or is redeployed to the Middle hoist (20)',
  naiveApproach:
    'Treat the staircase as scenery — the loft errands look like simple ' +
    'ferry work until the stair itself appears on the moving list.',
  insight:
    'The staircase is cargo too, and the Loft exists only while one ' +
    'stands. Which socket serves it is a real choice — but whoever is ' +
    'still aloft when it leaves had better be finished there.',
  winningTraceSummary:
    'A — "Cliff stair": Lark carries the books up the bridge-and-stair path, delivers ' +
    'to the loft tenant, and stays as postmaster; Wren climbs after her, brings the ' +
    'gramophone down, ferries it to the music hall, returns; packs the stair at the ' +
    'West foot, ferries it to the promenade; returns, packs the bridge at Middle and ' +
    'ferries it to the museum (18 moves). ' +
    'B — "Middle hoist": Wren first packs the stair at West, re-sets it on the Middle ' +
    'hoist socket, then Lark climbs from the hub with the books and stays; Wren takes ' +
    'the gramophone down the hoist and the same ferry routine ships everything ' +
    '(20 moves). Distinct signature: the stair serves the Loft at the West cliff ' +
    'socket in A — every upstairs trip crosses the bridge first — versus redeployed ' +
    'on the Middle hoist in B, where the bridge is used only to fetch the stair itself.',
  wrongApproaches: [
    'Missing cargo: pack and sell the stair while the gramophone is still aloft — ' +
      'the music hall order strands recoverable on pack, undo-only on handover; the ' +
      'books and Lark\'s postbox go with it.',
    'Handling endpoint: stand on the Loft and try to pack the stair — its marked ' +
      'lifts are the low ends at West and Middle, not the top landing.',
    'No connection: walk up after the stair is packed — the cliff is bare until a ' +
      'stair is deployed again.',
    'Height rule: re-set the stair on the flat West–Middle frame — the socket fits ' +
      'the kind but the declared heights match, so the placement is rejected (PFT-009).',
  ],
  hints: [
    'The gramophone is upstairs and the tenant\'s books must go up — but the ' +
      'staircase itself is also on the moving list. Finish every upstairs job ' +
      'before the stair is lifted.',
    'The stair has two marked sockets: the West cliff foot and the Middle hoist. ' +
      'Either serves the Loft — choose one. Nobody comes down off the Loft once ' +
      'the stair is packed, so whoever stays aloft should be ending there.',
    'Decide who ends upstairs before the stair moves — someone whose ' +
      'work is done up there. The stair is lifted once, on purpose: it ' +
      'cannot come down for anyone still aloft.',
  ],
  coopNote:
    'Lark owns the Loft: books up, then she stays as postmaster — her exit never ' +
      'needs the stair again. Wren owns the water and the packing list. The ' +
      'conversation is "who is still aloft?" before the stair leaves: every ' +
      'upstairs errand must be closed first.',
} as const;
