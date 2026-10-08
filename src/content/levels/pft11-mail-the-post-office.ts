/**
 * PFT-11 "Mail the Post Office" — the extraction destination itself moves
 * (master §II PFT-D, chapter-3 finale block).
 *
 * Card: introduce a movable post-office sign/final address alongside
 * existing delivery jobs. Relocate the destination while preserving a path
 * for every courier; the old extraction point ceases to count. The final
 * town location remains clear throughout.
 *
 * Map: the usual town, the Slip boardwalk, the relay post on North Field
 * (postal link North -> East), and TWO post-office sites — the Old Post
 * Office lane off West Bank and the New Post Office lane off the Slip. The
 * office lanes are `mountedOn` the post-office sign: whichever post the
 * sign stands on, that lane is in town; while the sign rides in a satchel,
 * the office is nowhere at all.
 *
 * The joke in the title: the post office cannot be mailed — `send` carries
 * parcels only. Someone has to shoulder the sign and walk it across both
 * crossings to the new site. While it is packed, every exit reads closed —
 * that is the taught cost of moving the destination.
 *
 * Work: Finch packs the sign at the old post (West handling) and carries it
 * West -> Middle -> East -> Slip to stand it at the new post. Lark mails
 * the postmaster's mailbag to the East quay and then decommissions the
 * relay mailbox for the Middle depot. Wren runs the Market cider East and
 * then packs the plank bridge for the museum — the last west-bank job.
 * Sparrow lifts the Town Span at its East foot for the foundry, receives
 * the mailed mailbag, and carries it to the postmaster at the moved office.
 * Everyone finishes standing in the new office lane — simultaneously.
 *
 * Orders: mailbag -> postmaster (office-new); cider -> tavern; granite ->
 * monument; mailbox -> depot; plank bridge -> museum; town span -> foundry;
 * all four couriers -> the post office.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT11_MAIL_THE_POST_OFFICE: PftLevel = {
  levelId: 'pft-11',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft11-mail-the-post-office/1.0.0',
  title: 'Mail the Post Office',

  nodes: [
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'north', name: 'North Field', height: 0 },
    { id: 'middle', name: 'Middle Landing', height: 0 },
    { id: 'east', name: 'East Shore', height: 0 },
    { id: 'slip', name: 'Slip', height: 0 },
    // The office lanes exist only where the post-office sign stands.
    { id: 'office-old', name: 'Old Post Office lane', height: 0, mountedOn: 'sign-1' },
    { id: 'office-new', name: 'New Post Office lane', height: 0, mountedOn: 'sign-1' },
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
      name: 'Town Span frame',
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
    {
      id: 'post-office-old',
      name: 'Old Post Office post',
      handlingNode: 'west',
      connects: ['west', 'office-old'],
      accepts: ['sign'],
    },
    {
      id: 'post-office-new',
      name: 'New Post Office post',
      handlingNode: 'slip',
      connects: ['slip', 'office-new'],
      accepts: ['sign'],
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
      // fixed service — tonight's mail goes by bridge and by wire
    },
  ],

  couriers: [
    { id: 'courier-1', name: 'Courier Wren', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-2', name: 'Courier Lark', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-3', name: 'Courier Finch', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-4', name: 'Courier Sparrow', at: 'east', cargoCapacity: 1 },
  ],

  parcels: [
    // Staged on the relay post — the mailbag goes most of the way by wire,
    // then the last stretch by hand to wherever the office IS.
    { id: 'mailbag', name: "Postmaster's Mailbag", at: { type: 'node', nodeId: 'north' } },
    { id: 'cider', name: 'Market Cider', at: { type: 'node', nodeId: 'west' } },
    { id: 'granite', name: 'Monument Granite', at: { type: 'node', nodeId: 'middle' } },
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
      handlingNodes: ['east'],
      initial: { status: 'deployed', siteId: 'socket-town-span' },
    },
    {
      id: 'mailbox-1',
      kind: 'mailbox',
      name: 'Relay Mailbox',
      handlingNodes: ['north'],
      initial: { status: 'deployed', siteId: 'socket-north-post' },
    },
    {
      id: 'sign-1',
      kind: 'sign',
      name: 'Post Office sign',
      // Lifted from the West side of the old post, set from the Slip side
      // of the new one (PFT-005). It is never delivered — it must be
      // standing at the new post for anyone to finish their shift.
      handlingNodes: ['west'],
      initial: { status: 'deployed', siteId: 'post-office-old' },
    },
  ],

  recipients: [
    // The obsolete address: the lane exists while the sign stands at the
    // old post — but nobody ordered anything there tonight.
    { id: 'postmaster-old', name: 'Postmaster — old office', node: 'office-old' },
    { id: 'postmaster', name: 'Postmaster — new office', node: 'office-new' },
    { id: 'tavern', name: 'East Tavern', node: 'east' },
    { id: 'monument', name: 'Slip Monument', node: 'slip' },
    { id: 'depot', name: 'Middle Depot', node: 'middle' },
    { id: 'museum', name: 'East Museum', node: 'east' },
    { id: 'foundry', name: 'East Foundry', node: 'east' },
  ],

  exits: [
    // The extraction point is wherever the office IS — tonight it is the
    // new lane, and it only exists while the sign stands there.
    { id: 'post-office', name: 'Post Office', node: 'office-new' },
  ],

  orders: [
    {
      id: 'order-mailbag',
      label: "Deliver the postmaster's mailbag to the post office",
      subject: { type: 'parcel', parcelId: 'mailbag' },
      recipientId: 'postmaster',
    },
    {
      id: 'order-cider',
      label: 'Deliver the cider to the East tavern',
      subject: { type: 'parcel', parcelId: 'cider' },
      recipientId: 'tavern',
    },
    {
      id: 'order-granite',
      label: 'Deliver the granite to the Slip monument',
      subject: { type: 'parcel', parcelId: 'granite' },
      recipientId: 'monument',
    },
    {
      id: 'order-mailbox',
      label: 'File the relay mailbox at the Middle depot',
      subject: { type: 'piece', pieceId: 'mailbox-1' },
      recipientId: 'depot',
    },
    {
      id: 'order-bridge',
      label: 'Deliver the plank bridge to the East museum',
      subject: { type: 'piece', pieceId: 'bridge-1' },
      recipientId: 'museum',
    },
    {
      id: 'order-span',
      label: 'Deliver the Town Span to the East foundry',
      subject: { type: 'piece', pieceId: 'bridge-2' },
      recipientId: 'foundry',
    },
    {
      id: 'order-wren-exit',
      label: 'Courier Wren finishes at the post office',
      subject: { type: 'courier', courierId: 'courier-1' },
      exitId: 'post-office',
    },
    {
      id: 'order-lark-exit',
      label: 'Courier Lark finishes at the post office',
      subject: { type: 'courier', courierId: 'courier-2' },
      exitId: 'post-office',
    },
    {
      id: 'order-finch-exit',
      label: 'Courier Finch finishes at the post office',
      subject: { type: 'courier', courierId: 'courier-3' },
      exitId: 'post-office',
    },
    {
      id: 'order-sparrow-exit',
      label: 'Courier Sparrow finishes at the post office',
      subject: { type: 'courier', courierId: 'courier-4' },
      exitId: 'post-office',
    },
  ],

  // Verified trace commits 28 moves: sign relocated by hand, mailbag mailed
  // partway and hand-delivered, bridges sold after the last west errands.
  par: 28,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT11_CARD = {
  // Bible §3.6 checklist: declared solution policy. Hybrid — the forced
  // core is structural (the sign must end standing on the new post for
  // anyone to finish; the west bank must be empty before the plank
  // bridge sells); the periphery is open (who carries the mailbag — hand
  // or wire — and which order the deliveries run).
  solutionPolicy:
    'hybrid — forced sign relocation + teardown order; free routing and ' +
      'optional mail-vs-hand choice for the mailbag',
  // Bible §3.34: the naive reading and the insight it fails without.
  naiveApproach:
    'Do every delivery first and send someone back for the sign at the end ' +
      '— but the plank bridge is owed to the museum and packs from Middle, ' +
      'so once it sells, nothing reaches West to fetch the sign: the office ' +
      'can never move and nobody can ever clock out.',
  insight:
    'The destination is a piece: the sign travels by hand to the new post ' +
      'BEFORE the west crossing is torn down, and every courier finishes ' +
      'inside the moved office — together.',
  winningTraceSummary:
    '"Move the destination, then close up" (28 moves): Lark hikes the orchard ' +
    'path, mails the postmaster\'s mailbag East, packs the relay mailbox and ' +
    'files it at the Middle depot, then carries the granite to the Slip ' +
    'monument. Finch lifts the Post Office sign at the old post and carries ' +
    'it over both crossings to stand it on the new post at the Slip. Wren ' +
    'fetches the cider to the East tavern, walks back, packs the plank ' +
    'bridge and ships it to the museum. Sparrow lifts the Town Span at its ' +
    'East foot for the foundry, collects the mailed mailbag, and hands it to ' +
    'the postmaster at the moved office — then all four couriers step into ' +
    'the new office lane together.',
  wrongApproaches: [
    'You cannot mail the post office: sending the sign down the wire is ' +
      'refused — only parcels travel postal links. Somebody carries it.',
    'Moving day underfoot: packing the sign while a courier stands on the ' +
      'old office lane is refused — "cannot pack" (PFT-006).',
    'The dead address: the mailbag handed in at the old office is refused — ' +
      '"no open order" — and once the sign moves, the lane itself is gone.',
    'Office closed: while the sign rides in a satchel the office exists ' +
      'nowhere — every exit strands until it stands again (redeploy while ' +
      'carried).',
    'Sell the span early: lifting the Town Span while couriers are still on ' +
      'the Middle side strands their exits (redeploy while a bridge is ' +
      'carried).',
  ],
  // Bible §3.4 ladder: T1 names which two things interact; T2 names the
  // tool without the use; T3 names the first decisive commitment, no more.
  hints: [
    'The office and the sign are the same object — the exits and the ' +
      'postmaster live wherever the sign stands, and nowhere while it ' +
      'rides in a satchel.',
    'The sign is a piece, not a place: `pack` lifts it, `deploy` stands ' +
      'it — and no wire will carry it. Each post answers only to its own ' +
      'street end.',
    'Move the destination before you sell the way there: the sign must ' +
      'cross the creek while a bridge still stands — decide who shoulders ' +
      'it before the plank bridge becomes cargo.',
  ],
  coopNote:
    'Four distinct contributions: Lark is the postal runner (send + relay ' +
      'decommission + monument leg), Finch is the sign-bearer (the only job ' +
      'that touches the moving address), Wren is the west runner (cider + ' +
      'plank-bridge sale), Sparrow is the east receiver (span sale + the ' +
      'final postmaster delivery). The forced coupling: the plank bridge ' +
      'is both Wren\'s route to the sign\'s old post and cargo owed East — ' +
      'whether it can be packed depends on whether Finch has already ' +
      'lifted the sign, so the teardown is a sequencing decision, not just ' +
      'a division of labor.',
} as const;
