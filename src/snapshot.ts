export interface SnapshotData {
  version: number;
  createdAt: number;
  entries: [string, any][];
}

export class MemorySnapshot {
  public static create(entries: [string, any][]): Uint8Array {
    const data: SnapshotData = {
      version: 1,
      createdAt: Date.now(),
      entries
    };
    const jsonStr = JSON.stringify(data);
    return Buffer.from(jsonStr, 'utf-8');
  }

  public static restore(bytes: Uint8Array): [string, any][] {
    const jsonStr = Buffer.from(bytes).toString('utf-8');
    const data: SnapshotData = JSON.parse(jsonStr);
    return data.entries;
  }
}
