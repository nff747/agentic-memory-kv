export class NamespaceManager {
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
