// AUTOMATED PLAYTEST probe — PFT-11
import { simulate } from '../src/engine/pft/sim';
import { PFT11_MAIL_THE_POST_OFFICE as L } from '../src/content/levels/pft11-mail-the-post-office';
import type { PftAction } from '../src/engine/pft/types';

const W='courier-1',L2='courier-2',F3='courier-3',S='courier-4',F='ferry-1';
const T: PftAction[] = [
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
const SEED = 'audit';
const full = simulate(L, T, SEED);
console.log('trace: ' + T.length + ' moves, success=' + full.success);
const redundant = [];
for (let i = 0; i < T.length; i++) {
  const cut = T.slice(0, i).concat(T.slice(i + 1));
  if (simulate(L, cut, SEED).success) redundant.push(i);
}
console.log('redundant single actions: ' + (redundant.length ? redundant.join(',') : 'none'));

// Shortcut attempt 1: mail the granite instead of Lark's monument leg.
const mailGranite: PftAction[] = [
 {type:'travel',courierId:L2,path:['west','north']},
 {type:'send',courierId:L2,linkId:'link-north-east',parcelId:'mailbag'},
 {type:'pack',courierId:L2,pieceId:'mailbox-1'},
 {type:'travel',courierId:L2,path:['west','middle']},
 {type:'deliver',courierId:L2,itemId:'mailbox-1',recipientId:'depot'},
 {type:'pickup',courierId:L2,itemId:'granite'},
 {type:'travel',courierId:L2,path:['west','north']},      // back over orchard
 {type:'send',courierId:L2,linkId:'link-north-east',parcelId:'granite'},
 {type:'travel',courierId:L2,path:['west','middle','east','slip']},
 {type:'travel',courierId:F3,path:['west']},
 {type:'pack',courierId:F3,pieceId:'sign-1'},
 {type:'travel',courierId:F3,path:['middle','east','slip']},
 {type:'deploy',courierId:F3,pieceId:'sign-1',siteId:'post-office-new'},
 {type:'travel',courierId:W,path:['west']},
 {type:'pickup',courierId:W,itemId:'cider'},
 {type:'travel',courierId:W,path:['middle','east']},
 {type:'deliver',courierId:W,itemId:'cider',recipientId:'tavern'},
 {type:'travel',courierId:W,path:['middle']},
 {type:'pack',courierId:W,pieceId:'bridge-1'},
 {type:'travel',courierId:W,path:['east']},
 {type:'deliver',courierId:W,itemId:'bridge-1',recipientId:'museum'},
 {type:'pack',courierId:S,pieceId:'bridge-2'},
 {type:'deliver',courierId:S,itemId:'bridge-2',recipientId:'foundry'},
 {type:'pickup',courierId:S,itemId:'mailbag'},
 {type:'pickup',courierId:S,itemId:'granite'},   // cap 1 — expect failure here
];
const r1 = simulate(L, mailGranite, SEED);
console.log('mail-granite shortcut: success=' + r1.success + ' moves=' + r1.stats.moves);
