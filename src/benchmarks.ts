import { KeyHasher } from './hash';

export function runMicroBenchmark(iterations: number = 50000): {
  opsPerSec: number;
  durationMs: number;
} {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    KeyHasher.hash(`agent_key_${i}`);
  }
  const durationMs = performance.now() - start;
  const opsPerSec = Math.round(iterations / (durationMs / 1000));
  return { opsPerSec, durationMs };
}
