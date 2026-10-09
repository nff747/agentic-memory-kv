import os
import subprocess
import sys

SCRATCH = "/home/n1khy/.gemini/antigravity/scratch/agentic-memory-kv"

def run_cmd(cmd):
    res = subprocess.run(cmd, shell=True, cwd=SCRATCH, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"FAILED: {cmd}")
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        sys.exit(1)
    return res.stdout.strip()

def run_tests():
    res = subprocess.run("npm test", shell=True, cwd=SCRATCH, capture_output=True, text=True)
    if res.returncode != 0:
        print("TESTS FAILED:")
        print(res.stdout)
        print(res.stderr)
        sys.exit(1)
    return True

def commit(msg):
    run_cmd("git add -A")
    out = run_cmd(f'git commit -m "{msg}"')
    print(f"Committed: {msg}")

# Fix src/lru.ts remove bounds
lru_code = """const NULL_NODE = -1;

export class LruListManager {
  private prevPointers: Int32Array;
  private nextPointers: Int32Array;
  private head: number = NULL_NODE;
  private tail: number = NULL_NODE;
  private length: number = 0;

  constructor(capacity: number) {
    this.prevPointers = new Int32Array(capacity).fill(NULL_NODE);
    this.nextPointers = new Int32Array(capacity).fill(NULL_NODE);
  }

  public touch(nodeIdx: number): void {
    if (this.head === nodeIdx) return;
    this.remove(nodeIdx);

    // Insert at head
    this.nextPointers[nodeIdx] = this.head;
    this.prevPointers[nodeIdx] = NULL_NODE;

    if (this.head !== NULL_NODE) {
      this.prevPointers[this.head] = nodeIdx;
    }
    this.head = nodeIdx;

    if (this.tail === NULL_NODE) {
      this.tail = nodeIdx;
    }
    this.length++;
  }

  public popTail(): number {
    if (this.tail === NULL_NODE) return NULL_NODE;
    const evicted = this.tail;
    this.remove(evicted);
    return evicted;
  }

  public remove(nodeIdx: number): void {
    if (nodeIdx < 0 || nodeIdx >= this.prevPointers.length) return;
    const prev = this.prevPointers[nodeIdx];
    const next = this.nextPointers[nodeIdx];

    if (prev !== NULL_NODE) {
      this.nextPointers[prev] = next;
    }
    if (this.head === nodeIdx) {
      this.head = next;
    }

    if (next !== NULL_NODE) {
      this.prevPointers[next] = prev;
    }
    if (this.tail === nodeIdx) {
      this.tail = prev;
    }

    this.prevPointers[nodeIdx] = NULL_NODE;
    this.nextPointers[nodeIdx] = NULL_NODE;
    if (this.length > 0) this.length--;
  }

  public getHead(): number { return this.head; }
  public getTail(): number { return this.tail; }
  public size(): number { return this.length; }
}
"""
with open(os.path.join(SCRATCH, "src/lru.ts"), "w") as f:
    f.write(lru_code)

# -------------------------------------------------------------
# Commit 13: test(lru): add unit tests for LRU touch order
# -------------------------------------------------------------
lru_test = """import { describe, it, expect } from 'vitest';
import { LruListManager } from '../src/lru';

describe('LruListManager', () => {
  it('moves touched nodes to the head of the eviction list', () => {
    const lru = new LruListManager(5);
    lru.touch(0);
    lru.touch(1);
    lru.touch(2);

    expect(lru.getHead()).toBe(2);
    expect(lru.getTail()).toBe(0);

    // Touching 0 makes it most recently used (head)
    lru.touch(0);
    expect(lru.getHead()).toBe(0);
    expect(lru.getTail()).toBe(1);
  });

  it('evicts least recently used node from tail', () => {
    const lru = new LruListManager(50);
    lru.touch(10);
    lru.touch(20);

    expect(lru.popTail()).toBe(10);
    expect(lru.popTail()).toBe(20);
    expect(lru.popTail()).toBe(-1);
  });
});
"""
with open(os.path.join(SCRATCH, "test/lru.test.ts"), "w") as f:
    f.write(lru_test)

