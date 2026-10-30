import { describe, it, expect, vi } from 'vitest';
import { FutexLock } from '../src/futex';

describe('FutexLock', () => {
  it('acquires and releases lock cleanly in uncontended scenarios', () => {
    const sab = new SharedArrayBuffer(4);
    const lock = new FutexLock(sab, 0);

    expect(lock.isLocked()).toBe(false);
    lock.acquire();
    expect(lock.isLocked()).toBe(true);
    lock.release();
    expect(lock.isLocked()).toBe(false);
  });

  it('allows re-acquisition after release', () => {
    const sab = new SharedArrayBuffer(4);
    const lock = new FutexLock(sab, 0);

    lock.acquire();
    lock.release();
    lock.acquire();
    expect(lock.isLocked()).toBe(true);
    lock.release();
  });

  it('fails closed when a contended lock cannot wait', () => {
    const sab = new SharedArrayBuffer(4);
    const owner = new FutexLock(sab, 0);
    const contender = new FutexLock(sab, 0, { spinLimit: 0 });
    owner.acquire();
    const wait = vi.spyOn(Atomics, 'wait').mockImplementation(() => { throw new Error('unavailable'); });
    try {
      expect(() => contender.acquire()).toThrow('Cannot wait for shared lock');
      expect(owner.isLocked()).toBe(true);
    } finally { wait.mockRestore(); owner.release(); }
  });
});
