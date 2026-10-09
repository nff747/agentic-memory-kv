import { describe, it, expect, vi } from 'vitest';
import { WriteAheadLog } from '../src/wal';

describe('WriteAheadLog', () => {
  it('appends records and replays state faithfully', () => {
    const wal = new WriteAheadLog();
    wal.append('PUT', 'a', 1);
    wal.append('PUT', 'b', 2);
    wal.append('DEL', 'a');

    expect(wal.getRecords().length).toBe(3);

    const mockTarget = {
      set: vi.fn(),
      delete: vi.fn()
    };

    const count = wal.replay(mockTarget);
    expect(count).toBe(3);
    expect(mockTarget.set).toHaveBeenCalledWith('a', 1);
    expect(mockTarget.set).toHaveBeenCalledWith('b', 2);
    expect(mockTarget.delete).toHaveBeenCalledWith('a');
  });
});
