export class SnapshotCorruptedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotCorruptedError';
  }
}

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

export function calculateCRC32(bytes: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export interface SnapshotData {
  version: number;
  createdAt: number;
  checksum: number;
  entries: [string, any][];
}

export class MemorySnapshot {
  public static create(entries: [string, any][]): Uint8Array {
    const payloadStr = JSON.stringify(entries);
    const checksum = calculateCRC32(Buffer.from(payloadStr, 'utf-8'));
    const data: SnapshotData = {
      version: 1,
      createdAt: Date.now(),
      checksum,
      entries
    };
    const jsonStr = JSON.stringify(data);
    return Buffer.from(jsonStr, 'utf-8');
  }

  public static restore(bytes: Uint8Array): [string, any][] {
    let data: SnapshotData;
    try {
      const jsonStr = Buffer.from(bytes).toString('utf-8');
      data = JSON.parse(jsonStr);
    } catch (e: any) {
      throw new SnapshotCorruptedError(`Failed to parse snapshot JSON: ${e.message}`);
    }

    if (!data || !Array.isArray(data.entries)) {
      throw new SnapshotCorruptedError('Malformed snapshot data: missing entries array');
    }

    if (data.checksum !== undefined) {
      const payloadStr = JSON.stringify(data.entries);
      const computed = calculateCRC32(Buffer.from(payloadStr, 'utf-8'));
      if (computed !== data.checksum) {
        throw new SnapshotCorruptedError(`Snapshot CRC32 checksum mismatch: expected ${data.checksum}, computed ${computed}`);
      }
    }

    return data.entries;
  }
}
