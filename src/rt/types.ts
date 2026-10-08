export type ItemKind = "lantern" | "crate" | "plank";
export type ItemState = "ground" | "carried" | "deployed" | "delivered";
export type WorldPhase = "playing" | "completed" | "failed";
export type Facing = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export interface Point {
  x: number;
  y: number;
}

export interface OrderDefinition {
  itemKind: ItemKind;
  zone: string;
  label: string;
}

export interface ActionPlan {
  verb: "deploy" | "deliver" | "drop" | "pickup" | "lift";
  x: number;
  y: number;
  itemId: string;
}

export interface LevelDefinition {
  id: string;
  title: string;
  timeLimitSec: number;
  stars: { three: number; two: number };
  sandbarFloodsAtSec?: number;
  map: string[];
  orders: OrderDefinition[];
  recipients: Record<string, string>;
}

export interface Input {
  dx: number;
  dy: number;
  action: boolean;
}

export interface Player {
  id: string;
  pos: Point;
  facing: Facing;
  carrying: string | null;
  state: "normal" | "splash";
  splashTicks: number;
  spawn: Point;
}

export interface Item {
  id: string;
  kind: ItemKind;
  state: ItemState;
  pos: Point;
  spawn: Point;
  initialState: "ground" | "deployed";
}

export interface Order {
  id: string;
  itemKind: ItemKind;
  zone: string;
  label: string;
  fulfilled: boolean;
}

export interface World {
  level: LevelDefinition;
  width: number;
  height: number;
  tick: number;
  timeRemainingTicks: number;
  sandbarFlooded: boolean;
  phase: WorldPhase;
  stars: number;
  players: Map<string, Player>;
  items: Map<string, Item>;
  orders: Order[];
  spawns: Point[];
  sockets: Map<string, string>;
}

export type SimEvent =
  | { type: "pickup"; playerId: string; itemId: string; itemKind: ItemKind }
  | { type: "deploy"; playerId: string; itemId: string; x: number; y: number }
  | { type: "deliver"; playerId: string; itemId: string; orderId: string; label: string }
  | { type: "splash"; playerId: string }
  | { type: "respawn"; playerId: string }
  | { type: "flood" }
  | { type: "complete"; stars: number }
  | { type: "failed"; message: "The tide's in" };

export interface WorldSnapshot {
  levelId: string;
  tick: number;
  timeRemainingTicks: number;
  sandbarFlooded: boolean;
  phase: WorldPhase;
  stars: number;
  players: Array<{
    id: string;
    x: number;
    y: number;
    facing: Facing;
    carrying: string | null;
    state: Player["state"];
    splashTicks: number;
    action: ActionPlan | null;
  }>;
  items: Array<{
    id: string;
    kind: ItemKind;
    state: ItemState;
    x: number;
    y: number;
  }>;
  orders: Array<{
    id: string;
    itemKind: ItemKind;
    zone: string;
    label: string;
    fulfilled: boolean;
  }>;
}
