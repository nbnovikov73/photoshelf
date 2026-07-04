interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

export function isRateLimited(
  key: string,
  options: {
    limit: number;
    windowMs: number;
  }
): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs
    });
    return false;
  }

  existing.count += 1;

  if (buckets.size > 1000) {
    for (const [bucketKey, entry] of buckets) {
      if (entry.resetAt <= now) {
        buckets.delete(bucketKey);
      }
    }
  }

  return existing.count > options.limit;
}
