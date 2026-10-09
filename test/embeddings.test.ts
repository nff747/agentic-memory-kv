import { describe, it, expect } from 'vitest';
import { VectorEmbeddingStore } from '../src/embeddings';

describe('VectorEmbeddingStore', () => {
  it('stores and retrieves normalized embedding vectors', () => {
    const store = new VectorEmbeddingStore(4);
    const vec = new Float32Array([0.1, 0.2, 0.3, 0.4]);
    store.setVector('mem_1', vec);

    const retrieved = store.getVector('mem_1');
    expect(retrieved).not.toBeNull();
    expect(retrieved![0]).toBeCloseTo(0.1, 5);
    expect(retrieved![1]).toBeCloseTo(0.2, 5);
    expect(retrieved![2]).toBeCloseTo(0.3, 5);
    expect(retrieved![3]).toBeCloseTo(0.4, 5);
  });

  it('rejects dimension mismatched vectors', () => {
    const store = new VectorEmbeddingStore(4);
    const badVec = new Float32Array([1.0, 2.0]);
    expect(() => store.setVector('mem_bad', badVec)).toThrow('Vector dimension mismatch');
  });
});
