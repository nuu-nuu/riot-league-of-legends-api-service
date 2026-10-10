// Unit tests for the low-level riot() fetch wrapper in isolation:
// retry-on-429 with Retry-After backoff, giving up after MAX_RETRIES,
// timeout handling, and auth header behavior.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { riot, RiotApiError } from "../src/riot/client.js";

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

describe("riot() client", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("sends the X-Riot-Token header with the given key", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await riot("https://kr.api.riotgames.com/some/path", "my-key");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://kr.api.riotgames.com/some/path",
      expect.objectContaining({ headers: { "X-Riot-Token": "my-key" } }),
    );
  });

  it("sends an empty token when key is undefined, rather than throwing", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await riot("https://kr.api.riotgames.com/some/path", undefined);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { "X-Riot-Token": "" } }),
    );
  });

  it("returns parsed JSON on success", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ hello: "world" }));
    const result = await riot<{ hello: string }>("https://kr.api.riotgames.com/x", "key");
    expect(result).toEqual({ hello: "world" });
  });

  it("throws RiotApiError with the status code on a non-ok response", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: { message: "Forbidden" } }, 403));
    await expect(riot("https://kr.api.riotgames.com/x", "bad-key")).rejects.toMatchObject({
      name: "RiotApiError",
      status: 403,
    });
  });

  it("retries on 429, waiting the Retry-After duration, then succeeds", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 429, { "Retry-After": "2" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const resultPromise = riot("https://kr.api.riotgames.com/x", "key");
    await vi.advanceTimersByTimeAsync(2100);
    const result = await resultPromise;

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("defaults the retry wait to 1s when Retry-After is absent", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 429)).mockResolvedValueOnce(jsonResponse({ ok: true }));

    const resultPromise = riot("https://kr.api.riotgames.com/x", "key");
    await vi.advanceTimersByTimeAsync(1100);
    const result = await resultPromise;

    expect(result).toEqual({ ok: true });
  });

  it("gives up after MAX_RETRIES (2) and throws a 429 RiotApiError", async () => {
    vi.useFakeTimers();
    // always 429 — attempt 0, 1, 2 (MAX_RETRIES=2 means 2 retries after the
    // first attempt, so 3 calls total before giving up)
    fetchMock.mockResolvedValue(jsonResponse({}, 429, { "Retry-After": "1" }));

    const resultPromise = riot("https://kr.api.riotgames.com/x", "key").catch((e) => e);
    await vi.advanceTimersByTimeAsync(5000);
    const result = await resultPromise;

    expect(result).toBeInstanceOf(RiotApiError);
    expect((result as RiotApiError).status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("maps a fetch timeout (AbortSignal.timeout firing) to a 504 RiotApiError", async () => {
    fetchMock.mockImplementationOnce(() => {
      const err = new Error("The operation was aborted due to timeout");
      err.name = "TimeoutError";
      return Promise.reject(err);
    });

    await expect(riot("https://kr.api.riotgames.com/x", "key")).rejects.toMatchObject({
      name: "RiotApiError",
      status: 504,
    });
  });

  it("rethrows non-timeout network errors unchanged", async () => {
    const networkError = new Error("getaddrinfo ENOTFOUND");
    fetchMock.mockImplementationOnce(() => Promise.reject(networkError));

    await expect(riot("https://kr.api.riotgames.com/x", "key")).rejects.toBe(networkError);
  });
});
