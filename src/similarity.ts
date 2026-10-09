export class VectorSimilarity {
  public static dotProduct(a: Float32Array, b: Float32Array): number {
    let dot = 0.0;
    const len = a.length;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
    }
    return dot;
  }

  public static cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    const len = a.length;

    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0.0;
  }

  public static rankTopK(
    query: Float32Array,
    corpus: [string, Float32Array][],
    k: number = 5
  ): { key: string; score: number }[] {
    const scored = corpus.map(([key, vec]) => ({
      key,
      score: this.cosineSimilarity(query, vec)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}
