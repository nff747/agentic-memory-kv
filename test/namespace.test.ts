import { describe, it, expect } from 'vitest';
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
