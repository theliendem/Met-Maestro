/**
 * WebView HTML Content Cache
 * 
 * Optimizes WebView initialization by caching HTML content templates
 * and reducing re-generation overhead.
 */

interface CacheEntry {
  content: string;
  timestamp: number;
  hits: number;
}

class WebViewCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxAge = 5 * 60 * 1000; // 5 minutes
  private readonly maxEntries = 10;
  
  /**
   * Generate a cache key based on content parameters
   */
  private generateKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    
    // Create a simple hash from the sorted params
    let hash = 0;
    for (let i = 0; i < sortedParams.length; i++) {
      const char = sortedParams.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `webview_${Math.abs(hash)}`;
  }
  
  /**
   * Get cached HTML content if available and valid
   */
  get(params: Record<string, any>): string | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count and return content
    entry.hits++;
    return entry.content;
  }
  
  /**
   * Store HTML content in cache
   */
  set(params: Record<string, any>, content: string): void {
    const key = this.generateKey(params);
    
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
      hits: 0
    });
  }
  
  /**
   * Find the oldest (least recently used) cache entry
   */
  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
  
  /**
   * Clear expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    totalHits: number;
    entries: Array<{ key: string; hits: number; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 16) + '...',
      hits: entry.hits,
      age: now - entry.timestamp
    }));
    
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    
    return {
      size: this.cache.size,
      totalHits,
      entries
    };
  }
  
  /**
   * Clear all cached content
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const webViewCache = new WebViewCache();

// Cleanup expired entries every 2 minutes
setInterval(() => {
  webViewCache.cleanup();
}, 2 * 60 * 1000);