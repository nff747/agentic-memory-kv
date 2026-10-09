const NULL_NODE = -1;

export class LruListManager {
  private prevPointers: Int32Array;
  private nextPointers: Int32Array;
  private head: number = NULL_NODE;
  private tail: number = NULL_NODE;
  private length: number = 0;

  constructor(capacity: number) {
    this.prevPointers = new Int32Array(capacity).fill(NULL_NODE);
    this.nextPointers = new Int32Array(capacity).fill(NULL_NODE);
  }

  public touch(nodeIdx: number): void {
    if (this.head === nodeIdx) return;
    this.remove(nodeIdx);

    // Insert at head
    this.nextPointers[nodeIdx] = this.head;
    this.prevPointers[nodeIdx] = NULL_NODE;

    if (this.head !== NULL_NODE) {
      this.prevPointers[this.head] = nodeIdx;
    }
    this.head = nodeIdx;

    if (this.tail === NULL_NODE) {
      this.tail = nodeIdx;
    }
    this.length++;
  }

  public popTail(): number {
    if (this.tail === NULL_NODE) return NULL_NODE;
    const evicted = this.tail;
    this.remove(evicted);
    return evicted;
  }

  public remove(nodeIdx: number): void {
    if (nodeIdx < 0 || nodeIdx >= this.prevPointers.length) return;
    const prev = this.prevPointers[nodeIdx];
    const next = this.nextPointers[nodeIdx];

    if (prev !== NULL_NODE) {
      this.nextPointers[prev] = next;
    }
    if (this.head === nodeIdx) {
      this.head = next;
    }

    if (next !== NULL_NODE) {
      this.prevPointers[next] = prev;
    }
    if (this.tail === nodeIdx) {
      this.tail = prev;
    }

    this.prevPointers[nodeIdx] = NULL_NODE;
    this.nextPointers[nodeIdx] = NULL_NODE;
    if (this.length > 0) this.length--;
  }

  public getHead(): number { return this.head; }
  public getTail(): number { return this.tail; }
  public size(): number { return this.length; }
}
