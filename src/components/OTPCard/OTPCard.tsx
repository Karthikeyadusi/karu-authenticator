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

  const getTimeColor = () => {
    if (otpDisplay.timeRemaining <= 5) return 'text-red-600';
    if (otpDisplay.timeRemaining <= 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div 
      ref={swipeGesture.ref}
      className={`rounded-lg border hover:shadow-md transition-all duration-200 relative overflow-hidden ${
        isDark 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200'
      }`}
      style={{
        transform: swipeGesture.getSwipeTransform(),
        transition: swipeGesture.isActive ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      {/* Swipe Delete Background */}
      {swipeGesture.gesture && swipeGesture.gesture.deltaX < -30 && (
        <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6">
          <div className="flex items-center space-x-2 text-white">
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">Delete</span>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className={`relative p-4 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Account Info */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>{getAccountShortName(account)}</h3>
          {getAccountSubtitle(account) && (
            <p className={`text-sm truncate ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>{getAccountSubtitle(account)}</p>
          )}
        </div>
        
        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`p-1 rounded-full transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <MoreVertical className={`w-4 h-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`} />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className={`absolute right-0 top-8 z-20 border rounded-lg shadow-lg py-1 w-32 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-gray-200'
              }`}>
                <button
                  onClick={() => {
                    onEdit(account);
                    setShowMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(account.id);
                    setShowMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center transition-colors ${
                    isDark 
                      ? 'text-red-400 hover:bg-red-900/30' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* OTP Code - Mobile Optimized */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className={`text-3xl sm:text-2xl font-mono font-bold tracking-wider select-all ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {otpService.formatOTPCode(otpDisplay.code)}
          </div>
        </div>
        
        {/* Copy Button - Mobile Optimized */}
        <button
          onClick={handleCopy}
          className={`ml-3 p-3 sm:p-2 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
            isDark 
              ? 'hover:bg-gray-700 active:bg-gray-600' 
              : 'hover:bg-gray-100 active:bg-gray-200'
          }`}
          title="Copy code"
        >
          {copied ? (
            <CheckCircle className="w-6 h-6 sm:w-5 sm:h-5 text-green-600" />
          ) : (
            <Copy className={`w-6 h-6 sm:w-5 sm:h-5 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`} />
          )}
        </button>
      </div>

      {/* Progress Bar and Timer */}
      <div className="flex items-center space-x-3">
        {/* Progress Bar */}
        <div className={`flex-1 rounded-full h-2 overflow-hidden ${
          isDark ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
            style={{ 
              width: `${100 - otpDisplay.progress}%`,
              transition: otpDisplay.timeRemaining === 30 ? 'none' : 'width 1s linear'
            }}
          />
        </div>
        
        {/* Timer */}
        <div className={`text-sm font-medium ${getTimeColor()}`}>
          {otpDisplay.timeRemaining}s
        </div>
      </div>

      {/* Account Type Badge */}
      <div className="absolute top-2 right-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isDark 
            ? 'bg-blue-900/30 text-blue-400' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {account.type.toUpperCase()}
        </span>
      </div>
      </div>

      {/* Developer Panel */}
      {developerMode && <DeveloperPanel account={account} />}
    </div>
  );
};