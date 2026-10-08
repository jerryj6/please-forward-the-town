import { LEVELS, CARDS } from "../src/content/levels/index.js";

// Fast schema pass over PFT level defs + cards.
// Deep approach-vs-engine consistency lives in scripts/card-vs-engine.ts when present.
let fail = false;
const ids = new Set<string>();
const need = [
  "levelId", "rulesVersion", "contentVersion", "title", "nodes", "edges",
  "sites", "postalLinks", "ferries", "couriers", "parcels", "pieces",
  "recipients", "exits", "orders",
];
for (const l of LEVELS) {
  const d = l.def as unknown as Record<string, unknown>;
  const tag = `${l.id}`;
  for (const k of need) if (!(k in d)) { console.error(`${tag}: missing ${k}`); fail = true; }
  if (ids.has(l.id)) { console.error(`duplicate level id ${l.id}`); fail = true; }
  ids.add(l.id);
  if (((d.orders as unknown[]) ?? []).length < 1) { console.error(`${tag}: no orders`); fail = true; }
  // Tutorial (PFT-01) is card-exempt; every other level needs a 3-tier hint ladder.
  if (l.id !== "PFT-01") {
    const card = CARDS[l.id as keyof typeof CARDS];
    if (!card) { console.error(`${tag}: missing card`); fail = true; }
    else if (card.hints.length < 3) { console.error(`${tag}: hints < 3`); fail = true; }
  }
}
const n = (LEVELS as readonly { id: string }[]).length;
console.log(`content: ${n}/12 main levels authored`);
if (n > 12) { console.error("more than 12 main levels — mastery must be separate"); fail = true; }
process.exit(fail ? 1 : 0);
