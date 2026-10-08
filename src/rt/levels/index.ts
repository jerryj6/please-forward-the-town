import type { LevelDefinition } from "../types.js";

export const LEVELS: LevelDefinition[] = [
  {
    id: "L1",
    title: "The Last Crossing",
    timeLimitSec: 90,
    stars: { three: 45, two: 20 },
    map: [
      "~~~~~~~~~~~~~~~~~~",
      "~~....~~~~~~~~~~~~",
      "~~.L..~~~~~~~.o..~",
      "~~....=..S..=....~",
      "~~....~.....~.m..~",
      "~~~~~~~.....~..X.~",
      "~~~~~~~~~~~~~~~~~~",
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
    stars: { three: 60, two: 25 },
    sandbarFloodsAtSec: 105,
    map: [
      "~~~~~~~~~~~~~~~~~~",
      "~...~~~~~~~~~~~~~~",
      "~.rS=..=..-..-.C.~",
      "~...~..~..~..~.fX~",
      "~...~~~~~~~..~...~",
      "~~,,,,,,,,,,~~~~~~",
      "~~~~~~~~~~~~~~~~~~",
    ],
    orders: [
      { itemKind: "crate", zone: "r", label: "Bakery" },
      { itemKind: "plank", zone: "f", label: "Far dock" },
    ],
    recipients: { r: "Bakery", f: "Far dock" },
  },
  {
    id: "L3",
    title: "Two Shores",
    timeLimitSec: 180,
    stars: { three: 70, two: 30 },
    sandbarFloodsAtSec: 130,
    map: [
      "~~~~~~~~~~~~~~~~~~",
      "~~~~~~~.L.~~~~~~~~",
      "~~~~~~~,,,~~~~~~~~",
      "~....~.....~~....~",
      "~.wX.=..S..=-.e..~",
      "~.w..~.PS..~~.C..~",
      "~....~.....~~..C.~",
      "~~~~~~~~~~~~~~~~~~",
    ],
    orders: [
      { itemKind: "lantern", zone: "e", label: "Lighthouse" },
      { itemKind: "crate", zone: "w", label: "West market" },
      { itemKind: "crate", zone: "w", label: "West market" },
      { itemKind: "plank", zone: "w", label: "West carpenter" },
    ],
    recipients: { w: "West market", e: "Lighthouse" },
  },
];

export function getLevel(levelId: string): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === levelId);
}
