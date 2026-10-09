export class VectorEmbeddingStore {
  private dimension: number;
  private vectors: Map<string, Float32Array> = new Map();

  constructor(dimension: number = 384) {
    this.dimension = dimension;
  }

  public setVector(key: string, vector: Float32Array): void {
    if (vector.length !== this.dimension) {
      throw new Error(`Vector dimension mismatch. Expected ${this.dimension}, got ${vector.length}`);
    }
    this.vectors.set(key, new Float32Array(vector));
  }

  public getVector(key: string): Float32Array | null {
    return this.vectors.get(key) || null;
  }

  public removeVector(key: string): boolean {
    return this.vectors.delete(key);
  }

  public getDimension(): number { return this.dimension; }
  public count(): number { return this.vectors.size; }
  public entries(): [string, Float32Array][] { return Array.from(this.vectors.entries()); }
}
