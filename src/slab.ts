import { SlabStats } from './types';

export class SlabArena {
  private bytes: Uint8Array;
  private headOffset: number = 0;
  private capacity: number;
  private allocationsCount: number = 0;

  constructor(sab: SharedArrayBuffer, byteOffset: number, capacity: number) {
    this.capacity = capacity;
    this.bytes = new Uint8Array(sab, byteOffset, capacity);
  }

  public allocate(payload: Uint8Array): { offset: number; size: number } | null {
    const size = payload.length;
    if (this.headOffset + size > this.capacity) {
      // Ring compaction / wrap around
      this.headOffset = 0;
    }
    if (size > this.capacity) return null;

    const offset = this.headOffset;
    this.bytes.set(payload, offset);
    this.headOffset += size;
    this.allocationsCount++;

    return { offset, size };
  }

  public read(offset: number, size: number): Uint8Array {
    return this.bytes.subarray(offset, offset + size);
  }

  public getStats(): SlabStats {
    return {
      totalBytes: this.capacity,
      usedBytes: this.headOffset,
      freeBytes: this.capacity - this.headOffset,
      allocations: this.allocationsCount
    };
  }

  public reset(): void {
    this.headOffset = 0;
    this.allocationsCount = 0;
  }
}
