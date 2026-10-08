// Please Forward the Town — client shell.
//
// Same shell architecture as the reference (title → level select → board +
// orders panel + ledger + hints + verdict), driven by the PFT engine's
// session API: begin → propose/commit per order → undo → evaluate →
// acceptResult. PFT is incremental, not plan-then-run: every commit mutates
// the world immediately and emits order.fulfilled / order.stranded events.

import { useMemo, useRef, useState } from "react";
import { PftEngine, analyzeOrderStatuses } from "../engine/pft/engine.js";
import type { PftAction, PftLevel, PftPlayState } from "../engine/pft/types.js";
import type { GameEvent } from "../engine/contracts.js";
import { PFT01_LAST_CROSSING } from "../content/levels/pft01-last-crossing.js";
import SceneView from "./SceneView";
import LedgerView, { type LedgerEntry } from "./TimelineView";
import HintLadder from "./HintLadder";
import { PFT_HINTS } from "./hints";
import { actionSlug, describeAction, describeOrder, nameOf } from "./describe";
import { RoomClient } from "./net/roomClient.js";

const LEVELS: { level: PftLevel; chapter: string; blurb: string }[] = [
  {
    level: PFT01_LAST_CROSSING,
    chapter: "Contract 01 — Crossing",
    blurb: "A lantern on the wrong bank, a bridge the museum wants, and one ferry with room for a single parcel.",
  },
];

export default function App() {
  const [screen, setScreen] = useState<"title" | "select" | "play" | "lobby">("title");
  const [level, setLevel] = useState<PftLevel>(PFT01_LAST_CROSSING);
  const net = useRef<RoomClient | null>(null);
  const netState = useRef<{ setGs?: (s: PftPlayState) => void }>({});
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [netErr, setNetErr] = useState<string | null>(null);
  const foldRef = useRef<(p: unknown) => void>(() => {});

  const goOnline = async (mode: "create" | "join", code?: string) => {
    try {
      const client = new RoomClient({
        onJoin: (_a, rc) => setRoomCode(rc),
        onState: (rs) => {
          const r = rs as { levelId: string; state: PftPlayState };
          netState.current.setGs?.(r.state);
        },
        onCommand: (p) => foldRef.current(p),
        onError: (_c, msg) => setNetErr(msg),
      });
      await client.connect();
      net.current = client;
      if (mode === "create") client.createRoom("pft", level.levelId.toUpperCase());
      else client.joinRoom(code ?? "");
      setScreen("play");
    } catch { setNetErr("Could not reach the room server."); }
  };

  if (screen === "title") {
    return (
      <main className="title-screen">
        <div className="title-card">
          <p className="overline">A valley logistics contract</p>
          <h1>Please Forward the Town</h1>
          <p className="pitch">Everything arrives — parcels, planks, and the postmistress herself.</p>
          <button type="button" className="primary" data-testid="play-solo" onClick={() => setScreen("select")}>
            Play solo
          </button>
          <button type="button" className="ghost" data-testid="play-coop" onClick={() => setScreen("lobby")}>
            Crew up
          </button>
          {netErr && <p className="fail">{netErr}</p>}
        </div>
      </main>
    );
  }

  if (screen === "lobby") {
    let codeInput = "";
    return (
      <main className="select-screen">
        <h1>Contract a convoy</h1>
        <p>Share a room code; every committed order lands on every runner's ledger.</p>
        <div className="actions">
          <button type="button" className="primary" onClick={() => void goOnline("create")}>
            Host a room ({level.levelId.toUpperCase()})
          </button>
          <input placeholder="Room code" onChange={(e) => (codeInput = e.target.value)} />
          <button type="button" onClick={() => void goOnline("join", codeInput)}>Join</button>
        </div>
        {netErr && <p className="fail">{netErr}</p>}
        <button type="button" className="ghost" onClick={() => setScreen("title")}>Back</button>
      </main>
    );
  }

  if (screen === "select") {
    return (
      <main className="select-screen">
        <h1>Choose today's contract</h1>
        <div className="level-list">
          {LEVELS.map(({ level: l, chapter, blurb }) => (
            <button
              key={l.levelId}
              type="button"
              className="level-card"
              data-testid={`level-${l.levelId}`}
              onClick={() => {
                setLevel(l);
                setScreen("play");
              }}
            >
              <span className="level-id">{l.levelId.toUpperCase()}</span>
              <span className="level-title">{l.title}</span>
              <span className="level-chapter">{chapter}</span>
              <span className="level-blurb">{blurb}</span>
            </button>
          ))}
        </div>
        <button type="button" className="ghost" onClick={() => setScreen("title")}>
          Back
        </button>
      </main>
    );
  }

  return (
    <PlayScreen
      key={`${level.levelId}-${roomCode ?? "solo"}`}
      level={level}
      onExit={() => setScreen("select")}
      net={net}
      netState={netState}
      foldRef={foldRef}
      roomCode={roomCode}
    />
  );
}

// ---------------------------------------------------------------------------

