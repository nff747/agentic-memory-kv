import { describe, it, expect } from 'vitest';
import { CacheStatsCollector } from '../src/stats';

describe('CacheStatsCollector', () => {
  it('calculates hit rate and operation counters accurately', () => {
    const collector = new CacheStatsCollector();
    collector.recordHit();
    collector.recordHit();
    collector.recordHit();
    collector.recordMiss();

    const metrics = collector.getMetrics();
    expect(metrics.hits).toBe(3);
    expect(metrics.misses).toBe(1);
    expect(metrics.hitRate).toBe(0.75);
  });

  it('resets all metrics to clean zero state', () => {
    const collector = new CacheStatsCollector();
    collector.recordHit();
    collector.recordEviction();
    collector.reset();

    const metrics = collector.getMetrics();
    expect(metrics.hits).toBe(0);
    expect(metrics.evictions).toBe(0);
    expect(metrics.hitRate).toBe(1.0);
  });
});
