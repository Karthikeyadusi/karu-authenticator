import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export const PWAUpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setRegistration(registration);

        // Listen for update available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          setShowUpdate(true);
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    console.log('Update button clicked');
    console.log('Registration:', registration);
    console.log('Waiting worker:', registration?.waiting);
    
    if (registration && registration.waiting) {
      console.log('Sending SKIP_WAITING message to service worker');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Listen for controllerchange to reload
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed, reloading...');
        window.location.reload();
      });
    } else {
      console.log('No waiting service worker, forcing reload');
      window.location.reload();
    }
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg border border-green-400">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5" />
            <h3 className="font-semibold">Update Available</h3>
          </div>
          <button
            onClick={() => setShowUpdate(false)}
            className="text-green-100 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-green-100 text-sm mb-3">
          A new version of Karu Authenticator is available with improvements and bug fixes.
        </p>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowUpdate(false)}
            className="flex-1 bg-green-400 hover:bg-green-300 text-green-900 font-medium py-2 px-3 rounded-md transition-colors text-sm"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 bg-white text-green-600 hover:bg-green-50 font-medium py-2 px-3 rounded-md transition-colors text-sm"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
};