import { describe, it, expect } from 'vitest';
import { WorkerBridge } from '../src/worker_bridge';

describe('WorkerBridge', () => {
  it('exports and imports SharedArrayBuffer handles cleanly', () => {
    const sab = new SharedArrayBuffer(128);
    const handle = WorkerBridge.exportHandle(sab);
    expect(handle.byteLength).toBe(128);

    const imported = WorkerBridge.importHandle(handle);
    expect(imported).toBe(sab);
  });
});
