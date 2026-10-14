// Shared TTL cache used by both Riot and DDragon data access.
// The default cache window is conservative for frequently changing Riot data,
// while individual callers can override it for slower-changing static data.

export const DEFAULT_CACHE_MS = 30 * 60 * 1000;

export interface CacheEntry<T> {
  at: number;
  data: T;
}

export class TtlCache<T> {
  private entry: CacheEntry<T> | undefined;

  constructor(private ttlMs: number = DEFAULT_CACHE_MS) {}

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
