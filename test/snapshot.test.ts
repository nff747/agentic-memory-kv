import { describe, it, expect } from 'vitest';
import { MemorySnapshot } from '../src/snapshot';

describe('MemorySnapshot', () => {
  it('serializes entries to binary buffer and restores faithfully', () => {
    const entries: [string, any][] = [
      ['mem_1', { role: 'assistant', text: 'Hello' }],
      ['mem_2', { role: 'user', text: 'Hi' }]
    ];

    const bytes = MemorySnapshot.create(entries);
    expect(bytes.length).toBeGreaterThan(0);

    const restored = MemorySnapshot.restore(bytes);
    expect(restored).toEqual(entries);
  });
});
