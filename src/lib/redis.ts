// Redis Client — Singleton with lazy connection & graceful
// error handling. If Redis is unavailable the app continues
// to work, falling back to direct database queries.

import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis = createClient({ url: REDIS_URL });

// Error handling — log but never crash the process
redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

redis.on("ready", () => {
  console.log("[Redis] Connected and ready");
});

// Shared connection promise — ensures connect() is
//    awaited exactly once, and all callers wait on it
let connectPromise: Promise<boolean> | null = null;

async function ensureConnected(): Promise<boolean> {
  // Already connected
  if (redis.isReady) return true;

  // If a connection attempt is already in-flight, wait on it
  if (connectPromise) {
    return connectPromise;
  }

  // Start a new connection attempt
  connectPromise = redis
    .connect()
    .then(() => {
      console.log("[Redis] Connection established");
      return true;
    })
    .catch((err) => {
      console.error("[Redis] Connection failed:", (err as Error).message);
      connectPromise = null; // allow retry on next call
      return false;
    });

  return connectPromise;
}

export { redis, ensureConnected };
