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

  public static incrementClamped(
    arr: BigInt64Array,
    index: number,
    amount: bigint = 1n,
    min: bigint = -9223372036854775808n,
    max: bigint = 9223372036854775807n
  ): bigint {
    while (true) {
      const current = Atomics.load(arr, index);
      let next = current + amount;
      if (next > max) next = max;
      if (next < min) next = min;
      if (Atomics.compareExchange(arr, index, current, next) === current) {
        return next;
      }
    }
  }

  public static decrementClamped(
    arr: BigInt64Array,
    index: number,
    amount: bigint = 1n,
    min: bigint = -9223372036854775808n,
    max: bigint = 9223372036854775807n
  ): bigint {
    while (true) {
      const current = Atomics.load(arr, index);
      let next = current - amount;
      if (next < min) next = min;
      if (next > max) next = max;
      if (Atomics.compareExchange(arr, index, current, next) === current) {
        return next;
      }
    }
  }
}
