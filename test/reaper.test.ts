import { describe, it, expect, vi } from 'vitest';
import { TtlReaper } from '../src/reaper';

describe('TtlReaper', () => {
  it('sweeps batch slots and returns count of expired items', () => {
    const mockTarget = {
      checkAndExpireSlot: vi.fn((idx: number) => idx === 1 || idx === 3),
      getCapacity: () => 5
    };

    const reaper = new TtlReaper(mockTarget, 5);
    const expired = reaper.sweepOnce();

    expect(expired).toBe(2);
    expect(mockTarget.checkAndExpireSlot).toHaveBeenCalledTimes(5);
  });
});
