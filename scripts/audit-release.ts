import { existsSync, readFileSync } from "node:fs";
import { LEVELS } from "../src/content/levels/index.js";

const checks: [string, boolean][] = [
  ["12 main levels authored", (LEVELS as readonly unknown[]).length === 12],
  ["dist build exists", existsSync("dist/index.html") && existsSync("dist/build-id.json")],
  ["README", existsSync("README.md")],
  ["RELEASE-STATUS.json", existsSync("docs/RELEASE-STATUS.json")],
  ["evidence index", existsSync("evidence/INDEX.md")],
  ["art manifest", existsSync("art/manifests/assets.json")],
];
let fail = false;
for (const [name, ok] of checks) { console.log(`${ok ? "PASS" : "FAIL"} ${name}`); if (!ok) fail = true; }
if (existsSync("docs/RELEASE-STATUS.json")) {
  const s = JSON.parse(readFileSync("docs/RELEASE-STATUS.json", "utf8")) as { levels?: Record<string, { status?: string }> };
  const notAccepted = Object.entries(s.levels ?? {}).filter(([, v]) => v.status !== "release_accepted");
  if (notAccepted.length) console.log(`levels not release_accepted: ${notAccepted.map(([k]) => k).join(", ") || "none"}`);
}
process.exit(fail ? 1 : 0);
