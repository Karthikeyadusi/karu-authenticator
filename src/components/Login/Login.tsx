import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { LoginForm } from '../../types';

interface LoginProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => boolean;
  onShowSignup?: () => void;
  onBackToLanding?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onShowSignup, onBackToLanding }) => {
  const { isDark } = useTheme();
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = onLogin(form.email, form.password, form.rememberMe);
    
    if (!success) {
      setError('Invalid email or password. Try demo@gmail.com / password123');
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 relative transition-colors duration-200 ${
      isDark ? 'bg-gray-900' : 'bg-google-gray-light'
    }`}>
      <div className="max-w-md w-full">
        {/* Google Logo and Title */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-google-blue'}`}>A</div>
          </div>
          <h1 className={`text-2xl font-normal mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Sign in to Authenticator
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-google-gray'}`}>
            Use your Google Account
          </p>
        </div>

        {/* Login Form */}
        <div className={`rounded-lg shadow-sm border p-8 transition-colors duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-google-border'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-gray-400' : 'text-google-gray'
                }`} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="Email or phone"
                  className={`w-full pl-12 pr-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-google-border text-gray-900 placeholder-gray-500'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-gray-400' : 'text-google-gray'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`w-full pl-12 pr-12 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-google-border text-gray-900 placeholder-gray-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    isDark ? 'text-gray-400 hover:text-gray-300' : 'text-google-gray hover:text-gray-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleInputChange}
                className="w-4 h-4 text-google-blue border-google-border rounded focus:ring-google-blue"
              />
              <label className="ml-2 text-sm text-google-gray">
                Stay signed in
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`border rounded-md p-3 ${
                isDark 
                  ? 'bg-red-900/20 border-red-800 text-red-400' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Demo Credentials */}
            <div className={`border rounded-md p-3 ${
              isDark 
                ? 'bg-blue-900/20 border-blue-800' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <p className={`text-sm font-medium mb-1 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>Demo Credentials:</p>
              <p className={`text-xs ${
                isDark ? 'text-blue-300' : 'text-blue-600'
              }`}>Email: demo@gmail.com</p>
              <p className={`text-xs ${
                isDark ? 'text-blue-300' : 'text-blue-600'
              }`}>Password: password123</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !form.email || !form.password}
              className={`w-full font-medium py-3 px-4 rounded-md transition-colors ${
                isLoading || !form.email || !form.password
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                className={`text-sm hover:underline transition-colors ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-google-blue hover:text-blue-800'
                }`}
              >
                Forgot password?
              </button>
            </div>
          </form>

          {/* Signup Link */}
          {onShowSignup && (
            <p className={`text-center text-sm mt-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account?{' '}
              <button
                onClick={onShowSignup}
                className={`font-medium hover:underline transition-colors ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                Sign up
              </button>
            </p>
          )}
        </div>

        {/* Back to Landing */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className={`absolute top-4 left-4 flex items-center space-x-2 transition-colors ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <div className={`flex justify-center space-x-6 text-xs ${
            isDark ? 'text-gray-500' : 'text-google-gray'
          }`}>
            <a href="#" className={`transition-colors ${
              isDark ? 'hover:text-gray-400' : 'hover:text-gray-700'
            }`}>Help</a>
            <a href="#" className={`transition-colors ${
              isDark ? 'hover:text-gray-400' : 'hover:text-gray-700'
            }`}>Privacy</a>
            <a href="#" className={`transition-colors ${
              isDark ? 'hover:text-gray-400' : 'hover:text-gray-700'
            }`}>Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
};