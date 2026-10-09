export interface HttpCacheAdapter {
  get: (key: string) => any;
  set: (key: string, value: any, ttlMs?: number) => void;
}

export class HttpCacheMiddleware {
  public static create(cache: HttpCacheAdapter, defaultTtlMs: number = 60000) {
    return (reqPath: string, computeFn: () => any): { body: any; cached: boolean } => {
      const cached = cache.get(reqPath);
      if (cached !== undefined && cached !== null) {
        return { body: cached, cached: true };
      }
      const fresh = computeFn();
      cache.set(reqPath, fresh, defaultTtlMs);
      return { body: fresh, cached: false };
    };
  }
}
