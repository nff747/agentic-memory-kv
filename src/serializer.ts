export class PayloadSerializer {
  public static serialize(value: any): Uint8Array {
    if (value instanceof Uint8Array) {
      const out = new Uint8Array(value.length + 1);
      out[0] = 1; // Type tag: Binary
      out.set(value, 1);
      return out;
    }
    if (typeof value === 'bigint') {
      const json = JSON.stringify({ __type: 'bigint', val: value.toString() });
      const encoded = Buffer.from(json, 'utf-8');
      const out = new Uint8Array(encoded.length + 1);
      out[0] = 2; // Type tag: BigInt JSON
      out.set(encoded, 1);
      return out;
    }

    const jsonStr = JSON.stringify(value);
    const buf = Buffer.from(jsonStr, 'utf-8');
    const out = new Uint8Array(buf.length + 1);
    out[0] = 0; // Type tag: Generic JSON
    out.set(buf, 1);
    return out;
  }

  public static deserialize<T = any>(bytes: Uint8Array): T {
    if (bytes.length === 0) return undefined as any;
    const tag = bytes[0];
    const data = bytes.subarray(1);

    if (tag === 1) {
      return new Uint8Array(data) as any;
    }

    const str = Buffer.from(data).toString('utf-8');
    const parsed = JSON.parse(str);
    if (tag === 2 && parsed && parsed.__type === 'bigint') {
      return BigInt(parsed.val) as any;
    }
    return parsed;
  }
}