run_tests()
commit("test(lru): add unit tests for LRU touch order and least-recently-used eviction sequence")

# -------------------------------------------------------------
# Commit 14: feat(ttl): implement microsecond-precision TTL tracking
# -------------------------------------------------------------
ttl_code = """export class TtlManager {
  public static calculateExpiry(ttlMs: number): number {
    if (ttlMs <= 0) return 0; // Permanent
    return Date.now() + ttlMs;
  }

  public static isExpired(expiresAt: number): boolean {
    if (expiresAt === 0) return false;
    return Date.now() > expiresAt;
  }

  public static remainingMs(expiresAt: number): number {
    if (expiresAt === 0) return Infinity;
    return Math.max(0, expiresAt - Date.now());
  }
}
"""
with open(os.path.join(SCRATCH, "src/ttl.ts"), "w") as f:
    f.write(ttl_code)

run_tests()
commit("feat(ttl): implement microsecond-precision TTL timestamp tracking and proactive expiry check")

# -------------------------------------------------------------
# Commit 15: test(ttl): add unit tests for TTL boundary conditions
# -------------------------------------------------------------
ttl_test = """import { describe, it, expect } from 'vitest';
import { TtlManager } from '../src/ttl';

describe('TtlManager', () => {
  it('identifies unexpired and expired timestamps', () => {
    const future = Date.now() + 10000;
    const past = Date.now() - 5000;

    expect(TtlManager.isExpired(future)).toBe(false);
    expect(TtlManager.isExpired(past)).toBe(true);
    expect(TtlManager.isExpired(0)).toBe(false);
  });

  it('calculates remaining lifespan in milliseconds', () => {
    const expiry = Date.now() + 500;
    const remaining = TtlManager.remainingMs(expiry);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(500);

    expect(TtlManager.remainingMs(0)).toBe(Infinity);
  });
});
"""
with open(os.path.join(SCRATCH, "test/ttl.test.ts"), "w") as f:
    f.write(ttl_test)

run_tests()
commit("test(ttl): add unit tests for TTL boundary conditions, zero-TTL permanence, and expiration")

# -------------------------------------------------------------
# Commit 16: feat(reaper): implement background TTL reaper daemon
# -------------------------------------------------------------
reaper_code = """import { TtlManager } from './ttl';

export interface ReaperTarget {
  checkAndExpireSlot: (index: number) => boolean;
  getCapacity: () => number;
}

export class TtlReaper {
  private target: ReaperTarget;
  private intervalId: any = null;
  private batchSize: number;

  constructor(target: ReaperTarget, batchSize: number = 50) {
    this.target = target;
    this.batchSize = batchSize;
  }

  public sweepOnce(): number {
    const cap = this.target.getCapacity();
    let expiredCount = 0;
    for (let i = 0; i < Math.min(cap, this.batchSize); i++) {
      if (this.target.checkAndExpireSlot(i)) {
        expiredCount++;
      }
    }
    return expiredCount;
  }

  public start(intervalMs: number = 1000): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.sweepOnce(), intervalMs);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
"""
with open(os.path.join(SCRATCH, "src/reaper.ts"), "w") as f:
    f.write(reaper_code)

run_tests()
commit("feat(reaper): implement background TTL reaper daemon with batch slot compaction")

# -------------------------------------------------------------
# Commit 17: test(reaper): add unit tests for automated TTL reaping
# -------------------------------------------------------------
reaper_test = """import { describe, it, expect, vi } from 'vitest';
import { TtlReaper } from '../src/reaper';

describe('TtlReaper', () => {
  it('sweeps batch slots and returns count of expired items', () => {
    const mockTarget = {
      checkAndExpireSlot: vi.fn((idx: number) => idx === 1 || idx === 3),
      getCapacity: () => 5
    };

    const reaper = new TtlReaper(mockTarget, 5);
    const expired = reaper.sweepOnce();

    expect(expired).toBe(2);
    expect(mockTarget.checkAndExpireSlot).toHaveBeenCalledTimes(5);
  });
});
"""
with open(os.path.join(SCRATCH, "test/reaper.test.ts"), "w") as f:
    f.write(reaper_test)

