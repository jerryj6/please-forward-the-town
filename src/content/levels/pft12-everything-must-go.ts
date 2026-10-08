/**
 * PFT-12 "Everything Must Go" — the finale: complete the moving town
 * without stranding its delivery team (master §II PFT-D, PFT-11/12 block).
 *
 * Card: all taught infrastructure categories, fixed four couriers, final
 * post-office delivery, no new core rules. Deliver every required item and
 * every courier to the final neighborhood. Verify two strategically
 * different complete logistics plans.
 *
 * Map: the whole town — West bank and orchard path, Middle Landing, East
 * Shore and Slip boardwalk, the cliff loft (stair-mounted), the relay post
 * (postal link North -> East), the packet ferry (for sale at the East
 * quay), and the two post-office lanes riding on the office sign.
 *
 * The work: four parcels out (tapestry down the stair, tea across the
 * creek, granite to the monument, the records and the mailbag east), four
 * pieces sold (both bridges, the staircase, the relay mailbox), the ferry
 * signed over with an empty hold, and the office sign carried to the new
 * post so that all four couriers can finish inside the moved office —
 * simultaneously.
 *
 * Two verified plans with different infrastructure signatures:
 *
 *   A "Office first" (46 moves): the sign moves at once — Finch shoulders
 *     it over both crossings and stands it on the new post before any
 *     cargo moves; the office then stays open for the whole teardown.
 *     Freight rides the ferry in the hold (a load/ride/unload leg); the
 *     mailbag travels by hand.
 *
 *   B "Close the office last" (44 moves): the mail does the work — both
 *     records and mailbag go down the wire — while Finch carries the sign
 *     in his satchel through the entire teardown and opens the new office
 *     as the very last act before everyone walks in. One ferry ride, just
 *     to position the boat for its sale.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT12_EVERYTHING_MUST_GO: PftLevel = {
  levelId: 'pft-12',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft12-everything-must-go/1.0.0',
  title: 'Everything Must Go',

  nodes: [
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'north', name: 'North Field', height: 0 },
    { id: 'middle', name: 'Middle Landing', height: 0 },
    { id: 'east', name: 'East Shore', height: 0 },
    { id: 'slip', name: 'Slip', height: 0 },
    { id: 'loft', name: 'Cliff Loft', height: 1, mountedOn: 'stair-1' },
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
      id: 'socket-west-loft',
      name: 'West cliff stair socket',
      handlingNode: 'west',
      connects: ['west', 'loft'],
      accepts: ['stair'],
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
      name: 'Packet Ferry',
      docks: ['middle', 'east'],
      courierCapacity: 1,
      parcelCapacity: 1,
      startsAt: 'middle',
      handlingNode: 'east',
    },
  ],

  couriers: [
    { id: 'courier-1', name: 'Courier Wren', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-2', name: 'Courier Lark', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-3', name: 'Courier Finch', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-4', name: 'Courier Sparrow', at: 'east', cargoCapacity: 1 },
  ],

  parcels: [
    { id: 'mailbag', name: "Postmaster's Mailbag", at: { type: 'node', nodeId: 'north' } },
    { id: 'records', name: 'Town Records', at: { type: 'node', nodeId: 'north' } },
    { id: 'tapestry', name: "Weaver's Tapestry", at: { type: 'node', nodeId: 'loft' } },
    { id: 'tea', name: 'Market Tea', at: { type: 'node', nodeId: 'west' } },
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
      id: 'stair-1',
      kind: 'stair',
      name: 'Elm Staircase',
      handlingNodes: ['west'],
      initial: { status: 'deployed', siteId: 'socket-west-loft' },
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
      handlingNodes: ['west'],
      initial: { status: 'deployed', siteId: 'post-office-old' },
    },
  ],

  recipients: [
    { id: 'postmaster-old', name: 'Postmaster — old office', node: 'office-old' },
    { id: 'postmaster', name: 'Postmaster — new office', node: 'office-new' },
    { id: 'archives', name: 'East Archives', node: 'east' },
    { id: 'conservatory', name: 'East Conservatory', node: 'east' },
    { id: 'gallery', name: 'Slip Gallery', node: 'slip' },
    { id: 'monument', name: 'Slip Monument', node: 'slip' },
    { id: 'depot', name: 'Middle Depot', node: 'middle' },
    { id: 'museum', name: 'East Museum', node: 'east' },
    { id: 'foundry', name: 'East Foundry', node: 'east' },
    { id: 'observatory', name: 'East Observatory', node: 'east' },
    { id: 'harbor-master', name: 'Harbor-Master', node: 'east' },
  ],

  exits: [
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
      id: 'order-records',
      label: 'Send the town records to the East archives',
      subject: { type: 'parcel', parcelId: 'records' },
      recipientId: 'archives',
    },
    {
      id: 'order-tapestry',
      label: 'Deliver the tapestry to the Slip gallery',
      subject: { type: 'parcel', parcelId: 'tapestry' },
      recipientId: 'gallery',
    },
    {
      id: 'order-tea',
      label: 'Deliver the tea to the East conservatory',
      subject: { type: 'parcel', parcelId: 'tea' },
      recipientId: 'conservatory',
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
      id: 'order-stair',
      label: 'Deliver the elm staircase to the East observatory',
      subject: { type: 'piece', pieceId: 'stair-1' },
      recipientId: 'observatory',
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
      id: 'order-ferry',
      label: 'Sign the packet ferry over to the harbor-master',
      subject: { type: 'ferry', ferryId: 'ferry-1' },
      recipientId: 'harbor-master',
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

  // Verified traces: plan A commits 46 moves, plan B commits 44 — the
  // tighter plan is the reference par.
  par: 44,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT12_CARD = {
  // Bible §3.6 checklist: declared solution policy. Open — the finale is
  // elaboration/sandbox over the taught vocabulary; two complete plans
  // verified with different infrastructure signatures.
  solutionPolicy:
    'open — two verified plans: "office first" (sign deployed early, ferry ' +
      'freight leg, mailbag by hand) vs "close the office last" (everything ' +
      'mailed, sign opened as the final act)',
  naiveApproach:
    'Empty the town west-to-east as the jobs appear and treat the office ' +
      'move as just another errand — but a bridge sold while the sign ' +
      'still stands on the west bank leaves the sign unreachable: the ' +
      'office can never move, and four exit orders die with it.',
  insight:
    'The sign is cargo with a deadline: it must cross while a crossing ' +
      'still stands — move it early and the office stays open all night, ' +
      'or carry it packed through the teardown and open it last.',
  winningTraceSummary:
    'A — "Office first" (46 moves): Finch lifts the sign at once and stands ' +
    'it on the new post; Lark mails the records, files the mailbox, then ' +
    'carries the mailbag by hand to the postmaster; Finch also ferries the ' +
    'tea across in the hold; Wren brings the tapestry down the stair and ' +
    'packs the plank bridge for the museum; Sparrow takes the granite, the ' +
    'span, and the ferry papers. ' +
    'B — "Close the office last" (44 moves): both mailbag and records go ' +
    'down the wire, Finch carries the packed sign east on the ferry\'s last ' +
    'sail and keeps it in his satchel through the whole teardown — Wren ' +
    'takes the loft and the granite, Sparrow the tea and the span — and ' +
    'only when every order is settled does Finch stand the sign on the new ' +
    'post and everyone walks into the office.',
  wrongApproaches: [
    'You cannot mail the post office: sending the sign down the wire is ' +
      'refused — only parcels travel postal links.',
    'Teardown before the move: packing the plank bridge while the sign ' +
      'still stands at the old post (or a teammate still works the west ' +
      'bank) strands the west work — redeploy while carried, undo once ' +
      'filed.',
    'The dead address: the mailbag at the old office is "no open order"; ' +
      'and a courier clocking out on the old lane finishes nothing — the ' +
      'exit is wherever the sign NOW stands.',
    'Sold boat, full hold: the harbor-master will not take the ferry with ' +
      'cargo aboard — unload first.',
    'Occupied structure: neither the staircase nor the sign packs while ' +
      'someone (or something) is still standing on what it carries (PFT-006).',
  ],
  // Bible §3.4 ladder: T1 relationship; T2 tool without use; T3 first
  // decisive commitment — the WHEN of the office move, not the roster.
  hints: [
    'Every obligation and every tool is the same short list tonight: the ' +
      'loft needs the staircase, the wire needs the mailbox, the west ' +
      'bank needs the plank bridge — and the exits need the office.',
    'Each piece is a tool in one window and cargo in another: `send` ' +
      'before `pack`, fetch before `pack`, and `hand_over_ferry` only ' +
      'after the hold is empty. The sign is `pack`/`deploy` like the rest.',
    'Choose when the office moves — that single commitment shapes the ' +
      'whole night. The one thing that can never happen: a bridge sold ' +
      'while the sign still stands on the west bank.',
  ],
  coopNote:
    'Four distinct contributions in either plan: a postal runner (Lark — ' +
      'the wire and the mailbag), a sign-bearer (Finch — the moving address ' +
      'itself), a loft-and-teardown runner (Wren — stair, granite, plank ' +
      'bridge), and an east-side receiver (Sparrow — span, boat, and the ' +
      'quay-side freight). The forced coupling is the teardown order ' +
      'itself: every crossing is shared infrastructure AND cargo, so "can ' +
      'I pack?" is always a team question — the plan fails unless the ' +
      'group agrees the west bank is done before the last bridge lifts.',
} as const;
