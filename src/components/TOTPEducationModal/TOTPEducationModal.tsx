import React, { useState } from 'react';
import { BookOpen, X, Code, Clock, Shield, Key, AlertCircle } from 'lucide-react';

interface TOTPEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TOTPEducationModal: React.FC<TOTPEducationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">How TOTP Authentication Works</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'algorithm', label: 'Algorithm', icon: Code },
            { id: 'security', label: 'Security', icon: Key },
            { id: 'vulnerabilities', label: 'Vulnerabilities', icon: AlertCircle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 inline mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">What is TOTP?</h3>
                <p className="text-gray-600 mb-4">
                  Time-based One-Time Password (TOTP) is an algorithm that generates unique 6-8 digit codes 
                  that change every 30 seconds. It's widely used for two-factor authentication (2FA).
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Key Components:</h4>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    <strong>Secret Key:</strong> Shared between server and authenticator
                  </li>
                  <li className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <strong>Time:</strong> Current Unix timestamp divided by period (usually 30s)
                  </li>
                  <li className="flex items-center">
                    <Code className="w-4 h-4 mr-2" />
                    <strong>Algorithm:</strong> HMAC-SHA1/256/512 cryptographic function
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">How It Works:</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Server generates a random secret key during setup</li>
                  <li>Secret is shared with authenticator app (via QR code)</li>
                  <li>Both server and app use same algorithm to generate codes</li>
                  <li>Codes change every 30 seconds based on current time</li>
                  <li>Server verifies the code you enter matches expected value</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'algorithm' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">TOTP Algorithm Breakdown</h3>
                <p className="text-gray-600 mb-4">
                  TOTP follows RFC 6238 specification. Here's exactly how your Python script and our app generate codes:
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Step-by-Step Process:</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <span className="font-mono bg-blue-100 px-2 py-1 rounded mr-3">1</span>
                    <div>
                      <strong>Time Counter:</strong> <code>counter = floor(current_time / 30)</code>
                      <br />
                      <span className="text-gray-600">Convert current time to 30-second intervals</span>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="font-mono bg-blue-100 px-2 py-1 rounded mr-3">2</span>
                    <div>
                      <strong>HMAC Generation:</strong> <code>hmac = HMAC-SHA1(secret_key, counter)</code>
                      <br />
                      <span className="text-gray-600">Create cryptographic hash</span>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="font-mono bg-blue-100 px-2 py-1 rounded mr-3">3</span>
                    <div>
                      <strong>Dynamic Truncation:</strong> Extract 4 bytes from HMAC
                      <br />
                      <span className="text-gray-600">Use last 4 bits as offset</span>
                    </div>
                  </div>
                  <div className="flex">
                    <span className="font-mono bg-blue-100 px-2 py-1 rounded mr-3">4</span>
                    <div>
                      <strong>Code Generation:</strong> <code>code = extracted_value % 10^6</code>
                      <br />
                      <span className="text-gray-600">Get final 6-digit code</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">🔍 Your Python Script Logic:</h4>
                <pre className="text-sm text-yellow-800 font-mono bg-yellow-100 p-3 rounded overflow-x-auto">
{`# This is exactly what your script does:
totp = pyotp.TOTP(secret_key)
current_code = totp.now()  # Uses current time
future_code = totp.at(time + 30)  # Uses future time`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Security Properties</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">✅ Strengths</h4>
                  <ul className="space-y-1 text-green-800 text-sm">
                    <li>• Time-limited validity (30 seconds)</li>
                    <li>• Cryptographically secure (HMAC)</li>
                    <li>• No network required for generation</li>
                    <li>• Resistant to replay attacks</li>
                    <li>• Widely standardized (RFC 6238)</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">⚠️ Weaknesses</h4>
                  <ul className="space-y-1 text-red-800 text-sm">
                    <li>• Secret key compromise = total failure</li>
                    <li>• Vulnerable to phishing</li>
                    <li>• Requires accurate time sync</li>
                    <li>• No protection against malware</li>
                    <li>• Social engineering attacks</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">🛡️ Best Practices</h4>
                <ul className="space-y-1 text-blue-800 text-sm">
                  <li>• Never share secret keys</li>
                  <li>• Use backup codes for account recovery</li>
                  <li>• Enable multiple 2FA methods when possible</li>
                  <li>• Store secrets in secure authenticator apps</li>
                  <li>• Be aware of phishing attempts</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'vulnerabilities' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Security Vulnerabilities Demonstrated</h3>
                <p className="text-gray-600 mb-4">
                  Your Python script demonstrates critical security concepts that everyone should understand:
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">🚨 Secret Key Exposure</h4>
                <p className="text-red-800 text-sm mb-2">
                  <strong>What your script shows:</strong> If someone gets your secret key, they can predict ALL future OTP codes.
                </p>
                <div className="bg-red-100 p-3 rounded">
                  <code className="text-xs text-red-900">
                    secret_key = "C4LPLMNFS7BSSEZ4"<br />
                    # With this, attacker can generate:<br />
                    # - Current OTP<br />
                    # - Next 5 future OTPs<br />
                    # - ANY future OTP for any time
                  </code>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">⏰ Time Predictability</h4>
                <p className="text-yellow-800 text-sm mb-2">
                  TOTP is deterministic - codes are NOT random, they're calculated based on time.
                </p>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• Codes change every 30 seconds</li>
                  <li>• Future codes can be calculated in advance</li>
                  <li>• Time synchronization attacks possible</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">🔬 Educational Value</h4>
                <p className="text-purple-800 text-sm mb-2">
                  Your script is perfect for understanding why:
                </p>
                <ul className="text-purple-800 text-sm space-y-1">
                  <li>• Secret key protection is critical</li>
                  <li>• TOTP has inherent limitations</li>
                  <li>• Additional security layers are needed</li>
                  <li>• Security through obscurity doesn't work</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">🎓 Research Applications</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Penetration testing and security audits</li>
                  <li>• Educational demonstrations of 2FA limits</li>
                  <li>• Understanding cryptographic algorithms</li>
                  <li>• Developing better authentication systems</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Educational content for security research and understanding
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};