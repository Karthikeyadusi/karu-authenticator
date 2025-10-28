export class CacheService {
  private static instance: CacheService;
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Check if app is running offline
  isOffline(): boolean {
    return !navigator.onLine;
  }

  // Get cache status
  async getCacheStatus(): Promise<{
    isAppCached: boolean;
    cacheSize: number;
    lastUpdated?: Date;
  }> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const appCache = cacheNames.find(name => name.includes('workbox') || name.includes('app'));
        
        if (appCache) {
          const cache = await caches.open(appCache);
          const requests = await cache.keys();
          
          return {
            isAppCached: requests.length > 0,
            cacheSize: requests.length,
            lastUpdated: new Date() // Simplified - could track actual timestamps
          };
        }
      }
      
      return {
        isAppCached: false,
        cacheSize: 0
      };
    } catch (error) {
      console.error('Cache status check failed:', error);
      return {
        isAppCached: false,
        cacheSize: 0
      };
    }
  }

  // Clear all caches (for troubleshooting)
  async clearAllCaches(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared');
      }
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  // Preload critical resources
  async preloadCriticalResources(): Promise<void> {
    try {
      const criticalUrls = [
        '/',
        '/static/css/main.css',
        '/static/js/main.js'
      ];

      if ('caches' in window) {
        const cache = await caches.open('critical-resources');
        await cache.addAll(criticalUrls);
      }
    } catch (error) {
      console.error('Failed to preload critical resources:', error);
    }
  }

  // Check if specific resource is cached
  async isResourceCached(url: string): Promise<boolean> {
    try {
      if ('caches' in window) {
        const response = await caches.match(url);
        return !!response;
      }
      return false;
    } catch (error) {
      console.error('Failed to check resource cache:', error);
      return false;
    }
  }
}