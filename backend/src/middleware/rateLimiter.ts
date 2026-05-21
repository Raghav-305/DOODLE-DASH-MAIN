interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, Map<string, RateLimitEntry>> = new Map();

  public checkLimit(
    socketId: string,
    eventType: string,
    maxRequests: number,
    windowMs: number
  ): boolean {
    if (!this.limits.has(socketId)) {
      this.limits.set(socketId, new Map());
    }

    const userLimits = this.limits.get(socketId)!;
    const now = Date.now();

    if (!userLimits.has(eventType)) {
      userLimits.set(eventType, { count: 0, resetTime: now + windowMs });
    }

    const entry = userLimits.get(eventType)!;

    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    entry.count++;

    return entry.count <= maxRequests;
  }

  public clearUser(socketId: string): void {
    this.limits.delete(socketId);
  }
}
