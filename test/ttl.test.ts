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

describe('TtlManager Anti-Stampede & Renewal', () => {
  it('calculates jittered expiry within allowed tolerance bounds', () => {
    const ttlMs = 10000;
    const jitterRatio = 0.2; // +/- 20%
    const now = Date.now();
    const expiry = TtlManager.calculateJitteredExpiry(ttlMs, jitterRatio);

    expect(expiry).toBeGreaterThanOrEqual(now + 8000);
    expect(expiry).toBeLessThanOrEqual(now + 12000);
  });

  it('renews expiry by specified extension duration', () => {
    const current = Date.now() + 2000;
    const renewed = TtlManager.renew(current, 5000);
    expect(renewed).toBe(current + 5000);
  });

  it('accurately detects if expiry is within a given window', () => {
    const soon = Date.now() + 1500;
    const far = Date.now() + 10000;

    expect(TtlManager.isExpiringWithin(soon, 2000)).toBe(true);
    expect(TtlManager.isExpiringWithin(far, 2000)).toBe(false);
    expect(TtlManager.isExpiringWithin(0, 2000)).toBe(false); // permanent
  });
});
