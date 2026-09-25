/**
 * Options for configuring the AgenticMemoryKV store.
 */
export interface AgenticMemoryKVOptions {
  /**
   * The maximum number of items the cache can hold.
   * @default 1000
   */
  maxSize?: number;

  /**
   * Default Time-To-Live for items in milliseconds.
   * If 0, items do not expire by default.
   * @default 0
   */
  defaultTtl?: number;
}

interface CacheItem<V> {
  value: V;
  expiry: number;
}

/**
 * A zero-dependency, edge-compatible LRU/TTL store designed for AI agent short-term memory.
 * Features O(1) insertions, deletions, and lookups using V8 Map iteration order mechanics.
 */
export class AgenticMemoryKV<K = string, V = any> {
  private readonly maxSize: number;
  private readonly defaultTtl: number;
  private readonly cache: Map<K, CacheItem<V>>;

  constructor(options: AgenticMemoryKVOptions = {}) {
    if (options.maxSize !== undefined && options.maxSize <= 0) {
      throw new Error('maxSize must be greater than 0');
    }
    if (options.defaultTtl !== undefined && options.defaultTtl < 0) {
      throw new Error('defaultTtl cannot be negative');
    }

    this.maxSize = options.maxSize ?? 1000;
    this.defaultTtl = options.defaultTtl ?? 0;
    this.cache = new Map();
  }

  /**
   * Sets a key-value pair in the cache with an optional TTL.
   * @param key The key to set.
   * @param value The value to set.
   * @param ttl Optional Time-To-Live in milliseconds. Overrides defaultTtl.
   */
  set(key: K, value: V, ttl?: number): void {
    const expiry = this.calculateExpiry(ttl);
    
    if (this.cache.has(key)) {
      // Re-insert to update LRU order
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      this.evict();
    }
    
    this.cache.set(key, { value, expiry });
  }

  /**
   * Gets a value from the cache. Returns undefined if the key doesn't exist or has expired.
   * Updates the LRU status of the accessed item.
   * @param key The key to retrieve.
   */
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item === undefined) {
      return undefined;
    }

    if (item.expiry !== 0 && Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh LRU status by re-inserting
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  /**
   * Checks if a key exists and has not expired.
   * Does NOT update the LRU status.
   * @param key The key to check.
   */
  has(key: K): boolean {
    const item = this.cache.get(key);
    if (item === undefined) {
      return false;
    }
    
    if (item.expiry !== 0 && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Deletes a key from the cache.
   * @param key The key to delete.
   * @returns true if the key existed and was removed, false otherwise.
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears all items from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns the current number of items in the cache.
   * Note: This may include expired items that have not yet been evicted.
   */
  get size(): number {
    return this.cache.size;
  }

  private calculateExpiry(ttl?: number): number {
    const actualTtl = ttl !== undefined ? ttl : this.defaultTtl;
    return actualTtl > 0 ? Date.now() + actualTtl : 0;
  }

  private evict(): void {
    // The Map iterator returns elements in insertion order.
    // The first element is the Least Recently Used (LRU).
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
    }
  }
}
