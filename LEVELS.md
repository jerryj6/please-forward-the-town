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

**Solution space (bounded enumeration, automated playtest).** Complete DFS to
par+4 (bound 20): 17 plans — the 16-move plan is the UNIQUE optimum; the rest
are scheduling variants at 17–20.

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

**Solution space (bounded enumeration).** Complete DFS to par+4 (bound 21):
8 plans — the 17-move plan is the unique optimum; no 18-move plan exists
(the length ladder has a genuine gap between 17 and 19).

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

**Solution space (bounded enumeration).** Complete DFS to par+2 (bound 20):
9 plans — two optimal 18-move plans plus variants including the hoist
strategy (verified trace B); par+4 was intractable at the 3M-state cap
(bound documented in audit/PFT-AUDIT-PASS4.md).

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

**Solution space (bounded enumeration).** Complete DFS to par+4 (bound 17):
18 plans — THREE optimal 13-move plans, including a real role-swap: the
bridge can be packed and sold by either courier, not just Lark.

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

**Solution space (bounded enumeration).** Complete DFS to par+4 (bound 21):
20 plans — two optimal 17-move plans (direct carries vs dock-staged
freight), the rest are scheduling variants to 21.

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

**Solution space (bounded enumeration).** Complete DFS to par+4 (bound 24):
16 plans — two optimal 20-move plans, the rest scheduling variants to 24.

---

## PFT-08 — No One Left on West (`pft-08`)

*Four couriers, three bank errands, two bridges — and everyone goes home
East. The title is the trap: pack either bridge while a teammate still
needs it and the far bank fills with stranded orders.*

Chapter-3 interdependence: infrastructure removal affects several couriers.
Two crossings serve the West bank — the plank bridge (West–Middle) and the
Town Span (Middle–East) — plus a 1/1 packet ferry with shore-side handling
at East. Retrieval, handoff, and return must all be coordinated before the
paperwork: six deliveries, two bridge sales, a ferry hand-over, and four
divergent-but-East-side exits.

**Verified trace (21 moves, par).** Wren runs the Upland fetch (plank
bridge, orchard path) and walks the sunstone over the Town Span to the
archives; Lark carries the market ledger to the Slip annex, walks back,
packs the plank bridge at Middle and ships it across the span to the
museum; Finch rides the engine over on the packet ferry and closes the
drydock on Slip; Sparrow — already posted East — signs the ferry over to
the harbor-master, then lifts the Town Span at its East foot and files it
at the foundry. Nobody is left on West.

**Designed wrong approaches.**
1. *Pack under the runners:* lifting the plank bridge while couriers still
   need the west bank strands the sunstone, the ledger, and Wren's exit —
   `redeploy` while carried, `undo` once it is filed at the museum.
2. *Sell the span early:* hand over the ferry AND lift the Town Span while
   Lark is still at Middle — parcels parked on the far bank need both
   crossings (recovery `undo`), while a Middle courier's exit stays
   `redeploy` (any live bridge could be re-set on the channel).
3. *Full hold at the signing:* handing the ferry over with the engine
   still aboard is refused — the hold must ride in empty.
4. *Wrong shore:* signing over from Middle — "shore-side handling is at
   east".
5. *Sold boat:* riding after the hand-over is refused — "has been handed
   over".

**Hint ladder.**
1. The Town Span is the crossing that lets four couriers end on the far
   shore — a ferry only ever leaves one rider there. Count who still needs
   the west bank before anyone packs a thing.
2. Work west to east: Upland and Market errands first, then the bridge
   carried over the span, then the ferry run — and only then the paperwork.
3. Wren: north fetch, span, archives, done. Lark: ledger to the annex,
   back, pack the plank bridge, museum, Slip. Finch: engine on the ferry,
   drydock, Slip. Sparrow: sign the ferry at East, lift the span, file it
   at the foundry.

**Coop note.** Four distinct jobs, one shared spine: Wren owns the Upland
fetch, Lark owns the Market leg and the plank bridge, Finch owns the ferry
freight run, Sparrow owns the far-shore paperwork (ferry sale, span lift).
The agreement that matters: nobody lifts a bridge while a teammate still
needs it — extraction is a shared resource.

