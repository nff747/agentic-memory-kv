import { describe, it, expect } from 'vitest';
import { MemorySnapshot, SnapshotCorruptedError, calculateCRC32 } from '../src/snapshot';

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

  it('computes consistent CRC32 checksums', () => {
    const data = Buffer.from('test-payload-12345', 'utf-8');
    const crc = calculateCRC32(data);
    expect(typeof crc).toBe('number');
    expect(crc).toBe(calculateCRC32(data));
  });

  it('detects byte corruption and throws SnapshotCorruptedError', () => {
    const entries: [string, any][] = [['mem_key', 'val']];
    const bytes = MemorySnapshot.create(entries);

    // Corrupt one byte inside the serialized JSON
    const corrupted = new Uint8Array(bytes);
    corrupted[corrupted.length - 10] = corrupted[corrupted.length - 10] ^ 0xFF;

    expect(() => MemorySnapshot.restore(corrupted)).toThrow(SnapshotCorruptedError);
  });

  it('throws SnapshotCorruptedError on invalid non-JSON buffer', () => {
    const randomGarbage = new Uint8Array([0x00, 0xFF, 0xDE, 0xAD, 0xBE, 0xEF]);
    expect(() => MemorySnapshot.restore(randomGarbage)).toThrow(SnapshotCorruptedError);
  });
});
