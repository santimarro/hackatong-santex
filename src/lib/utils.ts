import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cache entry interface
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

// Cache interface
interface Cache {
  [key: string]: CacheEntry<any>;
}

// Default cache settings
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_ENTRIES = 100; // Limit cache size

// Memory cache store
let memoryCache: Cache = {};

/**
 * Secure cache implementation with expiration, memory usage control, and type safety
 */
export const dataCache = {
  /**
   * Get an item from cache if it exists and is not expired
   * @param key Cache key
   * @returns The cached value or null if not found/expired
   */
  get<T>(key: string): T | null {
    // Prefix with namespace to avoid collisions
    const cacheKey = `app_cache:${key}`;
    
    try {
      const entry = memoryCache[cacheKey];
      if (!entry) return null;
      
      const now = Date.now();
      
      // Check if expired
      if (now > entry.expiresAt) {
        // Clean up expired item
        delete memoryCache[cacheKey];
        return null;
      }
      
      return entry.value as T;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  },
  
  /**
   * Set an item in the cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, value: T, ttl: number = DEFAULT_CACHE_TTL): void {
    // Skip caching null/undefined values
    if (value === null || value === undefined) return;
    
    // Prefix with namespace to avoid collisions
    const cacheKey = `app_cache:${key}`;
    const now = Date.now();
    
    try {
      // Check cache size and purge if needed
      const cacheSize = Object.keys(memoryCache).length;
      if (cacheSize >= MAX_CACHE_ENTRIES) {
        this.purgeOldestEntries(Math.floor(MAX_CACHE_ENTRIES * 0.2)); // Purge 20% of entries
      }
      
      // Store in memory cache
      memoryCache[cacheKey] = {
        value,
        timestamp: now,
        expiresAt: now + ttl
      };
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },
  
  /**
   * Invalidate a specific cache entry
   * @param key Cache key to invalidate
   */
  invalidate(key: string): void {
    const cacheKey = `app_cache:${key}`;
    try {
      delete memoryCache[cacheKey];
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  },
  
  /**
   * Invalidate multiple cache entries by prefix
   * @param prefix Cache key prefix to match
   */
  invalidateByPrefix(prefix: string): void {
    const fullPrefix = `app_cache:${prefix}`;
    try {
      Object.keys(memoryCache).forEach(key => {
        if (key.startsWith(fullPrefix)) {
          delete memoryCache[key];
        }
      });
    } catch (error) {
      console.error('Cache prefix invalidation error:', error);
    }
  },
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    memoryCache = {};
  },
  
  /**
   * Removes oldest entries from the cache
   * @param count Number of entries to remove
   */
  private purgeOldestEntries(count: number): void {
    try {
      const entries = Object.entries(memoryCache);
      
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest entries up to count
      entries.slice(0, count).forEach(([key]) => {
        delete memoryCache[key];
      });
    } catch (error) {
      console.error('Cache purge error:', error);
    }
  }
};

/**
 * Wraps an async function with caching capabilities
 * @param fn The async function to wrap with caching
 * @param keyFn Function to generate a cache key from the arguments
 * @param ttl Cache TTL in milliseconds
 * @returns The wrapped function with caching
 */
export function withCache<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  keyFn: (...args: Args) => string,
  ttl: number = DEFAULT_CACHE_TTL
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    // Generate cache key
    const key = keyFn(...args);
    
    // Try to get from cache first
    const cached = dataCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Not in cache, call the original function
    const result = await fn(...args);
    
    // Cache the result
    dataCache.set(key, result, ttl);
    
    return result;
  };
}
