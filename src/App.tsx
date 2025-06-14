import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionList from './components/Transactions/TransactionList';
import CategoryList from './components/Categories/CategoryList';
import BudgetList from './components/Budget/BudgetList';
import SavingsGoals from './components/SavingsGoals/SavingsGoals';
import WishlistPage from './components/Wishlist/WishlistPage';
import Reports from './components/Reports/Reports';
import Settings from './components/Settings/Settings';
import AccountList from './components/Accounts/AccountList';

// Add global styles for modal handling
const GlobalStyles = () => {
  useEffect(() => {
    // Add a meta tag for mobile viewport
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no');
    }
    
    // Add a meta tag for theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#3B82F6');
    }
    
    // Add a meta tag for iOS web app
    const metaAppleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!metaAppleCapable) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-capable';
      meta.content = 'yes';
      document.head.appendChild(meta);
    }
    
    // Add a meta tag for iOS status bar
    const metaAppleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaAppleStatusBar) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-status-bar-style';
      meta.content = 'black-translucent';
      document.head.appendChild(meta);
    }
    
    return () => {
      // No need to clean up meta tags as they should persist
    };
  }, []);
  
  return null;
};

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
  ) : (
    <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
};

const MainApp: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<TransactionList />} />
                <Route path="/accounts" element={<AccountList />} />
                <Route path="/categories" element={<CategoryList />} />
                <Route path="/budgets" element={<BudgetList />} />
                <Route path="/savings" element={<SavingsGoals />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <GlobalStyles />
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;