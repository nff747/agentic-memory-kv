export class KeyHasher {
  private static FNV_OFFSET_BASIS = 0xcbf29ce484222325n;
  private static FNV_PRIME = 0x100000001b3n;

  public static hash(key: string | bigint | Uint8Array): bigint {
    if (typeof key === 'bigint') {
      return key;
    }

    let bytes: Uint8Array;
    if (typeof key === 'string') {
      bytes = Buffer.from(key, 'utf-8');
    } else {
      bytes = key;
    }

    let hash = this.FNV_OFFSET_BASIS;
    for (let i = 0; i < bytes.length; i++) {
      hash ^= BigInt(bytes[i]);
      hash = (hash * this.FNV_PRIME) & 0xffffffffffffffffn;
    }
    return hash;
  }

  public static slotIndex(hash: bigint, capacity: number): number {
    const positiveHash = hash < 0n ? -hash : hash;
    return Number(positiveHash % BigInt(capacity));
  }
}
