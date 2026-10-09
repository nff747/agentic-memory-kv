import { describe, it, expect } from 'vitest';
import { BloomFilter } from '../src/bloom';

describe('BloomFilter', () => {
  it('returns true for added keys and false for missing keys', () => {
    const filter = new BloomFilter(64);
    filter.add('key_exists_1');
    filter.add('key_exists_2');

    expect(filter.mayContain('key_exists_1')).toBe(true);
    expect(filter.mayContain('key_exists_2')).toBe(true);
    expect(filter.mayContain('non_existent_key_xyz')).toBe(false);
  });
});
