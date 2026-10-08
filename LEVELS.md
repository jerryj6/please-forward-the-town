# PFT levels 02–04 — design notes

Each level lists: title, fantasy one-liner, the verified winning trace summary,
designed wrong approaches, the 3-tier hint ladder, and the coop note. All traces
were verified against the frozen engine in `src/engine/pft/` (see REPORT.md).

---

## PFT-02 — Two Parcels, One Boat (`pft-02`)

*The harbor ferry has room for one courier and one crate, and the orchard still
needs its lantern tonight.*

Two-parcel juggling with ferry sequencing (master §II PFT-D). The map: Middle
Landing joins West Bank by a deployed plank bridge; a West–North orchard path is
the only natural edge; the ferry runs Middle–East at capacity 1/1. Parcels:
lantern on West (→ orchard), seed crate on North (→ greenhouse); the bridge
itself ships to the museum; Wren ends at the East exit and Lark at the North
dock — divergent exits make *when* the bridge is packed the whole question.

**Verified traces (both committed, both pass).**
- **A — "Lark ferries the crate" (16 moves, par):** Wren fetches the lantern by
  the bridge and ferries it to the orchard. Lark walks Middle→West→North, picks
  the crate, comes back, rides the ferry to the greenhouse, rides home, and
  walks West→North to the dock — *before* the bridge is lifted. Then Wren packs
  the bridge and ships it to the museum.
- **B — "Middle handoff" (18 moves):** Lark stages the crate on the Middle
  dock (`drop`), Wren ships both parcels, Lark walks home; the bridge sells
  last. Different signature: staged-cargo handoff vs courier-to-courier
  division; Lark never rides the ferry.

**Designed wrong approaches (all assert the right failure).**
1. *Stranded courier, undo-only:* sell the bridge while Lark's North dock exit
   still needs it — `order.stranded` on `order-lark-exit` with
   `recovery=redeploy` on pack, `undo` on handover; verified `achievable=false`.
   Recovery path tested: undo ×2, redeploy, send Lark home, sell again.
2. *Missing cargo, undo-only:* bridge sold with the crate still on North —
   `order-crate` strands `redeploy` → `undo`.
3. *Capacity rejection (PFT-004):* loading the lantern into the hold then
   riding with the crate carried — "ferry parcel capacity 1 exceeded: 2
   parcels would be aboard".
4. *Identity rejection:* the lantern at the greenhouse — "no open order".

**Hint ladder.**
1. Two parcels must cross on a one-parcel boat, and the bridge is cargo too —
   the question is whether the bridge can leave before everyone's work on its
   side is done.
2. The orchard path is the only road to the North dock — Lark can end there,
   but only while the bridge still stands. Ferries can also stage cargo: a
   parcel dropped on a dock still ships.
3. Lark carries the crate herself and walks home West→North before the lift;
   Wren then packs the bridge and sells it to the museum.

**Coop note.** Split the parcels between players; Wren owns the final packing
list. The live question is whether the bridge is free to go — nobody still
needs the West bank once Lark is home.

---

## PFT-03 — A Bridge With Two Addresses (`pft-03`)

*One plank bridge, two creeks, and a museum that wants the bridge itself.*

Temporary redeployment (master §II PFT-D): the same bridge serves two
compatible crossings, then ships to its final recipient. Middle Landing sits
between the West creek (to West Bank, where the lantern waits) and the North
creek (to North Field, where the honey crate waits) — both sockets accept the
bridge and both are handled from Middle. North has no other way in: the crate
is unreachable until the bridge is lifted off the West socket and re-set on
the North one. One courier, one ferry, one bridge.

**Verified trace (17 moves, par).** Wren ferries the lantern to the orchard
and returns; packs the bridge at Middle (West creek freed) and re-sets it on
the North creek socket; crosses, fetches the crate, ferries it to the
boathouse; returns, packs the bridge a second time at Middle, and ferries it
to the museum as the last job. Handling points are independently proven:
pack-at-Middle off West, deploy-from-Middle onto North, pack-at-Middle again.

**Designed wrong approaches.**
1. *Missing cargo, undo-only:* bridge delivered to the museum before the North
   fetch — `order-crate` strands; recovery degrades to `undo` (North has no
   other access).
2. *Handling endpoint (PFT-005):* trying to pack the bridge while standing on
   North Field — "can only be packed from its marked handling endpoint".
3. *No connection:* walking North before the second deployment — "no active
   connection".
4. *Early pack:* packing before the lantern is fetched strands `order-lantern`
   recoverably — redeploying unstrands it (PFT-C recovery verified).

**Hint ladder.**
1. The honey crate sits across the North creek — no boat reaches it, and the
   only bridge in town is busy at the West crossing.
2. A packed bridge is cargo you still own. Once the lantern is aboard, the
   West bank is done being useful — the bridge can be lifted and set elsewhere.
