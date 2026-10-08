import type { LevelDefinition } from "../types.js";

export const LEVELS: LevelDefinition[] = [
  {
    id: "L1",
    title: "The Last Crossing",
    timeLimitSec: 120,
    stars: { three: 65, two: 30 },
    map: [
      "~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~",
      "~...~...~......~",
      "~.L.=.S.=.o.mX.~",
      "~...~...~......~",
      "~...~...~......~",
      "~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~",
    ],
    orders: [
      { itemKind: "lantern", zone: "o", label: "Orchard" },
      { itemKind: "plank", zone: "m", label: "Museum" },
    ],
    recipients: { o: "Orchard", m: "Museum" },
  },
  {
    id: "L2",
    title: "Leapfrog",
    timeLimitSec: 150,
    stars: { three: 95, two: 50 },
    map: [
      "~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~",
      "~rXS=..=..-..Cf~",
      "~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~",
    ],
    orders: [
      { itemKind: "crate", zone: "f", label: "Far dock" },
      { itemKind: "plank", zone: "r", label: "Start dock" },
    ],
    recipients: { r: "Start dock", f: "Far dock" },
  },
  {
    id: "L3",
    title: "Two Shores",
    timeLimitSec: 180,
    stars: { three: 115, two: 60 },
    map: [
      "~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~",
      "~LXw=.S..=..Ce.~",
      "~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~",
    ],
    orders: [
      { itemKind: "lantern", zone: "e", label: "East parcel" },
      { itemKind: "crate", zone: "w", label: "West parcel" },
      { itemKind: "plank", zone: "w", label: "West bridge" },
    ],
    recipients: { w: "West shore", e: "East shore" },
  },
];

export function getLevel(levelId: string): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === levelId);
}
