const redis = require('redis');
require('dotenv').config();

let redisClient = null;

if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: true,
      rejectUnauthorized: false,
    },
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
    redisClient = null;
  });

  (async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      console.error('❌ Failed to connect to Redis:', err);
      redisClient = null;
    }
  })();
} else {
  console.log('⚠️ Redis URL not provided, running without cache');
}

module.exports = redisClient;