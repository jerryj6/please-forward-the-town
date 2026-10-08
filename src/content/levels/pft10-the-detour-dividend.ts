/**
 * PFT-10 "The Detour Dividend" — distinct strategies trade route setup for
 * cargo handling (master §II PFT-D, chapter-3 interdependence).
 *
 * Card: at least two workable network plans using familiar pieces and
 * capacities. Validate two meaningful strategies with different
 * infrastructure deployment/commitment signatures, explain the tradeoff,
 * and avoid counting unrelated action permutations.
 *
 * Map: the usual town, the Slip boardwalk, the North relay post (postal
 * link North -> East), and tonight's spare socket — the Channel span, an
 * East-handled bridge socket on Middle–East that the plank bridge can be
 * re-set onto.
 *
 * The level has two genuinely different winning plans:
 *
 * A — "Ferry freight": the plank bridge stays bolted to the West creek.
 *   Cider and granite ride the ferry (one parcel a leg, seven legs), the
 *   deeds go by mail, and the bridge sails across on the last ride — a
 *   cheap plan in moves but heavy on the one-parcel hold and on counting
 *   who still needs the west bank.
 *
 * B — "The span pays": the west bank is emptied first, then the bridge is
 *   lifted, carried across on one ferry ride, and re-set on the channel
 *   socket — now it IS the crossing. Everyone walks: couriers cross and
 *   return on foot, mailed parcels land on the far quay, and the span is
 *   finally lifted from its East foot for the museum. It costs a pack, a
 *   ride, a deploy and a re-pack of the same piece — the detour — and buys
 *   back an unlimited crossing where capacity never matters again.
 *
 * Different signatures: A runs the ferry for every leg and never touches
 * the channel socket; B runs exactly one ferry leg, deploys the span, and
 * sends two parcels by mail. Both end with the bridge at the East museum,
 * the mailbox at the depot, and the crew at divergent exits: Wren East,
 * Lark the North post, Finch the West gate, Sparrow the dock office.
 *
 * Orders: cider -> tavern; deeds -> registry; granite -> monument;
 * bridge -> museum; mailbox -> depot; exits x4.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT10_THE_DETOUR_DIVIDEND: PftLevel = {
  levelId: 'pft-10',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft10-the-detour-dividend/1.0.0',
  title: 'The Detour Dividend',

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
      // The span is worked from its East foot: carried across, set, and
      // finally lifted there (PFT-005). Deploying it from Middle is refused.
      handlingNode: 'east',
      connects: ['middle', 'east'],
      accepts: ['bridge'],
    },
    {
      id: 'socket-north-post',
      name: 'North Field relay post',
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
    { id: 'cider', name: 'Cider Keg', at: { type: 'node', nodeId: 'west' } },
    { id: 'deeds', name: 'Deed Bundle', at: { type: 'node', nodeId: 'north' } },
    { id: 'granite', name: 'Granite Block', at: { type: 'node', nodeId: 'middle' } },
  ],

  pieces: [
    {
      id: 'bridge-1',
      kind: 'bridge',
      name: 'Plank Bridge',
      // Packable at the Middle end of the west socket, or at the East foot
      // of the channel span once re-set there.
      handlingNodes: ['middle', 'east'],
      initial: { status: 'deployed', siteId: 'socket-west-middle' },
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
    { id: 'tavern', name: 'East Tavern', node: 'east' },
    { id: 'registry', name: 'East Registry Office', node: 'east' },
    { id: 'museum', name: 'East Museum', node: 'east' },
    { id: 'monument', name: 'Slip Monument Works', node: 'slip' },
    { id: 'depot', name: 'Middle Depot', node: 'middle' },
  ],

  exits: [
    { id: 'east-exit', name: 'East Exit', node: 'east' },
    { id: 'north-post', name: 'North Post', node: 'north' },
    { id: 'west-gate', name: 'West Gate', node: 'west' },
    { id: 'dock-office', name: 'Dock Office', node: 'middle' },
  ],

  orders: [
    {
      id: 'order-cider',
      label: 'Deliver the cider keg to the East tavern',
      subject: { type: 'parcel', parcelId: 'cider' },
      recipientId: 'tavern',
    },
    {
      id: 'order-deeds',
      label: 'Deliver the deed bundle to the East registry office',
      subject: { type: 'parcel', parcelId: 'deeds' },
      recipientId: 'registry',
    },
    {
      id: 'order-granite',
      label: 'Deliver the granite block to the Slip monument works',
      subject: { type: 'parcel', parcelId: 'granite' },
      recipientId: 'monument',
    },
    {
      id: 'order-bridge',
      label: 'Deliver the plank bridge to the East museum',
      subject: { type: 'piece', pieceId: 'bridge-1' },
      recipientId: 'museum',
    },
    {
      id: 'order-mailbox',
      label: 'Deliver the relay mailbox to the Middle depot',
      subject: { type: 'piece', pieceId: 'mailbox-1' },
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
      label: 'Courier Lark finishes at the North post',
      subject: { type: 'courier', courierId: 'courier-2' },
      exitId: 'north-post',
    },
    {
      id: 'order-finch-exit',
      label: 'Courier Finch finishes at the West gate',
      subject: { type: 'courier', courierId: 'courier-3' },
      exitId: 'west-gate',
    },
    {
      id: 'order-sparrow-exit',
      label: 'Courier Sparrow finishes at the dock office',
      subject: { type: 'courier', courierId: 'courier-4' },
      exitId: 'dock-office',
    },
  ],

  // Verified traces: A (ferry freight) 28 moves, B (span) 28 moves —
  // see tests/unit/pft08-10.test.ts.
  par: 28,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT10_CARD = {
  solutionPolicy:
    'open — two verified plans with different infrastructure signatures ' +
    '(ferry freight 28 vs span re-set 28, same final state)',
  naiveApproach:
    'The direct route is always cheapest — ride the ferry for every ' +
    'crossing and never touch the deployed bridge until it is sold.',
  insight:
    'The detour pays: re-setting the span on the channel socket converts ' +
    'one move into a crossing the whole east bank walks for free — the ' +
    'tool can be more valuable as a route than as cargo on time.',
  winningTraceSummary:
    'A — "Ferry freight" (28 moves): the bridge stays bolted to the West ' +
    'creek; Finch stages the cider at Middle, Lark mails the deeds and files ' +
    'the mailbox, Sparrow rides once to receive the mail and once back, and ' +
    'Wren runs five ferry legs — cider to the tavern, granite to the monument, ' +
    'bridge to the museum — closing the East exit. ' +
    'B — "The span pays" (28 moves): Finch hauls the cider to the North post ' +
    'and mails it, Lark mails the deeds and decommissions the mailbox; then ' +
    'Wren packs the bridge, rides it across once, sets it on the channel ' +
    'socket, walks the granite to the monument, files cider and deeds on the ' +
    'quay — and finally lifts the span from its East foot for the museum. ' +
    'Seven ferry legs against one; the dividend is that the crossing itself ' +
    'becomes cargo.',
  wrongApproaches: [
    'Trap a runner: pack the west bridge while Wren is still on the bank — ' +
      'his East exit strands (redeploy while carried, undo once it is at the ' +
      'museum). The mail cannot carry people home.',
    'Wrong foot: the channel socket is handled from East — deploying the ' +
      'span from Middle is refused; you pay one ferry ride to set it.',
    'Dead link: pack the relay mailbox and the post goes silent — "link ' +
      'inactive" on send.',
    'Kind mismatch: the mailbox will not stand on a bridge socket; the ' +
      'bridge will not stand on the post ("does not accept").',
    'Capacity: two parcels will not ride the harbor ferry — the hold takes ' +
      'one.',
  ],
  hints: [
    'Count the crossings the bridge itself must make tonight: it only has ' +
      'to be a bridge on ONE side at a time. Where you keep it decides what ' +
      'else has to ride the ferry.',
    '`pack` lifts a piece into your hands and `deploy` stands it on any ' +
      'socket that accepts its kind — a carried bridge is cargo you still ' +
      'own, and a deployed span is a crossing everyone walks for free. ' +
      '`send` moves a staged parcel down the wire with no courier at all.',
    'Decide where the bridge works tonight before anything rides the ' +
      'ferry — the channel socket is worked from its East foot, so whoever ' +
      're-sets it must already be across. That one choice picks your plan.',
  ],
  coopNote:
    'Four distinct contributions either way: a postal runner (Lark), a west ' +
      'runner (Finch), an east-leg receiver (Sparrow), and the closer who ' +
      'carries the bridge sale (Wren). In plan A the ferryman is the ' +
      'bottleneck role; in plan B the span-setter is — split the jobs before ' +
      'the first pack.',
} as const;
