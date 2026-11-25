interface CacheEntry<T> {
  value: T;
  expires: number;
}

/** Process-local cache. Nothing is written to disk. */
export class MemoryCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): T | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    if (this.now() >= hit.expires) {
      this.entries.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T): void {
    if (this.ttlMs <= 0) return;
    this.entries.set(key, { value, expires: this.now() + this.ttlMs });
  }

  clear(): void {
    this.entries.clear();
  }
}
