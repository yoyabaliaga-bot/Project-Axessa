// Production server for the built site. The TanStack Start build emits a portable
// fetch handler (dist/server/server.js) plus static client assets (dist/client);
// this wraps them in a Bun server on port 3000 — static files first, SSR for the
// rest. Also starts the Axessa API backend and proxies /api/* to it.
//
// Run `bun run build` before starting. Restart it with `bun run publish`.
//
// Starting a new instance supersedes the old one: it kills the previously
// recorded pid and takes over the port, so `publish` never collides with the
// already-running server.
import handler from "./dist/server/server.js";
import { createBackend } from "./src/backend/server.js";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const API_PORT = Number(process.env.API_PORT ?? 3001);
const CLIENT_DIR = `${import.meta.dir}/dist/client`;
const PID_FILE = `${import.meta.dir}/.server.pid`;

const prev = Number(await Bun.file(PID_FILE).text().catch(() => ""));
if (prev && prev !== process.pid) {
  try {
    process.kill(prev);
  } catch {
    // already gone
  }
  await Bun.sleep(500);
}
await Bun.write(PID_FILE, String(process.pid));

// Start the Express API backend on an internal port
const apiApp = createBackend();
const apiServer = apiApp.listen(API_PORT, "127.0.0.1", () => {
  console.log(`API server running on http://127.0.0.1:${String(API_PORT)}`);
});

Bun.serve({
  port: PORT,
  hostname: HOST,
  async fetch(req) {
    const url = new URL(req.url);

    // Proxy /api/* requests to the Express backend
    if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
      const targetUrl = `http://127.0.0.1:${String(API_PORT)}${url.pathname}${url.search}`;
      const proxyReq = new Request(targetUrl, {
        method: req.method,
        headers: req.headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? await req.bytes() : undefined,
      });
      return fetch(proxyReq);
    }

    // Serve static files
    if (url.pathname !== "/") {
      const file = Bun.file(CLIENT_DIR + url.pathname);
      if (await file.exists()) return new Response(file);
    }

    // Fall through to TanStack Start SSR handler
    return (
      handler as { fetch: (r: Request) => Response | Promise<Response> }
    ).fetch(req);
  },
});

console.log(`team-site serving on http://${HOST}:${String(PORT)}`);
console.log(`API proxied from /api/* to http://127.0.0.1:${String(API_PORT)}`);

// Cleanup on exit
process.on("SIGINT", () => {
  apiServer.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  apiServer.close();
  process.exit(0);
});