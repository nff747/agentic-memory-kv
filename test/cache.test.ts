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
    const cache = new AgenticMemoryKV<string, number>();
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
    expect(cache.has('a')).toBe(true);
  });

  it('should return undefined for missing keys', () => {
    const cache = new AgenticMemoryKV();
    expect(cache.get('nonexistent')).toBeUndefined();
    expect(cache.has('nonexistent')).toBe(false);
  });

  it('should evict the least recently used item when max size is reached', () => {
    const cache = new AgenticMemoryKV<string, number>({ maxSize: 3 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    // a, b, c are in cache
    cache.get('a'); // a is now most recently used
    
    cache.set('d', 4); // should evict b, which is now the least recently used
    
    expect(cache.has('b')).toBe(false);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('c')).toBe(true);
    expect(cache.has('d')).toBe(true);
  });

  it('should expire items based on default TTL', () => {
    const cache = new AgenticMemoryKV<string, string>({ defaultTtl: 1000 });
    cache.set('a', 'value');
    
    expect(cache.get('a')).toBe('value');
    
    vi.advanceTimersByTime(1001);
    
    expect(cache.get('a')).toBeUndefined();
    expect(cache.has('a')).toBe(false);
  });

  it('should expire items based on overridden TTL', () => {
    const cache = new AgenticMemoryKV<string, string>({ defaultTtl: 5000 });
    cache.set('a', 'value', 1000); // Override TTL to 1s
    
    vi.advanceTimersByTime(1001);
    
    expect(cache.get('a')).toBeUndefined();
  });

  it('should not expire items if TTL is 0', () => {
    const cache = new AgenticMemoryKV<string, string>({ defaultTtl: 0 });
    cache.set('a', 'value');
    
    vi.advanceTimersByTime(1000000);
    
    expect(cache.get('a')).toBe('value');
  });

  it('should throw an error for invalid max size', () => {
    expect(() => new AgenticMemoryKV({ maxSize: 0 })).toThrow('maxSize must be greater than 0');
  });
  
  it('should clear all items', () => {
    const cache = new AgenticMemoryKV<string, number>();
    cache.set('a', 1);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has('a')).toBe(false);
  });

  it('should delete a specific item', () => {
    const cache = new AgenticMemoryKV<string, number>();
    cache.set('a', 1);
    expect(cache.delete('a')).toBe(true);
    expect(cache.has('a')).toBe(false);
    expect(cache.delete('a')).toBe(false);
  });
});
