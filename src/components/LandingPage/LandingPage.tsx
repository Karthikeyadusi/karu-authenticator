import React, { useState, useEffect, useRef } from 'react';
import { Shield, Smartphone, Zap, Lock, ArrowRight, Github, Star, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const { theme, setTheme, isDark } = useTheme();
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light Mode' },
    { value: 'dark', icon: Moon, label: 'Dark Mode' },
    { value: 'system', icon: Monitor, label: 'System' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Karu Authenticator
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className={`transition-colors ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>Features</a>
              <a href="#security" className={`transition-colors ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>Security</a>
              <a href="#download" className={`transition-colors ${
                isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>Download</a>
            </div>
            
            {/* Theme Toggle Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'bg-white/50 text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
                title="Change theme"
              >
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              
              {/* Dropdown */}
              {showThemeDropdown && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="py-1">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = theme === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTheme(option.value as any);
                            setShowThemeDropdown(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${
                            isSelected
                              ? isDark 
                                ? 'bg-blue-900/50 text-blue-400' 
                                : 'bg-blue-50 text-blue-600'
                              : isDark
                              ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                          {isSelected && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-current"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={onGetStarted}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className={`text-5xl md:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Secure Your Digital Life with
              <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`}> Two-Factor Authentication</span>
            </h1>
            <p className={`text-xl mb-8 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Generate secure TOTP codes for all your accounts. Fast, reliable, and works offline.
              Your security is our priority.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Start Securing Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className={`border-2 px-8 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 ${
                isDark 
                  ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white' 
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}>
                <Github className="w-5 h-5" />
                <span>View on GitHub</span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Security Badge */}
        <div className="absolute top-10 right-10 hidden lg:block">
          <div className={`rounded-full p-4 shadow-lg border-2 ${
            isDark 
              ? 'bg-gray-800 border-green-600' 
              : 'bg-white border-green-200'
          }`}>
            <div className="flex items-center space-x-2 text-green-600">
              <Lock className="w-6 h-6" />
              <span className="font-semibold">Bank-Grade Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`px-6 py-20 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Why Choose Karu Authenticator?
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Built for security, designed for simplicity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className={`text-center p-8 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2 ${
              isDark 
                ? 'bg-blue-900/20 border-blue-800 hover:bg-blue-900/30' 
                : 'bg-blue-50 border-blue-100 hover:bg-blue-100'
            }`}>
              <div className="bg-blue-600 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Mobile-First Design
              </h3>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Optimized for mobile with touch gestures, swipe actions, and responsive design that works perfectly on any device.
              </p>
            </div>

            <div className={`text-center p-8 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2 ${
              isDark 
                ? 'bg-green-900/20 border-green-800 hover:bg-green-900/30' 
                : 'bg-green-50 border-green-100 hover:bg-green-100'
            }`}>
              <div className="bg-green-600 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Lightning Fast
              </h3>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Instant code generation, offline support, and blazing-fast performance. Your codes are ready when you need them.
              </p>
            </div>

            <div className={`text-center p-8 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2 ${
              isDark 
                ? 'bg-purple-900/20 border-purple-800 hover:bg-purple-900/30' 
                : 'bg-purple-50 border-purple-100 hover:bg-purple-100'
            }`}>
              <div className="bg-purple-600 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Ultra Secure
              </h3>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                End-to-end encryption, secure local storage, and compliance with RFC 6238 TOTP standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="px-6 py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Enterprise-Grade Security</h2>
            <p className="text-xl text-gray-300">Your data never leaves your device</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6">Built for Privacy</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="bg-green-600 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>All data encrypted with AES-256 encryption</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="bg-green-600 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>No cloud sync - your secrets stay on your device</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="bg-green-600 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Open source - verify the code yourself</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="bg-green-600 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Works completely offline</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="text-center">
                <Lock className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h4 className="text-xl font-bold mb-2">Zero Trust Architecture</h4>
                <p className="text-gray-300">We can't access your data even if we wanted to. Everything stays local.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="px-6 py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Secure Your Accounts?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of users who trust Karu Authenticator</p>
          
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-blue-100">5.0 stars from security experts</span>
          </div>

          <button
            onClick={onGetStarted}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
          >
            Get Started for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 px-6 py-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-semibold text-white">Karu Authenticator</span>
          </div>
          <p>© 2025 Karu Authenticator. Built with ❤️ for security.</p>
        </div>
      </footer>
    </div>
  );
};