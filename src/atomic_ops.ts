export class AtomicOperations {
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