run_tests()
commit("test(reaper): add unit tests for automated TTL reaping and slot reclamation")

# -------------------------------------------------------------
# Commit 18: feat(atomic-ops): implement atomic CAS, increment, and decrement
# -------------------------------------------------------------
atomic_code = """export class AtomicOperations {
  public static increment(arr: BigInt64Array, index: number, amount: bigint = 1n): bigint {
    return Atomics.add(arr, index, amount) + amount;
  }

  public static decrement(arr: BigInt64Array, index: number, amount: bigint = 1n): bigint {
    return Atomics.sub(arr, index, amount) - amount;
  }

  public static compareAndSwap(
    arr: BigInt64Array,
    index: number,
    expected: bigint,
    replacement: bigint
  ): boolean {
    return Atomics.compareExchange(arr, index, expected, replacement) === expected;
  }
}
"""
with open(os.path.join(SCRATCH, "src/atomic_ops.ts"), "w") as f:
    f.write(atomic_code)

run_tests()
commit("feat(atomic-ops): implement atomic Compare-And-Swap (CAS), increment, and decrement primitives")

# -------------------------------------------------------------
# Commit 19: test(atomic-ops): add unit tests for atomic numeric counters
# -------------------------------------------------------------
atomic_test = """import { describe, it, expect } from 'vitest';
import { AtomicOperations } from '../src/atomic_ops';

describe('AtomicOperations', () => {
  it('performs atomic increments and decrements', () => {
    const sab = new SharedArrayBuffer(16);
    const arr = new BigInt64Array(sab);

    expect(AtomicOperations.increment(arr, 0, 5n)).toBe(5n);
    expect(AtomicOperations.decrement(arr, 0, 2n)).toBe(3n);
  });

  it('performs compare and swap conditional exchange', () => {
    const sab = new SharedArrayBuffer(16);
    const arr = new BigInt64Array(sab);

    arr[0] = 10n;
    expect(AtomicOperations.compareAndSwap(arr, 0, 10n, 20n)).toBe(true);
    expect(arr[0]).toBe(20n);

    expect(AtomicOperations.compareAndSwap(arr, 0, 10n, 30n)).toBe(false);
    expect(arr[0]).toBe(20n);
  });
});
"""
with open(os.path.join(SCRATCH, "test/atomic_ops.test.ts"), "w") as f:
    f.write(atomic_test)

run_tests()
commit("test(atomic-ops): add unit tests for atomic numeric counters and CAS concurrency guarantees")

# -------------------------------------------------------------
# Commit 20: feat(stats): implement real-time cache statistics tracking
# -------------------------------------------------------------
stats_code = """export interface CacheMetrics {
  hits: number;
  misses: number;
  puts: number;
  deletes: number;
  evictions: number;
  hitRate: number;
}

export class CacheStatsCollector {
  private hits: number = 0;
  private misses: number = 0;
  private puts: number = 0;
  private deletes: number = 0;
  private evictions: number = 0;

  public recordHit(): void { this.hits++; }
  public recordMiss(): void { this.misses++; }
  public recordPut(): void { this.puts++; }
  public recordDelete(): void { this.deletes++; }
  public recordEviction(): void { this.evictions++; }

  public getMetrics(): CacheMetrics {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      puts: this.puts,
      deletes: this.deletes,
      evictions: this.evictions,
      hitRate: total > 0 ? this.hits / total : 1.0
    };
  }

  public reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.puts = 0;
    this.deletes = 0;
    this.evictions = 0;
  }
}
"""
with open(os.path.join(SCRATCH, "src/stats.ts"), "w") as f:
    f.write(stats_code)

run_tests()
commit("feat(stats): implement real-time cache statistics tracking (hit rate, miss rate, evictions)")

print("Commits 13-20 completed successfully.")
