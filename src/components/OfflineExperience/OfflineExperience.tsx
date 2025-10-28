import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, CheckCircle2, Clock } from 'lucide-react';

interface OfflineExperienceProps {
  className?: string;
}

export const OfflineExperience: React.FC<OfflineExperienceProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check if app is installed
    const checkInstalled = () => {
      setIsInstalled(
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
      );
    };

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    checkInstalled();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (installEvent) {
      installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === 'accepted') {
        setInstallEvent(null);
        setIsInstalled(true);
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-google-border p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
        <Wifi className="w-5 h-5 mr-2 text-google-blue" />
        Offline Experience
      </h3>

      <div className="space-y-3">
        {/* Current Status */}
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`} />
          <span className="text-sm font-medium">
            {isOnline ? 'Connected' : 'Offline Mode'}
          </span>
          {isOnline ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-orange-600" />
          )}
        </div>

        {/* Offline Features */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Generate TOTP codes offline</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Manage accounts locally</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Camera QR scanning works</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Auto-sync when online</span>
          </div>
        </div>

        {/* Install Prompt */}
        {!isInstalled && installEvent && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <Download className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Install for better offline experience
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Add to home screen for instant access and native app feel
                </p>
                <button
                  onClick={handleInstall}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Install App
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Installed Status */}
        {isInstalled && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">App installed</p>
                <p className="text-xs text-green-700">Optimized for offline use</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};