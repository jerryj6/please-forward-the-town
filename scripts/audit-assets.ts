import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

let fail = false;
const walk = (d: string): string[] =>
  existsSync(d) ? readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; }) : [];

const shipped = walk("public/assets").filter(f => !f.endsWith(".json"));
const manifestPath = "art/manifests/assets.json";
if (!existsSync(manifestPath)) {
  if (shipped.length) { console.error("assets shipped without art/manifests/assets.json"); fail = true; }
  console.log("audit:assets — no shipped assets yet (dev art only; release requires manifests)");
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { file: string; sha256: string; prompt?: string; approved?: boolean }[];
  const byFile = new Map(manifest.map(m => [m.file, m]));
  for (const f of shipped) {
    const rel = f.replace(/^public\//, "");
    const m = byFile.get(rel);
    if (!m) { console.error(`unmanifested asset ${rel}`); fail = true; continue; }
    const h = createHash("sha256").update(readFileSync(f)).digest("hex");
    if (h !== m.sha256) { console.error(`hash mismatch ${rel}`); fail = true; }
    if (!m.approved) { console.error(`unapproved asset ${rel}`); fail = true; }
  }
  console.log(`audit:assets — ${shipped.length} shipped asset(s) checked`);
}
const banned = shipped.filter(f => /placeholder|todo|tmp|draft/i.test(f));
if (banned.length) { console.error(`placeholder-named assets: ${banned.join(", ")}`); fail = true; }
process.exit(fail ? 1 : 0);
