import { describe, it, expect } from 'vitest';
import { AgenticMemoryKV } from '../src/cache';

describe('AgenticMemoryKV V2 Upgrade', () => {
  it('handles high volume key set and get operations without spin-burn', () => {
    const kv = new AgenticMemoryKV({ maxSize: 100 });
    for (let i = 0n; i < 50n; i++) {
      kv.set(i, i * 10n);
    }
    for (let i = 0n; i < 50n; i++) {
      expect(kv.get(i)).toBe(i * 10n);
    }
  });

  it('evicts correctly at capacity under fast index', () => {
    const kv = new AgenticMemoryKV({ maxSize: 3 });
    kv.set(1n, 10n);
    kv.set(2n, 20n);
    kv.set(3n, 30n);
    kv.set(4n, 40n); // Evicts 1n

    expect(kv.get(1n)).toBeUndefined();
    expect(kv.get(4n)).toBe(40n);
  });
});
