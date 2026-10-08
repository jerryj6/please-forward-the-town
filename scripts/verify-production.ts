export {};
const args = process.argv.slice(2);
const url = args[args.indexOf("--url") + 1];
const wantSha = args.includes("--sha") ? args[args.indexOf("--sha") + 1] : undefined;
if (!url) { console.error("usage: verify-production --url <base> [--sha <gitsha>]"); process.exit(2); }
const base = url.replace(/\/$/, "");
let fail = false;
try {
  const r = await fetch(`${base}/build-id.json`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`build-id ${r.status}`);
  const j = await r.json() as { sha?: string };
  console.log(`live build-id: ${j.sha}`);
  if (wantSha && j.sha !== wantSha) { console.error(`SHA mismatch: live ${j.sha} != ${wantSha}`); fail = true; }
  const page = await (await fetch(base, { signal: AbortSignal.timeout(15000) })).text();
  if (!/Please Forward the Town/i.test(page) && !/id="root"/.test(page)) { console.error("index.html missing app root"); fail = true; }
  else console.log("index served OK");
} catch (e) { console.error(`verify-production failed: ${e}`); fail = true; }
process.exit(fail ? 1 : 0);
