// Tiny standalone service: only job is answering Riot API requests.
// Runs on its own port, kept alive by PM2, proxied by nginx at /api/riot.
// The homepage itself stays a 100% static build — this process is the
// only thing that ever touches RIOT_API_KEY.
import 'dotenv/config';
import http from 'node:http';

const key = process.env.RIOT_API_KEY;
const name = (process.env.RIOT_NAME ?? '').trim();
const tag = (process.env.RIOT_TAG ?? '').trim().replace(/^#/, '');
const platform = (process.env.RIOT_REGION ?? 'euw1').toLowerCase();
const port = process.env.PORT ?? 4322;

// only allow the homepage's own origin to call this, browser-side
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*';

const cluster =
  ['na1', 'br1', 'la1', 'la2', 'oc1'].includes(platform) ? 'americas'
  : ['kr', 'jp1', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'].includes(platform) ? 'asia'
  : 'europe';

const headers = { 'X-Riot-Token': key };
const CACHE_MS = 30 * 60 * 1000; // 30 min, for rank + mastery only
const cache = {};

async function riot(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

async function getPuuid() {
  if (cache.puuid && Date.now() - cache.puuid.at < CACHE_MS) return cache.puuid.data;
  const acc = await riot(
    `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
  );
  cache.puuid = { at: Date.now(), data: acc.puuid };
  return acc.puuid;
}

async function getRank() {
  if (cache.rank && Date.now() - cache.rank.at < CACHE_MS) return cache.rank.data;
  const puuid = await getPuuid();
  const data = await riot(`https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`);
  cache.rank = { at: Date.now(), data };
  return data;
}

async function getMastery() {
  if (cache.mastery && Date.now() - cache.mastery.at < CACHE_MS) return cache.mastery.data;
  const puuid = await getPuuid();
  const data = await riot(
    `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=4`,
  );
  cache.mastery = { at: Date.now(), data };
  return data;
}

async function getLive() {
  // never cached — the whole point is "right now"
  const puuid = await getPuuid();
  try {
    const game = await riot(`https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`);
    const me = game.participants.find((p) => p.puuid === puuid);
    return { inGame: true, mode: game.gameMode, championId: me?.championId ?? null, startedAt: game.gameStartTime };
  } catch (e) {
    if (e.message === '404') return { inGame: false };
    throw e;
  }
}

async function getRecentKda() {
  const puuid = await getPuuid();
  const ids = await riot(`https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=1`);
  if (!ids.length) return null;
  const match = await riot(`https://${cluster}.api.riotgames.com/lol/match/v5/matches/${ids[0]}`);
  const me = match.info.participants.find((p) => p.puuid === puuid);
  if (!me) return null;
  return { championId: me.championId, kills: me.kills, deaths: me.deaths, assists: me.assists, win: me.win, mode: match.info.gameMode };
}

const server = http.createServer(async (req, res) => {
  // CORS Header setzen
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight OPTIONS-Anfragen sofort bestätigen
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname !== '/api/riot') {
    res.writeHead(404);
    res.end(JSON.stringify({ ok: false, error: 'not found' }));
    return;
  }

  const part = url.searchParams.get('part');
  try {
    if (!key) throw new Error('RIOT_API_KEY missing in .env');
    if (!name || !tag) throw new Error('RIOT_NAME or RIOT_TAG missing in .env');

    let data;
    if (part === 'mastery') data = await getMastery();
    else if (part === 'live') data = await getLive();
    else if (part === 'recent') data = await getRecentKda();
    else if (part === 'all') {
      const [rank, mastery, live] = await Promise.all([getRank(), getMastery(), getLive()]);
      data = { rank, mastery, live };
    } else data = await getRank();

    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, data }));
  } catch (e) {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: false, error: e.message }));
  }
});

// Explizit an '0.0.0.0' binden für IPv4 & IPv6 Unterstuetzung
server.listen(port, '0.0.0.0', () => console.log(`riot-service listening on :${port}`));