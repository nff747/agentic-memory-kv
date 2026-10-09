import { describe, it, expect } from 'vitest';
import { SlabArena } from '../src/slab';

describe('SlabArena', () => {
  it('allocates and retrieves binary slices cleanly', () => {
    const sab = new SharedArrayBuffer(1024);
    const arena = new SlabArena(sab, 0, 1024);

    const payload = new Uint8Array([10, 20, 30, 40]);
    const alloc = arena.allocate(payload);
    expect(alloc).not.toBeNull();
    expect(alloc?.offset).toBe(0);
    expect(alloc?.size).toBe(4);

    const read = arena.read(alloc!.offset, alloc!.size);
    expect(Array.from(read)).toEqual([10, 20, 30, 40]);
  });

  it('tracks allocation statistics accurately', () => {
    const sab = new SharedArrayBuffer(100);
    const arena = new SlabArena(sab, 0, 100);

    arena.allocate(new Uint8Array(20));
    arena.allocate(new Uint8Array(30));

    const stats = arena.getStats();
    expect(stats.usedBytes).toBe(50);
    expect(stats.freeBytes).toBe(50);
    expect(stats.allocations).toBe(2);
  });
});
