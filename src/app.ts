// Hono app definition: routes, middleware, CORS. Deliberately has no
// side effects (no serve()/port binding) so it can be imported directly
// in tests via app.request(...) without starting a real server.
//
// Bring your own RIOT_API_KEY — this process is the only thing that
// ever touches it; nothing is exposed to the client beyond /api/riot.

import { Hono } from "hono";
import { cors } from "hono/cors";
import { loadConfig } from "./config.js";
import { createRiotService } from "./riot/service.js";
import { RiotApiError } from "./riot/client.js";

export function createApp() {
  const config = loadConfig();
  const riotService = createRiotService(config);

  const app = new Hono();

  app.use(
    "/api/riot",
    cors({
      origin: (origin) => {
        if (config.allowedOrigins.includes("*")) return "*";
        if (origin && config.allowedOrigins.includes(origin)) return origin;
        return null;
      },
      allowMethods: ["GET", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use("/api/riot", async (c, next) => {
    const region = c.req.query("region");
    const gameName = c.req.query("gameName");
    const tag = c.req.query("tag");

    if (!region) {
      return c.json({ ok: false, error: "User Region is required" }, 400);
    }

    if (!gameName) {
      return c.json({ ok: false, error: "User Game Name is required" }, 400);
    }

    if (!tag) {
      return c.json({ ok: false, error: "User Tag is required" }, 400);
    }

    await next();
  });

  app.get("/health", (c) => c.json({ ok: true, uptime: process.uptime() }));

  // GET /api/riot?part=<rank|mastery|live|recent|all>
  // part is optional; omitting it (or any unrecognized value) returns rank data.
  app.get("/api/riot", async (c) => {
    const part = c.req.query("part");
    try {
      if (!config.key) throw new Error("RIOT_API_KEY missing in .env");
      if (!config.name || !config.tag) throw new Error("RIOT_NAME or RIOT_TAG missing in .env");

      let data: unknown;
      if (part === "mastery") data = await riotService.getMastery();
      else if (part === "live") data = await riotService.getLive();
      else if (part === "recent") data = await riotService.getRecentKda();
      else if (part === "all") {
        const [rank, mastery, live] = await Promise.all([
          riotService.getRank(),
          riotService.getMastery(),
          riotService.getLive(),
        ]);
        data = { rank, mastery, live };
      } else data = await riotService.getRank();

      return c.json({ ok: true, data });
    } catch (e) {
      if (e instanceof RiotApiError) {
        // bubble Riot's own status (404/429/504/etc.) instead of masking everything as 200
        return c.json({ ok: false, error: e.message }, e.status as never);
      }
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        500,
      );
    }
  });

  app.notFound((c) => c.json({ ok: false, error: "not found" }, 404));

  return { app, config };
}
