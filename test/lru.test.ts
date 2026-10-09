import { describe, it, expect } from 'vitest';
import { LruListManager } from '../src/lru';

describe('LruListManager', () => {
  it('moves touched nodes to the head of the eviction list', () => {
    const lru = new LruListManager(5);
    lru.touch(0);
    lru.touch(1);
    lru.touch(2);

    expect(lru.getHead()).toBe(2);
    expect(lru.getTail()).toBe(0);

    // Touching 0 makes it most recently used (head)
    lru.touch(0);
    expect(lru.getHead()).toBe(0);
    expect(lru.getTail()).toBe(1);
  });

  it('evicts least recently used node from tail', () => {
    const lru = new LruListManager(50);
    lru.touch(10);
    lru.touch(20);

    expect(lru.popTail()).toBe(10);
    expect(lru.popTail()).toBe(20);
    expect(lru.popTail()).toBe(-1);
  });
});
