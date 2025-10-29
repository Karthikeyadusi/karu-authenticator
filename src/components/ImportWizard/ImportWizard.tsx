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
  const [debugStatus, setDebugStatus] = useState<string>('Ready to scan'); // Debug status for mobile

  // Parse Google Authenticator export QR code
  const parseGoogleAuthExport = (uri: string): ParsedAccount[] => {
    try {
      console.log('🔍 Parsing URI:', uri);
      console.log('📝 URI type analysis:');
      console.log('  - Starts with otpauth-migration:', uri.startsWith('otpauth-migration://'));
      console.log('  - Starts with otpauth:', uri.startsWith('otpauth://'));
      
      // Check if it's a Google Authenticator migration URI
      if (uri.startsWith('otpauth-migration://')) {
        console.log('🔄 Detected Google Authenticator migration URI');
        return parseGoogleMigrationData(uri);
      }
      
      // Check if it's a regular otpauth URI
      if (uri.startsWith('otpauth://')) {
        console.log('🔑 Detected regular otpauth URI');
        const account = parseOtpAuthUri(uri);
        console.log('✅ Parsed single account:', account);
        return [account];
      }
      
      // For testing - create a dummy account if it's any QR code
      if (uri.length > 10) {
        console.log('🧪 Creating test account for any QR code');
        return [{
          issuer: 'Test Service',
          accountIdentifier: 'test@example.com',
          secret: 'JBSWY3DPEHPK3PXP', // Sample base32 secret
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          type: 'TOTP'
        }];
      }
      
      console.log('❌ Unknown URI format:', uri.substring(0, 50) + '...');
      throw new Error('Invalid QR code format. Please scan a Google Authenticator export QR code or individual account QR code.');
    } catch (error: any) {
      console.error('❌ Error parsing QR code:', error);
      throw error;
    }
  };

  // Parse Google Authenticator migration data
  const parseGoogleMigrationData = (uri: string): ParsedAccount[] => {
    try {
      console.log('🔄 Starting Google migration parsing for URI:', uri);
      
      const url = new URL(uri);
      console.log('📊 URL parsed. Pathname:', url.pathname, 'Search params:', url.search);
      
      const data = url.searchParams.get('data');
      console.log('📦 Migration data parameter:', data ? `${data.length} characters` : 'Not found');
      
      if (!data) {
        throw new Error('No migration data found in QR code');
      }
      
      console.log('🔧 Decoding base64 migration data...');
      // Decode base64 data
      const decodedData = atob(data);
      console.log('✅ Base64 decoded, length:', decodedData.length);
      
      // Convert to Uint8Array for parsing
      const bytes = new Uint8Array(decodedData.length);
      for (let i = 0; i < decodedData.length; i++) {
        bytes[i] = decodedData.charCodeAt(i);
      }
      console.log('🔢 Converted to bytes array, length:', bytes.length);
      
      // Parse Protocol Buffers data
      // This is a simplified parser for Google Authenticator's protobuf format
      const accounts: ParsedAccount[] = [];
      let offset = 0;
      
      console.log('🔍 Starting protobuf parsing...');
      while (offset < bytes.length) {
        console.log(`📍 Parsing at offset ${offset}/${bytes.length}`);
        const result = parseProtobufMessage(bytes, offset);
        if (result.account) {
          console.log('✅ Found account:', { ...result.account, secret: '***' });
          accounts.push(result.account);
        }
        offset = result.nextOffset;
        
        // Safety check to prevent infinite loops
        if (offset >= bytes.length || result.nextOffset <= offset) {
          console.log('🛑 Reached end of data or invalid offset');
          break;
        }
      }
      
      console.log(`🎉 Migration parsing complete. Found ${accounts.length} accounts`);
      
      if (accounts.length === 0) {
        throw new Error('No valid accounts found in migration data');
      }
      
      return accounts;
      
    } catch (error: any) {
      console.error('❌ Migration parsing error:', error);
      throw new Error(`Failed to parse Google Authenticator export: ${error.message}`);
    }
  };

  // Simple Protocol Buffers parser for Google Authenticator format
  const parseProtobufMessage = (bytes: Uint8Array, startOffset: number): { account: ParsedAccount | null, nextOffset: number } => {
    let offset = startOffset;
    let account: Partial<ParsedAccount> = {};
    
    console.log(`🔧 Parsing protobuf message starting at offset ${startOffset}`);
    
    try {
      while (offset < bytes.length) {
        // Read field number and wire type
        const fieldHeader = readVarint(bytes, offset);
        if (!fieldHeader) {
          console.log('❌ Failed to read field header, ending parse');
          break;
        }
        
        offset = fieldHeader.nextOffset;
        const fieldNumber = fieldHeader.value >>> 3;
        const wireType = fieldHeader.value & 0x7;
        
        console.log(`📋 Field ${fieldNumber}, wire type ${wireType} at offset ${offset - 1}`);
        
        switch (fieldNumber) {
          case 1: // secret (bytes)
            if (wireType === 2) { // Length-delimited
              const length = readVarint(bytes, offset);
              if (length) {
                offset = length.nextOffset;
                const secretBytes = bytes.slice(offset, offset + length.value);
                account.secret = base32Encode(secretBytes);
                console.log(`🔑 Found secret (${length.value} bytes)`);
                offset += length.value;
              }
            }
            break;
            
          case 2: // name/label (string)
            if (wireType === 2) {
              const length = readVarint(bytes, offset);
              if (length) {
                offset = length.nextOffset;
                const nameBytes = bytes.slice(offset, offset + length.value);
                const fullName = new TextDecoder().decode(nameBytes);
                
                console.log(`🏷️ Found name: ${fullName}`);
                
                // Parse issuer:account format
                const parts = fullName.split(':');
                if (parts.length >= 2) {
                  account.issuer = parts[0].trim();
                  account.accountIdentifier = parts.slice(1).join(':').trim();
                } else {
                  account.issuer = fullName.trim() || 'Unknown';
                  account.accountIdentifier = '';
                }
                offset += length.value;
              }
            }
            break;
            
          case 3: // issuer (string)
            if (wireType === 2) {
              const length = readVarint(bytes, offset);
              if (length) {
                offset = length.nextOffset;
                const issuerBytes = bytes.slice(offset, offset + length.value);
                const issuer = new TextDecoder().decode(issuerBytes);
                console.log(`🏢 Found issuer: ${issuer}`);
                if (issuer.trim()) {
                  account.issuer = issuer.trim();
                }
                offset += length.value;
              }
            }
            break;
            
          case 4: // algorithm (enum)
            if (wireType === 0) { // Varint
              const algorithm = readVarint(bytes, offset);
              if (algorithm) {
                offset = algorithm.nextOffset;
                switch (algorithm.value) {
                  case 1: account.algorithm = 'SHA1'; break;
                  case 2: account.algorithm = 'SHA256'; break;
                  case 3: account.algorithm = 'SHA512'; break;
                  default: account.algorithm = 'SHA1';
                }
                console.log(`🔐 Found algorithm: ${account.algorithm}`);
              }
            }
            break;
            
          case 5: // digits (int32)
            if (wireType === 0) {
              const digits = readVarint(bytes, offset);
              if (digits) {
                offset = digits.nextOffset;
                account.digits = digits.value;
                console.log(`🔢 Found digits: ${account.digits}`);
              }
            }
            break;
            
          case 6: // type (enum)
            if (wireType === 0) {
              const type = readVarint(bytes, offset);
              if (type) {
                offset = type.nextOffset;
                account.type = type.value === 1 ? 'HOTP' : 'TOTP';
                console.log(`📱 Found type: ${account.type}`);
              }
            }
            break;
            
          default:
            // Skip unknown fields
            console.log(`⏭️ Skipping unknown field ${fieldNumber}`);
            offset = skipField(bytes, offset, wireType);
            break;
        }
        
        // Check if we have a complete account
        if (account.secret && account.issuer) {
          const completeAccount = {
            issuer: account.issuer,
            accountIdentifier: account.accountIdentifier || '',
            secret: account.secret,
            algorithm: account.algorithm || 'SHA1',
            digits: account.digits || 6,
            period: 30, // Google Authenticator uses 30 seconds
            type: account.type || 'TOTP'
          };
          
          console.log('✅ Complete account found:', { ...completeAccount, secret: '***' });
          
          return {
            account: completeAccount,
            nextOffset: offset
          };
        }
      }
    } catch (error) {
      console.error('❌ Protobuf parsing error:', error);
    }
    
    console.log('❌ No complete account found in this message');
    return { account: null, nextOffset: bytes.length };
  };

  // Helper functions for Protocol Buffers parsing
  const readVarint = (bytes: Uint8Array, offset: number): { value: number, nextOffset: number } | null => {
    let result = 0;
    let shift = 0;
    let currentOffset = offset;
    
    while (currentOffset < bytes.length) {
      const byte = bytes[currentOffset++];
      result |= (byte & 0x7F) << shift;
      
      if ((byte & 0x80) === 0) {
        return { value: result, nextOffset: currentOffset };
      }
      
      shift += 7;
      if (shift >= 32) break; // Prevent overflow
    }
    
    return null;
  };

  const skipField = (bytes: Uint8Array, offset: number, wireType: number): number => {
    switch (wireType) {
      case 0: // Varint
        const varint = readVarint(bytes, offset);
        return varint ? varint.nextOffset : offset + 1;
      case 1: // 64-bit
        return offset + 8;
      case 2: // Length-delimited
        const length = readVarint(bytes, offset);
        return length ? length.nextOffset + length.value : offset + 1;
      case 5: // 32-bit
        return offset + 4;
      default:
        return offset + 1;
    }
  };

  const base32Encode = (bytes: Uint8Array): string => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let buffer = 0;
    let bitsLeft = 0;
    
    for (const byte of bytes) {
      buffer = (buffer << 8) | byte;
      bitsLeft += 8;
      
      while (bitsLeft >= 5) {
        result += alphabet[(buffer >>> (bitsLeft - 5)) & 31];
        bitsLeft -= 5;
      }
    }
    
    if (bitsLeft > 0) {
      result += alphabet[(buffer << (5 - bitsLeft)) & 31];
    }
    
    return result;
  };

  // Parse individual otpauth URI
  const parseOtpAuthUri = (uri: string): ParsedAccount => {
    console.log('🔑 Parsing individual otpauth URI:', uri);
    
    const url = new URL(uri);
    console.log('📊 URL parts:', {
      protocol: url.protocol,
      hostname: url.hostname,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams.entries())
    });
    
    const pathParts = url.pathname.substring(1).split(':');
    console.log('📂 Path parts:', pathParts);
    
    const type = url.hostname; // totp or hotp
    const issuer = pathParts[0] || 'Unknown';
    const accountIdentifier = pathParts[1] || '';
    
    const secret = url.searchParams.get('secret');
    const algorithm = url.searchParams.get('algorithm') || 'SHA1';
    const digits = parseInt(url.searchParams.get('digits') || '6');
    const period = parseInt(url.searchParams.get('period') || '30');
    
    console.log('📋 Parsed values:', {
      type,
      issuer,
      accountIdentifier,
      secret: secret ? `${secret.substring(0, 8)}...` : 'null',
      algorithm,
      digits,
      period
    });
    
    if (!secret) {
      throw new Error('No secret found in QR code');
    }
    
    const account = {
      issuer,
      accountIdentifier,
      secret,
      algorithm,
      digits,
      period,
      type: type.toUpperCase()
    };
    
    console.log('✅ Final parsed account:', { ...account, secret: '***' });
    return account;
  };

  const handleQRScan = (result: string) => {
    setDebugStatus(`QR Scanned: ${result.substring(0, 50)}...`);
    
    try {
      console.log('🔍 ImportWizard: QR Code scanned:', result);
      console.log('📊 Current step before parsing:', currentStep);
      
      setDebugStatus('Parsing QR code...');
      const accounts = parseGoogleAuthExport(result);
      console.log('✅ Parsed accounts:', accounts);
      
      setDebugStatus(`Found ${accounts.length} accounts`);
      setParsedAccounts(accounts);
      setSelectedAccounts(new Set(accounts.map((_, index) => index)));
      setShowScanner(false);
      setCurrentStep('preview');
      setError('');
      setDebugStatus('Ready for import');
      
      console.log('🎯 Updated state - step: preview, accounts:', accounts.length);
    } catch (error: any) {
      console.error('❌ Import error:', error);
      setError(error.message);
      setDebugStatus(`Error: ${error.message}`);
      setShowScanner(false);
      // Stay on current step to show error
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
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Import from Google Authenticator
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Step: {currentStep} | Debug: {debugStatus}
              </p>
            </div>
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
                    setDebugStatus('Opening camera scanner...');
                    console.log('🎯 Scan QR Code button clicked');
                    console.log('📊 Current state:', {
                      currentStep,
                      showScanner,
                      parsedAccounts: parsedAccounts.length,
                      error
                    });
                    setCurrentStep('scan');
                    setShowScanner(true);
                    setDebugStatus('Camera ready - scan QR code');
                    console.log('✅ Updated to scan mode');
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

              {/* Error display for method step */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

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