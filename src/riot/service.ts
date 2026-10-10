// Domain-level Riot operations: looks up an account's puuid, then rank,
// mastery, live-game status, and recent match KDA for it.
//
// Exposed as a factory (createRiotService) rather than top-level functions
// so tests can construct an isolated instance with its own config and cache
// state instead of sharing module-level singletons across test cases.

import { clusterFor, loadConfig, type AppConfig } from "../config.js";
import { riot, RiotApiError } from "./client.js";
import { TtlCache } from "./cache.js";
import type {
  RiotAccount,
  RankEntry,
  MasteryEntry,
  SpectatorGame,
  Match,
  LiveGameStatus,
  RecentMatchSummary,
} from "../types.js";

export function createRiotService(tag: string, region: string, gameName: string) {
  const cluster = clusterFor(region);
  const CONFIG = loadConfig();
  const RIOT_KEY = CONFIG.key;

  const puuidCache = new TtlCache<string>();
  const rankCache = new TtlCache<RankEntry[]>();
  const masteryCache = new TtlCache<MasteryEntry[]>();

  async function getPuuid(): Promise<string> {
    const cached = puuidCache.get();
    if (cached) return cached;
    const acc = await riot<RiotAccount>(
      `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tag)}`,
      RIOT_KEY,
    );
    puuidCache.set(acc.puuid);
    return acc.puuid;
  }

  async function getRank(): Promise<RankEntry[]> {
    const cached = rankCache.get();
    if (cached) return cached;
    const puuid = await getPuuid();
    const data = await riot<RankEntry[]>(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
      RIOT_KEY,
    );
    rankCache.set(data);
    return data;
  }

  async function getMastery(): Promise<MasteryEntry[]> {
    const cached = masteryCache.get();
    if (cached) return cached;
    const puuid = await getPuuid();
    const data = await riot<MasteryEntry[]>(
      `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=4`,
      RIOT_KEY,
    );
    masteryCache.set(data);
    return data;
  }

  async function getLive(): Promise<LiveGameStatus> {
    // never cached — the whole point is "right now"
    const puuid = await getPuuid();
    try {
      const game = await riot<SpectatorGame>(
        `https://${cluster}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
        RIOT_KEY,
      );
      const me = game.participants.find((p) => p.puuid === puuid);
      return {
        inGame: true,
        mode: game.gameMode,
        championId: me?.championId ?? null,
        startedAt: game.gameStartTime,
      };
    } catch (e) {
      if (e instanceof RiotApiError && e.status === 404) return { inGame: false };
      throw e;
    }
  }

  async function getRecentKda(): Promise<RecentMatchSummary | null> {
    const puuid = await getPuuid();
    const ids = await riot<string[]>(
      `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=1`,
      RIOT_KEY,
    );
    if (!ids.length) return null;
    const match = await riot<Match>(
      `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${ids[0]}`,
      RIOT_KEY,
    );
    const me = match.info.participants.find((p) => p.puuid === puuid);
    if (!me) return null;
    return {
      championId: me.championId,
      kills: me.kills,
      deaths: me.deaths,
      assists: me.assists,
      win: me.win,
      mode: match.info.gameMode,
    };
  }

  return { getPuuid, getRank, getMastery, getLive, getRecentKda };
}

export type RiotService = ReturnType<typeof createRiotService>;
