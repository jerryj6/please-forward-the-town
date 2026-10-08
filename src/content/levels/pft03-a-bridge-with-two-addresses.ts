/**
 * PFT-03 "A Bridge With Two Addresses" — temporarily deploy the same bridge
 * more than once (master §II PFT-D).
 *
 * Card: at least two compatible crossings and a final bridge recipient; one
 * finite bridge. Use the first crossing to retrieve a necessary parcel, repack
 * from a legal endpoint, deploy at the second, then complete its delivery.
 * Independent proof of every handling point.
 *
 * Map: Middle Landing sits between two creeks. The West creek crossing serves
 * the West Bank (lantern). The North creek crossing serves North Field (the
 * honey crate). Both sockets are marked bridge-compatible and both are worked
 * from the Middle side. The ferry runs Middle–East to the boathouse, museum,
 * and Wren's exit.
 *
 * There is exactly one bridge. At start it lies across the West creek; North
 * Field has no other way in — the crate is unreachable until the bridge is
 * lifted and re-set on the North socket (PFT-002: packing removes the
 * connection; deployment consumes the same packed object).
 *
 * Orders: lantern -> East orchard; honey crate -> East boathouse; bridge ->
 * East museum; Wren -> East exit.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT03_A_BRIDGE_WITH_TWO_ADDRESSES: PftLevel = {
  levelId: 'pft-03',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft03-a-bridge-with-two-addresses/1.0.0',
  title: 'A Bridge With Two Addresses',

  nodes: [
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'north', name: 'North Field', height: 0 },
    { id: 'middle', name: 'Middle Landing', height: 0 },
    { id: 'east', name: 'East Shore', height: 0 },
  ],

  // No permanent paths: every connection is a deployed piece or the ferry.
  edges: [],

  sites: [
    {
      id: 'socket-west-middle',
      name: 'West creek crossing',
      handlingNode: 'middle',
      connects: ['west', 'middle'],
      accepts: ['bridge'],
    },
    {
      id: 'socket-north-middle',
      name: 'North creek crossing',
      handlingNode: 'middle',
      connects: ['north', 'middle'],
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
      startsAt: 'middle',
      // fixed service; the bridge, not the ferry, is the delivery item here
    },
  ],

  couriers: [{ id: 'courier-1', name: 'Courier Wren', at: 'middle', cargoCapacity: 1 }],

  parcels: [
    { id: 'lantern', name: 'Harbor Lantern', at: { type: 'node', nodeId: 'west' } },
    { id: 'crate', name: 'Honey Crate', at: { type: 'node', nodeId: 'north' } },
  ],

  pieces: [
    {
      id: 'bridge-1',
      kind: 'bridge',
      name: 'Plank Bridge',
      handlingNodes: ['middle'], // all lifting happens from the Middle side (PFT-005)
      initial: { status: 'deployed', siteId: 'socket-west-middle' },
    },
  ],

  recipients: [
    { id: 'orchard', name: 'East Orchard', node: 'east' },
    { id: 'boathouse', name: 'East Boathouse', node: 'east' },
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
      id: 'order-crate',
      label: 'Deliver the honey crate to the East boathouse',
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
      id: 'order-wren-exit',
      label: 'Courier Wren finishes at the East exit',
      subject: { type: 'courier', courierId: 'courier-1' },
      exitId: 'east-exit',
    },
  ],

  // Verified trace commits 17 moves (lantern out, bridge re-set north, crate
  // out, bridge sold last).
  par: 17,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT03_CARD = {
  solutionPolicy:
    'hybrid — the redeploy-and-ship spine is fixed, but the fetch order ' +
    'around it admits several verified schedules (17 moves)',
  naiveApproach:
    'Treat the deployed bridge as bolted down — the North creek has no ' +
    'bridge of its own, so the crate looks unreachable.',
  insight:
    'A packed bridge is cargo you still own — and you may re-deploy it. ' +
    'One bridge can serve the West creek, then the North creek, then ' +
    'ride to the museum: three jobs, one piece.',
  winningTraceSummary:
    'Wren ferries the lantern to the orchard and returns; packs the bridge at Middle ' +
    '(West creek freed), re-sets it on the North creek socket, crosses, fetches the ' +
    'honey crate, and ferries it to the boathouse; returns, packs the bridge a second ' +
    'time at Middle, and ferries it to the museum as the last job (17 moves). The ' +
    'bridge is handled at three legal points: packed at Middle off the West socket, ' +
    'deployed from Middle onto the North socket, packed at Middle again for handover.',
  wrongApproaches: [
    'Missing cargo: sell the bridge to the museum before the North fetch — the ' +
      'boathouse order strands recoverable on pack, undo-only on handover (North has ' +
      'no other way in).',
    'Handling endpoint: stand on North Field and try to pack the bridge — the handle ' +
      'is on Middle; the far bank refuses it.',
    'No connection: walk to North before the bridge is re-set — the creek is open water ' +
      'until the second deployment.',
    'Missing cargo: pack the bridge at Middle while the lantern is still on West — ' +
      'recoverable by redeploying, but every move now costs extra lifts.',
  ],
  hints: [
    'The honey crate sits across the North creek — no boat reaches it, and the only ' +
      'bridge in town is busy at the West crossing. Nothing else reaches North Field.',
    'A packed bridge is cargo you still own. Once the lantern is aboard, the West ' +
      'bank is done being useful — the bridge can be lifted and set somewhere else.',
    'The bridge works a shift: it is owed to the museum, but it owes the ' +
      'North creek a crossing first. Plan around one piece doing three ' +
      'jobs — lift, re-set, lift — not around finding a second bridge.',
  ],
  coopNote:
    'Solo contract — Wren does every lift. In a shared session, split the planning: ' +
      'one player sequences the West fetch, another proves the North redeploy works ' +
      'before anyone commits the pack. Both halves must agree the bridge is free ' +
      'before it ships.',
} as const;
