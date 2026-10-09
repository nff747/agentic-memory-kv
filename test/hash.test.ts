import { describe, it, expect } from 'vitest';
import { KeyHasher } from '../src/hash';

describe('KeyHasher', () => {
  it('generates consistent 64-bit hashes for identical strings', () => {
    const h1 = KeyHasher.hash('agent_memory:user_123');
    const h2 = KeyHasher.hash('agent_memory:user_123');
    expect(h1).toBe(h2);
  });

  it('preserves raw BigInt values directly', () => {
    expect(KeyHasher.hash(42n)).toBe(42n);
    expect(KeyHasher.hash(999999999999n)).toBe(999999999999n);
  });

  it('hashes Uint8Array payloads consistently', () => {
    const buf = new Uint8Array([1, 2, 3, 4, 5]);
    const h = KeyHasher.hash(buf);
    expect(typeof h).toBe('bigint');
    expect(h).not.toBe(0n);
  });

  it('maps hashes to valid slot indices within capacity', () => {
    const capacity = 1024;
    for (let i = 0; i < 100; i++) {
      const h = KeyHasher.hash(`key_${i}`);
      const slot = KeyHasher.slotIndex(h, capacity);
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(capacity);
    }
  });
});
