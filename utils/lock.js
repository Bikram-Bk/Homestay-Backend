import redisClient from "../config/redis.js";

/**
 * Acquire a distributed Redis lock.
 * @param {string} key    - Unique lock key
 * @param {number} ttlMs  - Lock expiry in milliseconds (default 5s)
 * @returns {boolean}     - true if lock acquired, false if already locked
 */
export async function acquireLock(key, ttlMs = 5000) {
  if (!redisClient) {
    // Redis offline — gracefully skip locking (DB overlap check still runs)
    console.warn("[lock] Redis unavailable, skipping distributed lock for:", key);
    return true;
  }

  try {
    // SET key value NX PX ttl — atomic, sets only if key does NOT exist
    const result = await redisClient.set(key, "1", "NX", "PX", ttlMs);
    return result === "OK"; // "OK" = lock acquired; null = already locked
  } catch (err) {
    console.warn("[lock] acquireLock error:", err.message);
    return true; // Redis error — fail open (DB check will still guard)
  }
}

/**
 * Release a distributed Redis lock.
 * @param {string} key - Lock key to release
 */
export async function releaseLock(key) {
  if (!redisClient) return;

  try {
    await redisClient.del(key);
  } catch (err) {
    console.warn("[lock] releaseLock error:", err.message);
    // TTL will auto-expire the key anyway
  }
}
