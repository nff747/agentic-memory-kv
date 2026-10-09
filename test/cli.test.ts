import { describe, it, expect } from 'vitest';
import { runCLI } from '../src/cli';

describe('CLI runner', () => {
  it('executes stats diagnostic command with code 0', () => {
    expect(runCLI(['node', 'cli.js', 'stats'])).toBe(0);
    expect(runCLI(['node', 'cli.js', 'help'])).toBe(0);
  });
});
