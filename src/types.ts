export type KeyType = string | bigint | Uint8Array;
export type ValueType = string | number | boolean | bigint | object | Uint8Array;

export interface MemoryEntry<T = ValueType> {
  key: string;
  value: T;
  version: number;
  createdAt: number;
  expiresAt: number;
  tags?: string[];
  embedding?: Float32Array;
}

export interface HashSlot {
  keyHash: bigint;
  offset: number;
  size: number;
  probeDistance: number;
}

export interface FutexOptions {
  spinLimit?: number;
  timeoutMs?: number;
}

export interface SlabStats {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  allocations: number;
}

export interface AgenticKvConfig {
  maxSize?: number;
  defaultTtl?: number;
  slabSizeBytes?: number;
  buffer?: SharedArrayBuffer;
  enableEmbeddingIndex?: boolean;
}
