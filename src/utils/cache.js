/**
 * Simple in-memory cache with TTL support
 */

class Cache {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour default
    this.cleanupInterval = options.cleanupInterval || 600000; // 10 minutes

    // Start cleanup interval
    if (this.cleanupInterval > 0) {
      this._cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.cleanupInterval);
    }
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(...args) {
    return JSON.stringify(args);
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = null) {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete key from cache
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }

  /**
   * Destroy cache and cleanup timer
   */
  destroy() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
    }
    this.clear();
  }
}

// Singleton instance for global use
let globalCache = null;

/**
 * Get or create global cache instance
 */
function getCache(options) {
  if (!globalCache) {
    globalCache = new Cache(options);
  }
  return globalCache;
}

module.exports = {
  Cache,
  getCache,
};