3. Pack at Middle, re-set on the North socket, fetch the crate, then lift it
   once more at Middle and ferry it to the museum.

**Coop note.** Solo contract; in a shared session split the planning — one
player sequences the West fetch, another proves the North redeploy before the
pack is committed.

---

## PFT-04 — The Upstairs Address (`pft-04`)

*The tenant upstairs gets the heavy books, the music hall gets the gramophone
— and the staircase itself is on the moving list.*

Height connections as cargo obligations (master §II PFT-D). Middle Landing is
the hub; the bridge crosses to West Bank where the cliff stair's foot socket
climbs to the Cliff Loft (height 1); a second stair socket hoists Middle→Loft.
Upstairs work goes both ways — books up to the tenant, gramophone down to the
music hall — then the stair ships to the promenade and the bridge to the
museum. Lark's contract ends at the Loft postbox, so the stair may leave once
she is settled: final extraction never relies on the removed stair.

**Verified traces — two strategically distinct solutions (both committed, both
pass).**
- **A — "Cliff stair" (18 moves, par):** Lark carries the books up the
  bridge-and-stair path, delivers, stays as postmaster; Wren climbs for the
  gramophone, ships it, packs the stair at the West foot, sells it to the
  promenade, then packs the bridge and ships it to the museum. Signature:
  Loft served at `socket-west-loft`; every upstairs trip crosses the bridge.
- **B — "Middle hoist" (20 moves):** Wren first packs the stair at West and
  re-sets it on `socket-middle-loft`; Lark climbs from the hub and stays;
  same ferry routine ships everything. Signature: Loft served from Middle;
  the bridge is used only to fetch the stair itself.

**Designed wrong approaches.**
1. *Missing cargo, undo-only:* stair packed and sold while the gramophone is
   aloft — `order-gramophone`, `order-books`, and `order-lark-exit` all strand
   `redeploy` on pack → `undo` on handover.
2. *No connection:* climbing after the stair is packed — "no active
   connection".
3. *Handling endpoint (PFT-005):* packing from the top landing — the marked
   lifts are the low ends at West and Middle.
4. *Height rule (PFT-009):* re-setting the stair on the flat West–Middle frame
   — socket accepts the kind but heights match, "differing declared heights".
5. *Kind mismatch (PFT-007):* a bridge on the cliff socket — "does not accept".

**Hint ladder.**
1. The gramophone is upstairs and the tenant's books must go up — but the
   staircase itself is also on the moving list. Finish every upstairs job
   before the stair is lifted.
2. The stair has two marked sockets: West cliff foot and Middle hoist. Either
   serves the Loft. Nobody comes down off the Loft once the stair is packed,
   so whoever stays aloft should be ending there.
3. Lark goes up with the books and stays at the postbox; Wren brings the
   gramophone down, ships it, then packs the stair at the West foot and sells
   it — the bridge packs last, from Middle.

**Coop note.** Lark owns the Loft (books up, then postmaster — her exit never
needs the stair again); Wren owns the water and the packing list. The
conversation before the stair leaves: "who is still aloft?"

---

## PFT-05 — Return to Sender (`pft-05`)

*The skiff takes passengers, never freight — the registry goes over the ridge
by wire instead.*

Cargo-only relay mailbox + physically separate courier route (PFT-008). The
foot ferry carries couriers only (`parcelCapacity: 0`), so the Land Registry
can never cross the water — its only route to the East archives is the relay
post on Upstream Landing and the postal link over the ridge. Lark hikes
bridge-and-path out, stages the parcel, and sends it; her way home is the
bridge, never the mailbag. Both pieces ship back to the Middle depot once
their work is done.

**Verified traces (both committed, both pass).**
- **A — "Lark posts, Wren receives" (13 moves, par):** Lark fetches the
  registry at West, stages and sends it at the Upstream post, packs the
  mailbox home, and signs mailbox and bridge into the depot, ending at the
  dock office. Wren rides, picks up the mailed parcel, delivers.
- **B — "North handoff" (15 moves):** Lark mails and returns; Wren makes a
  second Upstream run to fetch the mailbox while Lark signs the bridge in.

**Designed wrong approaches.**
1. *Mail a courier:* bridge packed while Lark is Upstream — `order-lark-exit`
   strands `redeploy` → `undo` while `order-registry` still reads achievable
   (the link covers cargo, never people). Recovery tested: undo, redeploy,
   walk home.
2. *Packed post:* send while the mailbox is cargo — "relay mailbox is not
   deployed — link inactive".
3. *Stage first:* send a carried parcel — "not staged at north"; send a
   packed piece — "only parcels travel postal links".
4. *Capacity:* riding the foot ferry with freight — "ferry parcel capacity 0
   exceeded".

