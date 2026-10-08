/**
 * PFT-02 "Two Parcels, One Boat" — cargo staging and capacity (master §II PFT-D).
 *
 * Card: two parcels, limited ferry capacity, two couriers, a bridge delivery
 * whose timing matters. Stage cargo where a return trip remains possible;
 * combine useful handoffs without adding capacity.
 *
 * Map: Middle holds both couriers, the ferry dock, and the bridge handle.
 * West holds the lantern; the orchard path (a natural edge) runs West–North.
 * North holds the seed crate and Lark's home dock. East holds the orchard,
 * the greenhouse, the museum, and Wren's exit.
 *
 * The ferry is the only way East: 1 courier + 1 parcel per crossing, and a
 * carried parcel uses the same slot (PFT-004). The bridge is the only way to
 * North — Lark's exit — so the handover cannot happen until Lark is home and
 * every west-side parcel is evacuated.
 *
 * Orders: lantern -> East orchard; crate -> East greenhouse; bridge -> East
 * museum; Wren -> East exit; Lark -> North dock.
 */

import { PFT_RULES_VERSION } from '../../engine/pft/engine.js';
import type { PftLevel } from '../../engine/pft/types.js';

export const PFT02_TWO_PARCELS_ONE_BOAT: PftLevel = {
  levelId: 'pft-02',
  rulesVersion: PFT_RULES_VERSION,
  contentVersion: 'pft02-two-parcels-one-boat/1.0.0',
  title: 'Two Parcels, One Boat',

  nodes: [
    { id: 'west', name: 'West Bank', height: 0 },
    { id: 'north', name: 'North Orchard', height: 0 },
    { id: 'middle', name: 'Middle Landing', height: 0 },
    { id: 'east', name: 'East Shore', height: 0 },
  ],

  // One permanent path on the far bank; all water crossings are infrastructure.
  edges: [{ a: 'west', b: 'north', label: 'the orchard path' }],

  sites: [
    {
      id: 'socket-west-middle',
      name: 'West–Middle crossing',
      handlingNode: 'middle', // bridge handle is on Middle (PFT-005)
      connects: ['west', 'middle'],
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
      parcelCapacity: 1, // one courier plus one parcel per crossing, incl. carried cargo
      startsAt: 'middle',
      // fixed service again: not a delivery item in this contract
    },
  ],

  couriers: [
    { id: 'courier-1', name: 'Courier Wren', at: 'middle', cargoCapacity: 1 },
    { id: 'courier-2', name: 'Courier Lark', at: 'middle', cargoCapacity: 1 },
  ],

  parcels: [
    { id: 'lantern', name: 'Harbor Lantern', at: { type: 'node', nodeId: 'west' } },
    { id: 'crate', name: 'Seed Crate', at: { type: 'node', nodeId: 'north' } },
  ],

  pieces: [
    {
      id: 'bridge-1',
      kind: 'bridge',
      name: 'Plank Bridge',
      handlingNodes: ['middle'],
      initial: { status: 'deployed', siteId: 'socket-west-middle' },
    },
  ],

  recipients: [
    { id: 'orchard', name: 'East Orchard', node: 'east' },
    { id: 'greenhouse', name: 'East Greenhouse', node: 'east' },
    { id: 'museum', name: 'East Museum', node: 'east' },
  ],

  exits: [
    { id: 'east-exit', name: 'East Exit', node: 'east' },
    { id: 'north-dock', name: 'North Dock', node: 'north' },
  ],

  orders: [
    {
      id: 'order-lantern',
      label: 'Deliver the lantern to the East orchard',
      subject: { type: 'parcel', parcelId: 'lantern' },
      recipientId: 'orchard',
    },
    {
      id: 'order-crate',
      label: 'Deliver the seed crate to the East greenhouse',
      subject: { type: 'parcel', parcelId: 'crate' },
      recipientId: 'greenhouse',
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
      label: 'Courier Lark finishes at the North dock',
      subject: { type: 'courier', courierId: 'courier-2' },
      exitId: 'north-dock',
    },
  ],

  // Verified trace A commits 16 moves; trace B (Middle handoff) commits 18.
  par: 16,
};

/**
 * LevelCard (§II CONTENT-PRODUCTION / §IV.5.2).
 */
export const PFT02_CARD = {
  solutionPolicy:
    'hybrid — two verified orders of work (the crate rides Lark\'s own ' +
    'ferry leg, 16 moves; or changes hands as staged cargo on Middle, 18)',
  naiveApproach:
    'Shuttle everything by ferry in arrival order — the boat is right ' +
    'there and the bridge can always be sold at the end.',
  insight:
    'The exits are divergent: Lark\'s dock sits past the bridge that the ' +
    'museum is owed. Whoever still needs the far bank settles it before ' +
    'the plank leaves its socket — the bridge is the last thing sold.',
  winningTraceSummary:
    'A — "Lark ferries the crate": Wren ferries the lantern to the orchard and returns the ' +
    'ferry; Lark walks the orchard path to North, ferries the crate to the greenhouse, ' +
    'returns, and walks home to the North dock; Wren packs the bridge at Middle, ferries ' +
    'it across, and hands it to the museum (16 moves). ' +
    'B — "Middle handoff": Lark fetches the crate and stages it on Middle, then walks home ' +
    'while Wren ships both parcels across one at a time before selling the bridge (18 moves). ' +
    'Distinct signature: the crate crosses on Lark\'s own ferry ride in A; in B it changes ' +
    'hands as staged cargo and Lark never rides.',
  wrongApproaches: [
    'Courier stranded: sell the bridge while Lark is still east of it — the North dock exit ' +
      'is unreachable, recoverable only by undo (packing first flags it as redeploy-recoverable).',
    'Missing cargo: pack and deliver the bridge before the crate leaves North — the ' +
      'greenhouse order strands recoverable on pack, undo-only on handover.',
    'Capacity: load one parcel into the hold and ride while carrying another — the ferry ' +
      'rejects it, two parcels would be aboard for capacity 1.',
    'Identity: hand the lantern to the greenhouse — there is no open order for it there.',
  ],
  hints: [
    'Two parcels wait on the far bank — the lantern at West and the seed crate up the ' +
      'orchard path at North — and Lark\'s dock is past the bridge too. Once the bridge ' +
      'leaves, nothing on that side can be reached.',
    'The boat takes one parcel per crossing, and a courier\'s carried parcel uses the same ' +
      'slot. Someone can ferry the crate themselves, or stage it on Middle and let Wren ' +
      'ship it — then send Lark home before the bridge goes.',
    'The decisive commitment is who ferries the crate — their own ride, or ' +
      'a staged Middle handoff. Everything after that is scheduling: sell ' +
      'the plank last, once Lark is home.',
  ],
  coopNote:
    'Two real jobs in parallel: Wren owns the ferry line (lantern out, boat back), Lark ' +
      'owns the orchard run (crate out, self home). The shared decision is when Middle ' +
      'calls "ready for handover" — selling the bridge early strands whoever is east of it.',
} as const;
