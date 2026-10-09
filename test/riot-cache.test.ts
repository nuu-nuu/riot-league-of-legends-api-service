// Unit tests for the TtlCache used to cache rank/mastery/puuid lookups.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TtlCache } from "../src/riot/cache.js";

describe("TtlCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns undefined when nothing has been set", () => {
    const cache = new TtlCache<string>(1000);
    expect(cache.get()).toBeUndefined();
  });

  it("returns the set value before the TTL expires", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("hello");
    vi.advanceTimersByTime(500);
    expect(cache.get()).toBe("hello");
  });

  it("returns undefined once the TTL has elapsed", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("hello");
    vi.advanceTimersByTime(1001);
    expect(cache.get()).toBeUndefined();
  });

  it("clear() immediately invalidates a cached value", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("hello");
    cache.clear();
    expect(cache.get()).toBeUndefined();
  });

  it("set() overwrites a previous value and resets its TTL window", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("first");
    vi.advanceTimersByTime(900);
    cache.set("second");
    vi.advanceTimersByTime(900); // 1800ms since first set, but only 900ms since second
    expect(cache.get()).toBe("second");
  });

  it("defaults to the 30-minute CACHE_MS when no ttl is given", () => {
    const cache = new TtlCache<string>();
    cache.set("hello");
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(cache.get()).toBe("hello");
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(cache.get()).toBeUndefined();
  });
});