**Hint ladder.**
1. The skiff carries people, not freight — the registry will never ride it.
   The only route East for that parcel is the relay post on the Upstream
   Landing.
2. Mailboxes take staged parcels, not carried ones — Lark has to set the
   registry down on the post. Her way home is the bridge; nobody rides the
   mail.
3. Lark carries the registry over bridge and path to the post, drops it,
   sends it; then packs the mailbox, comes home, signs both pieces into the
   depot; Wren collects at the archives.

**Coop note.** Lark owns the remote run; Wren owns the water. The handoff is
a staged parcel on a dock, and neither courier ever touches the other's
route.

---

## PFT-06 — The Ferry's Last Fare (`pft-06`)

*Tonight the skiff itself is sold — every crate that needs the crossing must
already be across when the papers are signed.*

The transport service as a deliverable (PFT-D). The ferry has
`handlingNode: 'east'` — the harbor-master's office is on the far quay, so
the hand-over is shore-side there, hold empty. Signing the boat early strands
every unfinished East job with **no recovery at all** (no piece hypothesis
restores a service edge) — and strands any courier left on the wrong shore.
Lark exits by land at the West gate; Wren sails the last fare and stays.

**Verified traces (both committed, both pass).**
- **A — "Lark sails the freight" (17 moves, par):** Lark ferries tea crate and
  piano herself, walks home; Wren packs the bridge, sails it to the museum,
  signs the ferry over at the East quay.
- **B — "Dockside staging" (22 moves):** Lark loads the crate into the hold
  at Middle and stages the piano on the dock, walks home; Wren shuttles
  (unload, deliver, return) and signs the service over. Distinct signature:
  `load_ferry`/`unload_ferry`/`drop` vs direct carries; Lark never rides.

**Designed wrong approaches.**
1. *Early handover:* signing the boat with freight outstanding — every East
   order strands `recovery='none'` (undo-only via engine undo), including
   Lark's own exit if she's aboard-side; riding a sold boat is refused
   ("has been handed over").
2. *Hold not empty:* hand-over with a parcel aboard — "ferry hold must be
   empty for hand-over".
3. *Wrong shore:* signing over from Middle — "shore-side handling is at
   east".
4. *Identity:* offering the boat to the museum — "no open order".

**Hint ladder.**
1. Once the ferry is signed away, nothing crosses the water — every boat job
   must already be done. The hand-over is the last act of the night.
2. The skiff carries one courier plus one parcel — a rider brings her cargo;
   the hold also takes freight ahead of time for pickup on the far shore.
3. Lark ferries both parcels herself and walks home by the West gate; Wren
   packs the bridge, sails it to the museum, hands the boat over at the East
   quay — hold empty.

**Coop note.** Settle before anyone packs: what still needs the boat? Split
the freight; whoever signs the boat over is the last one East.

---

## PFT-07 — The Moving Address (`pft-07`)

*The Greene household isn't a place on the map tonight — it's wherever the
sign is standing.*

A recipient's deployed location changes (PFT-010), built from pure
primitives: both Greene lots are `mountedOn` the sign itself, so a lane
exists only while the sign stands on its post. Deployed at the old fence
post, the Old Lot is in town; lifted and re-set at the new post, the New Lot
is; packed in a satchel, the address is *nowhere* — and nothing can be
delivered to it. The tea set's order names the new address; the sign itself
then ships on to the town registry.

**Verified trace (20 moves, par).** Lark lifts the sign off the old post at
West, ferries it East, and sets it on the new post; sails home and walks out
the West gate. Wren fetches the tea set, crosses, and carries it up the new
lane while the sign stands; then packs the bridge to the museum, lifts the
sign a last time, and files it at the registry.

**Designed wrong approaches.**
1. *Obsolete location:* tea at the Old Lot refuses — "no open order" — even
   while the lane still exists; after the sign moves, the lane is gone
   entirely.
2. *Address packed:* lifting the sign at the new post before the tea arrives
   strands `order-tea` — `redeploy` while owned, `undo` once filed.
3. *Occupant:* the sign cannot be lifted while a courier stands on its lane —
   "cannot pack" (PFT-006).
4. *Kind mismatch:* the sign won't stand on the water socket, the bridge
   won't stand on a fence post — "does not accept".

**Hint ladder.**
1. The Greene household is wherever the sign is standing. Deliver where the
   sign WAS and you're answering a dead address.
2. Only the sign posts hold the sign — lifted at the West fence, set at the
   East fence. A packed sign means the Greene lane exists nowhere.
3. Lark carries the sign East and sets it on the new post, comes home by the
   West gate; Wren runs the tea set up the new lane while the sign stands,
   then ships the bridge and files the sign at the registry — in that order.

**Coop note.** Lark owns the sign; Wren owns the cargo. The one rule: nobody
lifts the sign at the new post until the tea is inside — the address
disappears under anyone still standing on it.
