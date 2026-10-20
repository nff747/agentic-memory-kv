export class TtlManager {
  public static calculateExpiry(ttlMs: number): number {
    if (ttlMs <= 0) return 0; // Permanent
    return Date.now() + ttlMs;
  }

  /**
   * Applies randomized jitter to TTL to prevent thundering herd / cache stampede problems.
   */
  public static calculateJitteredExpiry(ttlMs: number, jitterRatio: number = 0.1): number {
    if (ttlMs <= 0) return 0;
    const clampedRatio = Math.max(0, Math.min(0.5, jitterRatio));
    const delta = (Math.random() * 2 - 1) * (ttlMs * clampedRatio);
    const effectiveTtl = Math.max(1, Math.round(ttlMs + delta));
    return Date.now() + effectiveTtl;
  }

  public static isExpired(expiresAt: number): boolean {
    if (expiresAt === 0) return false;
    return Date.now() > expiresAt;
  }

  public static isExpiringWithin(expiresAt: number, windowMs: number): boolean {
    if (expiresAt === 0) return false;
    const remaining = expiresAt - Date.now();
    return remaining > 0 && remaining <= windowMs;
  }

  public static renew(currentExpiry: number, extensionMs: number): number {
    if (extensionMs <= 0) return currentExpiry;
    const base = Math.max(Date.now(), currentExpiry);
    return base + extensionMs;
  }

  public static remainingMs(expiresAt: number): number {
    if (expiresAt === 0) return Infinity;
    return Math.max(0, expiresAt - Date.now());
  }
}
