import React, { useState } from 'react';
import { Download, AlertCircle, CheckCircle, X, Camera, Upload } from 'lucide-react';
import { CameraQRScanner } from '../CameraQRScanner/CameraQRScanner';
import { useTheme } from '../../contexts/ThemeContext';
import type { AuthAccount } from '../../types';

interface ImportWizardProps {
  onImport: (accounts: Omit<AuthAccount, 'id'>[]) => void;
  onClose: () => void;
  existingAccounts: AuthAccount[];
}

interface ParsedAccount {
  issuer: string;
  accountIdentifier?: string;
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
  type: string;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ onImport, onClose, existingAccounts }) => {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState<'method' | 'scan' | 'preview' | 'complete'>('method');
  const [showScanner, setShowScanner] = useState(false);
  const [parsedAccounts, setParsedAccounts] = useState<ParsedAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<number>>(new Set());
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  // Parse Google Authenticator export QR code
  const parseGoogleAuthExport = (uri: string): ParsedAccount[] => {
    try {
      console.log('Parsing URI:', uri);
      
      // Check if it's a Google Authenticator migration URI
      if (uri.startsWith('otpauth-migration://offline?data=')) {
        return parseGoogleMigrationData(uri);
      }
      
      // Check if it's a regular otpauth URI
      if (uri.startsWith('otpauth://')) {
        return [parseOtpAuthUri(uri)];
      }
      
      throw new Error('Invalid QR code format. Please scan a Google Authenticator export QR code.');
    } catch (error: any) {
      console.error('Error parsing QR code:', error);
      throw error;
    }
  };

  // Parse Google Authenticator migration data
  const parseGoogleMigrationData = (uri: string): ParsedAccount[] => {
    try {
      const url = new URL(uri);
      const data = url.searchParams.get('data');
      
      if (!data) {
        throw new Error('No migration data found in QR code');
      }
      
      // Decode base64 data (Protocol Buffers parsing would go here)
      // const decodedData = atob(data);
      
      // This is a simplified parser - in reality, Google uses Protocol Buffers
      // For now, we'll show a placeholder implementation
      throw new Error('Google Authenticator migration format parsing is not yet implemented. Please use individual account QR codes or manual entry.');
      
    } catch (error: any) {
      throw new Error(`Failed to parse Google Authenticator export: ${error.message}`);
    }
  };

  // Parse individual otpauth URI
  const parseOtpAuthUri = (uri: string): ParsedAccount => {
    const url = new URL(uri);
    const pathParts = url.pathname.substring(1).split(':');
    
    const type = url.hostname; // totp or hotp
    const issuer = pathParts[0] || 'Unknown';
    const accountIdentifier = pathParts[1] || '';
    
    const secret = url.searchParams.get('secret');
    const algorithm = url.searchParams.get('algorithm') || 'SHA1';
    const digits = parseInt(url.searchParams.get('digits') || '6');
    const period = parseInt(url.searchParams.get('period') || '30');
    
    if (!secret) {
      throw new Error('No secret found in QR code');
    }
    
    return {
      issuer,
      accountIdentifier,
      secret,
      algorithm,
      digits,
      period,
      type: type.toUpperCase()
    };
  };

  const handleQRScan = (result: string) => {
    try {
      console.log('QR Code scanned:', result);
      const accounts = parseGoogleAuthExport(result);
      setParsedAccounts(accounts);
      setSelectedAccounts(new Set(accounts.map((_, index) => index)));
      setShowScanner(false);
      setCurrentStep('preview');
      setError('');
    } catch (error: any) {
      console.error('Import error:', error);
      setError(error.message);
      setShowScanner(false);
    }
  };

  const handleImport = () => {
    setImportStatus('importing');
    
    try {
      const accountsToImport = parsedAccounts
        .filter((_, index) => selectedAccounts.has(index))
        .map(account => ({
          issuer: account.issuer,
          accountIdentifier: account.accountIdentifier || '',
          secret: account.secret,
          algorithm: account.algorithm as 'SHA1' | 'SHA256' | 'SHA512',
          digits: account.digits,
          period: account.period,
          type: account.type.toLowerCase() as 'totp' | 'hotp'
        }));
      
      onImport(accountsToImport);
      setImportStatus('success');
      
      setTimeout(() => {
        setCurrentStep('complete');
      }, 1500);
      
    } catch (error: any) {
      console.error('Import failed:', error);
      setError(error.message);
      setImportStatus('error');
    }
  };

  const toggleAccountSelection = (index: number) => {
    const newSelection = new Set(selectedAccounts);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedAccounts(newSelection);
  };

  const checkForDuplicates = (account: ParsedAccount) => {
    return existingAccounts.some(existing => 
      existing.issuer === account.issuer && 
      existing.accountIdentifier === account.accountIdentifier
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-2xl rounded-xl shadow-2xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Import from Google Authenticator
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'method' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Choose Import Method
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Select how you want to import your Google Authenticator accounts
                </p>
              </div>

              <div className="space-y-4">
                {/* QR Code Import */}
                <button
                  onClick={() => {
                    setCurrentStep('scan');
                    setShowScanner(true);
                  }}
                  className="w-full p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70">
                      <Camera className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Scan Export QR Code
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Use Google Authenticator's "Export accounts" feature
                      </p>
                    </div>
                  </div>
                </button>

                {/* Manual Import - Coming Soon */}
                <div className="w-full p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl opacity-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-500 dark:text-gray-400">
                        Upload Backup File
                      </h4>
                      <p className="text-sm text-gray-400">
                        Coming soon - Import from backup files
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-1">How to export from Google Authenticator:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Open Google Authenticator app</li>
                      <li>Tap the three dots menu (⋮)</li>
                      <li>Select "Export accounts"</li>
                      <li>Choose accounts to export</li>
                      <li>Scan the generated QR code here</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Review Accounts to Import
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Select which accounts you want to import
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div className="max-h-96 overflow-y-auto space-y-3">
                {parsedAccounts.map((account, index) => {
                  const isDuplicate = checkForDuplicates(account);
                  const isSelected = selectedAccounts.has(index);
                  
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      } ${isDuplicate ? 'opacity-50' : ''}`}
                      onClick={() => !isDuplicate && toggleAccountSelection(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {account.issuer}
                              </h4>
                              {account.accountIdentifier && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {account.accountIdentifier}
                                </p>
                              )}
                            </div>
                          </div>
                          {isDuplicate && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                              ⚠️ Account already exists
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {account.digits} digits • {account.algorithm}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep('method')}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedAccounts.size === 0 || importStatus === 'importing'}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importStatus === 'importing' ? 'Importing...' : `Import ${selectedAccounts.size} Accounts`}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Import Complete!
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Successfully imported {selectedAccounts.size} accounts from Google Authenticator
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <CameraQRScanner
          isOpen={showScanner}
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};