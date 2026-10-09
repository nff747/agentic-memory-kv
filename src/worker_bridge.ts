export interface WorkerBufferHandle {
  buffer: SharedArrayBuffer;
  byteLength: number;
}

export class WorkerBridge {
  public static exportHandle(sab: SharedArrayBuffer): WorkerBufferHandle {
    return {
      buffer: sab,
      byteLength: sab.byteLength
    };
  }

  public static importHandle(handle: WorkerBufferHandle): SharedArrayBuffer {
    if (!handle.buffer || !(handle.buffer instanceof SharedArrayBuffer)) {
      throw new Error('Invalid SharedArrayBuffer handle');
    }
    return handle.buffer;
  }
}
