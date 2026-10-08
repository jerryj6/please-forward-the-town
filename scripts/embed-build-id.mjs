import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
let sha = "unknown";
try { sha = execSync("git rev-parse HEAD").toString().trim(); } catch {}
mkdirSync("dist", { recursive: true });
writeFileSync("dist/build-id.json", JSON.stringify({ sha, builtAt: new Date().toISOString(), game: "the-record-stands" }, null, 1));
console.log(`build-id: ${sha.slice(0, 12)}`);
