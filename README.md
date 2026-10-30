# agentic-memory-kv

Experimental JavaScript shared-memory and in-memory data structure components. This package is not a distributed database, durable storage system, or production-ready agent memory service. It has not been independently security audited or verified across browsers and edge runtimes.

`AgenticMemoryKV` stores signed 64-bit bigint keys and values in a `SharedArrayBuffer`. The key `-1n` is reserved. Instances attaching to the same buffer must use the same `maxSize`. TTL is in milliseconds; `0` means no expiry. Under a shared lock, lookups validate their local index and fall back to a linear scan when another instance changes the buffer. This can be O(n), especially for misses.

```ts
import { AgenticMemoryKV } from 'agentic-memory-kv';
const memory = new AgenticMemoryKV({ maxSize: 1000, defaultTtl: 30_000 });
memory.set(100n, 4200n);
console.log(memory.get(100n));
```

Shared memory requires a runtime that supports `SharedArrayBuffer` and atomics. A contended lock cannot be acquired when `Atomics.wait` is unavailable; the operation throws rather than continuing without a lock. A worker terminating while holding the lock has no recovery mechanism. Test your target platform and worker lifecycle before using it.

The other exported components are independent utilities, not automatically integrated database features. In particular, `MemoryTransaction` records operations and does not atomically apply or roll them back; `WriteAheadLog` stores records in memory and is not durable. Snapshot and some other helpers rely on Node APIs. Do not assume that all exports work in a browser or edge runtime, or that memory, tags and vector indexes are shared between workers.

Build and test with `npm install`, `npm run build` and `npm test`. The CLI's `stats` command reports that it is not connected to a live store; it does not inspect a running service.

[Apache License 2.0](LICENSE).
