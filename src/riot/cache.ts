// Small TTL cache for data that changes infrequently (rank, mastery, and PUUID
// lookups). This keeps requests under Riot's rate limits without caching live
// match state, which would become stale immediately.

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
