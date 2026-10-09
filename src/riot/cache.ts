// Simple TTL cache for data that barely changes minute to minute (rank,
// mastery, account puuid lookups), so we stay well under Riot's rate limits.
// Live-game and recent-match data are intentionally never cached — staleness
// would defeat the point of those endpoints.

export const CACHE_MS = 30 * 60 * 1000;

export interface CacheEntry<T> {
  at: number;
  data: T;
}

export class TtlCache<T> {
  private entry: CacheEntry<T> | undefined;

  constructor(private ttlMs: number = CACHE_MS) {}

  get(): T | undefined {
    if (this.entry && Date.now() - this.entry.at < this.ttlMs) {
      return this.entry.data;
    }
    return undefined;
  }

  set(data: T): void {
    this.entry = { at: Date.now(), data };
  }

  clear(): void {
    this.entry = undefined;
  }
}
