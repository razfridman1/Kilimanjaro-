import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting.
 *
 * Uses Upstash Redis when configured (recommended for production), and
 * silently degrades to an in-memory bucket in dev / when env vars are
 * missing. The in-memory limiter is per-process, so it is NOT safe for
 * multi-instance deployments — set the Upstash variables on Vercel.
 */

type LimitResult = { success: boolean; remaining: number; reset: number };

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const upstashLimiter = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "motivation:rl",
    })
  : null;

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();
const MEM_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MEM_MAX = 20;

function memoryLimit(key: string): LimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + MEM_WINDOW_MS });
    return { success: true, remaining: MEM_MAX - 1, reset: now + MEM_WINDOW_MS };
  }
  bucket.count += 1;
  return {
    success: bucket.count <= MEM_MAX,
    remaining: Math.max(0, MEM_MAX - bucket.count),
    reset: bucket.resetAt,
  };
}

/**
 * Check the rate limit for a given identifier (e.g. `${tenantId}:${userId}`).
 */
export async function rateLimit(identifier: string): Promise<LimitResult> {
  if (upstashLimiter) {
    const r = await upstashLimiter.limit(identifier);
    return {
      success: r.success,
      remaining: r.remaining,
      reset: r.reset,
    };
  }
  return memoryLimit(identifier);
}
