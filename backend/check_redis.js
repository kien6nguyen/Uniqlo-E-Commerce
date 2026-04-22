const redis = require("connect-redis");
console.log(redis);
console.log("default:", redis.default);
console.log("RedisStore:", redis.RedisStore);
