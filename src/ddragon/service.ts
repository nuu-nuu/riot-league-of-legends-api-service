// Domain-level Riot operations: looks up an account's puuid, then rank,
// mastery, live-game status, and recent match KDA for it.
//
// Exposed as a factory (createRiotService) rather than top-level functions
// so tests can construct an isolated instance with its own config and cache
// state instead of sharing module-level singletons across test cases.

import { TtlCache } from "../cache.js";
import { ddragon } from "./client.js";
import type {
  LeagueOfLegendsVersion, Champion
} from "../types.js";

export function createDdragonService() {

  const versionCache = new TtlCache<LeagueOfLegendsVersion>();
  const championCache = new TtlCache<Champion[]>();

  async function getCurrentGameVersion(): Promise<LeagueOfLegendsVersion> {
    const cached = versionCache.get();
    if (cached) return cached;
    const versions : LeagueOfLegendsVersion[] = await ddragon<LeagueOfLegendsVersion[]>(
      `https://ddragon.leagueoflegends.com/api/versions.json`
    );

    console.log(versions);

    const curr : LeagueOfLegendsVersion = versions[0];

    console.log(curr);

    versionCache.set(curr);
    return curr;
  }

  async function getChampionData(): Promise<Champion[]> {
    const version : LeagueOfLegendsVersion = await getCurrentGameVersion();
    const cached = championCache.get();
    if (cached) return cached;

    const data : Champion[] = await ddragon<Champion[]>(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
    );

    console.log(data);

    championCache.set(data);
    return data;
  }

  return { getCurrentGameVersion, getChampionData };
}

export type DdragonService = ReturnType<typeof createDdragonService>;
