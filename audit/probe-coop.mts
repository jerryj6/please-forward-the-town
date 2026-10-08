// coopNote truth-check: remove each courier; which orders die?
import { simulate } from '../src/engine/pft/sim';
import { PFT08_NO_ONE_LEFT_ON_WEST as L08 } from '../src/content/levels/pft08-no-one-left-on-west';
import { PFT09_THREE_USEFUL_PARCELS as L09 } from '../src/content/levels/pft09-three-useful-parcels';
import { PFT10_THE_DETOUR_DIVIDEND as L10 } from '../src/content/levels/pft10-the-detour-dividend';
import { PFT11_MAIL_THE_POST_OFFICE as L11 } from '../src/content/levels/pft11-mail-the-post-office';
import { PFT12_EVERYTHING_MUST_GO as L12 } from '../src/content/levels/pft12-everything-must-go';
import type { PftAction, PftLevel } from '../src/engine/pft/types';
const W='courier-1',L2='courier-2',F3='courier-3',S='courier-4',F='ferry-1';
const SEED='audit';
function missingOrders(level: PftLevel, res: any): string[] {
  return level.orders.map((o: any)=>o.id).filter((id:string)=>!res.finalState.fulfilled[id]);
}
const T_L08: PftAction[] = [
  { type: 'travel', courierId: W, path: ['west', 'north'] },
  { type: 'pickup', courierId: W, itemId: 'sunstone' },
  { type: 'travel', courierId: W, path: ['west', 'middle'] },
  { type: 'travel', courierId: W, path: ['east'] }, // walks the Town Span
  { type: 'deliver', courierId: W, itemId: 'sunstone', recipientId: 'archives' },
  { type: 'travel', courierId: L2, path: ['west'] },
  { type: 'pickup', courierId: L2, itemId: 'ledger' },
  { type: 'travel', courierId: L2, path: ['middle', 'east', 'slip'] },
  { type: 'deliver', courierId: L2, itemId: 'ledger', recipientId: 'annex' },
  { type: 'travel', courierId: L2, path: ['east', 'middle'] },
  { type: 'pack', courierId: L2, pieceId: 'bridge-1' },
  { type: 'travel', courierId: L2, path: ['east'] }, // carries the plank over the span
  { type: 'deliver', courierId: L2, itemId: 'bridge-1', recipientId: 'museum' },
  { type: 'travel', courierId: L2, path: ['slip'] },
  { type: 'pickup', courierId: F3, itemId: 'engine' },
  { type: 'ride_ferry', courierId: F3, ferryId: F, to: 'east' },
  { type: 'travel', courierId: F3, path: ['slip'] },
  { type: 'deliver', courierId: F3, itemId: 'engine', recipientId: 'drydock' },
  { type: 'hand_over_ferry', courierId: S, ferryId: F, recipientId: 'harbor-master' },
  { type: 'pack', courierId: S, pieceId: 'bridge-2' }, // span lifted at its East foot
  { type: 'deliver', courierId: S, itemId: 'bridge-2', recipientId: 'foundry' },
];

