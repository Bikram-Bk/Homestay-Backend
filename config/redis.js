import Redis from "ioredis";
import env from "./env.js";

let redisClient = null;

try {
  redisClient = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    tls: env.REDIS_TLS === "true" ? {} : undefined,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.warn("[redis] Max reconnection attempts reached. Continuing in memory/offline mode.");
        return null;
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    console.log("[redis] Connected to Redis successfully.");
  }).catch((err) => {
    console.warn(`[redis] Connection warning: ${err.message}. Redis features will gracefully degrade.`);
  });

  redisClient.on("error", (err) => {
    console.warn(`[redis] Client error: ${err.message}`);
  });
} catch (error) {
  console.warn(`[redis] Initialization error: ${error.message}`);
}

export default redisClient;
