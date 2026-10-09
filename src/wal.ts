export interface WalRecord {
  timestamp: number;
  op: 'PUT' | 'DEL';
  key: string;
  value?: any;
}

export class WriteAheadLog {
  private log: WalRecord[] = [];

  public append(op: 'PUT' | 'DEL', key: string, value?: any): void {
    this.log.push({
      timestamp: Date.now(),
      op,
      key,
      value
    });
  }

  public getRecords(): readonly WalRecord[] {
    return this.log;
  }

  public replay(target: { set: (k: string, v: any) => void; delete: (k: string) => void }): number {
    let replayed = 0;
    for (const rec of this.log) {
      if (rec.op === 'PUT') {
        target.set(rec.key, rec.value);
      } else if (rec.op === 'DEL') {
        target.delete(rec.key);
      }
      replayed++;
    }
    return replayed;
  }

  public clear(): void {
    this.log = [];
  }
}
