import { execSync } from "node:child_process";

const steps = ["check:source", "check:static", "test:unit", "test:properties", "test:campaign",
  "test:depth", "test:network", "test:e2e", "test:a11y", "test:visual", "test:performance",
  "audit:assets", "audit:release", "build"];
const results: [string, string][] = [];
for (const s of steps) {
  try { execSync(`npm run ${s}`, { stdio: "pipe" }); results.push([s, "PASS"]); }
  catch { results.push([s, "FAIL"]); }
}
for (const [s, r] of results) console.log(`${r} ${s}`);
process.exit(results.some(([, r]) => r === "FAIL") ? 1 : 0);
