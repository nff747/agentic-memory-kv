import { FutexLock } from './futex';
import { KeyHasher } from './hash';
import { VectorEmbeddingStore } from './embeddings';
import { TagIndex } from './tags';

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

    if (this.capacity <= 0) throw new Error('maxSize must be greater than 0');
    if (defaultTtl < 0) throw new Error('defaultTtl cannot be negative');

    const bytes = (HEADER_SIZE + this.capacity * NODE_SIZE) * 8;
    
    if (options.buffer) {
      this.sab = options.buffer;
      this.header = new BigInt64Array(this.sab, 0, HEADER_SIZE);
      this.nodes = new BigInt64Array(this.sab, HEADER_SIZE * 8, this.capacity * NODE_SIZE);
      // Rebuild index
      for (let i = 0; i < this.capacity; i++) {
        const k = this.getNode(i, N_KEY);
        if (k !== NULL) {
          this.keyIndex.set(k, i);
        }
      }
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
    return idx !== undefined ? idx : Number(NULL);
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
}
