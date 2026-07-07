import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL variable is missing.");
}

const redis = new Redis(process.env.REDIS_URL, {
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  autoResendUnfulfilledCommands: false,
  retryStrategy: (times) => {
    return Math.min(100 * 2 ** times, 5000);
  },
});

redis.on("connect", () => {
  console.log("[Redis] connected");
});

redis.on("ready", () => {
  console.log("[Redis] Ready");
});

redis.on("error", (error) => {
  console.error("[Redis] Error:", error);
});

redis.on("close", () => {
  console.warn("[Redis] Connection closed");
});

redis.on("reconnecting", (delay: number) => {
  console.log(`[Redis] Reconnecting in ${delay} ms`);
});

export { redis };
