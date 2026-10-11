// Entrypoint. This is the one place that starts the Node HTTP server; the app
// factory in app.ts remains side-effect free so it can be imported in tests
// without binding a real port.

import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const { app, config } = createApp();

// bind explicitly to 0.0.0.0 so the server is reachable over IPv4 and IPv6
serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" }, (info) => {
  console.log(`riot-service listening on :${info.port}`);
});