---

## PFT-09 — Three Useful Parcels (`pft-09`)

*Tonight every tool becomes cargo — the staircase that reaches the loft,
the bridge that crosses the creek, the mailbox that sends the records. A
tool only ships after it has finished being a tool.*

Chapter-3 escalation: several infrastructure obligations interact — bridge,
stairs, and relay are used as tools before their own deliveries on a finite
graph with one solvable dependency order. The apparent cycle (bridge sale
traps the stair-runner) resolves through the taught temporary-staging
idiom: `drop` parks any carried parcel or packed piece at a node for the
ferryman to collect — never hidden teleportation.

**Verified trace (38 moves, par).** Lark hikes the orchard path to the
relay post, sends the staged records East, packs the relay mailbox and
files it at the Middle depot, then walks back to the North post; Finch
climbs the elm staircase for the tapestry, stages it at Middle, packs the
staircase at its West foot and stages it for the boat; Wren fetches the
tea set and stages it at Middle, exits the West gate; Sparrow runs four
freight legs — tea to the conservatory, records from the quay to the
archives, tapestry to the Slip gallery, staircase to the observatory — then
packs the plank bridge, sails it to the museum, and closes the East exit.

**Designed wrong approaches.**
1. *The apparent cycle:* pack the plank bridge while the loft runner is
   still west-side and the mail is dead — tea, tapestry, and the runner's
   exit strand together (`redeploy` while carried, `undo` once filed).
2. *Occupied structure:* the staircase cannot be packed while a courier or
   the tapestry is still on the loft (PFT-006).
3. *Dead link:* send after the mailbox is packed — "link inactive".
4. *Wrong socket:* the elm staircase on the flat West–Middle frame is
   refused on declared heights (PFT-009); the mailbox on a bridge frame is
   refused on kind.
5. *Capacity:* a second parcel aboard the harbor ferry is refused; a
   carried parcel will not mail — it must be staged at the post.

**Hint ladder.**
1. Every tool becomes cargo tonight — but only after it has finished being
   a tool. Send before packing the post, fetch before packing the stair,
   empty the west bank before selling the bridge.
2. The records are already staged on the relay post: one send, no fetch.
   The loft only exists while the staircase stands — bring everything down
   before you lift it.
3. Lark: post → send → mailbox to the depot → North post. Finch: loft →
   tapestry down → pack the stair → stage it → dock office. Wren: tea →
   Middle → West gate. Sparrow: tea, records, tapestry, stair by ferry,
   then the bridge — East exit.

**Coop note.** Four distinct contributions: Lark is the postal courier
(send + relay decommission), Finch is the climber (stair fetch + stair
packing), Wren is the market runner (west fetch + staging), Sparrow is the
ferryman and closer (every freight leg + the bridge sale). Exits are
divergent by design — only the last rider ends East.

---

## PFT-10 — The Detour Dividend (`pft-10`)

*Two honest ways to close the same night: keep the bridge bolted and let
the ferry do freight — or pay one ride to re-set the bridge as a span and
never worry about capacity again. The detour is the dividend.*

Chapter-3 capstone: distinct strategies trade route setup for cargo
handling. Both plans run 28 moves but wear completely different
infrastructure signatures — Plan A commits zero piece deployments and sends
one parcel; Plan B commits two sends and one redeployment (the bridge moves
to the channel socket, then ships to the museum from its East foot). The
final states are identical; the paths there are not.

**Verified trace A — "Ferry freight" (28 moves, par).** The bridge stays
bolted to the West creek; Finch stages the cider at Middle, Lark mails the
deeds and files the mailbox, Sparrow rides once to receive the mail and
once back, and Wren runs five ferry legs — cider to the tavern, granite to
the monument, bridge to the museum — closing the East exit.

**Verified trace B — "The span pays" (28 moves, par).** Finch hauls the
cider to the North post and mails it, Lark mails the deeds and
decommissions the mailbox; then Wren packs the bridge, rides it across
once, sets it on the channel socket, walks the granite to the monument,
files cider and deeds on the quay — and finally lifts the span from its
East foot for the museum. Seven ferry legs against one; the dividend is
that the crossing itself becomes cargo.

