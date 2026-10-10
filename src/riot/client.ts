// Low-level HTTP wrapper for Riot's API: adds the auth header, a hard
// timeout, and automatic retry-with-backoff on 429 responses.

const FETCH_TIMEOUT_MS = 8000; // abort if Riot's API hangs, instead of hanging the request forever
const MAX_RETRIES = 2; // retries on 429, honoring Riot's Retry-After header

export class RiotApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

export async function riot<T>(
  url: string,
  apiKey: string | undefined,
  attempt = 0,
): Promise<T> {
  const headers = { "X-Riot-Token": apiKey ?? "" };

  let res: Response;
  try {
    res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new RiotApiError(504, "Riot API request timed out");
    }
    throw e;
  }

  if (res.status === 429 && attempt < MAX_RETRIES) {
    // Riot's rate limit — respect Retry-After rather than hammering the API.
    const retryAfter = Number(res.headers.get("Retry-After") ?? "1");
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return riot<T>(url, apiKey, attempt + 1);
  }

  if (!res.ok) throw new RiotApiError(res.status, String(res.status));
  return res.json() as Promise<T>;
}
