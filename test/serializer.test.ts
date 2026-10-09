import { describe, it, expect } from 'vitest';
import { PayloadSerializer } from '../src/serializer';

describe('PayloadSerializer', () => {
  it('serializes and restores arbitrary JSON objects', () => {
    const input = { agent: 'react-loop', steps: [1, 2, 3], active: true };
    const bytes = PayloadSerializer.serialize(input);
    const restored = PayloadSerializer.deserialize(bytes);
    expect(restored).toEqual(input);
  });

  it('serializes and preserves Uint8Array zero-copy data', () => {
    const raw = new Uint8Array([255, 128, 64, 32]);
    const bytes = PayloadSerializer.serialize(raw);
    const restored = PayloadSerializer.deserialize<Uint8Array>(bytes);
    expect(Array.from(restored)).toEqual([255, 128, 64, 32]);
  });

  it('correctly handles 64-bit BigInt values', () => {
    const val = 1234567890123456789n;
    const bytes = PayloadSerializer.serialize(val);
    const restored = PayloadSerializer.deserialize<bigint>(bytes);
    expect(restored).toBe(val);
  });
});
