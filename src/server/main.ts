import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = Number(process.env.PORT ?? 8787);
const DIST = "dist";
const MIME: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };

createServer((req, res) => {
  const u = new URL(req.url ?? "/", `http://x`).pathname;
  if (u === "/healthz") { res.writeHead(200).end("ok"); return; }
  let p = join(DIST, u === "/" ? "index.html" : u);
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, "index.html");
  res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" }).end(readFileSync(p));
}).listen(PORT, () => console.log(`please-forward-the-town server on :${PORT} (room server lands in NET-ROOM-001)`));
