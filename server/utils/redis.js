const { createClient } = require('redis');

let redisClient = null;
let isRedisConnected = false;

// Simple in-memory fallback cache
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = createClient({ url: redisUrl });

  redisClient.on('error', (err) => {
    console.warn('Redis connection failure, falling back to in-memory cache:', err.message);
    isRedisConnected = false;
  });

  redisClient.on('connect', () => {
    console.log('Successfully connected to Redis server.');
    isRedisConnected = true;
  });

  try {
    // Attempt connection with timeout
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 3000))
    ]);
  } catch (err) {
    console.warn('Redis could not connect on startup. Using in-memory fallback.');
    isRedisConnected = false;
  }
};

initRedis();

const get = async (key) => {
  if (isRedisConnected) {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      console.error('Redis GET error:', err);
    }
  }
  
  // Fallback memory cache check
  if (memoryCache.has(key)) {
    const expiry = memoryCacheExpiry.get(key);
    if (expiry && expiry < Date.now()) {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
      return null;
    }
    return memoryCache.get(key);
  }
  return null;
};

const set = async (key, value, expirySeconds = 300) => {
  if (isRedisConnected) {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: expirySeconds
      });
      return true;
    } catch (err) {
      console.error('Redis SET error:', err);
    }
  }

  // Fallback memory cache set
  memoryCache.set(key, value);
  memoryCacheExpiry.set(key, Date.now() + (expirySeconds * 1000));
  return true;
};

const del = async (key) => {
  if (isRedisConnected) {
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.error('Redis DEL error:', err);
    }
  }
  memoryCache.delete(key);
  memoryCacheExpiry.delete(key);
  return true;
};

module.exports = {
  get,
  set,
  del
};
