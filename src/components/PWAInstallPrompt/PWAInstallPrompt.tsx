import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Tablet } from 'lucide-react';

interface PWAInstallPromptProps {
  onClose: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    
    // Check if iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      onClose();
    }
  };

  if (isStandalone) {
    return null; // Already installed
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg border border-blue-400">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <h3 className="font-semibold">Install Karu Authenticator</h3>
        </div>
        <button
          onClick={onClose}
          className="text-blue-100 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-blue-100 text-sm mb-4">
        Install our app for the best experience with offline support, faster loading, and native features.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <Smartphone className="w-6 h-6 mx-auto mb-1 text-blue-200" />
          <span className="text-xs text-blue-100">Mobile</span>
        </div>
        <div className="text-center">
          <Tablet className="w-6 h-6 mx-auto mb-1 text-blue-200" />
          <span className="text-xs text-blue-100">Tablet</span>
        </div>
        <div className="text-center">
          <Monitor className="w-6 h-6 mx-auto mb-1 text-blue-200" />
          <span className="text-xs text-blue-100">Desktop</span>
        </div>
      </div>

      {/* Android/Chrome Install */}
      {deferredPrompt && (
        <button
          onClick={handleInstall}
          className="w-full bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-md transition-colors"
        >
          Install App
        </button>
      )}

      {/* iOS Install Instructions */}
      {isIOS && !deferredPrompt && (
        <div className="bg-blue-500 bg-opacity-50 rounded-md p-3">
          <p className="text-sm text-blue-100 mb-2">
            <strong>To install on iOS:</strong>
          </p>
          <ol className="text-xs text-blue-100 space-y-1">
            <li>1. Tap the Share button in Safari</li>
            <li>2. Select "Add to Home Screen"</li>
            <li>3. Tap "Add" to install</li>
          </ol>
        </div>
      )}

      {/* Other browsers */}
      {!deferredPrompt && !isIOS && (
        <div className="bg-blue-500 bg-opacity-50 rounded-md p-3">
          <p className="text-sm text-blue-100 mb-2">
            <strong>To install:</strong>
          </p>
          <p className="text-xs text-blue-100">
            Look for the install icon in your browser's address bar or menu
          </p>
        </div>
      )}
    </div>
  );
};