**Designed wrong approaches.**
1. *Trap a runner:* pack the west bridge while Wren is still on the bank —
   his East exit strands (`redeploy` while carried, `undo` once it is at
   the museum). The mail cannot carry people home.
2. *Wrong foot:* the channel socket is handled from East — deploying the
   span from Middle is refused; you pay one ferry ride to set it.
3. *Dead link:* pack the relay mailbox and the post goes silent — "link
   inactive" on send.
4. *Kind mismatch:* the mailbox will not stand on a bridge socket; the
   bridge will not stand on the post ("does not accept").
5. *Capacity:* two parcels will not ride the harbor ferry — the hold takes
   one.

**Hint ladder.**
1. Count the crossings the bridge itself must make tonight: it only has to
   be a bridge on ONE side at a time. Where you keep it decides what else
   has to ride the ferry.
2. The channel socket is worked from its East foot — whoever sets the span
   must already be across. One ride buys a crossing everyone else walks
   for free.
3. Plan A: never repack until the end — ferry legs do the work. Plan B:
   mail everything on the west bank first, then carry the bridge east and
   re-set it — after that there is no capacity problem at all.

**Coop note.** Four distinct contributions either way: a postal runner
(Lark), a west runner (Finch), an east-leg receiver (Sparrow), and the
closer who carries the bridge sale (Wren). In plan A the ferryman is the
bottleneck role; in plan B the span-setter is — split the jobs before the
first pack.

**Documented alternate — "Both parcels down the wire" (27 moves).** A
third verified plan discovered in pass-3 automated playtest — and it
runs ONE MOVE UNDER the 28-move reference par: Finch mails the cider at
the North post too, Sparrow receives both parcels on the east quay in a
single round-trip, and Wren ferries only the granite and the bridge
sale (2 sends, 5 rides, 0 deploys). Legal under the level's `open`
solution policy; verified as `PFT10_TRACE_C` in
tests/unit/pft08-10.test.ts. Curated here so players who find it meet a
documented plan, not an accident — and so par-beating schedules are
expected.

---

## PFT-11 — Mail the Post Office (`pft-11`)

*The post office isn't a place on the map tonight — it's wherever the sign
is standing. You can't mail a post office; somebody shoulders the sign and
walks it across both crossings to the new post.*

Finale chapter: the extraction destination itself moves. The two office
lanes are `mountedOn` the post-office sign — whichever post it stands on,
that lane is in town; packed in a satchel, the office is nowhere at all.
Relocating the destination has to happen while a crossing still stands to
fetch it: the plank bridge owed to the museum is also the only way back
West — sell it first and the sign is marooned forever (`none` — the
hardest failure class).

**Verified trace (28 moves, par).** Lark hikes the orchard path, mails the
postmaster's mailbag East, packs the relay mailbox and files it at the
Middle depot, then carries the granite to the Slip monument. Finch lifts
the Post Office sign at the old post and carries it over both crossings to
stand it on the new post at the Slip — the office is nowhere while it
rides in his satchel. Wren fetches the cider to the East tavern, walks
back, packs the plank bridge and ships it to the museum. Sparrow lifts the
Town Span at its East foot for the foundry, collects the mailed mailbag,
and hands it to the postmaster at the moved office — then all four
couriers step into the new office lane together.

**Designed wrong approaches.**
1. *Mail the post office:* `send` on the sign is refused — "only parcels
   travel postal links". Somebody carries it.
2. *Moving day underfoot:* the sign will not pack while a courier stands
   on the old office lane — "cannot pack" (PFT-006).
3. *The dead address:* the mailbag at the old office is refused — "no open
   order" — and once the sign moves the lane itself is gone.
4. *Office closed:* while the sign rides packed, the office exists nowhere
   — every exit is unachievable (`redeploy` while carried) and travel to
   it is refused "no active connection".
5. *Teardown before the move:* pack the plank bridge while the sign still
   stands on the old post — the sign is unreachable, every exit classifies
   `none` (undo restores it to `redeploy`).

