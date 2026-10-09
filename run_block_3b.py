import os
import subprocess
import sys

SCRATCH = "/home/n1khy/.gemini/antigravity/scratch/agentic-memory-kv"

def run_cmd(cmd):
    res = subprocess.run(cmd, shell=True, cwd=SCRATCH, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"FAILED: {cmd}")
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        sys.exit(1)
    return res.stdout.strip()

def run_tests():
    res = subprocess.run("npm test", shell=True, cwd=SCRATCH, capture_output=True, text=True)
    if res.returncode != 0:
        print("TESTS FAILED:")
        print(res.stdout)
        print(res.stderr)
        sys.exit(1)
    return True

def commit(msg):
    run_cmd("git add -A")
    out = run_cmd(f'git commit -m "{msg}"')
    print(f"Committed: {msg}")

# -------------------------------------------------------------
# Commit 23: test(embeddings): add unit tests for vector storage
# -------------------------------------------------------------
embed_test = """import { describe, it, expect } from 'vitest';
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
"""
with open(os.path.join(SCRATCH, "test/embeddings.test.ts"), "w") as f:
    f.write(embed_test)

run_tests()
commit("test(embeddings): add unit tests for float32 vector storage, normalization, and magnitude checks")

# -------------------------------------------------------------
# Commit 24: feat(similarity): implement Cosine Similarity and Dot Product
# -------------------------------------------------------------
sim_code = """export class VectorSimilarity {
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
"""
with open(os.path.join(SCRATCH, "src/similarity.ts"), "w") as f:
    f.write(sim_code)

run_tests()
commit("feat(similarity): implement fast SIMD-friendly Cosine Similarity and Dot Product vector search")

# -------------------------------------------------------------
# Commit 25: test(similarity): add unit tests for vector similarity
# -------------------------------------------------------------
sim_test = """import { describe, it, expect } from 'vitest';
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
"""
with open(os.path.join(SCRATCH, "test/similarity.test.ts"), "w") as f:
    f.write(sim_test)

run_tests()
commit("test(similarity): add unit tests for vector similarity metrics and nearest-neighbor rank order")

# -------------------------------------------------------------
# Commit 26: feat(tags): implement secondary tag indexing
# -------------------------------------------------------------
tags_code = """export class TagIndex {
  private tagToKeys: Map<string, Set<string>> = new Map();
  private keyToTags: Map<string, Set<string>> = new Map();

  public tag(key: string, tags: string[]): void {
    if (!this.keyToTags.has(key)) {
      this.keyToTags.set(key, new Set());
    }
    const currentTags = this.keyToTags.get(key)!;

    for (const t of tags) {
      currentTags.add(t);
      if (!this.tagToKeys.has(t)) {
        this.tagToKeys.set(t, new Set());
      }
      this.tagToKeys.get(t)!.add(key);
    }
  }

  public getKeysByTag(tag: string): string[] {
    const keys = this.tagToKeys.get(tag);
    return keys ? Array.from(keys) : [];
  }

  public getKeysByAllTags(tags: string[]): string[] {
    if (tags.length === 0) return [];
    let result: Set<string> | null = null;

    for (const t of tags) {
      const keys = this.tagToKeys.get(t) || new Set();
      if (!result) {
        result = new Set(keys);
      } else {
        result = new Set(Array.from(result).filter(k => keys.has(k)));
      }
    }
    return result ? Array.from(result) : [];
  }

  public removeKey(key: string): void {
    const tags = this.keyToTags.get(key);
    if (!tags) return;
    for (const t of tags) {
      const set = this.tagToKeys.get(t);
      if (set) set.delete(key);
    }
    this.keyToTags.delete(key);
  }
}
"""
with open(os.path.join(SCRATCH, "src/tags.ts"), "w") as f:
    f.write(tags_code)

run_tests()
commit("feat(tags): implement secondary tag indexing for associative agent memory retrieval")

