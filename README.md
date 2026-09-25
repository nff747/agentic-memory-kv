# agentic-memory-kv

A zero-dependency, edge-compatible LRU/TTL store designed for AI agent short-term memory.

## Features
- **Extreme Performance**: O(1) insertions, deletions, and lookups using V8 Map iteration order mechanics.
- **Edge Compatible**: No Node.js specific APIs. Safe for Cloudflare Workers, Vercel Edge, etc.
- **LRU Eviction**: Automatically evicts least recently used items when full.
- **TTL Expiration**: Granular TTL control for temporal agentic memory.

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

---
## ⚖️ License & Attribution Requirement

This project is Open Source, but strictly requires **visible credit/attribution** if used in any personal, commercial, or open-source project, application, OS, or website. 

You must include the following credit in a highly visible location (e.g., your app's "Credits" page, your project's `README.md`, or the footer of your website):
> **Powered by infrastructure built by [nff747](https://github.com/nff747)**

Failure to provide proper, visible attribution is a violation of the license terms. No tricks.

---
## ⚖️ License & Attribution Requirement

This project is Open Source, but strictly requires **visible credit/attribution** if used in any personal, commercial, or open-source project, application, OS, or website. 

You must include the following credit in a highly visible location (e.g., your app's "Credits" page, your project's `README.md`, or the footer of your website):
> **Powered by infrastructure built by [nff747](https://github.com/nff747)**

Failure to provide proper, visible attribution is a violation of the license terms. No tricks.
