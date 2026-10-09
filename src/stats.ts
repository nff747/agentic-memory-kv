export interface CacheMetrics {
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