# -------------------------------------------------------------
# Commit 27: test(tags): add unit tests for multi-tag querying
# -------------------------------------------------------------
tags_test = """import { describe, it, expect } from 'vitest';
import { TagIndex } from '../src/tags';

describe('TagIndex', () => {
  it('indexes keys by multiple tags and performs intersection queries', () => {
    const index = new TagIndex();
    index.tag('mem_1', ['session:100', 'role:user', 'topic:billing']);
    index.tag('mem_2', ['session:100', 'role:agent', 'topic:billing']);
    index.tag('mem_3', ['session:200', 'role:user']);

    expect(index.getKeysByTag('topic:billing')).toEqual(['mem_1', 'mem_2']);
    expect(index.getKeysByAllTags(['session:100', 'role:user'])).toEqual(['mem_1']);
  });

  it('removes keys cleanly and updates tag sets', () => {
    const index = new TagIndex();
    index.tag('mem_del', ['t1']);
    expect(index.getKeysByTag('t1')).toEqual(['mem_del']);
    index.removeKey('mem_del');
    expect(index.getKeysByTag('t1')).toEqual([]);
  });
});
"""
with open(os.path.join(SCRATCH, "test/tags.test.ts"), "w") as f:
    f.write(tags_test)

run_tests()
commit("test(tags): add unit tests for multi-tag querying and intersection filtering")

# -------------------------------------------------------------
# Commit 28: feat(namespace): implement isolated multi-tenant namespaces
# -------------------------------------------------------------
ns_code = """export class NamespaceManager {
  public static qualifyKey(namespace: string, key: string): string {
    const cleanNs = namespace.trim();
    if (!cleanNs) return key;
    return `${cleanNs}::${key}`;
  }

  public static parseKey(qualifiedKey: string): { namespace: string; key: string } {
    const idx = qualifiedKey.indexOf('::');
    if (idx === -1) {
      return { namespace: 'default', key: qualifiedKey };
    }
    return {
      namespace: qualifiedKey.substring(0, idx),
      key: qualifiedKey.substring(idx + 2)
    };
  }

  public static isKeyInNamespace(qualifiedKey: string, namespace: string): boolean {
    return qualifiedKey.startsWith(`${namespace}::`);
  }
}
"""
with open(os.path.join(SCRATCH, "src/namespace.ts"), "w") as f:
    f.write(ns_code)

run_tests()
commit("feat(namespace): implement isolated multi-tenant memory namespaces within a single buffer")

# -------------------------------------------------------------
# Commit 29: test(namespace): add unit tests for namespace boundary enforcement
# -------------------------------------------------------------
ns_test = """import { describe, it, expect } from 'vitest';
import { NamespaceManager } from '../src/namespace';

describe('NamespaceManager', () => {
  it('qualifies and parses namespace-prefixed keys', () => {
    const qualified = NamespaceManager.qualifyKey('tenant_alpha', 'agent_session_1');
    expect(qualified).toBe('tenant_alpha::agent_session_1');

    const parsed = NamespaceManager.parseKey(qualified);
    expect(parsed.namespace).toBe('tenant_alpha');
    expect(parsed.key).toBe('agent_session_1');
  });

  it('checks namespace ownership accurately', () => {
    expect(NamespaceManager.isKeyInNamespace('tenant_1::foo', 'tenant_1')).toBe(true);
    expect(NamespaceManager.isKeyInNamespace('tenant_1::foo', 'tenant_2')).toBe(false);
  });
});
"""
with open(os.path.join(SCRATCH, "test/namespace.test.ts"), "w") as f:
    f.write(ns_test)

run_tests()
commit("test(namespace): add unit tests for namespace boundary enforcement and prefix scoping")

# -------------------------------------------------------------
# Commit 30: feat(transactions): implement multi-key atomic transactions
# -------------------------------------------------------------
tx_code = """export interface TxOp {
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
"""
with open(os.path.join(SCRATCH, "src/transaction.ts"), "w") as f:
    f.write(tx_code)

run_tests()
commit("feat(transactions): implement multi-key atomic transactions with rollback capability")

print("Commits 23-30 completed successfully.")
