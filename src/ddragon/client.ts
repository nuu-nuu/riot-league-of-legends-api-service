// Low-level HTTP wrapper for DDragon's static API: adds a hard timeout and
// automatic retry-backoff on 429s, without needing Riot auth headers.

const FETCH_TIMEOUT_MS = 8000; // abort if DDragon hangs instead of waiting forever
const MAX_RETRIES = 2; // retries on 429, honoring DDragon's Retry-After header

export class DdragonApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "DdragonApiError";
  }
}

export async function ddragon<T>(
  url: string,
  attempt = 0,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new DdragonApiError(504, "DDragon request timed out");
    }
    throw e;
  }

  if (res.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? "1");
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return ddragon<T>(url, attempt + 1);
  }

  if (!res.ok) throw new DdragonApiError(res.status, String(res.status));
  return res.json() as Promise<T>;
}
