export interface TxOp {
  type: 'set' | 'delete';
  key: string;
  value?: any;
  previousValue?: any;
}

export class MemoryTransaction {
  private ops: TxOp[] = [];
  private committed: boolean = false;
  private rolledBack: boolean = false;

  public set(key: string, value: any, previousValue?: any): void {
    if (this.committed || this.rolledBack) throw new Error('Transaction already finished');
    this.ops.push({ type: 'set', key, value, previousValue });
  }

  public delete(key: string, previousValue?: any): void {
    if (this.committed || this.rolledBack) throw new Error('Transaction already finished');
    this.ops.push({ type: 'delete', key, previousValue });
  }

  public getOperations(): readonly TxOp[] {
    return this.ops;
  }

  public commit(): void {
    this.committed = true;
  }

  public rollback(): TxOp[] {
    this.rolledBack = true;
    return [...this.ops].reverse();
  }

  public isDone(): boolean { return this.committed || this.rolledBack; }
}
