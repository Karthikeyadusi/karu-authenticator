import React, { useState, useEffect } from 'react';
import { Code, Clock, Shield, AlertTriangle, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';
import { OTPService } from '../../services/otp';
import type { AuthAccount, FutureOTP } from '../../types';

interface DeveloperPanelProps {
  account: AuthAccount;
}

export const DeveloperPanel: React.FC<DeveloperPanelProps> = ({ account }) => {
  const [futureOTPs, setFutureOTPs] = useState<FutureOTP[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<'valid' | 'invalid' | null>(null);
  const otpService = OTPService.getInstance();

  useEffect(() => {
    if (showPanel) {
      updateFutureOTPs();
      const interval = setInterval(updateFutureOTPs, 1000);
      return () => clearInterval(interval);
    }
  }, [showPanel, account]);

  const updateFutureOTPs = () => {
    const future = otpService.getFutureOTPs(account, 5);
    setFutureOTPs(future);
  };

  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleVerifyCode = () => {
    const isValid = otpService.verifyTOTP(account, verifyCode);
    setVerifyResult(isValid ? 'valid' : 'invalid');
    setTimeout(() => setVerifyResult(null), 3000);
  };

  const getTimeUntil = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-red-200 bg-red-50">
      {/* Developer Mode Warning */}
      <div className="p-3 bg-red-100 border-b border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Developer Mode</span>
            <span className="text-xs text-red-600">Educational Use Only</span>
          </div>
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="p-1 rounded hover:bg-red-200 transition-colors"
          >
            {showPanel ? <EyeOff className="w-4 h-4 text-red-600" /> : <Eye className="w-4 h-4 text-red-600" />}
          </button>
        </div>
      </div>

      {/* Developer Panel Content */}
      {showPanel && (
        <div className="p-4 space-y-4">
          {/* Algorithm Info */}
          <div className="bg-white rounded border border-red-200 p-3">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Code className="w-4 h-4 mr-2" />
              TOTP Algorithm Details
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Algorithm: <span className="font-mono">{account.algorithm}</span></div>
              <div>Period: <span className="font-mono">{account.period}s</span></div>
              <div>Digits: <span className="font-mono">{account.digits}</span></div>
              <div>Secret: <span className="font-mono text-xs break-all">{account.secret}</span></div>
            </div>
          </div>

          {/* Future OTPs Prediction */}
          <div className="bg-white rounded border border-red-200 p-3">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Future OTP Predictions
            </h4>
            <div className="space-y-2">
              {futureOTPs.map((otp, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded border">
                  <div className="flex-1">
                    <div className="font-mono font-bold text-lg text-gray-900">
                      {otpService.formatOTPCode(otp.code)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {otp.timeString} (in {getTimeUntil(otp.timestamp)})
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(otp.code, index)}
                    className="p-2 rounded hover:bg-gray-200 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* OTP Verification Tool */}
          <div className="bg-white rounded border border-red-200 p-3">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              OTP Verification Tool
            </h4>
            <div className="flex space-x-2">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="Enter OTP to verify"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                maxLength={account.digits}
              />
              <button
                onClick={handleVerifyCode}
                disabled={verifyCode.length !== account.digits}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded transition-colors"
              >
                Verify
              </button>
            </div>
            {verifyResult && (
              <div className={`mt-2 p-2 rounded text-sm ${
                verifyResult === 'valid' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {verifyResult === 'valid' ? '✅ OTP is valid!' : '❌ OTP is invalid or expired'}
              </div>
            )}
          </div>

          {/* Educational Info */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 className="font-medium text-blue-900 mb-2">🔬 How This Works</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• TOTP codes are generated using: <code>HMAC-SHA({account.algorithm}, secret_key, time_counter)</code></p>
              <p>• Time counter = <code>floor(current_time / {account.period})</code></p>
              <p>• This demonstrates that TOTP is <strong>deterministic</strong>, not random</p>
              <p>• If someone has your secret key, they can predict ALL future codes</p>
            </div>
          </div>

          {/* Security Warning */}
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <h4 className="font-medium text-red-900 mb-2">⚠️ Security Warning</h4>
            <div className="text-sm text-red-800 space-y-1">
              <p>• Never share your secret keys</p>
              <p>• This feature is for educational purposes only</p>
              <p>• In production, secret keys should be stored securely</p>
              <p>• TOTP is secure when secrets remain confidential</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};