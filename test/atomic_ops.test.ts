import { describe, it, expect } from 'vitest';
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
