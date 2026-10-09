import { describe, it, expect } from 'vitest';
import { BufferCompression } from '../src/compression';

describe('BufferCompression', () => {
  it('losslessly delta-encodes and decodes sequential integers', () => {
    const original = [1000, 1004, 1012, 1015, 1020];
    const deltas = BufferCompression.deltaEncode(original);
    expect(deltas).toEqual([1000, 4, 8, 3, 5]);

    const decoded = BufferCompression.deltaDecode(deltas);
    expect(decoded).toEqual(original);
  });
});
