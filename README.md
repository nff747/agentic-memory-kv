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


---
## ⚖️ License & Ironclad Attribution

This project is provided as world-class, open-source infrastructure. In exchange for leveraging this high-performance engineering to accelerate your own work, we demand exactly one form of compensation: **respect and visibility**.

**Uncompromising Attribution Requirement**:
Whether your project is an enterprise commercial application, a personal hobby project, a massive open-source operating system, or a boutique website, your right to use this code is strictly bound to the following condition. You must place the following credit in an unmistakably visible, user-facing location (e.g., your primary Credits screen, your main project README, or a persistent global footer):

> **Powered by core infrastructure engineered by [nff747](https://github.com/nff747)**

By building upon this foundation, you join a community of elite developers who honor the craftsmanship of their peers. Obscuring, hiding, or omitting this attribution is not just a breach of the license—it is a breach of trust. Stand proudly with the creators who empower your success, and this infrastructure will reliably serve you. Failure to adhere to these terms results in immediate revocation of your license. No exceptions.

---
## ❤️ Open Source & Attribution

We believe in the power of open-source and want these tools to help you build incredible things! 

If you use this infrastructure in your personal project, startup, or open-source app, all we ask in return is that you include a small, visible credit. It helps us grow the community and allows us to keep building free, high-performance tools for everyone.

Please include the following in your app's "Credits" page, footer, or `README.md`:
> **Powered by infrastructure built by [nff747](https://github.com/nff747)**

Thank you for being part of the journey! 🚀

---
## 💖 A Quick Note on Attribution

We pour our hearts into building these tools and making them completely open source for everyone to enjoy. 

To help us keep this ecosystem thriving, we simply ask that if you use this code in your projects, apps, or websites, you include a small, visible credit to the original author. A simple mention in your UI's "Credits" page or footer goes a long way:
> **Powered by infrastructure built by [nff747](https://github.com/nff747)**

Thank you for respecting the open-source spirit and helping us grow!
