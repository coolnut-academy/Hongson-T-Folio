/**
 * Cache Utilities for Performance Optimization
 * Provides localStorage-based caching with TTL support
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Set item in cache with TTL
 */
export function setCache<T>(key: string, data: T, ttlMs: number = 60000): void {
  if (typeof window === 'undefined') return;
  
  const cacheItem: CacheItem<T> = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.warn('Failed to set cache:', error);
  }
}

/**
 * Get item from cache if still valid
 */
export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const cacheItem: CacheItem<T> = JSON.parse(cached);
    const now = Date.now();
    const age = now - cacheItem.timestamp;
    
    // Check if cache is still valid
    if (age < cacheItem.ttl) {
      return cacheItem.data;
    } else {
      // Cache expired - remove it
      localStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.warn('Failed to get cache:', error);
    return null;
  }
}

/**
 * Clear specific cache item
 */
export function clearCache(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

/**
 * Clear all expired cache items
 */
export function clearExpiredCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          const cacheItem: CacheItem<unknown> = JSON.parse(item);
          if (cacheItem.timestamp && cacheItem.ttl) {
            const age = Date.now() - cacheItem.timestamp;
            if (age >= cacheItem.ttl) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Not a cache item - skip
        }
      }
    });
  } catch (error) {
    console.warn('Failed to clear expired cache:', error);
  }
}

// Cache keys
export const CACHE_KEYS = {
  SITE_STATUS: 'hongson_site_status',
  USER_PERMISSIONS: 'hongson_user_permissions',
  ADMIN_ACCESS: 'adminMaintenanceAccess',
  ADMIN_ACCESS_TIME: 'adminMaintenanceAccessTime',
} as const;

