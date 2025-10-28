import React, { useState } from 'react';
import { Camera } from 'lucide-react';

export const CameraTest: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [permissions, setPermissions] = useState<string>('');

  const testCameraAccess = async () => {
    setStatus('Testing camera access...');
    
    try {
      // Check if we're in a secure context
      setStatus(`Secure context: ${window.isSecureContext}`);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('❌ getUserMedia not supported');
        return;
      }
      
      setStatus('✅ getUserMedia supported, requesting permission...');
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStatus('✅ Camera permission granted!');
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
      
      // Check permission state
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissions(`Permission state: ${permissionStatus.state}`);
      
    } catch (error: any) {
      console.error('Camera test error:', error);
      setStatus(`❌ Error: ${error.name} - ${error.message}`);
      setPermissions('');
    }
  };

  const checkPermissions = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissions(`Current permission: ${permissionStatus.state}`);
    } catch (error) {
      setPermissions('Could not check permissions');
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-3">Camera Test</h3>
      
      <div className="space-y-3">
        <button
          onClick={testCameraAccess}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Camera className="w-4 h-4" />
          <span>Test Camera Access</span>
        </button>
        
        <button
          onClick={checkPermissions}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Check Current Permissions
        </button>
        
        {status && (
          <div className="text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 p-2 rounded">
            <strong>Status:</strong> {status}
          </div>
        )}
        
        {permissions && (
          <div className="text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 p-2 rounded">
            <strong>Permissions:</strong> {permissions}
          </div>
        )}
      </div>
    </div>
  );
};