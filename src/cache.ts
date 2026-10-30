import { FutexLock } from './futex.js';
import { KeyHasher } from './hash.js';
import { VectorEmbeddingStore } from './embeddings.js';
import { TagIndex } from './tags.js';

export interface AgenticMemoryKVOptions {
  maxSize?: number;
  defaultTtl?: number;
  buffer?: SharedArrayBuffer;
}

const HEADER_SIZE = 5;
const H_LOCK = 0;
const H_SIZE = 1;
const H_HEAD = 2;
const H_TAIL = 3;
const H_DEFAULT_TTL = 4;

const NODE_SIZE = 5;
const N_PREV = 0;
const N_NEXT = 1;
const N_KEY = 2;
const N_VALUE = 3;
const N_EXPIRY = 4;

const NULL = -1n;
const MIN_I64 = -(1n << 63n);
const MAX_I64 = (1n << 63n) - 1n;

function assertKey(key: bigint): void {
  if (typeof key !== 'bigint' || key < MIN_I64 || key > MAX_I64 || key === NULL) throw new Error('key must be a signed 64-bit bigint other than -1');
}
function assertValue(value: bigint): void {
  if (typeof value !== 'bigint' || value < MIN_I64 || value > MAX_I64) throw new Error('value must be a signed 64-bit bigint');
}
function assertTtl(ttl: number | undefined): void {
  if (ttl !== undefined && (!Number.isSafeInteger(ttl) || ttl < 0 || ttl > Number.MAX_SAFE_INTEGER - Date.now())) throw new Error('ttl must be a non-negative safe integer in milliseconds');
}

export class AgenticMemoryKV {
  private sab: SharedArrayBuffer;
  private header: BigInt64Array;
  private nodes: BigInt64Array;
  private capacity: number;
  private futex: FutexLock;
  private vectorStore: VectorEmbeddingStore = new VectorEmbeddingStore(128);
  private tagIndex: TagIndex = new TagIndex();

  // Fast O(1) hash index: maps key -> nodeIndex
  private keyIndex: Map<bigint, number> = new Map();

  constructor(options: AgenticMemoryKVOptions = {}) {
    this.capacity = options.maxSize ?? 1000;
    const defaultTtl = options.defaultTtl ?? 0;

    if (!Number.isSafeInteger(this.capacity) || this.capacity <= 0) throw new Error('maxSize must be a positive integer');
    assertTtl(defaultTtl);

    const bytes = (HEADER_SIZE + this.capacity * NODE_SIZE) * 8;
    
    if (options.buffer) {
      if (options.buffer.byteLength !== bytes) throw new Error('buffer size does not match maxSize');
      this.sab = options.buffer;
      this.header = new BigInt64Array(this.sab, 0, HEADER_SIZE);
      this.nodes = new BigInt64Array(this.sab, HEADER_SIZE * 8, this.capacity * NODE_SIZE);
      // Rebuild lazily under the shared lock on first lookup.
    } else {
      this.sab = new SharedArrayBuffer(bytes);
      this.header = new BigInt64Array(this.sab, 0, HEADER_SIZE);
      this.nodes = new BigInt64Array(this.sab, HEADER_SIZE * 8, this.capacity * NODE_SIZE);
      
      this.header[H_LOCK] = 0n;
      this.header[H_SIZE] = 0n;
      this.header[H_HEAD] = NULL;
      this.header[H_TAIL] = NULL;
      this.header[H_DEFAULT_TTL] = BigInt(defaultTtl);
      
      for (let i = 0; i < this.capacity; i++) {
        this.setNode(i, N_KEY, NULL);
      }
    }

    this.futex = new FutexLock(this.sab, 0);
  }

  get buffer(): SharedArrayBuffer {
    return this.sab;
  }

  get size(): number {
    return Number(Atomics.load(this.header, H_SIZE));
  }

  public has(key: bigint): boolean {
    return this.get(key) !== undefined;
  }

  private lock() {
    this.futex.acquire();
  }

  private unlock() {
    this.futex.release();
  }

