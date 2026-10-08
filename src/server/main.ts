import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { startRtRoomServer } from "./rt/manager.js";

const PORT = Number(process.env.PORT ?? 8787);
const DIST = "dist";
const MIME: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".woff2": "font/woff2",
};

const http = createServer((req: IncomingMessage, res: ServerResponse) => {
  const u = new URL(req.url ?? "/", "http://x").pathname;
  if (u === "/healthz") { res.writeHead(200).end("ok"); return; }
  let p = join(DIST, u === "/" ? "index.html" : u);
  if (!resolve(p).startsWith(resolve(DIST)) || !existsSync(p) || !statSync(p).isFile()) p = join(DIST, "index.html");
  res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" }).end(readFileSync(p));
});

startRtRoomServer(http);
http.listen(PORT, () => console.log(`please-forward-the-town on :${PORT} — static /, real-time /rt`));
