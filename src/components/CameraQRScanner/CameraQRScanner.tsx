import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, SwitchCamera, Zap, ZapOff } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface CameraQRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const CameraQRScanner: React.FC<CameraQRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<QrScanner.Camera | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    console.log('CameraQRScanner useEffect triggered - isOpen:', isOpen, 'videoRef:', !!videoRef.current);
    
    if (isOpen) {
      console.log('Scanner should be opening...');
      // Add a small delay to ensure the video element is ready
      const timer = setTimeout(() => {
        if (videoRef.current) {
          console.log('Video element ready, starting initialization...');
          initializeScanner();
        } else {
          console.error('Video element still not ready after delay');
          setError('Video element not available. Please try again.');
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        console.log('CameraQRScanner closing, cleaning up...');
        if (qrScannerRef.current) {
          qrScannerRef.current.stop();
          qrScannerRef.current.destroy();
          qrScannerRef.current = null;
        }
      };
    }
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setError('');
      setPermissionDenied(false);
      
      console.log('=== Starting QR Scanner Initialization ===');
      
      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext;
      console.log('Secure context:', isSecureContext);
      
      if (!isSecureContext && !window.location.hostname.includes('localhost')) {
        console.error('Not in secure context');
        setError('Camera access requires HTTPS. Please use a secure connection.');
        return;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported');
        setError('Camera API not supported in this browser.');
        return;
      }

      console.log('Basic camera API checks passed, testing direct camera access...');

      // Test direct camera access first
      let cameraStream: MediaStream | null = null;
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        console.log('✅ Direct camera access successful');
        
        // Stop the test stream
        cameraStream.getTracks().forEach(track => track.stop());
      } catch (directError: any) {
        console.error('❌ Direct camera access failed:', directError);
        setError(`Camera access failed: ${directError.message}`);
        setPermissionDenied(true);
        return;
      }

      // Now try QrScanner
      console.log('Testing QrScanner library...');
      
      let hasCamera = false;
      try {
        hasCamera = await QrScanner.hasCamera();
        console.log('QrScanner.hasCamera():', hasCamera);
      } catch (qrError: any) {
        console.error('QrScanner.hasCamera() failed:', qrError);
        // Try to continue anyway
        hasCamera = true;
        console.log('Assuming camera is available despite QrScanner error');
      }

      setHasCamera(hasCamera);

      if (!hasCamera) {
        console.error('No camera detected by QrScanner');
        setError('No camera found for QR scanning');
        return;
      }

      // Get available cameras with better error handling
      let cameras: QrScanner.Camera[] = [];
      try {
        cameras = await QrScanner.listCameras(true);
        console.log('Available cameras for QR scanning:', cameras);
        setCameras(cameras);
      } catch (listError: any) {
        console.error('Failed to list cameras:', listError);
        console.log('Continuing with default camera setup...');
        cameras = [];
        setCameras([]);
      }
      
      // Prefer back camera for QR scanning
      const backCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('rear')
      ) || cameras[0];
      
      if (backCamera) {
        setSelectedCamera(backCamera);
        console.log('Selected camera:', backCamera);
      } else {
        console.log('No specific camera selected, using default');
      }

      if (videoRef.current) {
        try {
          console.log('Creating QrScanner instance...');
          // Create QR scanner with more permissive options
          qrScannerRef.current = new QrScanner(
            videoRef.current,
            (result) => {
              console.log('QR Code detected:', result.data);
              onScan(result.data);
              stopScanning();
            },
            {
              returnDetailedScanResult: true,
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: backCamera?.id || 'environment',
              maxScansPerSecond: 5,
            }
          );

          console.log('Starting QR Scanner...');
          await qrScannerRef.current.start();
          setScanning(true);
          setError('');
          console.log('✅ QR Scanner started successfully');
        } catch (startError: any) {
          console.error('❌ Failed to start QR Scanner:', startError);
          setError(`QR Scanner failed to start: ${startError.message}`);
          
          // Clean up if start failed
          if (qrScannerRef.current) {
            try {
              qrScannerRef.current.destroy();
            } catch (e) {
              console.error('Error destroying scanner:', e);
            }
            qrScannerRef.current = null;
          }
        }
      } else {
        console.error('Video element not available');
        setError('Video element not ready');
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize QR scanner:', error);
      setError(`Failed to initialize QR scanner: ${error.message}`);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      setScanning(false);
    }
  };

  const switchCamera = async () => {
    if (!qrScannerRef.current || cameras.length < 2) return;

    const currentIndex = cameras.findIndex(camera => camera.id === selectedCamera?.id);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    try {
      await qrScannerRef.current.setCamera(nextCamera.id);
      setSelectedCamera(nextCamera);
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  const toggleFlash = async () => {
    if (!qrScannerRef.current) return;

    try {
      if (flashEnabled) {
        await qrScannerRef.current.turnFlashOff();
      } else {
        await qrScannerRef.current.turnFlashOn();
      }
      setFlashEnabled(!flashEnabled);
    } catch (error) {
      console.error('Flash not supported:', error);
    }
  };

  const handleClose = () => {
    stopScanning();
    setPermissionDenied(false);
    setError('');
    onClose();
  };

  const requestPermissionAgain = async () => {
    setPermissionDenied(false);
    setError('');
    await initializeScanner();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-black bg-opacity-50">
        <h2 className="text-lg font-semibold">Scan QR Code</h2>
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {hasCamera && !error ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              style={{ display: 'block' }}
            />
            
            {/* Scan Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black bg-opacity-50" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white border-dashed rounded-lg" />
            </div>

            {/* Scanning Status */}
            {scanning && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm">
                <Camera className="w-4 h-4 inline mr-2" />
                Scanning...
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white p-6">
            <div className="text-center max-w-sm">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">
                {error || 'Camera not available'}
              </p>
              <p className="text-sm text-gray-300 mb-6">
                {permissionDenied 
                  ? 'Camera access is required to scan QR codes. Please allow camera permission in your browser settings.'
                  : 'Please check camera permissions and try again'
                }
              </p>
              
              {(permissionDenied || error.includes('Video element')) && (
                <div className="space-y-3">
                  <button
                    onClick={requestPermissionAgain}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    Try Again
                  </button>
                  <div className="text-xs text-gray-400">
                    <p>If camera issues persist:</p>
                    <p>1. Refresh the page completely</p>
                    <p>2. Check camera permissions in browser settings</p>
                    <p>3. Make sure no other apps are using the camera</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Always render video element, even if hidden */}
        {!hasCamera || error ? (
          <video
            ref={videoRef}
            className="hidden"
            autoPlay
            playsInline
            muted
          />
        ) : null}
      </div>

      {/* Controls */}
      {hasCamera && !error && (
        <div className="p-4 bg-black bg-opacity-50">
          <div className="flex justify-center space-x-6">
            {/* Switch Camera */}
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="p-3 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-colors"
                title="Switch Camera"
              >
                <SwitchCamera className="w-6 h-6" />
              </button>
            )}

            {/* Flash Toggle */}
            <button
              onClick={toggleFlash}
              className={`p-3 rounded-full text-white transition-colors ${
                flashEnabled 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
              title={flashEnabled ? 'Turn Flash Off' : 'Turn Flash On'}
            >
              {flashEnabled ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-white text-sm">
              Position the QR code within the frame to scan
            </p>
          </div>
        </div>
      )}
    </div>
  );
};