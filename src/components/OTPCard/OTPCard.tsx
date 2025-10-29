import React, { useState, useEffect } from 'react';
import { Copy, MoreVertical, Edit, Trash2, CheckCircle } from 'lucide-react';
import { OTPService } from '../../services/otp';
import { DeveloperPanel } from '../DeveloperPanel/DeveloperPanel';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useTheme } from '../../contexts/ThemeContext';
import type { AuthAccount, OTPDisplay } from '../../types';
import { getAccountShortName, getAccountSubtitle } from '../../types';

interface OTPCardProps {
  account: AuthAccount;
  onEdit: (account: AuthAccount) => void;
  onDelete: (accountId: string) => void;
  developerMode?: boolean;
}

export const OTPCard: React.FC<OTPCardProps> = ({ account, onEdit, onDelete, developerMode = false }) => {
  const { isDark } = useTheme();
  const [otpDisplay, setOtpDisplay] = useState<OTPDisplay>({ code: '', timeRemaining: 30, progress: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const otpService = OTPService.getInstance();

  // Swipe gesture for mobile delete
  const swipeGesture = useSwipeGesture({
    onSwipeLeft: () => {
      onDelete(account.id);
    },
    threshold: 80,
    preventScroll: true
  });

  useEffect(() => {
    const updateOTP = () => {
      const display = otpService.getOTPDisplay(account);
      setOtpDisplay(display);
    };

    // Update immediately
    updateOTP();

    // Set up interval to update every second
    const interval = setInterval(updateOTP, 1000);

    return () => clearInterval(interval);
  }, [account, otpService]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(otpDisplay.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getProgressColor = () => {
    if (otpDisplay.timeRemaining <= 5) return 'bg-red-500';
    if (otpDisplay.timeRemaining <= 10) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div 
      ref={swipeGesture.ref}
      className={`rounded-xl border hover:shadow-xl transition-all duration-300 relative overflow-hidden ${
        isDark 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      style={{
        transform: swipeGesture.getSwipeTransform(),
        transition: swipeGesture.isActive ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      {/* Swipe Delete Background */}
      {swipeGesture.gesture && swipeGesture.gesture.deltaX < -30 && (
        <div className="absolute inset-0 bg-gradient-to-l from-red-500 to-red-600 flex items-center justify-end pr-6">
          <div className="flex items-center space-x-2 text-white">
            <Trash2 className="w-5 h-5" />
            <span className="font-semibold">Delete</span>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className={`relative p-5 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        
        {/* Header Section - Redesigned to avoid collisions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-3">
            {/* Title Row with inline badge */}
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className={`font-semibold text-lg truncate ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{getAccountShortName(account)}</h3>
              
              {/* Account Type Badge - Now inline with title */}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200'
              }`}>
                {account.type.toUpperCase()}
              </span>
            </div>
            
            {/* Subtitle */}
            {getAccountSubtitle(account) && (
              <p className={`text-sm truncate ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>{getAccountSubtitle(account)}</p>
            )}
          </div>
          
          {/* Menu Button - Better positioned */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {/* Enhanced Dropdown Menu */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className={`absolute right-0 top-12 z-20 border rounded-xl shadow-2xl py-2 w-40 backdrop-blur-xl ${
                  isDark 
                    ? 'bg-gray-800/95 border-gray-600 shadow-black/30' 
                    : 'bg-white/95 border-gray-200 shadow-gray-900/10'
                }`}>
                  <button
                    onClick={() => {
                      onEdit(account);
                      setShowMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center transition-all duration-200 hover:scale-105 ${
                      isDark 
                        ? 'text-gray-300 hover:bg-gray-700/50' 
                        : 'text-gray-700 hover:bg-gray-100/70'
                    }`}
                  >
                    <Edit className="w-4 h-4 mr-3" />
                    Edit Account
                  </button>
                  <button
                    onClick={() => {
                      onDelete(account.id);
                      setShowMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center transition-all duration-200 hover:scale-105 ${
                      isDark 
                        ? 'text-red-400 hover:bg-red-900/30' 
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* OTP Code Section - Enhanced */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`text-4xl font-mono font-bold tracking-wider select-all ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {otpService.formatOTPCode(otpDisplay.code)}
              </div>
            </div>
            
            {/* Enhanced Copy Button */}
            <button
              onClick={handleCopy}
              className={`ml-4 p-3 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 min-w-[52px] min-h-[52px] flex items-center justify-center ${
                copied
                  ? isDark 
                    ? 'bg-green-900/40 border-2 border-green-500/50 shadow-lg shadow-green-500/20' 
                    : 'bg-green-50 border-2 border-green-300 shadow-lg shadow-green-500/10'
                  : isDark 
                    ? 'hover:bg-gray-700 border-2 border-transparent hover:border-gray-600' 
                    : 'hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
              }`}
              title="Copy code"
            >
              {copied ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Copy className={`w-6 h-6 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`} />
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Progress Bar and Timer */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className={`h-2.5 rounded-full overflow-hidden ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${getProgressColor()}`}
                style={{ 
                  width: `${otpDisplay.progress}%`,
                  background: otpDisplay.timeRemaining <= 5 
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                    : otpDisplay.timeRemaining <= 10
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #10b981, #059669)'
                }}
              />
            </div>
          </div>
          
          {/* Enhanced Timer Badge */}
          <div className={`px-3 py-2 rounded-xl font-bold text-sm border ${
            otpDisplay.timeRemaining <= 5 
              ? isDark 
                ? 'bg-red-900/40 text-red-400 border-red-500/30' 
                : 'bg-red-50 text-red-600 border-red-200'
              : otpDisplay.timeRemaining <= 10
              ? isDark 
                ? 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30' 
                : 'bg-yellow-50 text-yellow-600 border-yellow-200'
              : isDark 
                ? 'bg-green-900/40 text-green-400 border-green-500/30' 
                : 'bg-green-50 text-green-600 border-green-200'
          }`}>
            {otpDisplay.timeRemaining}s
          </div>
        </div>
      </div>

      {/* Developer Panel */}
      {developerMode && <DeveloperPanel account={account} />}
    </div>
  );
};