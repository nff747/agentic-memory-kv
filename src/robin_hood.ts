import { KeyHasher } from './hash';

const SLOT_FIELDS = 4;
const F_HASH = 0;
const F_VAL_OFFSET = 1;
const F_VAL_SIZE = 2;
const F_PROBE_DIST = 3;

const EMPTY_HASH = -1n;

export class RobinHoodHashTable {
  private buffer: BigInt64Array;
  private capacity: number;

  constructor(sab: SharedArrayBuffer, byteOffset: number, capacity: number) {
    this.capacity = capacity;
    this.buffer = new BigInt64Array(sab, byteOffset, capacity * SLOT_FIELDS);
  }

  public init(): void {
    for (let i = 0; i < this.capacity; i++) {
      this.buffer[i * SLOT_FIELDS + F_HASH] = EMPTY_HASH;
      this.buffer[i * SLOT_FIELDS + F_VAL_OFFSET] = 0n;
      this.buffer[i * SLOT_FIELDS + F_VAL_SIZE] = 0n;
      this.buffer[i * SLOT_FIELDS + F_PROBE_DIST] = 0n;
    }
  }

  public findSlot(keyHash: bigint): number {
    let slot = KeyHasher.slotIndex(keyHash, this.capacity);
    let probe = 0;

    while (probe < this.capacity) {
      const idx = (slot + probe) % this.capacity;
      const base = idx * SLOT_FIELDS;
      const storedHash = this.buffer[base + F_HASH];

      if (storedHash === EMPTY_HASH) {
        return -1; // Not found
      }
      if (storedHash === keyHash) {
        return idx; // Found
      }

      const storedProbe = Number(this.buffer[base + F_PROBE_DIST]);
      if (probe > storedProbe) {
        // Robin hood property: element with longer probe cannot precede shorter
        return -1;
      }
      probe++;
    }
    return -1;
  }

  public put(keyHash: bigint, offset: number, size: number): boolean {
    let slot = KeyHasher.slotIndex(keyHash, this.capacity);
    let probe = 0;
    let curHash = keyHash;
    let curOffset = BigInt(offset);
    let curSize = BigInt(size);
    let curProbe = 0n;

    while (probe < this.capacity) {
      const idx = (slot + probe) % this.capacity;
      const base = idx * SLOT_FIELDS;
      const storedHash = this.buffer[base + F_HASH];

      if (storedHash === EMPTY_HASH || storedHash === curHash) {
        this.buffer[base + F_HASH] = curHash;
        this.buffer[base + F_VAL_OFFSET] = curOffset;
        this.buffer[base + F_VAL_SIZE] = curSize;
        this.buffer[base + F_PROBE_DIST] = curProbe;
        return true;
      }

      const storedDist = this.buffer[base + F_PROBE_DIST];
      if (curProbe > storedDist) {
        // Rich steals from the poor: swap
        const tmpH = this.buffer[base + F_HASH];
        const tmpO = this.buffer[base + F_VAL_OFFSET];
        const tmpS = this.buffer[base + F_VAL_SIZE];
        const tmpP = this.buffer[base + F_PROBE_DIST];

        this.buffer[base + F_HASH] = curHash;
        this.buffer[base + F_VAL_OFFSET] = curOffset;
        this.buffer[base + F_VAL_SIZE] = curSize;
        this.buffer[base + F_PROBE_DIST] = curProbe;

        curHash = tmpH;
        curOffset = tmpO;
        curSize = tmpS;
        curProbe = tmpP;
      }

      curProbe++;
      probe++;
    }
    return false; // Table full
  }

  public get(keyHash: bigint): { offset: number; size: number } | null {
    const slot = this.findSlot(keyHash);
    if (slot === -1) return null;
    const base = slot * SLOT_FIELDS;
    return {
      offset: Number(this.buffer[base + F_VAL_OFFSET]),
      size: Number(this.buffer[base + F_VAL_SIZE])
    };
  }

  public remove(keyHash: bigint): boolean {
    const slot = this.findSlot(keyHash);
    if (slot === -1) return false;
    const base = slot * SLOT_FIELDS;
    this.buffer[base + F_HASH] = EMPTY_HASH;
    this.buffer[base + F_VAL_OFFSET] = 0n;
    this.buffer[base + F_VAL_SIZE] = 0n;
    this.buffer[base + F_PROBE_DIST] = 0n;
    return true;
  }
}
