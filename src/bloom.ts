import { KeyHasher } from './hash';

export class BloomFilter {
  private bits: Uint8Array;
  private sizeBits: number;

  constructor(sizeBytes: number = 128) {
    this.bits = new Uint8Array(sizeBytes);
    this.sizeBits = sizeBytes * 8;
  }

  public add(key: string): void {
    const h1 = Number(KeyHasher.hash(key) % BigInt(this.sizeBits));
    const h2 = Number(KeyHasher.hash(`${key}:salt`) % BigInt(this.sizeBits));

    this.setBit(Math.abs(h1));
    this.setBit(Math.abs(h2));
  }

  public mayContain(key: string): boolean {
    const h1 = Number(KeyHasher.hash(key) % BigInt(this.sizeBits));
    const h2 = Number(KeyHasher.hash(`${key}:salt`) % BigInt(this.sizeBits));

    return this.getBit(Math.abs(h1)) && this.getBit(Math.abs(h2));
  }

  private setBit(idx: number): void {
    const byte = Math.floor(idx / 8);
    const bit = idx % 8;
    this.bits[byte] |= (1 << bit);
  }

  private getBit(idx: number): boolean {
    const byte = Math.floor(idx / 8);
    const bit = idx % 8;
    return (this.bits[byte] & (1 << bit)) !== 0;
  }
}