{
  const t = T_L08;
  for (const c of ['courier-1','courier-2','courier-3','courier-4']) {
    const cut = t.filter(a => (a as any).courierId !== c);
    const r = simulate(L08, cut, SEED);
    const mine = t.filter(a => (a as any).courierId === c).length;
    console.log('L08 minus ' + c + ' (removed ' + mine + ' acts): success=' + r.success + ' unfulfilled=' + missingOrders(L08, r).join('|'));
  }
}
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
  for (const c of ['courier-1','courier-2','courier-3','courier-4']) {
    const cut = t.filter(a => (a as any).courierId !== c);
    const r = simulate(L09, cut, SEED);
    const mine = t.filter(a => (a as any).courierId === c).length;
    console.log('L09 minus ' + c + ' (removed ' + mine + ' acts): success=' + r.success + ' unfulfilled=' + missingOrders(L09, r).join('|'));
  }
}
const T_L10_A: PftAction[] = [
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
  const t = T_L10_A;
  for (const c of ['courier-1','courier-2','courier-3','courier-4']) {
    const cut = t.filter(a => (a as any).courierId !== c);
    const r = simulate(L10, cut, SEED);
    const mine = t.filter(a => (a as any).courierId === c).length;
    console.log('L10-A minus ' + c + ' (removed ' + mine + ' acts): success=' + r.success + ' unfulfilled=' + missingOrders(L10, r).join('|'));
  }
}
const T_L11: PftAction[] = [
  // — Lark: the postal run and the relay decommission
  { type: 'travel', courierId: L2, path: ['west', 'north'] },
  { type: 'send', courierId: L2, linkId: 'link-north-east', parcelId: 'mailbag' },
  { type: 'pack', courierId: L2, pieceId: 'mailbox-1' },
  { type: 'travel', courierId: L2, path: ['west', 'middle'] },
  { type: 'deliver', courierId: L2, itemId: 'mailbox-1', recipientId: 'depot' },
  // — Lark: the monument leg
  { type: 'pickup', courierId: L2, itemId: 'granite' },
  { type: 'travel', courierId: L2, path: ['east', 'slip'] },
  { type: 'deliver', courierId: L2, itemId: 'granite', recipientId: 'monument' },
  // — Finch: the moving address (pack West, deploy Slip)
  { type: 'travel', courierId: F3, path: ['west'] },
  { type: 'pack', courierId: F3, pieceId: 'sign-1' }, // the office is nowhere
  { type: 'travel', courierId: F3, path: ['middle', 'east', 'slip'] },
  { type: 'deploy', courierId: F3, pieceId: 'sign-1', siteId: 'post-office-new' },
  // — Wren: the cider run, then the plank-bridge sale (last west job)
  { type: 'travel', courierId: W, path: ['west'] },
  { type: 'pickup', courierId: W, itemId: 'cider' },
  { type: 'travel', courierId: W, path: ['middle', 'east'] },
  { type: 'deliver', courierId: W, itemId: 'cider', recipientId: 'tavern' },
  { type: 'travel', courierId: W, path: ['middle'] },
  { type: 'pack', courierId: W, pieceId: 'bridge-1' },
  { type: 'travel', courierId: W, path: ['east'] },
  { type: 'deliver', courierId: W, itemId: 'bridge-1', recipientId: 'museum' },
  // — Sparrow: span sale, then the mailbag to the moved office
  { type: 'pack', courierId: S, pieceId: 'bridge-2' },
  { type: 'deliver', courierId: S, itemId: 'bridge-2', recipientId: 'foundry' },
  { type: 'pickup', courierId: S, itemId: 'mailbag' }, // mailed here in step 2
  { type: 'travel', courierId: S, path: ['slip', 'office-new'] },
  { type: 'deliver', courierId: S, itemId: 'mailbag', recipientId: 'postmaster' },
  // — the whole team walks into the moved office
  { type: 'travel', courierId: L2, path: ['office-new'] },
  { type: 'travel', courierId: F3, path: ['office-new'] },
  { type: 'travel', courierId: W, path: ['slip', 'office-new'] },
];

{
  const t = T_L11;
  for (const c of ['courier-1','courier-2','courier-3','courier-4']) {
    const cut = t.filter(a => (a as any).courierId !== c);
    const r = simulate(L11, cut, SEED);
    const mine = t.filter(a => (a as any).courierId === c).length;
    console.log('L11 minus ' + c + ' (removed ' + mine + ' acts): success=' + r.success + ' unfulfilled=' + missingOrders(L11, r).join('|'));
  }
}
const T_L12_B: PftAction[] = [
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

{
  const t = T_L12_B;
  for (const c of ['courier-1','courier-2','courier-3','courier-4']) {
    const cut = t.filter(a => (a as any).courierId !== c);
    const r = simulate(L12, cut, SEED);
    const mine = t.filter(a => (a as any).courierId === c).length;
    console.log('L12-B minus ' + c + ' (removed ' + mine + ' acts): success=' + r.success + ' unfulfilled=' + missingOrders(L12, r).join('|'));
  }
}
