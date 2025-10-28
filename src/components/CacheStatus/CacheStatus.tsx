import React, { useState, useEffect } from 'react';
import { HardDrive, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { CacheService } from '../../services/cache';

export const CacheStatus: React.FC = () => {
  const { isDark } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStatus, setCacheStatus] = useState<{
    isAppCached: boolean;
    cacheSize: number;
  }>({ isAppCached: false, cacheSize: 0 });

  const cacheService = CacheService.getInstance();

  useEffect(() => {
    const updateStatus = async () => {
      const status = await cacheService.getCacheStatus();
      setCacheStatus(status);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    updateStatus();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [cacheService]);

  return (
    <div className={`flex items-center space-x-4 text-xs ${
      isDark ? 'text-gray-400' : 'text-google-gray'
    }`}>
      {/* Online/Offline Status */}
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="w-3 h-3 text-green-600" />
        ) : (
          <WifiOff className="w-3 h-3 text-orange-600" />
        )}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Offline Ready Badge */}
      {cacheStatus.isAppCached && (
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isDark 
            ? 'bg-green-900/30 text-green-400' 
            : 'bg-green-100 text-green-800'
        }`}>
          ✓ Works Offline
        </div>
      )}
    </div>
  );
};