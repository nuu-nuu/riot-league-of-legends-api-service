// Domain-level Riot operations: looks up an account's puuid, then rank,
// mastery, live-game status, and recent match KDA for it.
//
// Exposed as a factory (createRiotService) rather than top-level functions
// so tests can construct an isolated instance with its own config and cache
// state instead of sharing module-level singletons across test cases.

import { clusterFor, loadConfig, type AppConfig } from "../config.js";
import { TtlCache } from "../cache.js";
import { ddragon, DdragonApiError } from "./client.js";
import type {
  LeagueOfLegendsVersion,
} from "../types.js";

export function createDdragonService(tag: string, region: string, gameName: string) {
  const cluster = clusterFor(region);
  const CONFIG = loadConfig();
  const RIOT_KEY = CONFIG.key;

  const versionCache = new TtlCache<string>();

  async function getCurrentGameVersion(): Promise<string> {
    const cached = versionCache.get();
    if (cached) return cached;
    const versions : any = await ddragon<LeagueOfLegendsVersion>(
      `https://ddragon.leagueoflegends.com/api/versions.json`
    );

    console.log(versions);

    const curr = versions[0][0];

    console.log(curr);

    versionCache.set(curr);
    return curr;
  }

  /* async function getRank(): Promise<RankEntry[]> {
    const cached = rankCache.get();
    if (cached) return cached;
    const puuid = await getPuuid();
    const data = await ddragon<RankEntry[]>(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
      RIOT_KEY,
    );
    rankCache.set(data);
    return data;
  } */

 

  return { getCurrentGameVersion };
}

export type RiotService = ReturnType<typeof createDdragonService>;
