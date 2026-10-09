import { describe, it, expect } from 'vitest';
import { TtlManager } from '../src/ttl';

describe('TtlManager', () => {
  it('identifies unexpired and expired timestamps', () => {
    const future = Date.now() + 10000;
    const past = Date.now() - 5000;

    expect(TtlManager.isExpired(future)).toBe(false);
    expect(TtlManager.isExpired(past)).toBe(true);
    expect(TtlManager.isExpired(0)).toBe(false);
  });

  it('calculates remaining lifespan in milliseconds', () => {
    const expiry = Date.now() + 500;
    const remaining = TtlManager.remainingMs(expiry);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(500);

    expect(TtlManager.remainingMs(0)).toBe(Infinity);
  });
});
