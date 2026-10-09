import { describe, it, expect } from 'vitest';
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
});
