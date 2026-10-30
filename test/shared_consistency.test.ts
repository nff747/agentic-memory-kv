import { describe, expect, it } from 'vitest';
import { AgenticMemoryKV } from '../src/cache';

describe('shared buffer consistency', () => {
  it('observes inserts, deletes and evictions from another instance', () => {
    const first = new AgenticMemoryKV({ maxSize:2 });
    const second = new AgenticMemoryKV({ maxSize:2, buffer:first.buffer });
    first.set(1n, 10n);
    expect(second.get(1n)).toBe(10n);
    second.set(2n, 20n);
    expect(first.get(2n)).toBe(20n);
    first.delete(1n);
    expect(second.get(1n)).toBeUndefined();
    second.set(3n, 30n);
    first.set(4n, 40n);
    expect(second.get(2n)).toBeUndefined();
    expect(second.get(4n)).toBe(40n);
    expect(first.size).toBe(2);
  });
  it('rejects sentinel keys and values that would silently wrap', () => {
    const cache = new AgenticMemoryKV({maxSize:2});
    expect(() => cache.set(-1n, 0n)).toThrow();
    expect(() => cache.get(-1n)).toThrow();
    expect(() => cache.set(2n ** 63n, 0n)).toThrow();
    expect(() => cache.set(1n, 2n ** 63n)).toThrow();
    expect(() => cache.mset([[1n, 1n], [-1n, 2n]])).toThrow();
    expect(cache.size).toBe(0);
  });
  it('rejects attaching a buffer using the wrong capacity', () => {
    const first = new AgenticMemoryKV({maxSize: 2});
    expect(() => new AgenticMemoryKV({maxSize:1, buffer:first.buffer})).toThrow('buffer size');
  });
});
