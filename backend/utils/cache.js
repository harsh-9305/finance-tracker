const redisClient = require('../config/redis');

// Cache durations in seconds
const CACHE_DURATION = {
  USER_ANALYTICS: 900,    // 15 minutes
  CATEGORIES: 3600,       // 1 hour
  TRANSACTIONS: 600,      // 10 minutes
};

class CacheManager {
  // Get data from cache
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Set data in cache
  async set(key, data, duration = 600) {
    try {
      await redisClient.setEx(key, duration, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  // Delete specific key
  async delete(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Delete keys matching pattern
  async deletePattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  }

  // Clear all cache
  async clear() {
    try {
      await redisClient.flushAll();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Generate cache key for user analytics
  getUserAnalyticsKey(userId, period = 'all') {
    return `analytics:user:${userId}:${period}`;
  }

  // Generate cache key for categories
  getCategoriesKey(userId) {
    return `categories:user:${userId}`;
  }

  // Generate cache key for transactions
  getTransactionsKey(userId, filters = {}) {
    const filterStr = Object.keys(filters).length > 0 
      ? `:${JSON.stringify(filters)}` 
      : '';
    return `transactions:user:${userId}${filterStr}`;
  }

  // Invalidate user-related caches
  async invalidateUserCache(userId) {
    await this.deletePattern(`analytics:user:${userId}*`);
    await this.deletePattern(`transactions:user:${userId}*`);
    await this.deletePattern(`categories:user:${userId}*`);
  }
}

module.exports = new CacheManager();