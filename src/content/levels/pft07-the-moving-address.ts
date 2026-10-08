/**
 * PFT-07 "The Moving Address" — a recipient's deployed location changes
 * (master §II PFT-D, PFT-010).
 *
 * Card: a movable named address sign, familiar routes, ordinary cargo
 * addressed to that recipient. Relocate and deploy/deliver the sign as
 * required, then route cargo to the now-valid address. Do not satisfy
 * delivery at an obsolete location or while the address is packed.
 *
 * Map: the usual town, plus two lanes that only exist where a sign stands.
 * The Greene family is moving from the Old Lot (off West Bank, at the old
 * fence post) to the New Lot (off East Shore, at the new post). Both lots are
 * `mountedOn` the Greene sign itself: the address is where the sign is
 * deployed — deployed at the old post the Old Lot is in town, moved to the
 * new post the New Lot is, and packed in a satchel the address exists
 * nowhere at all (PFT-010).
 *
 * Work: the tea set goes to the Greene household at its CURRENT address —
 * the New Lot, reachable only while the sign stands at the new post. The
 * sign itself then ships on to the town registry, and the bridge to the
 * museum. Lark walks home through the West gate; Wren closes up East.
 *
 * Orders: tea set -> Greene household (new lot); Greene sign -> town
 * registry; bridge -> museum; Wren -> East exit; Lark -> West gate.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT07_THE_MOVING_ADDRESS: PftLevel = {
  levelId: 'pft-07',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft07-the-moving-address/1.0.0',
  title: 'The Moving Address',

  nodes: [
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'north', name: 'North Field', height: 0 },
    { id: 'middle', name: 'Middle Landing', height: 0 },
    { id: 'east', name: 'East Shore', height: 0 },
    // The lots exist only where the Greene sign stands (PFT-006 occupancy).
    { id: 'old-lot', name: 'Old Greene Lot', height: 0, mountedOn: 'sign-1' },
    { id: 'new-lot', name: 'New Greene Lot', height: 0, mountedOn: 'sign-1' },
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
      id: 'signpost-old',
      name: 'Old Greene fence post',
      handlingNode: 'west',
      connects: ['west', 'old-lot'],
      accepts: ['sign'],
    },
    {
      id: 'signpost-new',
      name: 'New Greene fence post',
      handlingNode: 'east',
      connects: ['east', 'new-lot'],
      accepts: ['sign'],
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
    {
      id: 'tea',
      name: "Grandmother's Tea Set",
      at: { type: 'node', nodeId: 'north' },
    },
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
      id: 'sign-1',
      kind: 'sign',
      name: 'Greene Residence sign',
      // One street end of each post: lifted from the East side of the new
      // lot, worked from the West side of the old one (PFT-005). East is
      // listed first so the order analysis reads the live East handle.
      handlingNodes: ['east', 'west'],
      initial: { status: 'deployed', siteId: 'signpost-old' },
    },
  ],

  recipients: [
    // The obsolete address: a real lane, reachable while the sign stands at
    // the old post — but nothing is ordered to it.
    { id: 'greene-old', name: 'Greene household — old lot', node: 'old-lot' },
    { id: 'greene-new', name: 'Greene household — new lot', node: 'new-lot' },
    { id: 'registry', name: 'Town Registry', node: 'east' },
    { id: 'museum', name: 'East Museum', node: 'east' },
  ],

  exits: [
    { id: 'east-exit', name: 'East Exit', node: 'east' },
    { id: 'west-gate', name: 'West Gate', node: 'west' },
  ],

  orders: [
    {
      id: 'order-tea',
      label: 'Deliver the tea set to the Greene household',
      subject: { type: 'parcel', parcelId: 'tea' },
      recipientId: 'greene-new',
    },
    {
      id: 'order-sign',
      label: 'File the Greene sign at the town registry',
      subject: { type: 'piece', pieceId: 'sign-1' },
      recipientId: 'registry',
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
      label: 'Courier Lark finishes at the West gate',
      subject: { type: 'courier', courierId: 'courier-2' },
      exitId: 'west-gate',
    },
  ],

  // Verified trace commits 20 moves: Lark moves the sign; Wren delivers the
  // tea while the address stands, then ships bridge and sign out.
  par: 20,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT07_CARD = {
  winningTraceSummary:
    'Lark lifts the Greene sign off the old fence post at West, ferries it East, and ' +
    'sets it on the new post — the address moves with it; she sails back and walks ' +
    'home through the West gate. Wren fetches the tea set from North Field, crosses, ' +
    'and carries it up the new lane to the Greene household while the sign still ' +
    'stands; then back to pack the bridge, ferry it to the museum, lift the sign a ' +
    'last time at the new post, and file it at the registry (20 moves).',
  wrongApproaches: [
    'Obsolete location: the tea set handed in at the Old Lot is refused — "no open ' +
      'order" — and once the sign leaves the old post, the lane itself is gone.',
    'Address packed: lifting the sign at the new post before the tea arrives strands ' +
      'the delivery — redeploy to recover while it is still owned, undo-only once ' +
      'filed at the registry.',
    'Occupant: the sign cannot be lifted while a courier stands on the lot it ' +
      'carries — "cannot pack" (PFT-006).',
    'Kind mismatch: the sign will not stand on the West–Middle water socket, and the ' +
      'bridge will not stand on a fence post — "does not accept".',
  ],
  hints: [
    'The Greene household is not a place on the map tonight — it is wherever the ' +
      'sign is standing. Deliver to where the sign WAS and you are answering a dead ' +
      'address.',
    'Only the sign posts can hold the sign, and each is worked from its own street ' +
      '— lifted at the West fence, set at the East fence. A packed sign means the ' +
      'Greene lane exists nowhere.',
    'Lark carries the sign East and sets it on the new post, then comes home by ' +
      'the West gate. Wren runs the tea set up the new lane while the sign stands, ' +
      'then ships the bridge and files the sign at the registry — in that order.',
  ],
  coopNote:
    'Lark owns the sign; Wren owns the cargo. The one coordination rule: nothing ' +
      'lifts the sign at the new post until the tea set is inside — the address ' +
      'disappears under anyone still standing on it.',
} as const;
