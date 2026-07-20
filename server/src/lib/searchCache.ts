// In-memory TTL cache for the calendar/everywhere fan-out endpoints. A
// single Node process (this app's deploy target is one Render Web Service,
// never horizontally scaled) makes this simpler than reaching for Redis,
// and it's purely a perf optimization — a cold cache just means one slow
// request, never a wrong one.
const store = new Map<string, { data: unknown; expiresAt: number }>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}
