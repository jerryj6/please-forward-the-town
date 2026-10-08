import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

const EXPECTED = "9eafb3af47415a2015a9d0842271a6524f6aca2536ab714721c79438b135eea7";
const required = [
  "docs/MASTER-HANDOFF.md", "docs/DECISIONS.md", "docs/REQUIREMENTS.json",
  "docs/source-manifest.json", "docs/RELEASE-STATUS.json", "AGENTS.md",
];
let fail = false;
for (const f of required) {
  if (!existsSync(f)) { console.error(`MISSING ${f}`); fail = true; }
}
if (existsSync("docs/MASTER-HANDOFF.md")) {
  const h = createHash("sha256").update(readFileSync("docs/MASTER-HANDOFF.md")).digest("hex");
  if (h !== EXPECTED) { console.error(`MASTER-HANDOFF hash mismatch: ${h}`); fail = true; }
  else console.log(`master hash OK ${h.slice(0, 12)}…`);
}
process.exit(fail ? 1 : 0);
