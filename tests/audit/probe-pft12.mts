// AUTOMATED PLAYTEST probe (audit tool, not shipped content)
import { simulate } from '../../src/engine/pft/sim';
import { PFT12_EVERYTHING_MUST_GO as L } from '../../src/content/levels/pft12-everything-must-go';
import type { PftAction } from '../../src/engine/pft/types';

const W='courier-1',L2='courier-2',F3='courier-3',S='courier-4',F='ferry-1';
const A: PftAction[] = [
  // — Finch: move the office first
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pack', courierId: F3, pieceId: 'sign-1' },
  { type: 'travel', courierId: F3, path: ['middle', 'east', 'slip'] },
  { type: 'deploy', courierId: F3, pieceId: 'sign-1', siteId: 'post-office-new' },
  // — Lark: the wire, the mailbox, then the mailbag by hand
  { type: 'travel', courierId: L2, path: ['west', 'north'] },
  { type: 'send', courierId: L2, linkId: 'link-north-east', parcelId: 'records' },
  { type: 'pack', courierId: L2, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L2, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L2, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L2, path: ['west', 'north'] },
  { type: 'pickup', courierId: L2, itemId: 'mailbag' },
  { type: 'travel', courierId: L2, path: ['west', 'middle', 'east', 'slip', 'office-new'] },
  { type: 'deliver', courierId: L2, itemId: 'mailbag', recipientId: 'postmaster' },
  // — Finch: the tea by ferry freight
  { type: 'travel', courierId: F3, path: ['east', 'middle', 'west'] },
  { type: 'pickup', courierId: F3, itemId: 'tea' },
  { type: 'travel', courierId: F3, path: ['middle'] },
  { type: 'load_ferry', courierId: F3, ferryId: F, itemId: 'tea' },
  { type: 'ride_ferry', courierId: F3, ferryId: F, to: 'east' },
  { type: 'unload_ferry', courierId: F3, ferryId: F, itemId: 'tea' },
  { type: 'pickup', courierId: F3, itemId: 'tea' },
  { type: 'deliver', courierId: F3, itemId: 'tea', recipientId: 'conservatory' },
  // — Wren: the loft fetch, then the staircase
  { type: 'travel', courierId: W, path: ['west', 'loft'] },
  { type: 'pickup', courierId: W, itemId: 'tapestry' },
  { type: 'travel', courierId: W, path: ['west', 'middle', 'east', 'slip'] },
  { type: 'deliver', courierId: W, itemId: 'tapestry', recipientId: 'gallery' },
  { type: 'travel', courierId: W, path: ['east', 'middle', 'west'] },
  { type: 'pack', courierId: W, pieceId: 'stair-1' },
  { type: 'travel', courierId: W, path: ['middle', 'east'] },
  { type: 'deliver', courierId: W, itemId: 'stair-1', recipientId: 'observatory' },
  // — Sparrow: the granite, then the mailed records off the quay
  { type: 'travel', courierId: S, path: ['middle'] },
  { type: 'pickup', courierId: S, itemId: 'granite' },
  { type: 'travel', courierId: S, path: ['east', 'slip'] },
  { type: 'deliver', courierId: S, itemId: 'granite', recipientId: 'monument' },
  { type: 'travel', courierId: S, path: ['east'] },
  { type: 'pickup', courierId: S, itemId: 'records' }, // mailed here in step 6
  { type: 'deliver', courierId: S, itemId: 'records', recipientId: 'archives' },
  // — Wren: plank-bridge sale (west bank is done)
  { type: 'travel', courierId: W, path: ['middle'] },
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'travel', courierId: W, path: ['east'] },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
  // — Sparrow: the span, then the boat
  { type: 'pack', courierId: S, pieceId: 'bridge-2' },
  { type: 'deliver', courierId: S, itemId: 'bridge-2', recipientId: 'foundry' },
  { type: 'hand_over_ferry', courierId: S, ferryId: F, recipientId: 'harbor-master' },
  // — everyone into the moved office
  { type: 'travel', courierId: W, path: ['slip', 'office-new'] },
  { type: 'travel', courierId: F3, path: ['slip', 'office-new'] },
  { type: 'travel', courierId: S, path: ['slip', 'office-new'] },
];
const B: PftAction[] = [
  // — Finch: pack the sign, ride it east on the boat's last sail
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pack', courierId: F3, pieceId: 'sign-1' },
  { type: 'travel', courierId: F3, path: ['middle'] },
  { type: 'ride_ferry', courierId: F3, ferryId: F, to: 'east' },
  // — Lark: mail everything, then decommission the relay
  { type: 'travel', courierId: L2, path: ['west', 'north'] },
  { type: 'send', courierId: L2, linkId: 'link-north-east', parcelId: 'records' },
  { type: 'send', courierId: L2, linkId: 'link-north-east', parcelId: 'mailbag' },
  { type: 'pack', courierId: L2, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L2, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L2, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L2, path: ['east'] }, // over the span
  { type: 'pickup', courierId: L2, itemId: 'mailbag' }, // receives the wire
  // — Wren: loft, staircase, granite
  { type: 'travel', courierId: W, path: ['west', 'loft'] },
  { type: 'pickup', courierId: W, itemId: 'tapestry' },
  { type: 'travel', courierId: W, path: ['west', 'middle', 'east', 'slip'] },
  { type: 'deliver', courierId: W, itemId: 'tapestry', recipientId: 'gallery' },
  { type: 'travel', courierId: W, path: ['east', 'middle', 'west'] },
  { type: 'pack', courierId: W, pieceId: 'stair-1' },
  { type: 'travel', courierId: W, path: ['middle', 'east'] },
  { type: 'deliver', courierId: W, itemId: 'stair-1', recipientId: 'observatory' },
  { type: 'travel', courierId: W, path: ['middle'] },
  { type: 'pickup', courierId: W, itemId: 'granite' },
  { type: 'travel', courierId: W, path: ['east', 'slip'] },
  { type: 'deliver', courierId: W, itemId: 'granite', recipientId: 'monument' },
  // — Sparrow: the tea run
  { type: 'travel', courierId: S, path: ['middle', 'west'] },
  { type: 'pickup', courierId: S, itemId: 'tea' },
  { type: 'travel', courierId: S, path: ['middle', 'east'] },
  { type: 'deliver', courierId: S, itemId: 'tea', recipientId: 'conservatory' },
  // — Sparrow: the records off the quay, then teardown: bridge, span, boat
  { type: 'pickup', courierId: S, itemId: 'records' },
  { type: 'deliver', courierId: S, itemId: 'records', recipientId: 'archives' },
  { type: 'travel', courierId: W, path: ['east', 'middle'] },
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'travel', courierId: W, path: ['east'] },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'pack', courierId: S, pieceId: 'bridge-2' },
  { type: 'deliver', courierId: S, itemId: 'bridge-2', recipientId: 'foundry' },
  { type: 'hand_over_ferry', courierId: S, ferryId: F, recipientId: 'harbor-master' },
  // — the office opens last
  { type: 'travel', courierId: F3, path: ['slip'] },
  { type: 'deploy', courierId: F3, pieceId: 'sign-1', siteId: 'post-office-new' },
  // — everyone walks in; Lark hands the postmaster the mailbag
  { type: 'travel', courierId: F3, path: ['office-new'] },
  { type: 'travel', courierId: W, path: ['slip', 'office-new'] },
  { type: 'travel', courierId: S, path: ['slip', 'office-new'] },
  { type: 'travel', courierId: L2, path: ['slip', 'office-new'] },
  { type: 'deliver', courierId: L2, itemId: 'mailbag', recipientId: 'postmaster' },
];
const SEED = 'audit';
for (const [nm, trace] of [['A', A], ['B', B]] as const) {
  const full = simulate(L, trace, SEED);
  console.log('plan ' + nm + ': ' + trace.length + ' moves, success=' + full.success);
  const redundant = [];
  for (let i = 0; i < trace.length; i++) {
    const cut = trace.slice(0, i).concat(trace.slice(i + 1));
    if (simulate(L, cut, SEED).success) redundant.push(i);
  }
  console.log('  redundant single actions: ' + (redundant.length ? redundant.join(',') : 'none'));
}
