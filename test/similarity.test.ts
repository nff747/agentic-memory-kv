import { describe, it, expect } from 'vitest';
import { VectorSimilarity } from '../src/similarity';

describe('VectorSimilarity', () => {
  it('computes exact cosine similarity between collinear vectors', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([2, 0, 0]);
    expect(VectorSimilarity.cosineSimilarity(a, b)).toBeCloseTo(1.0, 5);

    const c = new Float32Array([0, 1, 0]);
    expect(VectorSimilarity.cosineSimilarity(a, c)).toBeCloseTo(0.0, 5);
  });

  it('ranks top-K nearest neighbors accurately', () => {
    const query = new Float32Array([1, 0, 0]);
    const corpus: [string, Float32Array][] = [
      ['doc_far', new Float32Array([0, 1, 0])],
      ['doc_close', new Float32Array([0.9, 0.1, 0])],
      ['doc_mid', new Float32Array([0.5, 0.5, 0])]
    ];

    const ranked = VectorSimilarity.rankTopK(query, corpus, 2);
    expect(ranked.length).toBe(2);
    expect(ranked[0].key).toBe('doc_close');
    expect(ranked[1].key).toBe('doc_mid');
  });
});