**Hint ladder.**
1. The office and the sign are the same object — the exits and the
   postmaster live wherever the sign stands, and nowhere while it rides in
   a satchel.
2. The sign is a piece, not a place: `pack` lifts it, `deploy` stands it —
   and no wire will carry it. Each post answers only to its own street
   end.
3. Move the destination before you sell the way there: the sign must cross
   the creek while a bridge still stands — decide who shoulders it before
   the plank bridge becomes cargo.

**Coop note.** Lark is the postal runner (send + relay decommission +
monument leg), Finch is the sign-bearer (the only job that touches the
moving address), Wren is the west runner (cider + plank-bridge sale),
Sparrow is the east receiver (span sale + the final postmaster delivery).
The forced coupling: the plank bridge is both Wren's route to the sign's
old post and cargo owed East — whether it can be packed depends on whether
Finch has already lifted the sign, so teardown is a sequencing decision,
not just a division of labor.

---

## PFT-12 — Everything Must Go (`pft-12`)

*Everything crosses tonight — parcels, pieces, the boat, the office
itself. The only question that matters is what must still be a tool
before it becomes cargo.*

The finale: complete the moving town without stranding its delivery team.
Every taught category is on the board — two bridges, the cliff staircase,
the relay mailbox and postal wire, the packet ferry (for sale, empty
hold), and the post-office sign that decides where everyone finishes. Five
parcels out, four pieces sold, the boat signed over, the office moved —
and all four couriers inside it simultaneously. Two verified plans with
different infrastructure signatures, honestly priced: Plan A 46 moves, Plan
B 44 (par).

**Verified trace A — "Office first" (46 moves).** Finch lifts the sign at
once and stands it on the new post; the office stays open all night. Lark
mails the records, files the mailbox, then carries the mailbag by hand to
the postmaster. Finch also ferry-freights the tea (load/ride/unload).
Wren brings the tapestry down the stair, packs the staircase for the
observatory, then packs the plank bridge for the museum. Sparrow takes the
granite and the records off the quay, lifts the span, and signs the boat
over. Everyone walks in.

**Verified trace B — "Close the office last" (44 moves, par).** Both
mailbag and records go down the wire; Finch packs the sign and rides it
east on the ferry's last sail, keeping it in his satchel through the
entire teardown — Wren takes the loft, the staircase, the granite and the
plank bridge; Sparrow takes the tea, the span and the boat — and only when
every order is settled does Finch stand the sign on the new post and
everyone walk into the office.

**Designed wrong approaches.**
1. *Mail the post office:* `send` on the sign is refused — "only parcels
   travel postal links".
2. *Teardown before the move:* a bridge packed (let alone sold) while the
   sign still stands on the old post maroons the sign — the exits classify
   `none`, the strongest failure (west-side cargo stays `redeploy`).
3. *The dead address:* mailbag at the old office — "no open order"; and a
   courier clocking out on the old lane finishes nothing.
4. *Sold boat, full hold:* the harbor-master refuses a loaded ferry —
   "hold must be empty".
5. *Occupied structure:* neither the staircase nor the sign packs while
   someone (or something) stands on what it carries (PFT-006).

**Hint ladder.**
1. Every obligation and every tool is the same short list tonight: the
   loft needs the staircase, the wire needs the mailbox, the west bank
   needs the plank bridge — and the exits need the office.
2. Each piece is a tool in one window and cargo in another: `send` before
   `pack`, fetch before `pack`, and `hand_over_ferry` only after the hold
   is empty. The sign is `pack`/`deploy` like the rest.
3. Choose when the office moves — that single commitment shapes the whole
   night. The one thing that can never happen: a bridge sold while the
   sign still stands on the west bank.

**Coop note.** Four distinct contributions in either plan: a postal runner
(Lark — the wire and the mailbag), a sign-bearer (Finch — the moving
address itself), a loft-and-teardown runner (Wren — stair, granite, plank
bridge), and an east-side receiver (Sparrow — span, boat, quay-side
freight). The forced coupling is the teardown order itself: every crossing
is shared infrastructure AND cargo, so "can I pack?" is always a team
question — the plan fails unless the group agrees the west bank is done
before the last bridge lifts.
