// Route-level tests: param validation, status codes, part= switching,
// and Riot error propagation through the HTTP layer. Riot's API is mocked
// at the global fetch level — no real network calls.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE_ENV = {
  RIOT_API_KEY: "test-api-key",
  ALLOWED_ORIGIN: "*",
  PORT: "4322",
};

async function loadApp(envOverrides: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [k, v] of Object.entries(BASE_ENV)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  for (const [k, v] of Object.entries(envOverrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const { createApp } = await import("../src/app.js");
  return createApp().app;
}

const PUUID = "test-puuid-123";

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

describe("GET /health", () => {
  it("returns ok: true with an uptime number", async () => {
    const app = await loadApp();
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.uptime).toBe("number");
  });
});

describe("GET /api/v2/riot/* — param validation", () => {
  it("400s when region is missing", async () => {
    const app = await loadApp();
    const res = await app.request("/api/v2/riot/rank?gameName=Faker&tag=KR1");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/region/i);
  });

  it("400s when gameName is missing", async () => {
    const app = await loadApp();
    const res = await app.request("/api/v2/riot/rank?region=kr&tag=KR1");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/game name/i);
  });

  it("400s when tag is missing", async () => {
    const app = await loadApp();
    const res = await app.request("/api/v2/riot/rank?region=kr&gameName=Faker");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/tag/i);
  });

  it("400s when all three are missing", async () => {
    const app = await loadApp();
    const res = await app.request("/api/v2/riot/rank");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v2/riot/* — missing server config", () => {
  it("500s with a clear message when RIOT_API_KEY is unset", async () => {
    const app = await loadApp({ RIOT_API_KEY: undefined });
    const res = await app.request("/api/v2/riot/rank?region=kr&gameName=Faker&tag=KR1");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/RIOT_API_KEY/);
  });
});

describe("GET /api/v2/riot/rank — happy path (fetch mocked)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns rank data", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ puuid: PUUID })) // account lookup
      .mockResolvedValueOnce(
        jsonResponse([
          {
            queueType: "RANKED_SOLO_5x5",
            tier: "CHALLENGER",
            rank: "I",
            leaguePoints: 1337,
            wins: 500,
            losses: 300,
          },
        ]),
      );

    const app = await loadApp();
    const res = await app.request("/api/v2/riot/rank?region=kr&gameName=Faker&tag=KR1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data[0].tier).toBe("CHALLENGER");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("GET /api/v2/riot/mastery — happy path (fetch mocked)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns top champion mastery", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ puuid: PUUID }))
      .mockResolvedValueOnce(jsonResponse([{ championId: 7, championLevel: 7, championPoints: 999999 }]));

    const app = await loadApp();
    const res = await app.request("/api/v2/riot/mastery?region=kr&gameName=Faker&tag=KR1");
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data[0].championId).toBe(7);
  });
});

describe("GET /api/v2/riot/live — happy path (fetch mocked)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns inGame: true with champion info when a game is active", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ puuid: PUUID })).mockResolvedValueOnce(
      jsonResponse({
        gameMode: "CLASSIC",
        gameStartTime: 1234567890,
        participants: [{ puuid: PUUID, championId: 99 }],
      }),
    );

    const app = await loadApp();
    const res = await app.request("/api/v2/riot/live?region=kr&gameName=Faker&tag=KR1");
    const body = await res.json();
    expect(body.data).toEqual({
      inGame: true,
      mode: "CLASSIC",
      championId: 99,
      startedAt: 1234567890,
    });
  });

  it("returns inGame: false on a 404 from spectator-v5", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ puuid: PUUID }))
      .mockResolvedValueOnce(jsonResponse({ status: { message: "Not Found" } }, 404));

    const app = await loadApp();
    const res = await app.request("/api/v2/riot/live?region=kr&gameName=Faker&tag=KR1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ inGame: false });
  });
});

describe("GET /api/v2/riot/recentKda — happy path (fetch mocked)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns kda from the latest match", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ puuid: PUUID }))
      .mockResolvedValueOnce(jsonResponse(["MATCH_1"]))
      .mockResolvedValueOnce(
        jsonResponse({
          info: {
            gameMode: "CLASSIC",
            participants: [
              { puuid: PUUID, championId: 1, kills: 10, deaths: 2, assists: 5, win: true },
              { puuid: "someone-else", championId: 2, kills: 1, deaths: 1, assists: 1, win: false },
            ],
          },
        }),
      );

    const app = await loadApp();
    const res = await app.request("/api/v2/riot/recentKda?region=kr&gameName=Faker&tag=KR1");
    const body = await res.json();
    expect(body.data).toMatchObject({ championId: 1, kills: 10, deaths: 2, assists: 5, win: true });
  });

  it("returns null when match history is empty", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ puuid: PUUID })).mockResolvedValueOnce(jsonResponse([]));

    const app = await loadApp();
    const res = await app.request("/api/v2/riot/recentKda?region=kr&gameName=Faker&tag=KR1");
    const body = await res.json();
    expect(body.data).toBeNull();
  });
});

describe("GET /api/v2/riot/* — Riot API error propagation", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("bubbles a 404 from the account lookup (bad Riot ID) as a 404", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: { message: "Not Found" } }, 404));

    const app = await loadApp();
    const res = await app.request("/api/v2/riot/rank?region=kr&gameName=NoSuchSummoner&tag=XX1");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("returns 504 when the Riot API request times out", async () => {
    fetchMock.mockImplementationOnce(() => {
      const err = new Error("The operation was aborted");
      err.name = "TimeoutError";
      return Promise.reject(err);
    });

    const app = await loadApp();
    const res = await app.request("/api/v2/riot/rank?region=kr&gameName=Faker&tag=KR1");
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.error).toMatch(/timed out/i);
  });

  it("caches rank data across requests (fetch not re-invoked on second call)", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ puuid: PUUID }))
      .mockResolvedValueOnce(
        jsonResponse([{ queueType: "RANKED_SOLO_5x5", tier: "DIAMOND", rank: "I", leaguePoints: 0, wins: 1, losses: 0 }]),
      );

    const app = await loadApp();
    const res1 = await app.request("/api/v2/riot/rank?region=kr&gameName=Faker&tag=KR1");
    expect((await res1.json()).data[0].tier).toBe("DIAMOND");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const res2 = await app.request("/api/v2/riot/rank?region=kr&gameName=Faker&tag=KR1");
    expect((await res2.json()).data[0].tier).toBe("DIAMOND");
    expect(fetchMock).toHaveBeenCalledTimes(2); // cache hit, no new fetch calls
  });

  it("never caches live-game data (fetch invoked again on second call)", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ puuid: PUUID }))
      .mockResolvedValueOnce(jsonResponse({ status: {} }, 404))
      .mockResolvedValueOnce(jsonResponse({ status: {} }, 404)); // puuid cached, live re-fetched

    const app = await loadApp();
    await app.request("/api/v2/riot/live?region=kr&gameName=Faker&tag=KR1");
    await app.request("/api/v2/riot/live?region=kr&gameName=Faker&tag=KR1");
    // 1 puuid fetch (cached after) + 2 live fetches = 3 total
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("Unknown routes", () => {
  it("404s with ok: false", async () => {
    const app = await loadApp();
    const res = await app.request("/nope");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
