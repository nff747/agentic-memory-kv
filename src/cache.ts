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
  }

  get buffer(): SharedArrayBuffer {
    return this.sab;
  }

  private lock() {
    while (Atomics.compareExchange(this.header, H_LOCK, 0n, 1n) !== 0n) {
      // spin
    }
  }

  private unlock() {
    Atomics.store(this.header, H_LOCK, 0n);
  }

  private getNode(index: number, field: number): bigint {
    return Atomics.load(this.nodes, index * NODE_SIZE + field);
  }

  private setNode(index: number, field: number, value: bigint) {
    Atomics.store(this.nodes, index * NODE_SIZE + field, value);
  }

  private findKey(key: bigint): number {
    for (let i = 0; i < this.capacity; i++) {
      if (this.getNode(i, N_KEY) === key) {
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

    if (prev !== NULL) this.setNode(Number(prev), N_NEXT, next);
    else this.header[H_HEAD] = next;

    if (next !== NULL) this.setNode(Number(next), N_PREV, prev);
    else this.header[H_TAIL] = prev;
  }

  private pushFront(index: number) {
    const head = this.header[H_HEAD];
    this.setNode(index, N_PREV, NULL);
    this.setNode(index, N_NEXT, head);

    if (head !== NULL) this.setNode(Number(head), N_PREV, BigInt(index));
    else this.header[H_TAIL] = BigInt(index);

    this.header[H_HEAD] = BigInt(index);
  }

  set(key: bigint, value: bigint, ttl?: number): void {
    if (key === NULL) throw new Error("Invalid key");
    this.lock();
    try {
      let idx = this.findKey(key);
      if (idx !== Number(NULL)) {
        this.unlink(idx);
      } else {
        idx = this.findFree();
        if (idx === Number(NULL)) {
          // Evict tail
          idx = Number(this.header[H_TAIL]);
          if (idx !== Number(NULL)) {
            this.unlink(idx);
            this.header[H_SIZE]--;
          }
        }
      }

      if (idx !== Number(NULL)) {
        this.setNode(idx, N_KEY, key);
        this.setNode(idx, N_VALUE, value);
        
        const actualTtl = ttl !== undefined ? BigInt(ttl) : this.header[H_DEFAULT_TTL];
        this.setNode(idx, N_EXPIRY, actualTtl > 0n ? BigInt(Date.now()) + actualTtl : 0n);
        
        this.pushFront(idx);
        
        let newSize = 0n;
        for (let i = 0; i < this.capacity; i++) {
            if (this.getNode(i, N_KEY) !== NULL) newSize++;
        }
        this.header[H_SIZE] = newSize;
      }
    } finally {
      this.unlock();
    }
  }

  get(key: bigint): bigint | undefined {
    this.lock();
    try {
      const idx = this.findKey(key);
      if (idx === Number(NULL)) return undefined;

      const expiry = this.getNode(idx, N_EXPIRY);
      if (expiry !== 0n && BigInt(Date.now()) > expiry) {
        this.unlink(idx);
        this.setNode(idx, N_KEY, NULL);
        this.header[H_SIZE]--;
        return undefined;
      }

      this.unlink(idx);
      this.pushFront(idx);

      return this.getNode(idx, N_VALUE);
    } finally {
      this.unlock();
    }
  }

  has(key: bigint): boolean {
    this.lock();
    try {
      const idx = this.findKey(key);
      if (idx === Number(NULL)) return false;

      const expiry = this.getNode(idx, N_EXPIRY);
      if (expiry !== 0n && BigInt(Date.now()) > expiry) {
        this.unlink(idx);
        this.setNode(idx, N_KEY, NULL);
        this.header[H_SIZE]--;
        return false;
      }
      return true;
    } finally {
      this.unlock();
    }
  }

  delete(key: bigint): boolean {
    this.lock();
    try {
      const idx = this.findKey(key);
      if (idx === Number(NULL)) return false;

      this.unlink(idx);
      this.setNode(idx, N_KEY, NULL);
      this.header[H_SIZE]--;
      return true;
    } finally {
      this.unlock();
    }
  }

  clear(): void {
    this.lock();
    try {
      this.header[H_SIZE] = 0n;
      this.header[H_HEAD] = NULL;
      this.header[H_TAIL] = NULL;
      for (let i = 0; i < this.capacity; i++) {
        this.setNode(i, N_KEY, NULL);
      }
    } finally {
      this.unlock();
    }
  }

  get size(): number {
    this.lock();
    try {
      return Number(this.header[H_SIZE]);
    } finally {
      this.unlock();
    }
  }
}
