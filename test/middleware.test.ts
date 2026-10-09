import { describe, it, expect, vi } from 'vitest';
import { HttpCacheMiddleware } from '../src/middleware';

describe('HttpCacheMiddleware', () => {
  it('serves cached payload on repeat requests without recomputing', () => {
    const store = new Map<string, any>();
    const adapter = {
      get: (k: string) => store.get(k),
      set: (k: string, v: any) => store.set(k, v)
    };

    const middleware = HttpCacheMiddleware.create(adapter, 5000);
    const compute = vi.fn(() => ({ data: 'hello' }));

    const res1 = middleware('/api/user/1', compute);
    expect(res1.cached).toBe(false);
    expect(res1.body).toEqual({ data: 'hello' });
    expect(compute).toHaveBeenCalledTimes(1);

    const res2 = middleware('/api/user/1', compute);
    expect(res2.cached).toBe(true);
    expect(res2.body).toEqual({ data: 'hello' });
    expect(compute).toHaveBeenCalledTimes(1); // Not called again!
  });
});