function PlayScreen({
  level,
  onExit,
  net,
  netState,
  foldRef,
  roomCode,
}: {
  level: PftLevel;
  onExit: () => void;
  net: React.MutableRefObject<RoomClient | null>;
  netState: React.MutableRefObject<{ setGs?: (s: PftPlayState) => void }>;
  foldRef: React.MutableRefObject<(p: unknown) => void>;
  roomCode: string | null;
}) {
  const engineRef = useRef<PftEngine | null>(null);
  if (!engineRef.current) {
    const e = new PftEngine();
    e.begin(level);
    engineRef.current = e;
  }
  const engine = engineRef.current;

  // Mirror the session's state into React state; commit() swaps the object.
  const [gs, setGs] = useState<PftPlayState>(() => engine.currentState);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<{ accepted: boolean; reason?: string; finalHash: string } | null>(null);
  const seq = useRef(0);

  const legal: PftAction[] = useMemo(
    () => (verdict?.accepted ? [] : engine.getLegalActions(level, gs)),
    [engine, level, gs, verdict],
  );
  const statuses = useMemo(() => analyzeOrderStatuses(level, gs), [level, gs]);

  function commit(action: PftAction) {
    if (net.current) {
      net.current.command(action);
      return;
    }
    const proposal = engine.propose("solo", `ui-${++seq.current}`, action);
    const res = engine.commit(proposal);
    if (!res.ok) {
      setToast(res.reason ?? "refused");
      return;
    }
    setToast(null);
    setGs(engine.currentState);
    setLedger((l) => [
      ...l,
      { commandId: proposal.actionId, action, events: (res.events ?? []) as GameEvent[] },
    ]);
  }

  function undo() {
    const res = engine.undo();
    if (!res.ok) return;
    setVerdict(null);
    setGs(engine.currentState);
    setLedger((l) => l.slice(0, -1));
  }

  // Co-op: server broadcasts accepted command payloads; fold them through
  // the engine locally (deterministic ⇒ identical state on every client).
  netState.current.setGs = setGs;
  foldRef.current = (p: unknown) => {
    const res = engine.applyAction(level, gs, p as PftAction);
    setGs(res.state);
    setLedger((l) => [
      ...l,
      { commandId: `net-${++seq.current}`, action: p as PftAction, events: res.events as GameEvent[] },
    ]);
  };

  function restart() {
    engine.begin(level);
    setGs(engine.currentState);
    setLedger([]);
    setVerdict(null);
    setToast(null);
    setSelected(null);
  }

  function accept() {
    const res = engine.acceptResult();
    setVerdict({ accepted: res.accepted, ...(res.reason !== undefined ? { reason: res.reason } : {}), finalHash: res.finalHash });
  }

  const moves = gs.beat;
  const overPar = level.par !== undefined && moves > level.par;

  return (
    <main className="play-screen">
      <header className="topbar">
        <div>
          <span className="level-id">{level.levelId.toUpperCase()}</span>
          <h1>{level.title}</h1>
          {roomCode && <span className="badge">Convoy {roomCode}</span>}
        </div>
        <div className="topbar-actions">
          <span className={`move-counter ${overPar ? "over" : ""}`} data-testid="move-counter">
            {moves} moves{level.par !== undefined ? ` · par ${level.par}` : ""}
            {overPar ? ` (+${moves - (level.par ?? 0)} late)` : ""}
          </span>
          <button type="button" className="ghost" data-testid="undo" onClick={undo} disabled={net.current !== null || ledger.length === 0}>
            Undo
          </button>
          <button type="button" className="ghost" data-testid="restart" onClick={restart}>
            Restart
          </button>
          <button type="button" className="ghost" onClick={onExit}>
            Contracts
          </button>
        </div>
      </header>

      {toast ? (
        <p className="toast" data-testid="toast" role="alert">
          The contract refuses: {toast}
        </p>
      ) : null}

      <div className="play-layout">
        <section className="board-pane" aria-label="Map">
          <SceneView level={level} state={gs} selected={selected} onSelect={setSelected} />
          <LedgerView entries={ledger} />
        </section>

        <aside className="side-pane">
          <OrdersPanel level={level} statuses={statuses} />
          <ActionPanel legal={legal} gs={gs} onCommit={commit} />
          <Inspection level={level} gs={gs} selected={selected} />
          <section className="finish" aria-label="Finish the contract">
            <button
              type="button"
              className="primary"
              data-testid="accept-result"
              onClick={accept}
              disabled={!gs.completed}
              title={gs.completed ? "Close the day's contract" : "Every order must be fulfilled first"}
            >
              Close the contract
            </button>
            {verdict && !verdict.accepted ? <p className="warn">{verdict.reason ?? "Not accepted."}</p> : null}
          </section>
          {PFT_HINTS[level.levelId] ? <HintLadder content={PFT_HINTS[level.levelId]!} /> : null}
        </aside>
      </div>

      {verdict?.accepted ? (
        <div className="verdict-overlay" data-testid="accepted-banner">
          <div className="verdict-card">
            <p className="overline">Contract complete</p>
            <h2>Forwarded on schedule</h2>
            <p>
              Every order is fulfilled in {moves} moves{level.par !== undefined ? ` (par ${level.par}${overPar ? `, ${moves - level.par} late` : ""})` : ""}. The
              town will remember the route. Final hash <code>{verdict.finalHash.slice(0, 12)}…</code>
            </p>
            <div className="row">
              <button type="button" className="ghost" onClick={restart}>
                Run it again
              </button>
              <button type="button" className="ghost" onClick={onExit}>
                Back to contracts
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

// ---------------------------------------------------------------------------

function OrdersPanel({
  level,
  statuses,
}: {
  level: PftLevel;
  statuses: ReturnType<typeof analyzeOrderStatuses>;
}) {
  return (
    <section className="orders" aria-label="Contract orders">
      <h3>The contract asks for</h3>
      <ul>
        {statuses.map((st) => (
          <li key={st.orderId} className={st.fulfilled ? "pass" : st.achievable ? "pending" : "stranded"}>
            <span className="mark">{st.fulfilled ? "✓" : st.achievable ? "○" : "✗"}</span>
            <span className="pred">{describeOrder(st.orderId, level)}</span>
            {!st.fulfilled && !st.achievable ? (
              <span className="detail stranded-detail">
                stranded{st.reason ? ` — ${st.reason}` : ""}
                {st.recovery === "redeploy" ? " (redeploy a piece to recover)" : st.recovery === "undo" ? " (only undo can recover)" : ""}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActionPanel({
  legal,
  gs,
  onCommit,
}: {
  legal: PftAction[];
  gs: PftPlayState;
  onCommit: (a: PftAction) => void;
}) {
  // Dedupe identical slugs (e.g. two legal paths to the same landing keep the
  // first); group by courier for readability.
  const byCourier = new Map<string, PftAction[]>();
  const seen = new Set<string>();
  for (const a of legal) {
    const slug = actionSlug(a);
    if (seen.has(slug)) continue;
    seen.add(slug);
    const who = "courierId" in a ? a.courierId : "—";
    const list = byCourier.get(who) ?? [];
    list.push(a);
    byCourier.set(who, list);
  }
  return (
    <section className="actions" aria-label="Write orders">
      <h3>Write an order</h3>
      {legal.length === 0 ? <p className="dim">Nothing legal remains.</p> : null}
      {[...byCourier.entries()].map(([courierId, actions]) => (
        <div key={courierId} className="courier-group">
          <h4>{nameOf(courierId)}</h4>
          <div className="action-list">
            {actions.map((a) => (
              <button
                key={actionSlug(a)}
                type="button"
                className={`order-btn verb-${a.type}`}
                data-testid={`order-${actionSlug(a)}`}
                onClick={() => onCommit(a)}
              >
                {describeAction(a)}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="dim small">
        Courier standing: {Object.entries(gs.couriers).map(([id, c]) => `${nameOf(id)} at ${nameOf(c.at)}${c.cargo.length ? `, carrying ${c.cargo.map(nameOf).join(", ")}` : ""}`).join("; ")}
      </p>
    </section>
  );
}

function Inspection({ level, gs, selected }: { level: PftLevel; gs: PftPlayState; selected: string | null }) {
  if (!selected) return null;
  const parts: string[] = [];
  const courier = gs.couriers[selected];
  if (courier) {
    parts.push(`stands at ${nameOf(courier.at)}${courier.cargo.length ? `, carrying ${courier.cargo.map(nameOf).join(", ")}` : ", hands free"}`);
  }
  const parcel = gs.parcels[selected];
  if (parcel) parts.push(`is ${describeLoc(parcel.location)}`);
  const piece = gs.pieces[selected];
  if (piece) {
    parts.push(
      piece.status === "deployed"
        ? `is deployed at ${nameOf(piece.siteId)}`
        : piece.status === "packed"
          ? `is packed, ${describeLoc(piece.location)}`
          : `was delivered to ${nameOf(piece.recipientId)}`,
    );
  }
  const ferry = gs.ferries[selected];
  if (ferry) {
    parts.push(`is docked at ${nameOf(ferry.at)}${ferry.cargo.length ? `, hold: ${ferry.cargo.map(nameOf).join(", ")}` : ", hold empty"}`);
  }
  const site = level.sites.find((s) => s.id === selected);
  if (site) parts.push(`links ${site.connects.map(nameOf).join(" and ")}, handled from ${nameOf(site.handlingNode)}`);
  if (parts.length === 0) return null;
  return (
    <section className="inspect" aria-label="Inspection">
      <h3>Inspection</h3>
      <p>
        <strong>{nameOf(selected)}</strong> {parts.join("; ")}.
      </p>
    </section>
  );
}

function describeLoc(loc: import("../engine/pft/types.js").CargoLocation): string {
  switch (loc.type) {
    case "node":
      return `staged at ${nameOf(loc.nodeId)}`;
    case "courier":
      return `carried by ${nameOf(loc.courierId)}`;
    case "ferry":
      return `aboard the ferry`;
    case "delivered":
      return `delivered to ${nameOf(loc.recipientId)}`;
  }
}
