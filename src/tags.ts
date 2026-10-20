export class TagIndex {
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
        const intersection = new Set<string>();
        for (const k of result) {
          if (keys.has(k)) {
            intersection.add(k);
          }
        }
        result = intersection;
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
