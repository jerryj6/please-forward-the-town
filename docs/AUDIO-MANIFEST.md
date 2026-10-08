# Please Forward the Town — audio manifest

Procedural WebAudio cues (`src/client/audio.ts`, singleton `pftAudio`). No external files; every cue is synthesized. Stable event IDs dedupe network replays within 120 ms. Master mute via `setMuted` (Sound on/off toggle in play header).

| Cue ID | Trigger |
|---|---|
| parcel.pickup | pick_up action |
| parcel.drop | drop action |
| parcel.pack | pack action |
| piece.deploy | deploy action |
| piece.deliver | order.delivered / piece.delivered event |
| ferry.horn | hand_over_ferry action |
| ferry.dock | load_ferry / unload_ferry |
| ferry.ride | ride_ferry action |
| mail.send | send action |
| mail.flag | (reserved: mailbox flag) |
| order.open | (reserved: order opened) |
| order.strand | order.stranded event / refused accept |
| town.complete | contract.completed event / accepted verdict |
| ui.tick | all other committed actions |
