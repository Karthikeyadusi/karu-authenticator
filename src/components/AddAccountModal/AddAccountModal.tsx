import React, { useState, useEffect } from 'react';
import { X, QrCode, Key, Camera, Upload } from 'lucide-react';
import { OTPService } from '../../services/otp';
import { CameraQRScanner } from '../CameraQRScanner/CameraQRScanner';
import { useTheme } from '../../contexts/ThemeContext';
import type { AuthAccount, AddAccountForm } from '../../types';

interface AddAccountModalProps {
  account?: AuthAccount | null;
  onSave: (accountData: Omit<AuthAccount, 'id'>) => void;
  onClose: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ account, onSave, onClose }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'manual' | 'qr'>('manual');
  const [form, setForm] = useState<AddAccountForm>({
    accountIdentifier: '',
    issuer: '',
    secret: '',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  });
  const [error, setError] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const otpService = OTPService.getInstance();

  useEffect(() => {
    if (account) {
      setForm({
        accountIdentifier: account.accountIdentifier || '',
        issuer: account.issuer,
        secret: account.secret,
        algorithm: account.algorithm,
        digits: account.digits,
        period: account.period
      });
    }
  }, [account]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      // Always use industry standards
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    }));
    if (error) setError('');
  };

  const handleQrParse = () => {
    const parsed = otpService.parseOTPAuthURI(qrInput.trim());
    if (parsed) {
      setForm({
        accountIdentifier: parsed.accountIdentifier || '',
        issuer: parsed.issuer || '',
        secret: parsed.secret || '',
        // Use QR code settings if provided, otherwise use standards
        algorithm: parsed.algorithm || 'SHA1',
        digits: parsed.digits || 6,
        period: parsed.period || 30
      });
      setActiveTab('manual');
      setError('');
    } else {
      setError('Invalid QR code or otpauth:// URL');
    }
  };

  const handleCameraScan = (result: string) => {
    setQrInput(result);
    setShowCameraScanner(false);
    
    // Auto-parse if it's an otpauth:// URL
    if (result.startsWith('otpauth://')) {
      const parsed = otpService.parseOTPAuthURI(result);
      if (parsed) {
        setForm({
          accountIdentifier: parsed.accountIdentifier || '',
          issuer: parsed.issuer || '',
          secret: parsed.secret || '',
          // Use QR code settings if provided, otherwise use standards
          algorithm: parsed.algorithm || 'SHA1',
          digits: parsed.digits || 6,
          period: parsed.period || 30
        });
        setActiveTab('manual');
        setError('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.issuer.trim()) {
      setError('Issuer is required');
      return;
    }
    if (!form.secret.trim()) {
      setError('Secret key is required');
      return;
    }
    if (!otpService.validateSecret(form.secret)) {
      setError('Invalid secret key format');
      return;
    }

    const accountData: Omit<AuthAccount, 'id'> = {
      accountIdentifier: form.accountIdentifier.trim() || undefined,
      issuer: form.issuer.trim(),
      secret: form.secret.replace(/\s/g, '').toUpperCase(),
      // Always use industry standards for new accounts
      algorithm: account ? form.algorithm : 'SHA1',
      digits: account ? form.digits : 6,
      period: account ? form.period : 30,
      type: 'totp'
    };

    onSave(accountData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b flex-shrink-0 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-medium ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {account ? 'Edit Account' : 'Add Account'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">{/* Tabs */}
            {!account && (
              <div className={`flex border-b mb-6 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'manual'
                      ? 'border-blue-500 text-blue-500'
                      : `border-transparent ${
                          isDark 
                            ? 'text-gray-400 hover:text-gray-200' 
                            : 'text-gray-600 hover:text-gray-700'
                        }`
                  }`}
                >
                  <Key className="w-4 h-4 inline mr-2" />
                  Manual Entry
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`flex-1 pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'qr'
                      ? 'border-blue-500 text-blue-500'
                      : `border-transparent ${
                          isDark 
                            ? 'text-gray-400 hover:text-gray-200' 
                            : 'text-gray-600 hover:text-gray-700'
                        }`
                  }`}
                >
                  <QrCode className="w-4 h-4 inline mr-2" />
                  QR Code
                </button>
              </div>
            )}

            {/* QR Code Tab */}
            {activeTab === 'qr' && !account && (
              <div className="space-y-4">
                <div className={`text-center py-8 border-2 border-dashed rounded-lg ${
                  isDark 
                    ? 'border-gray-600 bg-gray-800/30' 
                    : 'border-gray-200 bg-gray-50/30'
                }`}>
                  <Camera className={`w-12 h-12 mx-auto mb-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                  <p className={`mb-4 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>Scan QR code or paste otpauth:// URL</p>
                  
                  {/* Camera Scan Button */}
                  <button
                    onClick={() => setShowCameraScanner(true)}
                    className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md transition-colors flex items-center mx-auto space-x-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Use Camera</span>
                  </button>
                  
                  <div className={`text-sm mb-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>or</div>
                  
                  <textarea
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Paste otpauth://totp/... URL here"
                    className={`w-full p-3 border rounded-md resize-none transition-colors ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    rows={3}
                  />
                  
                  <button
                    onClick={handleQrParse}
                    disabled={!qrInput.trim()}
                    className="mt-3 bg-google-blue hover:bg-google-blue-dark disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Parse QR Data
                  </button>
                </div>
              </div>
            )}

            {/* Manual Entry Tab */}
            {activeTab === 'manual' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Issuer - Primary Field */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Service Provider *
                  </label>
                  <input
                    type="text"
                    name="issuer"
                    value={form.issuer}
                    onChange={handleInputChange}
                    placeholder="e.g., Google, GitHub, Microsoft"
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    required
                  />
                  <p className={`text-xs mt-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    The name of the service (e.g., Google, GitHub)
                  </p>
                </div>

                {/* Account Identifier - Optional */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Account (Optional)
                  </label>
                  <input
                    type="text"
                    name="accountIdentifier"
                    value={form.accountIdentifier}
                    onChange={handleInputChange}
                    placeholder="e.g., your.email@gmail.com"
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Your username or email for this service
                  </p>
                </div>

                {/* Secret Key */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Secret Key *
                  </label>
                  <textarea
                    name="secret"
                    value={form.secret}
                    onChange={handleInputChange}
                    placeholder="Enter the secret key (base32 format)"
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-colors ${
                      isDark 
                        ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    rows={3}
                    required
                  />
                  <p className={`text-xs mt-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Base32 encoded secret (A-Z, 2-7)
                  </p>
                </div>

                {/* Standards Info */}
                <div className={`text-sm p-3 rounded-md ${
                  isDark 
                    ? 'text-gray-400 bg-gray-800' 
                    : 'text-gray-600 bg-gray-50'
                }`}>
                  <p>✓ Using industry standard settings: SHA1 algorithm, 6 digits, 30-second refresh period</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className={`border rounded-md p-3 ${
                    isDark 
                      ? 'bg-red-900/30 border-red-800 text-red-300' 
                      : 'bg-red-50 border-red-200 text-red-600'
                  }`}>
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 px-4 py-3 border rounded-md font-medium transition-colors ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
                  >
                    {account ? 'Update' : 'Add'} Account
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Camera QR Scanner Modal */}
      {showCameraScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-google-border flex justify-between items-center">
              <h3 className="text-lg font-medium text-google-text">Scan QR Code</h3>
              <button
                onClick={() => setShowCameraScanner(false)}
                className="text-google-gray hover:text-google-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <CameraQRScanner 
                onScan={handleCameraScan} 
                onClose={() => setShowCameraScanner(false)}
                isOpen={showCameraScanner}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};