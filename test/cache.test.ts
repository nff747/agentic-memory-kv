import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgenticMemoryKV } from '../src/cache.js';

describe('AgenticMemoryKV', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve values', () => {
    const cache = new AgenticMemoryKV();
    cache.set(1n, 100n);
    expect(cache.get(1n)).toBe(100n);
    expect(cache.has(1n)).toBe(true);
  });

  it('should return undefined for missing keys', () => {
    const cache = new AgenticMemoryKV();
    expect(cache.get(999n)).toBeUndefined();
    expect(cache.has(999n)).toBe(false);
  });

  it('should evict the least recently used item when max size is reached', () => {
    const cache = new AgenticMemoryKV({ maxSize: 3 });
    cache.set(1n, 100n);
    cache.set(2n, 200n);
    cache.set(3n, 300n);
    
    // 1, 2, 3 are in cache
    cache.get(1n); // 1 is now most recently used
    
    cache.set(4n, 400n); // should evict 2, which is now the least recently used
    
    expect(cache.has(2n)).toBe(false);
    expect(cache.has(1n)).toBe(true);
    expect(cache.has(3n)).toBe(true);
    expect(cache.has(4n)).toBe(true);
  });

  it('should expire items based on default TTL', () => {
    const cache = new AgenticMemoryKV({ defaultTtl: 1000 });
    cache.set(1n, 100n);
    
    expect(cache.get(1n)).toBe(100n);
    
    vi.advanceTimersByTime(1001);
    
    expect(cache.get(1n)).toBeUndefined();
    expect(cache.has(1n)).toBe(false);
  });

  it('should expire items based on overridden TTL', () => {
    const cache = new AgenticMemoryKV({ defaultTtl: 5000 });
    cache.set(1n, 100n, 1000); // Override TTL to 1s
    
    vi.advanceTimersByTime(1001);
    
    expect(cache.get(1n)).toBeUndefined();
  });

  it('should not expire items if TTL is 0', () => {
    const cache = new AgenticMemoryKV({ defaultTtl: 0 });
    cache.set(1n, 100n);
    
    vi.advanceTimersByTime(1000000);
    
    expect(cache.get(1n)).toBe(100n);
  });

  it('should throw an error for invalid max size', () => {
    expect(() => new AgenticMemoryKV({ maxSize: 0 })).toThrow('maxSize must be greater than 0');
  });
  
  it('should clear all items', () => {
    const cache = new AgenticMemoryKV();
    cache.set(1n, 100n);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has(1n)).toBe(false);
  });

  it('should delete a specific item', () => {
    const cache = new AgenticMemoryKV();
    cache.set(1n, 100n);
    expect(cache.delete(1n)).toBe(true);
    expect(cache.has(1n)).toBe(false);
    expect(cache.delete(1n)).toBe(false);
  });
});
