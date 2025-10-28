import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      // Auto-hide message after 5 seconds
      setTimeout(() => setShowOfflineMessage(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm transition-all duration-300 ${
      isOnline ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
    } border rounded-lg p-3 shadow-lg`}>
      <div className="flex items-center space-x-3">
        {isOnline ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Back online!</p>
              <p className="text-xs text-green-600">App synced successfully</p>
            </div>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">You're offline</p>
              <p className="text-xs text-orange-600">App still works - OTPs generate locally</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};