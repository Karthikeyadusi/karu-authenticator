import { useState, useEffect } from 'react';
import { Login } from './components/Login/Login';
import { Signup } from './components/Signup/Signup';
import { Dashboard } from './components/Dashboard/Dashboard';
import { LandingPage } from './components/LandingPage/LandingPage';
import { SettingsPage } from './components/SettingsPage/SettingsPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthService } from './services/authService';
import type { SignupData } from './services/authService';
import type { User } from './types';

type AppView = 'landing' | 'login' | 'signup' | 'dashboard' | 'settings';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const authService = AuthService.getInstance();

  useEffect(() => {
    // Check if user is already authenticated
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setCurrentView('dashboard');
    }
    setIsLoading(false);
  }, [authService]);

  const handleLogin = (email: string, password: string, _rememberMe: boolean): boolean => {
    const result = authService.login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      setCurrentView('dashboard');
      return true;
    }
    return false;
  };

  const handleSignup = (data: SignupData): { success: boolean; message?: string } => {
    const result = authService.signup(data);
    if (result.success && result.user) {
      setUser(result.user);
      setCurrentView('dashboard');
    }
    return result;
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentView('landing');
  };

  const handleGetStarted = () => {
    setCurrentView('login');
  };

  const handleShowSignup = () => {
    setCurrentView('signup');
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleShowSettings = () => {
    setCurrentView('settings');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="App">
        {currentView === 'landing' && (
          <LandingPage onGetStarted={handleGetStarted} />
        )}
        
        {currentView === 'login' && (
          <Login 
            onLogin={handleLogin}
            onShowSignup={handleShowSignup}
            onBackToLanding={handleBackToLanding}
          />
        )}
        
        {currentView === 'signup' && (
          <Signup 
            onSignup={handleSignup}
            onBackToLogin={handleBackToLogin}
          />
        )}
        
        {currentView === 'dashboard' && user && (
          <Dashboard 
            user={user}
            onLogout={handleLogout}
            onShowSettings={handleShowSettings}
          />
        )}
        
        {currentView === 'settings' && user && (
          <SettingsPage
            onBack={handleBackToDashboard}
            onLogout={handleLogout}
            userEmail={user.email}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
