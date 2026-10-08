// AUTOMATED PLAYTEST probe — PFT-09/10 minimalism + degenerate solves
import { simulate } from '../../src/engine/pft/sim';
import { PFT09_THREE_USEFUL_PARCELS as L09 } from '../../src/content/levels/pft09-three-useful-parcels';
import { PFT10_THE_DETOUR_DIVIDEND as L10 } from '../../src/content/levels/pft10-the-detour-dividend';
import type { PftAction } from '../../src/engine/pft/types';
const W='courier-1',L2='courier-2',F3='courier-3',S='courier-4',F='ferry-1';
const SEED='audit';
const T_L09: PftAction[] = [
  // Lark — the postal leg.
  { type: 'travel', courierId: L2, path: ['west', 'north'] },
  { type: 'send', courierId: L2, linkId: 'link-north-east', parcelId: 'records' },
  { type: 'pack', courierId: L2, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L2, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L2, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L2, path: ['west', 'north'] }, // home at the North post
  // Finch — the stair leg.
  { type: 'travel', courierId: F3, path: ['west', 'loft'] },
  { type: 'pickup', courierId: F3, itemId: 'tapestry' },
  { type: 'travel', courierId: F3, path: ['west', 'middle'] },
  { type: 'drop', courierId: F3, itemId: 'tapestry' }, // staged for the boat
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pack', courierId: F3, pieceId: 'stair-1' }, // loft empty — legal
  { type: 'travel', courierId: F3, path: ['middle'] },
  { type: 'drop', courierId: F3, itemId: 'stair-1' },
  // Wren — the market leg.
  { type: 'travel', courierId: W, path: ['west'] },
  { type: 'pickup', courierId: W, itemId: 'tea' },
  { type: 'travel', courierId: W, path: ['middle'] },
  { type: 'drop', courierId: W, itemId: 'tea' },
  { type: 'travel', courierId: W, path: ['west'] }, // home at the West gate
  // Sparrow — the ferryman and closer.
  { type: 'pickup', courierId: S, itemId: 'tea' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: S, itemId: 'tea', recipientId: 'conservatory' },
  { type: 'pickup', courierId: S, itemId: 'records' },
  { type: 'deliver', courierId: S, itemId: 'records', recipientId: 'archives' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: S, itemId: 'tapestry' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'travel', courierId: S, path: ['slip'] },
  { type: 'deliver', courierId: S, itemId: 'tapestry', recipientId: 'gallery' },
  { type: 'travel', courierId: S, path: ['east'] },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: S, itemId: 'stair-1' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: S, itemId: 'stair-1', recipientId: 'observatory' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: S, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: S, itemId: 'bridge-1', recipientId: 'museum' },
];

{
  const t = T_L09;
  const full = simulate(L09, t, SEED);
  console.log('L09: ' + t.length + ' moves, success=' + full.success);
  const redundant = [];
  for (let i = 0; i < t.length; i++) {
    const cut = t.slice(0, i).concat(t.slice(i + 1));
    if (simulate(L09, cut, SEED).success) redundant.push(i);
  }
  console.log('  redundant single actions: ' + (redundant.length ? redundant.join(',') : 'none'));
}
const T_L10: PftAction[] = [
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pickup', courierId: F3, itemId: 'cider' },
  { type: 'travel', courierId: F3, path: ['middle'] },
  { type: 'drop', courierId: F3, itemId: 'cider' },
  { type: 'travel', courierId: F3, path: ['west'] }, // West gate
  { type: 'travel', courierId: L2, path: ['west', 'north'] },
  { type: 'send', courierId: L2, linkId: 'link-north-east', parcelId: 'deeds' },
  { type: 'pack', courierId: L2, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L2, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L2, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L2, path: ['west', 'north'] }, // North post
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'east' },
  { type: 'pickup', courierId: S, itemId: 'deeds' },
  { type: 'deliver', courierId: S, itemId: 'deeds', recipientId: 'registry' },
  { type: 'ride_ferry', courierId: S, ferryId: F, to: 'middle' }, // dock office
  { type: 'pickup', courierId: W, itemId: 'cider' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'cider', recipientId: 'tavern' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pickup', courierId: W, itemId: 'granite' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'travel', courierId: W, path: ['slip'] },
  { type: 'deliver', courierId: W, itemId: 'granite', recipientId: 'monument' },
  { type: 'travel', courierId: W, path: ['east'] },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'middle' },
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
];

{
  const t = T_L10;
  const full = simulate(L10, t, SEED);
  console.log('L10: ' + t.length + ' moves, success=' + full.success);
  const redundant = [];
  for (let i = 0; i < t.length; i++) {
    const cut = t.slice(0, i).concat(t.slice(i + 1));
    if (simulate(L10, cut, SEED).success) redundant.push(i);
  }
  console.log('  redundant single actions: ' + (redundant.length ? redundant.join(',') : 'none'));
}
const T_L10B: PftAction[] = [
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pickup', courierId: F3, itemId: 'cider' },
  { type: 'travel', courierId: F3, path: ['north'] },
  { type: 'drop', courierId: F3, itemId: 'cider' },
  { type: 'send', courierId: F3, linkId: 'link-north-east', parcelId: 'cider' },
  { type: 'travel', courierId: F3, path: ['west'] }, // West gate
  { type: 'travel', courierId: L2, path: ['west', 'north'] },
  { type: 'send', courierId: L2, linkId: 'link-north-east', parcelId: 'deeds' },
  { type: 'pack', courierId: L2, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L2, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L2, itemId: 'mailbox-1', recipientId: 'depot' },
  { type: 'travel', courierId: L2, path: ['west', 'north'] }, // North post
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'ride_ferry', courierId: W, ferryId: F, to: 'east' },
  { type: 'deploy', courierId: W, pieceId: 'bridge-1', siteId: 'socket-town-span' },
  { type: 'travel', courierId: W, path: ['middle'] }, // walks the span it just set
  { type: 'pickup', courierId: W, itemId: 'granite' },
  { type: 'travel', courierId: W, path: ['east', 'slip'] },
  { type: 'deliver', courierId: W, itemId: 'granite', recipientId: 'monument' },
  { type: 'travel', courierId: W, path: ['east'] },
  { type: 'pickup', courierId: W, itemId: 'cider' },
  { type: 'deliver', courierId: W, itemId: 'cider', recipientId: 'tavern' },
  { type: 'travel', courierId: S, path: ['east'] }, // Sparrow walks the span too
  { type: 'pickup', courierId: S, itemId: 'deeds' },
  { type: 'deliver', courierId: S, itemId: 'deeds', recipientId: 'registry' },
  { type: 'travel', courierId: S, path: ['middle'] }, // back over it — dock office
  { type: 'pack', courierId: W, pieceId: 'bridge-1' }, // the span lifted at its East foot
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
];

{
  const t = T_L10B;
  const full = simulate(L10, t, SEED);
  console.log('L10B: ' + t.length + ' moves, success=' + full.success);
  const redundant = [];
  for (let i = 0; i < t.length; i++) {
    const cut = t.slice(0, i).concat(t.slice(i + 1));
    if (simulate(L10, cut, SEED).success) redundant.push(i);
  }
  console.log('  redundant single actions: ' + (redundant.length ? redundant.join(',') : 'none'));
}
