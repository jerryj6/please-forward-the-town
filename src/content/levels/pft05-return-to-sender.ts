/**
 * PFT-05 "Return to Sender" — cargo reachability differs from courier
 * reachability (master §II PFT-D).
 *
 * Card: introduce a cargo-only relay mailbox and a physically separate courier
 * route. Mail a parcel across a link while preserving a real way home for its
 * courier; trying to mail a courier must be impossible and clearly explained.
 *
 * Map: Middle Landing is the hub — ferry dock and the moving depot. West Bank
 * holds the land registry; the orchard path runs on to the Upstream Landing at
 * North, where a relay mailbox stands beside the path and a postal link runs
 * over the ridge to East Shore. The harbor ferry is a passenger skiff: it
 * takes couriers, never freight (parcelCapacity 0), so the only way the
 * registry reaches the East archives is by mail.
 *
 * The courier walk and the parcel flight are different graphs entirely
 * (PFT-008): the link lives in the parcel graph, the bridge and ferry in the
 * courier graph. Lark hikes out, stages the registry on the post, and mails
 * it — then walks home over the bridge. The mailbox and the bridge are both
 * decommissioned into the depot, but only after the mail has flown: pack the
 * post early and the link goes dead.
 *
 * Orders: registry -> East archives; mailbox -> Middle depot; bridge ->
 * Middle depot; Wren -> East exit; Lark -> Middle dock office.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT05_RETURN_TO_SENDER: PftLevel = {
  levelId: 'pft-05',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft05-return-to-sender/1.0.0',
  title: 'Return to Sender',

  nodes: [
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'north', name: 'Upstream Landing', height: 0 },
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
    {
      // The relay post stands beside the orchard path: its socket spans
      // North–West, which the path already joins — the mailbox is a mail
      // appliance, not a courier crossing (PFT-008).
      id: 'socket-mail-post',
      name: 'Relay post — orchard side',
      handlingNode: 'north',
      connects: ['north', 'west'],
      accepts: ['mailbox'],
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
      name: 'Passenger Skiff',
      docks: ['middle', 'east'],
      courierCapacity: 1,
      parcelCapacity: 0, // foot ferry — passengers only, no freight
      startsAt: 'middle',
    },
  ],

  couriers: [
    { id: 'courier-1', name: 'Courier Wren', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-2', name: 'Courier Lark', at: 'middle', cargoCapacity: 1 },
  ],

  parcels: [
    { id: 'registry', name: 'Land Registry', at: { type: 'node', nodeId: 'west' } },
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
      id: 'mailbox-1',
      kind: 'mailbox',
      name: 'Relay Mailbox',
      handlingNodes: ['north'],
      initial: { status: 'deployed', siteId: 'socket-mail-post' },
    },
  ],

  recipients: [
    { id: 'archives', name: 'East Archives', node: 'east' },
    { id: 'depot', name: 'Moving Depot', node: 'middle' },
  ],

  exits: [
    { id: 'east-exit', name: 'East Exit', node: 'east' },
    { id: 'dock-office', name: 'Dock Office', node: 'middle' },
  ],

  orders: [
    {
      id: 'order-registry',
      label: 'Mail the land registry to the East archives',
      subject: { type: 'parcel', parcelId: 'registry' },
      recipientId: 'archives',
    },
    {
      id: 'order-mailbox',
      label: 'Decommission the relay mailbox to the moving depot',
      subject: { type: 'piece', pieceId: 'mailbox-1' },
      recipientId: 'depot',
    },
    {
      id: 'order-bridge',
      label: 'Sign the plank bridge into the moving depot',
      subject: { type: 'piece', pieceId: 'bridge-1' },
      recipientId: 'depot',
    },
    {
      id: 'order-wren-exit',
      label: 'Courier Wren finishes at the East exit',
      subject: { type: 'courier', courierId: 'courier-1' },
      exitId: 'east-exit',
    },
    {
      id: 'order-lark-exit',
      label: 'Courier Lark finishes at the dock office',
      subject: { type: 'courier', courierId: 'courier-2' },
      exitId: 'dock-office',
    },
  ],

  // Verified trace A (Lark mails and decommissions; Wren receives) commits 13
  // moves; trace B (Wren makes the second Upstream run for the mailbox) 15.
  par: 13,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT05_CARD = {
  winningTraceSummary:
    'A — "Lark posts, Wren receives": Lark crosses the bridge, fetches the registry ' +
    'from West Bank, stages it on the Upstream post, and sends it over the ridge link ' +
    '(postal send); she packs the mailbox, walks home over the bridge, and signs the ' +
    'mailbox and the bridge into the depot, ending at the dock office. Wren rides the ' +
    'passenger skiff to East, picks up the mailed registry, and delivers it to the ' +
    'archives (13 moves). ' +
    'B — "North handoff": Lark mails and returns; Wren makes a second Upstream run to ' +
    'fetch the mailbox home while Lark signs the bridge in (15 moves).',
  wrongApproaches: [
    'Mail a courier: Lark stranded past the packed bridge cannot ride the link home — ' +
      'postal links move cargo only; her dock-office order strands redeploy/undo and ' +
      'there is no travel edge north->east.',
    'Missing cargo: pack the mailbox before the send — the link is dead, "relay ' +
      'mailbox is not deployed".',
    'Missing cargo: pack the bridge while Lark is still Upstream — her way home is ' +
      'the bridge, not the mailbag; deliver the bridge to the depot and it is undo-only.',
    'Capacity: the skiff is a foot ferry — riding with freight aboard is refused ' +
      '("ferry parcel capacity 0 exceeded").',
    'Stage first: send refuses a carried parcel — "not staged at north"; a packed ' +
      'piece refuses too — "only parcels travel postal links".',
  ],
  hints: [
    'The skiff carries people, not freight — the registry will never ride it. The ' +
      'only route to East for that parcel is the relay post on the Upstream Landing.',
    'Mailboxes take staged parcels, not carried ones: Lark has to set the registry ' +
      'down on the post before it can fly. Her way home is the bridge — nobody rides ' +
      'the mail.',
    'Lark carries the registry over bridge and path to the post, drops it, and sends ' +
      'it to East. Then she packs the mailbox, comes home, and signs both pieces into ' +
      'the depot; Wren collects the registry at the archives.',
  ],
  coopNote:
    'Lark owns the remote run — fetch, stage, send, decommission, and home again by ' +
      'land. Wren owns the water — receive and deliver. The handoff between them is a ' +
      'staged parcel on a dock, and neither courier ever touches the other\'s route.',
} as const;
