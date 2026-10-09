import { FutexOptions } from './types';

export class FutexLock {
  private state: Int32Array;
  private lockIndex: number;
  private spinLimit: number;
  private timeoutMs: number;

  constructor(sab: SharedArrayBuffer, byteOffset: number = 0, options: FutexOptions = {}) {
    this.state = new Int32Array(sab, byteOffset, 1);
    this.lockIndex = 0;
    this.spinLimit = options.spinLimit ?? 100;
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  public acquire(): void {
    // 1. Fast path: uncontended acquisition
    if (Atomics.compareExchange(this.state, this.lockIndex, 0, 1) === 0) {
      return;
    }

    // 2. Adaptive spin phase before futex sleep
    for (let i = 0; i < this.spinLimit; i++) {
      if (Atomics.load(this.state, this.lockIndex) === 0 &&
          Atomics.compareExchange(this.state, this.lockIndex, 0, 1) === 0) {
        return;
      }
    }

    // 3. Slow path: Futex wait / yield
    while (Atomics.compareExchange(this.state, this.lockIndex, 0, 1) !== 0) {
      try {
        // Atomics.wait sleeps the thread until notified or timeout
        Atomics.wait(this.state, this.lockIndex, 1, this.timeoutMs);
      } catch {
        // Fallback for environments where Atomics.wait is prohibited on main thread
        break;
      }
    }
  }

  public release(): void {
    Atomics.store(this.state, this.lockIndex, 0);
    try {
      Atomics.notify(this.state, this.lockIndex, 1);
    } catch {
      // Ignore main-thread restriction
    }
  }

  public isLocked(): boolean {
    return Atomics.load(this.state, this.lockIndex) === 1;
  }
}
