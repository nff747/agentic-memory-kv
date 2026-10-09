export class TtlManager {
  public static calculateExpiry(ttlMs: number): number {
    if (ttlMs <= 0) return 0; // Permanent
    return Date.now() + ttlMs;
  }

  public static isExpired(expiresAt: number): boolean {
    if (expiresAt === 0) return false;
    return Date.now() > expiresAt;
  }

  public static remainingMs(expiresAt: number): number {
    if (expiresAt === 0) return Infinity;
    return Math.max(0, expiresAt - Date.now());
  }
}
