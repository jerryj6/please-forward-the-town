import { LEVELS } from "../src/content/levels/index.js";

let fail = false;
const ids = new Set<string>();
for (const l of LEVELS) {
  const d = l.def as unknown as Record<string, unknown>;
  const tag = `${l.id}`;
  const need = ["levelId", "title", "horizonBeats", "entities", "routes", "sockets", "actors",
    "interventionCosts", "interventionBudget", "sealedObservations", "desiredOutcomes", "hints", "designNote"];
  for (const k of need) if (!(k in d)) { console.error(`${tag}: missing ${k}`); fail = true; }
  if (ids.has(l.id)) { console.error(`duplicate level id ${l.id}`); fail = true; }
  ids.add(l.id);
  if ((d.hints as unknown[]).length < 3) { console.error(`${tag}: hints < 3`); fail = true; }
  if ((d.sealedObservations as unknown[]).length < 1) { console.error(`${tag}: no observations`); fail = true; }
}
const n = (LEVELS as readonly {id:string}[]).length;
console.log(`content: ${n}/12 main levels authored`);
if (n > 12) { console.error("more than 12 main levels — mastery must be separate"); fail = true; }
process.exit(fail ? 1 : 0);
