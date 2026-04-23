// Redis Setup
const { createClient } = require("redis");
const { RedisStore } = require("connect-redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const url = require("url");

const rawRedisUrl = (process.env.REDIS_URL || "redis://127.0.0.1:6379").trim();
let redisUrlParsed;
try {
  redisUrlParsed = url.parse(rawRedisUrl);
} catch (e) {
  console.error("Malformed REDIS_URL:", e.message);
}

const redisConfig = {
  url: rawRedisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 500, 5000),
    connectTimeout: 20000,
    keepAlive: 5000,
    tls: rawRedisUrl.startsWith("rediss") ? { servername: redisUrlParsed?.hostname } : undefined,
    rejectUnauthorized: false
  },
  pingInterval: 5000,
};

const redisClient = createClient(redisConfig);
const pubClient = createClient(redisConfig);
const subClient = createClient(redisConfig);

// Error handlers
const handleError = (label) => (err) => console.error(`Redis ${label} Error:`, err);
redisClient.on("error", handleError("Main"));
pubClient.on("error", handleError("Pub"));
subClient.on("error", handleError("Sub"));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log("Redis Client for Session connected");

    await Promise.all([pubClient.connect(), subClient.connect()]);
    console.log("Redis Clients for Socket.io connected");
  } catch (err) {
    console.error("Redis Initial Connection Error:", err);
  }
})();
