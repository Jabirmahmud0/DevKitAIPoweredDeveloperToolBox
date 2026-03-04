import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash is configured
const isUpstashConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

let redis: Redis | null = null;
let aiLimiterInstance: Ratelimit | null = null;
let executeLimiterInstance: Ratelimit | null = null;

// Initialize only if Upstash is configured
if (isUpstashConfigured) {
    try {
        redis = Redis.fromEnv();
        
        /** 10 AI requests per minute per IP */
        aiLimiterInstance = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(10, "1 m"),
            prefix: "devkit:ai",
        });

        /** 100 code executions per hour per IP */
        executeLimiterInstance = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(100, "1 h"),
            prefix: "devkit:execute",
        });
    } catch (error) {
        console.warn("[Upstash Redis] Failed to initialize:", error);
    }
}

/**
 * Dummy rate limiter that always succeeds (used when Upstash is not configured)
 */
const dummyLimiter = {
    limit: async () => ({
        success: true,
        limit: 10,
        remaining: 10,
        reset: Date.now() + 60000,
    }),
};

/**
 * AI Rate Limiter - falls back to dummy if Upstash not configured
 */
export const aiLimiter = aiLimiterInstance || dummyLimiter;

/**
 * Code Execution Rate Limiter - falls back to dummy if Upstash not configured
 */
export const executeLimiter = executeLimiterInstance || dummyLimiter;

/**
 * Helper: returns 429 response if rate-limited, else null
 */
export async function checkRateLimit(
    limiter: typeof aiLimiter,
    identifier: string
): Promise<Response | null> {
    const { success, reset, remaining } = await limiter.limit(identifier);
    if (!success) {
        return new Response(
            JSON.stringify({
                error: "Rate limit exceeded",
                retryAfter: Math.ceil((reset - Date.now()) / 1000),
            }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "X-RateLimit-Remaining": String(remaining),
                    "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
                },
            }
        );
    }
    return null;
}

/**
 * Check if Upstash Redis is configured and active
 */
export function isRateLimitingActive(): boolean {
    return isUpstashConfigured && aiLimiterInstance !== null;
}
