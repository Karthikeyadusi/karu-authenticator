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

  useEffect(() => {
    if (isOpen && videoRef.current) {
      initializeScanner();
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      setHasCamera(hasCamera);

      if (!hasCamera) {
        setError('No camera found on this device');
        return;
      }

      // Get available cameras
      const cameras = await QrScanner.listCameras(true);
      setCameras(cameras);
      
      // Prefer back camera for QR scanning
      const backCamera = cameras.find(camera => camera.label.toLowerCase().includes('back')) || cameras[0];
      setSelectedCamera(backCamera);

      if (videoRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            onScan(result.data);
            stopScanning();
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: backCamera?.id,
          }
        );

        await qrScannerRef.current.start();
        setScanning(true);
        setError('');
      }
    } catch (error) {
      console.error('Failed to initialize QR scanner:', error);
      setError('Failed to access camera. Please check permissions.');
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
    onClose();
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
          <div className="flex-1 flex items-center justify-center text-white">
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">
                {error || 'Camera not available'}
              </p>
              <p className="text-sm text-gray-300">
                Please check camera permissions and try again
              </p>
            </div>
          </div>
        )}
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