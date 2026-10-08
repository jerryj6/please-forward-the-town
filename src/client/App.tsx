import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Input, SimEvent, World, WorldSnapshot } from "../rt/types.js";
import { createWorld, snapshot, step, withSoloTimeBonus } from "../rt/sim.js";
import { LEVELS, getLevel } from "../rt/levels/index.js";
import { pftAudio } from "./audio.js";
import { GameCanvas, type PlayerDisplay } from "./render/GameCanvas.js";
import { screenToWorld } from "./render/iso.js";
import { LevelMiniMap } from "./LevelMiniMap.js";

type Screen = "title" | "select" | "crew" | "lobby" | "game" | "results" | "credits";
type GameMode = "solo" | "online";

interface Progress {
  completed: string[];
  stars: Record<string, number>;
}

interface RoomPlayer {
  playerId: string;
  name: string;
  seat: number;
  color: string;
  connected: boolean;
}

interface LobbyState {
  players: RoomPlayer[];
  hostId: string;
  levelId: string;
  phase: "lobby" | "playing" | "results";
}

interface NetworkEvents {
  tick: number;
  list: SimEvent[];
}

interface SnapshotInterpolation {
  previous: WorldSnapshot | null;
  previousAt: number;
  current: WorldSnapshot | null;
  currentAt: number;
}

interface RoomConnection {
  socket: WebSocket;
  playerId: string;
  resumeToken: string;
  code: string;
  inputSeq: number;
}

const PROGRESS_KEY = "pft-rt-progress-v1";
const MUTE_KEY = "pft-rt-muted";
const LEVEL_COPY: Record<string, string> = {
  L1: "Two crossings, one lantern, and a plank that must leave the town.",
  L2: "Move the bridges forward. There are fewer planks than gaps.",
  L3: "Two parcels, two shores, and one bridge that cannot stay.",
  L4: "Take the low road before the tide takes it from you.",
  L5: "Two broad spans, one narrow crossing, and cargo that must go first.",
  L6: "The bridge gets you there. The ferry brings you home.",
  L7: "A piano needs the bridge. Get it across before the plank leaves.",
  L8: "Two ferries, two rhythms. Catch the right ride for each parcel.",
  L9: "The water rises twice. Rescue the far islands before the routes close.",
};

function loadProgress(): Progress {
  if (typeof localStorage === "undefined") return { completed: [], stars: {} };
  try {
    const value = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") as Partial<Progress>;
    return {
      completed: Array.isArray(value.completed) ? value.completed.filter((id): id is string => typeof id === "string") : [],
      stars: value.stars && typeof value.stars === "object" ? value.stars : {},
    };
  } catch {
    return { completed: [], stars: {} };
  }
}

