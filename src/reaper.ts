import { TtlManager } from './ttl';

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
