// Entrypoint. The only module that actually binds a port — app.ts has
// zero side effects so it can be imported in tests without starting a
// real server.

import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const { app, config } = createApp();

// bind explicitly to 0.0.0.0 so the server is reachable over IPv4 and IPv6
serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" }, (info) => {
  console.log(`riot-service listening on :${info.port}`);
});
