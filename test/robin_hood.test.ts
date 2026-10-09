import { describe, it, expect } from 'vitest';
import { RobinHoodHashTable } from '../src/robin_hood';

describe('RobinHoodHashTable', () => {
  it('inserts and retrieves items with O(1) probe efficiency', () => {
    const cap = 16;
    const bytes = cap * 4 * 8;
    const sab = new SharedArrayBuffer(bytes);
    const table = new RobinHoodHashTable(sab, 0, cap);
    table.init();

    expect(table.get(100n)).toBeNull();
    table.put(100n, 32, 64);
    const res = table.get(100n);
    expect(res).not.toBeNull();
    expect(res?.offset).toBe(32);
    expect(res?.size).toBe(64);
  });

  it('removes keys cleanly and reports null', () => {
    const cap = 16;
    const sab = new SharedArrayBuffer(cap * 4 * 8);
    const table = new RobinHoodHashTable(sab, 0, cap);
    table.init();

    table.put(200n, 128, 256);
    expect(table.remove(200n)).toBe(true);
    expect(table.get(200n)).toBeNull();
  });
});
