import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Palette, 
  Shield, 
  Download, 
  Trash2, 
  User, 
  Bell,
  Lock,
  HelpCircle,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
  userEmail: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, onLogout, userEmail }) => {
  const { theme, setTheme, isDark } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportData = () => {
    // In a real app, this would export encrypted account data
    const data = {
      exported_at: new Date().toISOString(),
      accounts: [], // This would contain the actual account data
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karu-authenticator-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = () => {
    if (showDeleteConfirm) {
      // Clear all data
      localStorage.clear();
      onLogout();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 5000); // Auto-cancel after 5 seconds
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className={`border-b transition-colors ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className={`flex items-center space-x-2 transition-colors ${
              isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Profile Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </h2>
          <div className={`p-4 rounded-lg border transition-colors ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDark ? 'bg-blue-600' : 'bg-blue-100'
              }`}>
                <User className={`w-6 h-6 ${isDark ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className="font-medium">{userEmail}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Authenticated User
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Appearance</span>
          </h2>
          <div className={`p-4 rounded-lg border transition-colors ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose your preferred theme
            </p>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as any)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : isDark
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      isSelected ? 'text-blue-600' : isDark ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-blue-600' : ''
                    }`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security</span>
          </h2>
          <div className="space-y-3">
            <div className={`p-4 rounded-lg border transition-colors ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Auto-lock</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Lock app when inactive
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className={`p-4 rounded-lg border transition-colors ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Security Alerts</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Notify about security events
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Data Management</span>
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Download encrypted backup of your accounts
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleDeleteAllData}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                showDeleteConfirm
                  ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700'
                  : isDark 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Trash2 className={`w-5 h-5 ${showDeleteConfirm ? 'text-red-600' : 'text-red-500'}`} />
                <div>
                  <p className={`font-medium ${showDeleteConfirm ? 'text-red-600' : ''}`}>
                    {showDeleteConfirm ? 'Click Again to Confirm' : 'Delete All Data'}
                  </p>
                  <p className={`text-sm ${
                    showDeleteConfirm 
                      ? 'text-red-500' 
                      : isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {showDeleteConfirm 
                      ? 'This will permanently delete everything' 
                      : 'Permanently remove all accounts and data'
                    }
                  </p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Help Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <HelpCircle className="w-5 h-5" />
            <span>Help & Support</span>
          </h2>
          <div className={`p-4 rounded-lg border transition-colors ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="space-y-3">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <strong>Version:</strong> 1.0.0
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <strong>Support:</strong> For help and support, visit our documentation or contact support.
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <strong>Privacy:</strong> All data is stored locally on your device and encrypted.
              </p>
            </div>
          </div>
        </section>

        {/* Logout Button */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onLogout}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};