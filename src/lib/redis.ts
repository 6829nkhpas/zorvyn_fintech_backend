// ─────────────────────────────────────────────────────────
// Redis Client — Singleton with graceful error handling
// If Redis is unavailable the app continues to work,
// falling back to direct database queries.
// ─────────────────────────────────────────────────────────

import { createClient, type RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis: RedisClientType = createClient({ url: REDIS_URL });

// ── Error handling — log but never crash the process ────
redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

redis.on("connect", () => {
  console.log("[Redis] Connected successfully");
});

redis.on("reconnecting", () => {
  console.log("[Redis] Reconnecting…");
});

// ── Connect (fire-and-forget; errors are caught above) ──
redis.connect().catch((err) => {
  console.error("[Redis] Initial connection failed:", err.message);
});

/**
 * Returns true when the Redis client is connected and ready
 * to accept commands. Use this guard before every cache call
 * so the app gracefully degrades to direct DB queries.
 */
export function isRedisReady(): boolean {
  return redis.isReady;
}

export { redis };
