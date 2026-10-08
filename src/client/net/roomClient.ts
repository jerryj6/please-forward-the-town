// Thin browser client for the ws room protocol (matches src/server/protocol.ts).
// Lockstep model: the server commits commands and broadcasts each accepted
// payload in revision order; clients fold the same payloads through the
// deterministic engine locally, seeded from a b64 snapshot + history.

export interface RoomClientEvents {
  /** Server state decoded: TrsRoomState {levelId, state} after snapshot+history fold. */
  onState?: (roomState: unknown) => void;
  /** An accepted command payload to fold through the local engine, in order. */
  onCommand?: (payload: unknown, revision: number) => void;
  onJoin?: (actorId: string, roomCode: string) => void;
  onError?: (code: string, message: string) => void;
}

function b64decode(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export class RoomClient {
  private ws: WebSocket | null = null;
  actorId: string | null = null;
  roomCode: string | null = null;
  revision = -1;
  private seq = 0;

  constructor(private ev: RoomClientEvents) {}

  connect(path = "/ws"): Promise<void> {
    return new Promise((resolve, reject) => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      this.ws = new WebSocket(`${proto}://${location.host}${path}`);
      this.ws.onopen = () => { this.send({ type: "hello", protocolVersion: 1 }); resolve(); };
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (m) => this.handle(JSON.parse(m.data as string));
    });
  }

  private send(msg: unknown) { this.ws?.send(JSON.stringify(msg)); }

  createRoom(gameType: string, seed?: string) {
    this.send({ type: "create", gameType, ...(seed !== undefined ? { seed } : {}) });
  }
  joinRoom(code: string) { this.send({ type: "join", room: code.toUpperCase() }); }
  leave() { this.send({ type: "leave" }); }

  command(payload: unknown) {
    this.seq += 1;
    this.send({
      type: "command",
      commandId: `${this.actorId ?? "anon"}-${this.seq}`,
      baseRevision: this.revision,
      payload,
    });
  }

  private handle(m: Record<string, unknown>) {
    if (m.type === "full_state") {
      this.actorId = m.actorId as string;
      const meta = m.room as { roomCode?: string };
      this.roomCode = meta.roomCode ?? null;
      this.revision = m.revision as number;
      this.ev.onJoin?.(this.actorId, this.roomCode ?? "");
      const snap = m.snapshot as { data: string } | undefined;
      const history = (m.history as { payload: unknown }[] | undefined) ?? [];
      // RoomState = snapshot decoded + history folded by adapter (engine-side
      // the fold is the App's job: we emit the decoded snapshot then payloads).
      this.ev.onState?.(snap ? JSON.parse(b64decode(snap.data)) : null);
      for (const h of history) this.ev.onCommand?.(h.payload, -1);
    } else if (m.type === "state_patch") {
      this.revision = m.revision as number;
      this.ev.onCommand?.(m.payload, this.revision);
    } else if (m.type === "error") {
      this.ev.onError?.(String(m.code), String(m.message));
    }
  }

  close() { this.send({ type: "leave" }); this.ws?.close(); this.ws = null; }
}