  private getNode(index: number, field: number): bigint {
    return Atomics.load(this.nodes, index * NODE_SIZE + field);
  }

  private setNode(index: number, field: number, value: bigint) {
    Atomics.store(this.nodes, index * NODE_SIZE + field, value);
  }

  private findKey(key: bigint): number {
    const idx = this.keyIndex.get(key);
    // The Map belongs to this instance, while nodes are shared across all
    // instances. Another worker can insert, delete or evict between calls.
    if (idx !== undefined && this.getNode(idx, N_KEY) === key) return idx;
    this.keyIndex.delete(key);
    for (let i = 0; i < this.capacity; i++) {
      if (this.getNode(i, N_KEY) === key) {
        this.keyIndex.set(key, i);
        return i;
      }
    }
    return Number(NULL);
  }

  private findFree(): number {
    for (let i = 0; i < this.capacity; i++) {
      if (this.getNode(i, N_KEY) === NULL) {
        return i;
      }
    }
    return Number(NULL);
  }

  private unlink(index: number) {
    const prev = this.getNode(index, N_PREV);
    const next = this.getNode(index, N_NEXT);

    if (prev !== NULL) {
      this.setNode(Number(prev), N_NEXT, next);
    } else {
      this.header[H_HEAD] = next;
    }

    if (next !== NULL) {
      this.setNode(Number(next), N_PREV, prev);
    } else {
      this.header[H_TAIL] = prev;
    }

    this.setNode(index, N_PREV, NULL);
    this.setNode(index, N_NEXT, NULL);
  }

  private insertAtHead(index: number) {
    const oldHead = this.header[H_HEAD];
    this.setNode(index, N_PREV, NULL);
    this.setNode(index, N_NEXT, oldHead);

    if (oldHead !== NULL) {
      this.setNode(Number(oldHead), N_PREV, BigInt(index));
    }
    this.header[H_HEAD] = BigInt(index);

    if (this.header[H_TAIL] === NULL) {
      this.header[H_TAIL] = BigInt(index);
    }
  }

  private evict(): number {
    const tail = this.header[H_TAIL];
    if (tail === NULL) return Number(NULL);

    const index = Number(tail);
    const key = this.getNode(index, N_KEY);
    this.keyIndex.delete(key);

    this.unlink(index);
    this.setNode(index, N_KEY, NULL);
    this.setNode(index, N_VALUE, NULL);
    this.setNode(index, N_EXPIRY, NULL);
    this.header[H_SIZE] -= 1n;
    return index;
  }

  public get(key: bigint): bigint | undefined {
    assertKey(key);
    this.lock();
    try {
      const index = this.findKey(key);
      if (index === Number(NULL)) {
        return undefined;
      }

      const expiry = this.getNode(index, N_EXPIRY);
      if (expiry !== 0n && expiry <= BigInt(Date.now())) {
        this.keyIndex.delete(key);
        this.unlink(index);
        this.setNode(index, N_KEY, NULL);
        this.setNode(index, N_VALUE, NULL);
        this.setNode(index, N_EXPIRY, NULL);
        this.header[H_SIZE] -= 1n;
        return undefined;
      }

      this.unlink(index);
      this.insertAtHead(index);

      return this.getNode(index, N_VALUE);
    } finally {
      this.unlock();
    }
  }

  public set(key: bigint, value: bigint, ttl?: number) {
    assertKey(key);
    assertValue(value);
    assertTtl(ttl);
    this.lock();
    try {
      let index = this.findKey(key);
      if (index !== Number(NULL)) {
        this.setNode(index, N_VALUE, value);
        const itemTtl = ttl !== undefined ? ttl : Number(this.header[H_DEFAULT_TTL]);
        const expiry = itemTtl > 0 ? BigInt(Date.now() + itemTtl) : 0n;
        this.setNode(index, N_EXPIRY, expiry);

        this.unlink(index);
        this.insertAtHead(index);
        return;
      }

      if (this.header[H_SIZE] >= BigInt(this.capacity)) {
        index = this.evict();
      } else {
        index = this.findFree();
      }

      if (index === Number(NULL)) {
        throw new Error('No available slots');
      }

      this.setNode(index, N_KEY, key);
      this.setNode(index, N_VALUE, value);
      const itemTtl = ttl !== undefined ? ttl : Number(this.header[H_DEFAULT_TTL]);
      const expiry = itemTtl > 0 ? BigInt(Date.now() + itemTtl) : 0n;
      this.setNode(index, N_EXPIRY, expiry);

      this.keyIndex.set(key, index);
      this.insertAtHead(index);
      this.header[H_SIZE] += 1n;
    } finally {
      this.unlock();
    }
  }

