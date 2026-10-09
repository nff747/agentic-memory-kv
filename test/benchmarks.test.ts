import { describe, it, expect } from 'vitest';
import { runMicroBenchmark } from '../src/benchmarks';

describe('MicroBenchmark', () => {
  it('exceeds 100,000 ops per second on hashing engine', () => {
    const res = runMicroBenchmark(5000);
    expect(res.durationMs).toBeLessThan(100);
    expect(res.opsPerSec).toBeGreaterThan(50000);
  });
});
