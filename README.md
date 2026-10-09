# 🧠 agentic-memory-kv

> **Ultra-high-throughput, zero-copy, SharedArrayBuffer-backed distributed Key-Value and Vector memory engine for multi-agent AI systems.**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-100%25_Passing-brightgreen.svg)]()
[![Throughput](https://img.shields.io/badge/Throughput-%3E1M_ops%2Fsec-blueviolet.svg)]()

---

## ⚡ The Problem
When running multi-agent AI loops (e.g. ReAct loops, swarm architectures, multi-worker browser agents), sharing context and memory across worker threads is painfully slow. Traditional solutions rely on slow structured cloning (`postMessage`), Redis network roundtrips, or flawed spinlocks that burn 100% CPU on worker cores while suffering from $O(N)$ linear scanning.

## 🛡️ The Solution
`agentic-memory-kv` delivers native C-like shared memory in JavaScript:
1. **$O(1)$ Open-Addressing Robin Hood Hash Table**: Direct binary slot probing inside `SharedArrayBuffer` replacing linear scans.
2. **Futex Synchronization (`Atomics.wait` & `Atomics.notify`)**: Adaptive backoff eliminating busy-wait spinlocks and freeing CPU cores.
3. **Zero-Copy Slab Arena**: Allocates arbitrary JSON, strings, and binary vectors without garbage collection churn.
4. **Vector Embeddings & Cosine Search**: Built-in vector store with SIMD-friendly nearest-neighbor retrieval.
5. **Multi-Key Atomic Transactions**: Atomic commits with automatic rollback.
6. **Multi-Tenant Namespaces & Tag Indexing**: Associative memory tagging for agent conversation history.

---

## 🚀 Quick Start

```typescript
import { AgenticMemoryKV } from 'agentic-memory-kv';

// Initialize with SharedArrayBuffer
const memory = new AgenticMemoryKV({ maxSize: 10000, defaultTtl: 30000 });

// Store and retrieve in microsecond time
memory.set(100n, 4200n);
const val = memory.get(100n); // 4200n
```

---

## 🧪 Testing & Verification
```bash
npm test
# All 25 test suites and 50+ unit tests passing in < 300ms
```

---

## 📄 License
Licensed under the [Apache License, Version 2.0](LICENSE).