  public delete(key: bigint): boolean {
    assertKey(key);
    this.lock();
    try {
      const index = this.findKey(key);
      if (index === Number(NULL)) {
        return false;
      }

      this.keyIndex.delete(key);
      this.unlink(index);
      this.setNode(index, N_KEY, NULL);
      this.setNode(index, N_VALUE, NULL);
      this.setNode(index, N_EXPIRY, NULL);
      this.header[H_SIZE] -= 1n;
      return true;
    } finally {
      this.unlock();
    }
  }

  public clear() {
    this.lock();
    try {
      this.header[H_SIZE] = 0n;
      this.header[H_HEAD] = NULL;
      this.header[H_TAIL] = NULL;
      this.keyIndex.clear();
      for (let i = 0; i < this.capacity; i++) {
        this.setNode(i, N_KEY, NULL);
        this.setNode(i, N_VALUE, NULL);
        this.setNode(i, N_EXPIRY, NULL);
        this.setNode(i, N_PREV, NULL);
        this.setNode(i, N_NEXT, NULL);
      }
    } finally {
      this.unlock();
    }
  }

  public mget(keys: bigint[]): (bigint | undefined)[] {
    keys.forEach(assertKey);
    this.lock();
    try {
      const results: (bigint | undefined)[] = [];
      for (const key of keys) {
        const index = this.findKey(key);
        if (index === Number(NULL)) {
          results.push(undefined);
          continue;
        }

        const expiry = this.getNode(index, N_EXPIRY);
        if (expiry !== 0n && expiry <= BigInt(Date.now())) {
          this.keyIndex.delete(key);
          this.unlink(index);
          this.setNode(index, N_KEY, NULL);
          this.setNode(index, N_VALUE, NULL);
          this.setNode(index, N_EXPIRY, NULL);
          this.header[H_SIZE] -= 1n;
          results.push(undefined);
          continue;
        }

        this.unlink(index);
        this.insertAtHead(index);
        results.push(this.getNode(index, N_VALUE));
      }
      return results;
    } finally {
      this.unlock();
    }
  }

  public mset(entries: [bigint, bigint, number?][]): void {
    for (const [key, value, ttl] of entries) { assertKey(key); assertValue(value); assertTtl(ttl); }
    this.lock();
    try {
      for (const [key, value, ttl] of entries) {
        let index = this.findKey(key);
        if (index !== Number(NULL)) {
          this.setNode(index, N_VALUE, value);
          const itemTtl = ttl !== undefined ? ttl : Number(this.header[H_DEFAULT_TTL]);
          const expiry = itemTtl > 0 ? BigInt(Date.now() + itemTtl) : 0n;
          this.setNode(index, N_EXPIRY, expiry);

          this.unlink(index);
          this.insertAtHead(index);
          continue;
        }

        if (this.header[H_SIZE] >= BigInt(this.capacity)) {
          index = this.evict();
        } else {
          index = this.findFree();
        }

        if (index === Number(NULL)) {
          throw new Error('No available slots');
        }

        this.setNode(index, N_KEY, key);
        this.setNode(index, N_VALUE, value);
        const itemTtl = ttl !== undefined ? ttl : Number(this.header[H_DEFAULT_TTL]);
        const expiry = itemTtl > 0 ? BigInt(Date.now() + itemTtl) : 0n;
        this.setNode(index, N_EXPIRY, expiry);

        this.keyIndex.set(key, index);
        this.insertAtHead(index);
        this.header[H_SIZE] += 1n;
      }
    } finally {
      this.unlock();
    }
  }
}
