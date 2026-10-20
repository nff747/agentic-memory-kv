import { describe, it, expect } from 'vitest';
import { matchesPattern, filterKeysByPattern } from '../src/pattern.js';

describe('Key Pattern Matching Engine', () => {
  it('matches universal wildcard pattern *', () => {
    expect(matchesPattern('users:123', '*')).toBe(true);
    expect(matchesPattern('', '*')).toBe(true);
  });

  it('matches prefix patterns with trailing asterisk', () => {
    expect(matchesPattern('session:agent:alpha', 'session:*')).toBe(true);
    expect(matchesPattern('cache:agent:alpha', 'session:*')).toBe(false);
  });

  it('matches single character wildcard ?', () => {
    expect(matchesPattern('user:1', 'user:?')).toBe(true);
    expect(matchesPattern('user:12', 'user:?')).toBe(false);
  });

  it('matches character set brackets [0-9]', () => {
    expect(matchesPattern('log_5', 'log_[0-9]')).toBe(true);
    expect(matchesPattern('log_x', 'log_[0-9]')).toBe(false);
  });

  it('filters key sets according to glob pattern', () => {
    const keys = [
      'agent:memory:short',
      'agent:memory:long',
      'system:config',
      'agent:scratchpad'
    ];
    const filtered = filterKeysByPattern(keys, 'agent:memory:*');
    expect(filtered).toEqual(['agent:memory:short', 'agent:memory:long']);
  });
});
