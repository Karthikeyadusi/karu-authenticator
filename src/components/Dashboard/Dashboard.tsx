import React, { useState, useEffect } from 'react';
import { Plus, Search, LogOut, Settings, Shield, Code, AlertTriangle, BookOpen } from 'lucide-react';
import { OTPCard } from '../OTPCard/OTPCard';
import { AddAccountModal } from '../AddAccountModal/AddAccountModal';
import { TOTPEducationModal } from '../TOTPEducationModal/TOTPEducationModal';
import { PWAInstallPrompt } from '../PWAInstallPrompt/PWAInstallPrompt';
import { PWAUpdateNotification } from '../PWAUpdateNotification/PWAUpdateNotification';
import { OfflineIndicator } from '../OfflineIndicator/OfflineIndicator';
import { CacheStatus } from '../CacheStatus/CacheStatus';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthService } from '../../services/authService';
import type { AuthAccount, User } from '../../types';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onShowSettings?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onShowSettings }) => {
  const { isDark } = useTheme();
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AuthAccount | null>(null);
  const [developerMode, setDeveloperMode] = useState(false);
  const [showDeveloperWarning, setShowDeveloperWarning] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const authService = AuthService.getInstance();

  // Pull to refresh functionality
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      // Refresh accounts and clear any cached data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh
      loadAccounts();
    },
    threshold: 70
  });

  useEffect(() => {
    loadAccounts();
    
    // Show PWA install prompt after 3 seconds if not installed
    const timer = setTimeout(() => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      if (!isStandalone && !isIOSStandalone) {
        setShowPWAPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const loadAccounts = () => {
    const userAccounts = authService.getUserAccounts();
    setAccounts(userAccounts);
  };

  const handleAddAccount = (accountData: Omit<AuthAccount, 'id'>) => {
    const newAccount: AuthAccount = {
      ...accountData,
      id: Date.now().toString()
    };
    const currentAccounts = authService.getUserAccounts();
    authService.storeUserAccounts([...currentAccounts, newAccount]);
    loadAccounts();
    setShowAddModal(false);
  };

  const handleEditAccount = (account: AuthAccount) => {
    setEditingAccount(account);
    setShowAddModal(true);
  };

  const handleUpdateAccount = (accountData: Omit<AuthAccount, 'id'>) => {
    if (editingAccount) {
      const currentAccounts = authService.getUserAccounts();
      const updatedAccounts = currentAccounts.map(acc => 
        acc.id === editingAccount.id 
          ? { ...accountData, id: editingAccount.id }
          : acc
      );
      authService.storeUserAccounts(updatedAccounts);
      loadAccounts();
      setShowAddModal(false);
      setEditingAccount(null);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      const currentAccounts = authService.getUserAccounts();
      const updatedAccounts = currentAccounts.filter(acc => acc.id !== accountId);
      authService.storeUserAccounts(updatedAccounts);
      loadAccounts();
    }
  };

  const toggleDeveloperMode = () => {
    if (!developerMode) {
      setShowDeveloperWarning(true);
    } else {
      setDeveloperMode(false);
    }
  };

  const confirmDeveloperMode = () => {
    setDeveloperMode(true);
    setShowDeveloperWarning(false);
  };

  const filteredAccounts = accounts.filter(account =>
    account.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.accountIdentifier && account.accountIdentifier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div 
      ref={pullToRefresh.ref}
      className={`min-h-screen overflow-auto transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-900' 
          : 'bg-gray-50'
      }`}
    >
      {/* Pull to Refresh Indicator */}
      {pullToRefresh.shouldShowRefreshIndicator() && (
        <div 
          className={`fixed top-0 left-1/2 transform -translate-x-1/2 z-50 rounded-full p-3 shadow-lg border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-google-border'
          }`}
          style={pullToRefresh.getPullTransform()}
        >
          <div className={`w-6 h-6 border-2 border-t-transparent rounded-full ${
            isDark ? 'border-blue-400' : 'border-google-blue'
          } ${pullToRefresh.isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      {/* Header */}
      <header className={`border-b sticky top-0 z-30 backdrop-blur-xl transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700/50 shadow-lg shadow-black/10' 
          : 'bg-white/80 border-gray-200/50 shadow-sm'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Karu Authenticator</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Welcome, {user.name}</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              {/* How TOTP Works Button */}
              <button
                onClick={() => setShowEducationModal(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                title="Learn how TOTP works"
              >
                <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Developer Mode Toggle */}
              <button
                onClick={toggleDeveloperMode}
                className={`p-2 rounded-full transition-all duration-200 hover:scale-105 ${
                  developerMode 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                title={developerMode ? 'Developer Mode Active' : 'Enable Developer Mode'}
              >
                <Code className="w-5 h-5" />
              </button>
              
              <button 
                onClick={onShowSettings}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 hover:text-red-500 dark:hover:text-red-400"
                title="Sign out"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Cache Status Bar */}
        <div className="mb-4 flex justify-center">
          <CacheStatus />
        </div>

        {/* Search and Add - Mobile Optimized */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200"
            />
          </div>

          {/* Add Account Button - Mobile Optimized */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-400 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-600 active:scale-95 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 text-lg min-h-[56px] shadow-lg hover:shadow-xl"
          >
            <Plus className="w-6 h-6" />
            <span>Add Account</span>
          </button>
        </div>

        {/* Developer Mode Warning */}
        {developerMode && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="font-medium text-red-800 dark:text-red-300">Developer Mode Active</h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">
              You can now see TOTP algorithm details, future OTP predictions, and verification tools. 
              This mode is for educational and testing purposes only.
            </p>
          </div>
        )}

        {/* PWA Install Prompt */}
        {showPWAPrompt && (
          <div className="mb-6">
            <PWAInstallPrompt onClose={() => setShowPWAPrompt(false)} />
          </div>
        )}

        {/* Accounts Grid */}
        {filteredAccounts.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredAccounts.map((account) => (
              <OTPCard
                key={account.id}
                account={account}
                onEdit={handleEditAccount}
                onDelete={handleDeleteAccount}
                developerMode={developerMode}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {searchTerm ? (
              <div>
                <Search className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No accounts found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No accounts match your search term "{searchTerm}"
                </p>
              </div>
            ) : (
              <div>
                <Shield className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No accounts yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add your first account using the button above to start generating verification codes
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {accounts.length > 0 && (
          <div className={`mt-8 p-4 rounded-lg border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className={`flex items-center justify-between text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span>Total accounts: {accounts.length}</span>
              <span>Active codes: {filteredAccounts.length}</span>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Account Modal */}
      {showAddModal && (
        <AddAccountModal
          account={editingAccount}
          onSave={editingAccount ? handleUpdateAccount : handleAddAccount}
          onClose={() => {
            setShowAddModal(false);
            setEditingAccount(null);
          }}
        />
      )}

      {/* Developer Mode Warning Modal */}
      {showDeveloperWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Enable Developer Mode?</h3>
              </div>
              
              <div className="mb-6 space-y-3">
                <p className="text-sm text-gray-600">
                  Developer Mode will show sensitive security information including:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Secret keys and algorithm details</li>
                  <li>• Future OTP predictions</li>
                  <li>• TOTP verification tools</li>
                  <li>• Security vulnerability demonstrations</li>
                </ul>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ This feature is for educational and testing purposes only.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeveloperWarning(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeveloperMode}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Enable Developer Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOTP Education Modal */}
      <TOTPEducationModal
        isOpen={showEducationModal}
        onClose={() => setShowEducationModal(false)}
      />

      {/* PWA Update Notification */}
      <PWAUpdateNotification />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
};