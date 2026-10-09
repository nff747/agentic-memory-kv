import { describe, it, expect } from 'vitest';
import { MemoryTransaction } from '../src/transaction';

describe('MemoryTransaction', () => {
  it('records set and delete operations and rolls back in reverse order', () => {
    const tx = new MemoryTransaction();
    tx.set('k1', 'v1', 'v0');
    tx.set('k2', 'v2', null);
    tx.delete('k3', 'v3');

    expect(tx.getOperations().length).toBe(3);
    const rollbackOps = tx.rollback();

    expect(rollbackOps.length).toBe(3);
    expect(rollbackOps[0].key).toBe('k3');
    expect(rollbackOps[1].key).toBe('k2');
    expect(rollbackOps[2].key).toBe('k1');
  });

  it('prevents adding operations after commit', () => {
    const tx = new MemoryTransaction();
    tx.commit();
    expect(() => tx.set('k', 'v')).toThrow('Transaction already finished');
  });
});