function formatTime(ticks: number): string {
  const seconds = Math.max(0, Math.ceil(ticks / 20));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatLevelDuration(seconds: number): string {
  const roundedSeconds = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(roundedSeconds / 60)}:${String(roundedSeconds % 60).padStart(2, "0")}`;
}

function sendSocket(socket: WebSocket | null | undefined, message: unknown): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function interpolatePlayers(
  latest: WorldSnapshot,
  frame: SnapshotInterpolation,
  targetAt: number,
): WorldSnapshot["players"] {
  const duration = frame.currentAt - frame.previousAt;
  const alpha = duration > 0 ? Math.max(0, Math.min(1, (targetAt - frame.previousAt) / duration)) : 1;
  return latest.players.map((player) => {
    const previous = frame.previous?.players.find((candidate) => candidate.id === player.id);
    if (!previous) return player;
    return {
      ...player,
      x: Math.round(previous.x + (player.x - previous.x) * alpha),
      y: Math.round(previous.y + (player.y - previous.y) * alpha),
    };
  });
}

function reconcilePrediction(world: World, authoritative: WorldSnapshot): void {
  world.tick = authoritative.tick;
  world.timeRemainingTicks = authoritative.timeRemainingTicks;
  world.phase = authoritative.phase;
  world.stars = authoritative.stars;
  world.sockets.clear();
  for (const state of authoritative.items) {
    const item = world.items.get(state.id);
    if (!item) continue;
    item.state = state.state;
    item.pos = { x: state.x, y: state.y };
    if (state.state === "deployed") world.sockets.set(`${state.x},${state.y}`, item.id);
  }
  for (const state of authoritative.orders) {
    const order = world.orders.find((candidate) => candidate.id === state.id);
    if (order) order.fulfilled = state.fulfilled;
  }
}

function simEventId(event: SimEvent, tick: number): string {
  return `${tick}-${event.type}-${"playerId" in event ? event.playerId : ""}`;
}

function playSimEvents(events: SimEvent[], tick: number): void {
  for (const event of events) {
    const eventId = simEventId(event, tick);
    switch (event.type) {
      case "pickup": pftAudio.play("parcel.pickup", eventId); break;
      case "deploy": pftAudio.play("piece.deploy", eventId); break;
      case "deliver": pftAudio.play("piece.deliver", eventId); break;
      case "splash": pftAudio.play("order.strand", eventId); break;
      case "respawn": pftAudio.play("ferry.dock", eventId); break;
      case "complete": pftAudio.play("town.complete", eventId); break;
      case "failed": pftAudio.play("ferry.horn", eventId); break;
    }
  }
}

function isGameplayKey(key: string): boolean {
  return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D", " ", "e", "E"].includes(key);
}

interface GameProps {
  levelId: string;
  mode: GameMode;
  playerId: string;
  playerNames: Record<string, PlayerDisplay>;
  socket: WebSocket | null;
  nextInputSequence: () => number;
  serverWorld: WorldSnapshot | null;
  networkEvents: NetworkEvents | null;
  onFinish: (world: WorldSnapshot) => void;
  onExit: () => void;
  onRestart: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

function GameScreen({
  levelId,
  mode,
  playerId,
  playerNames,
  socket,
  nextInputSequence,
  serverWorld,
  networkEvents,
  onFinish,
  onExit,
  onRestart,
  muted,
  onToggleMute,
}: GameProps): JSX.Element {
  const level = getLevel(levelId) ?? LEVELS[0]!;
  const runLevel = mode === "solo" ? withSoloTimeBonus(level) : level;
  const localWorld = useRef<World | null>(null);
  if (mode === "solo" && !localWorld.current) localWorld.current = createWorld(runLevel, [playerId]);
  const prediction = useRef<World | null>(null);
  if (mode === "online" && !prediction.current) prediction.current = createWorld(level, [playerId]);
  const interpolation = useRef<SnapshotInterpolation>({ previous: null, previousAt: 0, current: null, currentAt: 0 });
  const input = useRef<Input>({ dx: 0, dy: 0, action: false });
  const pendingAction = useRef(false);
  const keys = useRef(new Set<string>());
  const onFinishRef = useRef(onFinish);
  const onExitRef = useRef(onExit);
  const onRestartRef = useRef(onRestart);
  const handledFinish = useRef(false);
  const joystick = useRef<{ id: number; x: number; y: number } | null>(null);
  const [world, setWorld] = useState<WorldSnapshot>(() =>
    mode === "solo" ? snapshot(localWorld.current!) : serverWorld ?? snapshot(prediction.current!),
  );
  const [paused, setPaused] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [toasts, setToasts] = useState<Array<{ id: number; text: string }>>([]);
  const [floodBannerVisible, setFloodBannerVisible] = useState(false);
  const [floodBannerText, setFloodBannerText] = useState("The sandbar is under!");
  const [floodEventSeen, setFloodEventSeen] = useState(false);
  const toastSequence = useRef(0);
  const toastTimers = useRef(new Map<number, number>());
  const floodBannerTimer = useRef<number | null>(null);
  const handledEvents = useRef(new Set<string>());

  onFinishRef.current = onFinish;
  onExitRef.current = onExit;
  onRestartRef.current = onRestart;
  const showToast = useCallback((text: string): void => {
    const id = ++toastSequence.current;
    setToasts((current) => [...current, { id, text }]);
    const timer = window.setTimeout(() => {
      toastTimers.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 1500);
    toastTimers.current.set(id, timer);
  }, []);
  const showFloodBanner = useCallback((text: string): void => {
    setFloodEventSeen(true);
    setFloodBannerText(text);
    setFloodBannerVisible(true);
    if (floodBannerTimer.current !== null) window.clearTimeout(floodBannerTimer.current);
    floodBannerTimer.current = window.setTimeout(() => {
      floodBannerTimer.current = null;
      setFloodBannerVisible(false);
    }, 2000);
  }, []);
  const handleSimEvents = useCallback((events: SimEvent[], tick: number): void => {
    const freshEvents = events.filter((event) => {
      const id = simEventId(event, tick);
      if (handledEvents.current.has(id)) return false;
      handledEvents.current.add(id);
      return true;
    });
    playSimEvents(freshEvents, tick);
    for (const event of freshEvents) {
      if (event.type === "flood") {
        showFloodBanner(event.tier === "shoal" ? "The shoal is under!" : "The sandbar is under!");
      }
      if (event.type === "deliver") showToast(`Delivered to ${event.label}`);
      if (event.type === "splash" && event.playerId === playerId) showToast("Splash! Back to the dock");
    }
  }, [playerId, showFloodBanner, showToast]);

  useEffect(() => () => {
    for (const timer of toastTimers.current.values()) window.clearTimeout(timer);
    if (floodBannerTimer.current !== null) window.clearTimeout(floodBannerTimer.current);
  }, []);

  const updateFromKeys = (): void => {
    const current = keys.current;
    const x = Number(current.has("ArrowRight") || current.has("d") || current.has("D"))
      - Number(current.has("ArrowLeft") || current.has("a") || current.has("A"));
    const y = Number(current.has("ArrowDown") || current.has("s") || current.has("S"))
      - Number(current.has("ArrowUp") || current.has("w") || current.has("W"));
    const screenY = y * (x === 0 ? 100 : 50);
    const direction = screenToWorld(x * 100, screenY);
    input.current = { dx: direction.x, dy: direction.y, action: false };
  };

  const queueAction = (): void => {
    if (mode === "online") {
      sendSocket(socket, {
        type: "input",
        seq: nextInputSequence(),
        dx: input.current.dx,
        dy: input.current.dy,
        action: true,
      });
      pendingAction.current = false;
    } else {
      pendingAction.current = true;
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" || event.key.toLowerCase() === "p") {
        event.preventDefault();
        setPaused((value) => !value);
        return;
      }
      if (paused) return;
      if (!isGameplayKey(event.key)) return;
      event.preventDefault();
      keys.current.add(event.key);
      updateFromKeys();
      if ((event.key === " " || event.key.toLowerCase() === "e") && !event.repeat) queueAction();
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      keys.current.delete(event.key);
      updateFromKeys();
    };
    const onBlur = (): void => {
      keys.current.clear();
      input.current = { dx: 0, dy: 0, action: false };
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [mode, paused, socket]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (paused) {
        if (mode === "online") {
          sendSocket(socket, {
            type: "input",
            seq: nextInputSequence(),
            dx: 0,
            dy: 0,
            action: false,
          });
        }
        return;
      }
      const nextInput = { ...input.current, action: pendingAction.current };
      pendingAction.current = false;
      if (mode === "solo") {
        const current = localWorld.current!;
        const events = step(current, new Map([[playerId, nextInput]]));
        const next = snapshot(current);
        setWorld(next);
        handleSimEvents(events, current.tick);
        if (current.phase !== "playing" && !handledFinish.current) {
          handledFinish.current = true;
          onFinishRef.current(next);
        }
      } else {
        const current = prediction.current!;
        step(current, new Map([[playerId, nextInput]]));
        sendSocket(socket, {
          type: "input",
          seq: nextInputSequence(),
          dx: nextInput.dx,
          dy: nextInput.dy,
          action: nextInput.action,
        });
        if (serverWorld) {
          const positions = interpolatePlayers(serverWorld, interpolation.current, performance.now() - 100);
          const own = current.players.get(playerId);
          const authoritative = serverWorld.players.find((candidate) => candidate.id === playerId);
          if (own && authoritative) {
            const error = Math.hypot(own.pos.x - authoritative.x, own.pos.y - authoritative.y);
            if (error > 500) {
              own.pos = { x: authoritative.x, y: authoritative.y };
            } else {
              own.pos.x = Math.trunc((own.pos.x + authoritative.x) / 2);
              own.pos.y = Math.trunc((own.pos.y + authoritative.y) / 2);
            }
          }
          const predictedPlayer = current.players.get(playerId);
          const renderWorld = {
            ...serverWorld,
            players: positions.map((candidate) => candidate.id === playerId && predictedPlayer
              ? { ...candidate, x: predictedPlayer.pos.x, y: predictedPlayer.pos.y }
              : candidate),
          };
          setWorld(renderWorld);
        }
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [handleSimEvents, mode, paused, playerId, serverWorld, socket]);

  useEffect(() => {
    if (mode !== "online" || !serverWorld) return;
    const now = performance.now();
    const frame = interpolation.current;
    frame.previous = frame.current ?? serverWorld;
    frame.previousAt = frame.current ? frame.currentAt : now - 100;
    frame.current = serverWorld;
    frame.currentAt = now;
    const current = prediction.current!;
    reconcilePrediction(current, serverWorld);
    const own = current.players.get(playerId);
    const authoritative = serverWorld.players.find((candidate) => candidate.id === playerId);
    if (own && authoritative) {
      const error = Math.hypot(own.pos.x - authoritative.x, own.pos.y - authoritative.y);
      if (error > 500) {
        own.pos = { x: authoritative.x, y: authoritative.y };
      } else {
        own.pos.x = Math.trunc((own.pos.x + authoritative.x) / 2);
        own.pos.y = Math.trunc((own.pos.y + authoritative.y) / 2);
      }
      own.facing = authoritative.facing;
      own.state = authoritative.state;
      own.splashTicks = authoritative.splashTicks;
      own.carrying = authoritative.carrying;
    }
    const predictedPlayer = current.players.get(playerId);
    setWorld({
      ...serverWorld,
      players: interpolatePlayers(serverWorld, interpolation.current, now - 100).map((candidate) => candidate.id === playerId && predictedPlayer
        ? { ...candidate, x: predictedPlayer.pos.x, y: predictedPlayer.pos.y }
        : candidate),
    });
    if (serverWorld.phase !== "playing" && !handledFinish.current) {
      handledFinish.current = true;
      onFinishRef.current(serverWorld);
    }
  }, [mode, playerId, serverWorld]);

  useEffect(() => {
    if (mode === "online" && networkEvents) handleSimEvents(networkEvents.list, networkEvents.tick);
  }, [handleSimEvents, mode, networkEvents]);

  const onJoystickDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    joystick.current = { id: event.pointerId, x: bounds.width / 2, y: bounds.height / 2 };
    setJoystickPosition({ x: Math.max(-40, Math.min(40, x)), y: Math.max(-40, Math.min(40, y)) });
    const direction = screenToWorld(x, y);
    input.current = { dx: direction.x, dy: direction.y, action: false };
  };
  const onJoystickMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!joystick.current || joystick.current.id !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left - joystick.current.x;
    const y = event.clientY - bounds.top - joystick.current.y;
    const magnitude = Math.max(Math.hypot(x, y), 1);
    const scale = Math.min(1, 42 / magnitude);
    setJoystickPosition({ x: x * scale, y: y * scale });
    const direction = screenToWorld(x * scale, y * scale);
    input.current = { dx: direction.x, dy: direction.y, action: false };
  };
  const onJoystickUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (joystick.current?.id !== event.pointerId) return;
    joystick.current = null;
    setJoystickPosition({ x: 0, y: 0 });
    input.current = { dx: 0, dy: 0, action: false };
  };

  const seconds = Math.ceil(world.timeRemainingTicks / 20);
  const ticksUntilFlood = runLevel.sandbarFloodsAtSec === undefined
    ? null
    : world.timeRemainingTicks - runLevel.sandbarFloodsAtSec * 20;
  const sandbarWarningSeconds = ticksUntilFlood !== null &&
    !world.sandbarFlooded &&
    !floodEventSeen &&
    ticksUntilFlood > 0 &&
    ticksUntilFlood <= 10 * 20
    ? Math.ceil(ticksUntilFlood / 20)
    : null;
  const carriedItem = world.players.find((player) => player.id === playerId)?.carrying;

  return (
    <main className="game-shell">
      <GameCanvas level={runLevel} world={world} players={playerNames} />
      <header className="game-hud">
        <div className="hud-level">
          <span className="hud-kicker">{level.id} · COURIER SHIFT</span>
          <strong>{level.title}</strong>
        </div>
        <div className={`timer-card${seconds <= 20 ? " urgent" : ""}`} data-testid="game-timer">
          <span>THE TIDE</span>
          <strong>{formatTime(world.timeRemainingTicks)}</strong>
        </div>
        <div className="hud-orders">
          {world.orders.map((order) => (
            <div className={`order-chip${order.fulfilled ? " done" : ""}`} key={order.id}>
              <span className="order-icon">{order.itemKind === "lantern" ? "✦" : order.itemKind === "crate" ? "▣" : "▰"}</span>
              <span>{order.label}</span>
              <b aria-label={order.fulfilled ? "delivered" : "waiting"}>{order.fulfilled ? "✓" : "·"}</b>
            </div>
          ))}
          {sandbarWarningSeconds !== null && (
            <span className="sandbar-warning-chip" role="status" aria-live="polite">
              Sandbar floods in {sandbarWarningSeconds}
            </span>
          )}
        </div>
        <div className="hud-actions">
          <button className="icon-button" type="button" onClick={onToggleMute} aria-label={muted ? "Turn sound on" : "Mute sound"} title={muted ? "Sound on" : "Mute"}>
            {muted ? "◖" : "♫"}
          </button>
          <button className="icon-button" type="button" onClick={() => setPaused(true)} aria-label="Pause game" title="Pause">
            Ⅱ
          </button>
        </div>
      </header>
      <div className="hud-notifications" aria-live="polite">
        {toasts.map((toast) => <div className="hud-notification" key={toast.id}>{toast.text}</div>)}
      </div>
      {floodBannerVisible && (
        <div className="hud-flood-banner" role="status" aria-live="polite">{floodBannerText}</div>
      )}
      <div className="courier-roster" aria-label="Crew">
        {Object.entries(playerNames).map(([id, player]) => (
          <div
            className="roster-chip"
            data-testid={`courier-${id}`}
            data-position={world.players.find((candidate) => candidate.id === id) ? `${world.players.find((candidate) => candidate.id === id)!.x},${world.players.find((candidate) => candidate.id === id)!.y}` : ""}
            key={id}
          >
            <i style={{ backgroundColor: player.color }} />
            {player.name}{id === playerId ? " · YOU" : ""}
          </div>
        ))}
      </div>
      {level.id === "L1" && <div className="control-hint">WASD / arrows to run · Space or E to act</div>}
      <div className="touch-controls">
        <div
          className="virtual-stick"
          aria-label="Movement joystick"
          onPointerDown={onJoystickDown}
          onPointerMove={onJoystickMove}
          onPointerUp={onJoystickUp}
          onPointerCancel={onJoystickUp}
        >
          <span className="stick-ring" />
          <span className="stick-knob" style={{ transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)` }} />
        </div>
        <button
          className={`touch-action${carriedItem ? " carrying" : ""}`}
          type="button"
          onPointerDown={(event) => { event.preventDefault(); queueAction(); }}
          aria-label="Action"
        >
          <span>{carriedItem ? "DELIVER" : "ACT"}</span>
          <b>↗</b>
        </button>
      </div>
      {paused && (
        <div className="pause-shade" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <section className="pause-card">
            <span className="overline">CATCH YOUR BREATH</span>
            <h2 id="pause-title">Pause the crossing</h2>
            <p>The tide waits here. Your town does not.</p>
            <button className="primary" type="button" onClick={() => setPaused(false)}>Back to the town</button>
            <button className="secondary" type="button" onClick={() => { setPaused(false); onExitRef.current(); }}>Levels</button>
            {mode === "solo" && (
              <button className="secondary" type="button" onClick={() => onRestartRef.current()}>Restart level</button>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default function App(): JSX.Element {
  const [screen, setScreen] = useState<Screen>("title");
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [selectedLevelId, setSelectedLevelId] = useState("L1");
  const [mode, setMode] = useState<GameMode>("solo");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [name, setName] = useState("Courier");
  const [room, setRoom] = useState<RoomConnection | null>(null);
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [serverWorld, setServerWorld] = useState<WorldSnapshot | null>(null);
  const [networkEvents, setNetworkEvents] = useState<NetworkEvents | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(MUTE_KEY) === "true";
  });
  const [result, setResult] = useState<WorldSnapshot | null>(null);
  const [runNonce, setRunNonce] = useState(0);
  const intentionalCloses = useRef(new WeakSet<WebSocket>());

  useEffect(() => {
    const roomParam = new URLSearchParams(window.location.search).get("room");
    if (roomParam) {
      setRoomCodeInput(roomParam.toUpperCase());
      setMode("online");
      setScreen("crew");
    }
  }, []);

  useEffect(() => {
    pftAudio.setMuted(muted);
    localStorage.setItem(MUTE_KEY, String(muted));
  }, [muted]);

  useEffect(() => {
    if (lobby?.phase === "playing" && screen === "lobby") {
      setSelectedLevelId(lobby.levelId);
      setServerWorld(null);
      setScreen("game");
    } else if (lobby?.phase === "results" && screen === "lobby") {
      setScreen("results");
    }
  }, [lobby, screen]);

  const unlocked = useMemo(() => new Set([
    LEVELS[0]!.id,
    ...LEVELS.slice(1).filter((_, index) => progress.completed.includes(LEVELS[index]!.id)).map((level) => level.id),
  ]), [progress]);

  const storeProgress = (snapshotValue: WorldSnapshot): void => {
    if (snapshotValue.phase !== "completed") return;
    setProgress((current) => {
      const updated = {
        completed: [...new Set([...current.completed, snapshotValue.levelId])],
        stars: { ...current.stars, [snapshotValue.levelId]: Math.max(current.stars[snapshotValue.levelId] ?? 0, snapshotValue.stars) },
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const finishGame = (finalWorld: WorldSnapshot): void => {
    setResult(finalWorld);
    storeProgress(finalWorld);
    setScreen("results");
  };

  const connectToRoom = (create: boolean): void => {
    setError("");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/rt`);
    const pendingRoom: RoomConnection = { socket, playerId: "", resumeToken: "", code: "", inputSeq: 0 };
    setRoom(pendingRoom);
    socket.addEventListener("open", () => {
      sendSocket(socket, { type: "hello", v: 1, name });
      const code = roomCodeInput.trim().toUpperCase();
      const resumeToken = create ? null : localStorage.getItem(`pft-rt-resume:${code}`);
      sendSocket(socket, create ? { type: "create" } : {
        type: "join",
        code,
        ...(resumeToken ? { resumeToken } : {}),
      });
    });
    socket.addEventListener("message", (event) => {
      let message: Record<string, unknown>;
      try {
        message = JSON.parse(String(event.data)) as Record<string, unknown>;
      } catch {
        setError("The crew radio sent an unreadable message.");
        return;
      }
      if (message.type === "welcome") {
        const code = String(message.code);
        const playerId = String(message.playerId);
        const lastSeq = Number(message.lastSeq);
        const initialSequence = Number.isSafeInteger(lastSeq) ? Math.max(0, lastSeq + 1) : 0;
        localStorage.setItem(`pft-rt-resume:${code}`, String(message.resumeToken));
        localStorage.setItem(`pft-rt-seq:${playerId}`, String(initialSequence));
        localStorage.setItem("pft-rt-last-room", code);
        setRoom({
          socket,
          playerId,
          resumeToken: String(message.resumeToken),
          code,
          inputSeq: initialSequence,
        });
        setSelectedLevelId("L1");
        setScreen("lobby");
      } else if (message.type === "lobby") {
        setLobby(message as unknown as LobbyState);
      } else if (message.type === "snap") {
        setServerWorld(message.world as WorldSnapshot);
      } else if (message.type === "events") {
        setNetworkEvents({ tick: Number(message.tick), list: message.list as SimEvent[] });
      } else if (message.type === "error") {
        const reason = String(message.reason);
        setError(reason === "not_host" ? "Only the host can start or change the level." : `Crew radio: ${reason.replaceAll("_", " ")}.`);
      }
    });
    socket.addEventListener("close", () => {
      if (intentionalCloses.current.has(socket)) return;
      const lastRoom = localStorage.getItem("pft-rt-last-room") ?? roomCodeInput;
      setRoomCodeInput(lastRoom);
      setRoom(null);
      setLobby(null);
      setServerWorld(null);
      setScreen("crew");
      setError("Connection lost. Rejoin with the same dock code to recover your seat.");
    });
  };

  const leaveRoom = (): void => {
    if (room) {
      intentionalCloses.current.add(room.socket);
      sendSocket(room.socket, { type: "leave" });
      room.socket.close();
    }
    setRoom(null);
    setLobby(null);
    setServerWorld(null);
    setNetworkEvents(null);
    setError("");
    setScreen("title");
  };

  const goToLevels = (): void => {
    if (room) {
      intentionalCloses.current.add(room.socket);
      sendSocket(room.socket, { type: "leave" });
      room.socket.close();
      setRoom(null);
      setLobby(null);
      setServerWorld(null);
    }
    setResult(null);
    setScreen("select");
  };

  const toggleMute = (): void => setMuted((value) => !value);
  const isHost = Boolean(lobby && room && lobby.hostId === room.playerId);
  const playerNames: Record<string, PlayerDisplay> = room && lobby
    ? Object.fromEntries(lobby.players.map((player) => [player.playerId, { name: player.name, color: player.color }]))
    : { solo: { name: "Courier", color: "red" } };
  const playerId = room?.playerId || "solo";
  const nextInputSequence = (): number => {
    if (!room) return 0;
    const sequence = room.inputSeq;
    room.inputSeq = sequence + 1;
    return sequence;
  };

  const chooseMode = (next: GameMode): void => {
    setMode(next);
    setScreen(next === "solo" ? "select" : "crew");
  };

  const startSolo = (levelId: string): void => {
    setMode("solo");
    setSelectedLevelId(levelId);
    setResult(null);
    setRunNonce((value) => value + 1);
    setScreen("game");
  };

  const restartSolo = (): void => {
    setResult(null);
    setRunNonce((value) => value + 1);
  };

  const startRoom = (): void => {
    if (!room || !isHost) return;
    sendSocket(room.socket, { type: "select", levelId: selectedLevelId });
    sendSocket(room.socket, { type: "start" });
  };

  const copyInvite = async (): Promise<void> => {
    if (!room?.code) return;
    const link = `${window.location.origin}/?room=${room.code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Copy was unavailable. Share this code instead.");
    }
  };

  if (screen === "game") {
    return (
      <GameScreen
        key={`${mode}-${selectedLevelId}-${room?.playerId ?? "solo"}-${runNonce}`}
        levelId={selectedLevelId}
        mode={mode}
        playerId={playerId}
        playerNames={playerNames}
        socket={room?.socket ?? null}
        nextInputSequence={nextInputSequence}
        serverWorld={serverWorld}
        networkEvents={networkEvents}
        onFinish={finishGame}
        onExit={goToLevels}
        onRestart={restartSolo}
        muted={muted}
        onToggleMute={toggleMute}
      />
    );
  }

  if (screen === "title") {
    return (
      <main className="lobby-page title-page">
        <div className="title-glow" />
        <div className="title-content">
          <div className="brand-mark" aria-hidden="true"><span>✦</span><i /><b /></div>
          <p className="eyebrow">A REAL-TIME COURIER CO-OP</p>
          <h1>Please Forward<br /><em>the Town</em></h1>
          <p className="title-copy">The bridges are also the parcels.<br />Carry one away, and the path goes with it.</p>
          <div className="title-actions">
            <button className="primary large" type="button" onClick={() => chooseMode("solo")}>Play solo <span>↗</span></button>
            <button className="secondary large" type="button" onClick={() => chooseMode("online")}>Crew up <span>＋</span></button>
          </div>
          <button className="text-button credits-link" type="button" onClick={() => setScreen("credits")}>Credits</button>
        </div>
        <footer className="title-footer"><span>HARBOR POST · EST. 2026</span><span>DELIVER WHAT THE TOWN NEEDS</span></footer>
      </main>
    );
  }

  if (screen === "select") {
    return (
      <main className="lobby-page">
        <header className="page-header">
          <button className="back-button" type="button" onClick={() => setScreen("title")}>← <span>Back</span></button>
          <div><span className="eyebrow">THE ROUTE BOOK</span><h1>Choose a crossing</h1></div>
          <div className="progress-summary">{progress.completed.length} / {LEVELS.length} crossings cleared</div>
        </header>
        <section className="level-grid" aria-label="Level select">
          {LEVELS.map((level, index) => {
            const available = unlocked.has(level.id);
            return (
              <button
                type="button"
                className={`route-card ${available ? "" : "locked"}`}
                key={level.id}
                disabled={!available}
                onClick={() => startSolo(level.id)}
                data-testid={`level-${level.id}`}
              >
                <span className="route-top"><span>{String(index + 1).padStart(2, "0")} / ROUTE</span><span>{available ? `${progress.stars[level.id] ?? 0} ★` : "LOCKED"}</span></span>
                <LevelMiniMap level={level} />
                <span className="route-id">{level.id} · {formatLevelDuration(level.timeLimitSec)}</span>
                <strong>{level.title}</strong>
                <span className="route-copy">{LEVEL_COPY[level.id]}</span>
                <span className="route-footer"><span>{available ? "OPEN ROUTE" : `CLEAR ${LEVELS[index - 1]?.id} TO UNLOCK`}</span><b>{available ? "↗" : "⌁"}</b></span>
              </button>
            );
          })}
        </section>
        <p className="page-note">A delivered bridge is gone for good. Plan the crossing before you lift.</p>
      </main>
    );
  }

  if (screen === "crew") {
    return (
      <main className="lobby-page crew-page">
        <header className="page-header">
          <button className="back-button" type="button" onClick={() => setScreen("title")}>← <span>Back</span></button>
          <div><span className="eyebrow">THE CREW RADIO</span><h1>Meet at the dock</h1></div>
          <span />
        </header>
        <section className="crew-panel">
          <div className="crew-intro">
            <span className="dock-number">01—04</span>
            <h2>Better crossings<br />take a crew.</h2>
            <p>Host a room and send the five-letter dock code to your friends.</p>
            <label className="field-label" htmlFor="courier-name">Your courier name</label>
            <input id="courier-name" value={name} maxLength={24} onChange={(event) => setName(event.target.value)} />
            <button className="primary" type="button" onClick={() => connectToRoom(true)}>Host a crew <span>↗</span></button>
          </div>
          <div className="join-box">
            <span className="eyebrow">ALREADY HAVE A CODE?</span>
            <h2>Join the crossing</h2>
            <p>Type the code your host shared with you.</p>
            <label className="field-label" htmlFor="room-code">Five-letter dock code</label>
            <input id="room-code" className="code-input" value={roomCodeInput} maxLength={5} autoCapitalize="characters" onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />
            <button className="secondary" type="button" disabled={roomCodeInput.length !== 5} onClick={() => connectToRoom(false)}>Join crew <span>→</span></button>
          </div>
        </section>
        {error && <p className="inline-error" role="alert">{error}</p>}
      </main>
    );
  }

  if (screen === "lobby") {
    return (
      <main className="lobby-page waiting-page">
        <header className="page-header">
          <button className="back-button" type="button" onClick={leaveRoom}>← <span>Leave crew</span></button>
          <div><span className="eyebrow">THE CREW IS ASSEMBLING</span><h1>Dock {room?.code}</h1></div>
          <button className="secondary" type="button" onClick={() => void copyInvite()}>{copied ? "Copied!" : "Copy invite"}</button>
        </header>
        <section className="waiting-layout">
          <div className="waiting-crew">
            <span className="eyebrow">ON THE QUAY · {lobby?.players.length ?? 1}/4</span>
            <h2>Who’s carrying what?</h2>
            <div className="crew-list">
              {(lobby?.players ?? []).map((player) => (
                <div className="crew-member" key={player.playerId}>
                  <span className={`member-stamp ${player.color}`} aria-hidden="true">{player.name.slice(0, 1).toUpperCase()}</span>
                  <span><strong>{player.name}</strong><small>{player.playerId === room?.playerId ? "You · " : ""}{player.playerId === lobby?.hostId ? "Host" : "Courier"}</small></span>
                  <i className={player.connected ? "online-dot" : "offline-dot"} />
                </div>
              ))}
            </div>
            <p className="waiting-note">Your seat color stays yours if you need to reconnect.</p>
          </div>
          <div className="room-controls">
            <span className="eyebrow">ROUTE BRIEFING</span>
            {isHost ? (
              <>
                <label className="field-label" htmlFor="crew-level">Choose a route</label>
                <select id="crew-level" value={lobby?.levelId ?? "L1"} onChange={(event) => {
                  setSelectedLevelId(event.target.value);
                  sendSocket(room?.socket, { type: "select", levelId: event.target.value });
                }}>
                  {LEVELS.map((level) => <option value={level.id} key={level.id}>{level.id} — {level.title}</option>)}
                </select>
                <p>{LEVEL_COPY[lobby?.levelId ?? "L1"]}</p>
                <button className="primary" type="button" onClick={startRoom}>Start crossing <span>↗</span></button>
              </>
            ) : (
              <div className="waiting-state"><span className="waiting-glyph">◌</span><h2>Waiting for the host</h2><p>Take a look at the route while the crew gets ready.</p></div>
            )}
          </div>
        </section>
        {error && <p className="inline-error" role="alert">{error}</p>}
      </main>
    );
  }

  if (screen === "results" && result) {
    const completed = result.phase === "completed";
    const levelIndex = LEVELS.findIndex((level) => level.id === result.levelId);
    const nextLevel = LEVELS[levelIndex + 1];
    return (
      <main className="lobby-page results-page">
        <div className="results-stamp" aria-hidden="true">{completed ? "✦" : "↻"}</div>
        <span className="eyebrow">{completed ? "DELIVERY COMPLETE" : "THE TIDE CAME IN"}</span>
        <h1>{completed ? "Town, taken care of." : "The crossing can wait."}</h1>
        <p className="results-copy">{completed ? `${getLevel(result.levelId)?.title} is back in good order.` : "The parcels are safe. Let’s plan a better route."}</p>
        <div className="results-score">
          <span>{completed ? "YOUR STARS" : "TIME LEFT"}</span>
          <strong>{completed ? "★".repeat(result.stars) + "☆".repeat(3 - result.stars) : formatTime(result.timeRemainingTicks)}</strong>
          <small>{completed ? `Cleared with ${formatTime(result.timeRemainingTicks)} on the tide clock` : "Restart to try the crossing again"}</small>
        </div>
        <div className="results-actions">
          {mode === "solo" ? (
            <button className="primary" type="button" onClick={() => startSolo(result.levelId)}>Retry route</button>
          ) : (
            <button className="primary" type="button" disabled={!isHost} onClick={() => {
              sendSocket(room?.socket, { type: "select", levelId: result.levelId });
              sendSocket(room?.socket, { type: "start" });
              setServerWorld(null);
              setScreen("game");
            }}>Retry route</button>
          )}
          {completed && nextLevel && unlocked.has(nextLevel.id) && (
            <button className="secondary" type="button" onClick={() => {
              if (mode === "solo") startSolo(nextLevel.id);
              else {
                sendSocket(room?.socket, { type: "select", levelId: nextLevel.id });
                sendSocket(room?.socket, { type: "start" });
                setSelectedLevelId(nextLevel.id);
                setServerWorld(null);
                setScreen("game");
              }
            }}>Next crossing <span>→</span></button>
          )}
          <button className="text-button" type="button" onClick={goToLevels}>All routes</button>
        </div>
      </main>
    );
  }

  return (
    <main className="lobby-page credits-page">
      <button className="back-button" type="button" onClick={() => setScreen("title")}>← <span>Back</span></button>
      <span className="eyebrow">HARBOR POST · EST. 2026</span>
      <h1>For the towns<br /><em>we carry.</em></h1>
      <p>A small real-time co-op game about the fragile things that connect us.</p>
      <button className="primary" type="button" onClick={() => setScreen("title")}>Return to the dock</button>
    </main>
  );
}
