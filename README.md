# agentic-memory-kv

A zero-dependency, edge-compatible LRU/TTL store designed for AI agent short-term memory. Built for speed and scale.

## Features
- **Extreme Performance**: O(1) insertions, deletions, and lookups using V8 Map iteration order mechanics.
- **Edge Compatible**: No Node.js specific APIs. Safe for Cloudflare Workers, Vercel Edge, etc.
- **LRU Eviction**: Automatically evicts least recently used items when full.
- **TTL Expiration**: Granular TTL control for temporal agentic memory.

## Installation

```bash
npm install agentic-memory-kv
```

## Usage

```typescript
import { AgenticMemoryKV } from 'agentic-memory-kv';

// Initialize cache with 100 max items and default 1 minute TTL
const memory = new AgenticMemoryKV<string, string>({ 
  maxSize: 100, 
  defaultTtl: 60000 
});

memory.set('context', 'important stuff');
memory.get('context'); // 'important stuff'
```

## License

This project is licensed under the [MIT License](LICENSE).
