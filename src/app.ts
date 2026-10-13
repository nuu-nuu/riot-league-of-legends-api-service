// Hono application factory for the Riot API service.
// The app stays side-effect free (no port binding or server startup here) so
// tests can import it and call app.request(...) without booting an HTTP server.
//
// The Riot API key is read from configuration and checked before any Riot
// request is allowed through. The public surface is limited to the /api/v2/riot
// routes and never exposes the key to the client.

import { Hono } from "hono";
import { cors } from "hono/cors";
import { ALL_REGIONS, loadConfig } from "./config.js";
import { createRiotService } from "./riot/service.js";
import { RiotApiError } from "./riot/client.js";

export function createApp() {
  const config = loadConfig();

  const riotServices = new Map<string, ReturnType<typeof createRiotService>>();
  let riotService: ReturnType<typeof createRiotService> | undefined;

  const app = new Hono();

  // Validate the required Riot player identifiers and reuse a cached service per
  // region/gameName/tag key so repeated requests do not rebuild the client state.
  const riotMiddleware = async (c: any, next: () => Promise<void>) => {
    const region = c.req.query("region");
    const gameName = c.req.query("gameName");
    const tag = c.req.query("tag");

    if (!region) return c.json({ ok: false, error: "User Region is required" }, 400);

    if (!gameName) return c.json({ ok: false, error: "User Game Name is required" }, 400);

    if (!tag) return c.json({ ok: false, error: "User Tag is required" }, 400);

    if (!ALL_REGIONS.includes(region)) return c.json({ ok: false, error: "Invalid region" }, 400);

    const playerKey = `${region}:${gameName}:${tag}`;
    if (!riotServices.has(playerKey)) {
      riotServices.set(playerKey, createRiotService(tag, region, gameName));
    }
    riotService = riotServices.get(playerKey);

    await next();
  };

  // Allow only the configured origins while keeping the Riot routes read-only.
  const corsMiddleware = cors({
    origin: (origin) => {
      if (config.allowedOrigins.includes("*")) return "*";
      if (origin && config.allowedOrigins.includes(origin)) return origin;
      return null;
    },
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  });

  // Fail fast when the server is missing its Riot API key instead of letting the
  // downstream Riot service throw later in the request lifecycle.
  const apiKeyMiddleware = async (c: any, next: () => Promise<void>) => {
    if (!config.key) return c.json({ ok: false, error: "RIOT_API_KEY missing in .env" }, 500);
    await next();
  }

  app.use("/api/v2/riot/*", corsMiddleware);
  app.use("/api/v2/riot/*", riotMiddleware);
  app.use("/api/v2/riot/*", apiKeyMiddleware);

  app.get("/health", (c) => c.json({ ok: true, uptime: process.uptime() }));

  app.get("/api/v2/riot/rank", async (c) => {
    let rankData: unknown;

    try {
      rankData = await riotService!.getRank();
      return c.json({ ok: true, data: rankData });
    } catch (e) {
      if (e instanceof RiotApiError) {
        return c.json({ ok: false, error: e.message }, e.status as never);
      }
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        500,
      );
    }

  });

  app.get("/api/v2/riot/mastery", async (c) => {
    let masteryData: unknown;
    let query = c.req.query;
    let count = query("count");
    let total = query("total");
    let championName = query("championName");

    try {

      // championName has priority over count and total, but both are optional
      if (championName) {
      let champId = await riotService!.getChampionIdByName(championName);

        if (champId) {
          return c.json({ ok: false, error: "Champion name not found" }, 400);
        }

        masteryData = await riotService!.getMasteryByChampion(champId);
        return c.json({ ok: true, data: masteryData });
      }

      // total amount of points has priority over count, but both are optional
      if (total) {
        masteryData = await riotService!.getTotalMasteryPoints();
        return c.json({ ok: true, data: masteryData });

      }

      // count has low priority and count all is the default if no other query is provided
      if (count && !isNaN(parseInt(count))) return c.json({ ok: false, error: "Count must be a number" }, 400);

      if (count) {
        masteryData = await riotService!.getMastery(parseInt(count));
        return c.json({ ok: true, data: masteryData });
      } else {
        masteryData = await riotService!.getMastery(0);
        return c.json({ ok: true, data: masteryData });
      }
    } catch (e) {
      if (e instanceof RiotApiError) {
        return c.json({ ok: false, error: e.message }, e.status as never);
      }
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        500,
      );
    }

  });

  app.get("/api/v2/riot/live", async (c) => {
    let liveData: unknown;

    try {
      liveData = await riotService!.getLive();
      return c.json({ ok: true, data: liveData });
    } catch (e) {
      if (e instanceof RiotApiError) {
        return c.json({ ok: false, error: e.message }, e.status as never);
      }
      return c.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        500,
      );
    }

  });

  app.get("/api/v2/riot/recentKda", async (c) => {
    let lastKdaData: unknown;

    try {
      lastKdaData = await riotService!.getRecentKda();
      return c.json({ ok: true, data: lastKdaData });
    } catch (e) {
      if (e instanceof RiotApiError) {
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
