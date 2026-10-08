// Self-hosted League of Legends stats server.
// Exposes a single read-only endpoint (/api/riot) that fetches rank,
// mastery, live-game, and recent-match data for one Riot account.
// Bring your own RIOT_API_KEY — this process is the only thing that
// ever touches it; nothing is exposed to the client beyond /api/riot.

import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

// required: get a key at https://developer.riotgames.com
const key = process.env.RIOT_API_KEY;
// the Riot ID to track, e.g. RIOT_NAME=Faker and RIOT_TAG=KR1 (the "#KR1" part)
const name = (process.env.RIOT_NAME ?? '').trim();
const tag = (process.env.RIOT_TAG ?? '').trim().replace(/^#/, '');
// platform routing value for this account's region, e.g. euw1, na1, kr — see
// https://developer.riotgames.com/docs/lol#routing-values
const platform = (process.env.RIOT_REGION ?? 'euw1').toLowerCase();
const port = Number(process.env.PORT ?? 4322);

// restrict which site(s) may call /api/riot from the browser.
// accepts a single origin, '*' (any origin), or a comma-separated list
// for setups serving more than one frontend.
const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? '*').split(',').map((o) => o.trim());

// Riot's match/account endpoints live on a continent-level cluster rather
// than the per-platform region, so derive it from the configured platform.
const cluster =
  ['na1', 'br1', 'la1', 'la2', 'oc1'].includes(platform) ? 'americas'
  : ['kr', 'jp1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'].includes(platform) ? 'asia'
  : 'europe';

const headers = { 'X-Riot-Token': key ?? '' };
// rank/mastery barely change minute to minute, so cache them to stay well
// under Riot's rate limits. Live-game and recent-match data are never
// cached, since staleness would defeat the point of those endpoints.
const CACHE_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000; // abort if Riot's API hangs, instead of hanging the request forever
const MAX_RETRIES = 2; // retries on 429, honoring Riot's Retry-After header

interface CacheEntry<T> {
  at: number;
  data: T;
}

interface CacheStore {
  puuid?: CacheEntry<string>;
  rank?: CacheEntry<RankEntry[]>;
  mastery?: CacheEntry<MasteryEntry[]>;
}

const cache: CacheStore = {};

interface RiotAccount {
  puuid: string;
}

interface SpectatorParticipant {
  puuid: string;
  championId: number;
}

interface SpectatorGame {
  gameMode: string;
  gameStartTime: number;
  participants: SpectatorParticipant[];
}

interface MatchParticipant {
  puuid: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
}

interface Match {
  info: {
    gameMode: string;
    participants: MatchParticipant[];
  };
}

interface RankEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface MasteryEntry {
  championId: number;
  championLevel: number;
  championPoints: number;
}

class RiotApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'RiotApiError';
  }
}

async function riot<T>(url: string, attempt = 0): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') {
      throw new RiotApiError(504, 'Riot API request timed out');
    }
    throw e;
  }

  if (res.status === 429 && attempt < MAX_RETRIES) {
    // Riot's rate limit — respect Retry-After rather than hammering the API.
    const retryAfter = Number(res.headers.get('Retry-After') ?? '1');
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return riot<T>(url, attempt + 1);
  }

  if (!res.ok) throw new RiotApiError(res.status, String(res.status));
  return res.json() as Promise<T>;
}

async function getPuuid(): Promise<string> {
  if (cache.puuid && Date.now() - cache.puuid.at < CACHE_MS) return cache.puuid.data;
  const acc = await riot<RiotAccount>(
    `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
  );
  cache.puuid = { at: Date.now(), data: acc.puuid };
  return acc.puuid;
}

async function getRank(): Promise<RankEntry[]> {
  if (cache.rank && Date.now() - cache.rank.at < CACHE_MS) return cache.rank.data;
  const puuid = await getPuuid();
  const data = await riot<RankEntry[]>(`https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`);
  cache.rank = { at: Date.now(), data };
  return data;
}

async function getMastery(): Promise<MasteryEntry[]> {
  if (cache.mastery && Date.now() - cache.mastery.at < CACHE_MS) return cache.mastery.data;
  const puuid = await getPuuid();
  const data = await riot<MasteryEntry[]>(
    `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=4`,
  );
  cache.mastery = { at: Date.now(), data };
  return data;
}

async function getLive() {
  // never cached — the whole point is "right now"
  const puuid = await getPuuid();
  try {
    const game = await riot<SpectatorGame>(
      `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
    );
    const me = game.participants.find((p) => p.puuid === puuid);
    return { inGame: true, mode: game.gameMode, championId: me?.championId ?? null, startedAt: game.gameStartTime };
  } catch (e) {
    if (e instanceof Error && e.message === '404') return { inGame: false };
    throw e;
  }
}

async function getRecentKda() {
  const puuid = await getPuuid();
  const ids = await riot<string[]>(
    `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=1`,
  );
  if (!ids.length) return null;
  const match = await riot<Match>(`https://${cluster}.api.riotgames.com/lol/match/v5/matches/${ids[0]}`);
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

const app = new Hono();

app.use(
  '/api/riot',
  cors({
    origin: (origin) => {
      if (allowedOrigins.includes('*')) return '*';
      if (origin && allowedOrigins.includes(origin)) return origin;
      return null;
    },
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.get('/health', (c) => c.json({ ok: true, uptime: process.uptime() }));

// GET /api/riot?part=<rank|mastery|live|recent|all>
// part is optional; omitting it (or any unrecognized value) returns rank data.
app.get('/api/riot', async (c) => {
  const part = c.req.query('part');
  try {
    if (!key) throw new Error('RIOT_API_KEY missing in .env');
    if (!name || !tag) throw new Error('RIOT_NAME or RIOT_TAG missing in .env');

    let data: unknown;
    if (part === 'mastery') data = await getMastery();
    else if (part === 'live') data = await getLive();
    else if (part === 'recent') data = await getRecentKda();
    else if (part === 'all') {
      const [rank, mastery, live] = await Promise.all([getRank(), getMastery(), getLive()]);
      data = { rank, mastery, live };
    } else data = await getRank();

    return c.json({ ok: true, data });
  } catch (e) {
    if (e instanceof RiotApiError) {
      // bubble Riot's own status (404/429/504/etc.) instead of masking everything as 200
      return c.json({ ok: false, error: e.message }, e.status as never);
    }
    return c.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

app.notFound((c) => c.json({ ok: false, error: 'not found' }, 404));

// bind explicitly to 0.0.0.0 so the server is reachable over IPv4 and IPv6
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`riot-service listening on :${info.port}`);
});
