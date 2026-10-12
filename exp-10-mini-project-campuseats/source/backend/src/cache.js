// Cache used for the menu and for the daily token counter.
// Redis in production; an in-process map for tests and local development.

function memoryCache() {
  const data = new Map();
  return {
    async get(key) {
      const entry = data.get(key);
      if (!entry || (entry.expires && entry.expires < Date.now())) return null;
      return entry.value;
    },
    async set(key, value, ttlSeconds) {
      data.set(key, { value, expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
    },
    async del(key) {
      data.delete(key);
    },
    async incr(key) {
      const next = Number((await this.get(key)) || 0) + 1;
      data.set(key, { value: String(next), expires: null });
      return next;
    },
    async ping() {
      return true;
    },
  };
}

function redisCache(url) {
  const Redis = require('ioredis');
  const redis = new Redis(url, { maxRetriesPerRequest: 2 });
  return {
    get: (key) => redis.get(key),
    set: (key, value, ttlSeconds) =>
      ttlSeconds ? redis.set(key, value, 'EX', ttlSeconds) : redis.set(key, value),
    del: (key) => redis.del(key),
    async incr(key) {
      const value = await redis.incr(key);
      if (value === 1) await redis.expire(key, 60 * 60 * 36);
      return value;
    },
    async ping() {
      return (await redis.ping()) === 'PONG';
    },
  };
}

module.exports = { memoryCache, redisCache };
