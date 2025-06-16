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
import LandingPage from './components/LandingPage/LandingPage';

// This component is unchanged but is included for completeness.
const GlobalStyles = () => {
  useEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#3B82F6');
    }

    const metaAppleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!metaAppleCapable) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-capable';
      meta.content = 'yes';
      document.head.appendChild(meta);
    }

    const metaAppleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaAppleStatusBar) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-status-bar-style';
      meta.content = 'black-translucent';
      document.head.appendChild(meta);
    }
  }, []);

  return null;
};

// A dedicated screen for handling both login and signup forms.
const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  return isLogin ? (
    <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
  ) : (
    <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
  );
};

// Corrected ProtectedRoute component.
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can replace this with a proper loading spinner component
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// This component contains the main application layout and its nested routes.
const MainApp: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<TransactionList />} />
        <Route path="accounts" element={<AccountList />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="budgets" element={<BudgetList />} />
        <Route path="goals" element={<SavingsGoals />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        {/* A fallback route for any unknown paths within the protected app */}
        <Route path="*" element={<Navigate to="dashboard" />} />
      </Routes>
    </Layout>
  );
};

// This new component will handle all the routing logic.
// Because it's a child of AuthProvider, it can safely use the `useAuth` hook.
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  return (
      <Routes>
          {/* Public Routes */}
          <Route path="/" element={user ? <Navigate to="/app/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/app/dashboard" /> : <LoginForm />} />
          <Route path="/signup" element={user ? <Navigate to="/app/dashboard" /> : <SignupForm />} />
          
          {/* Protected Routes Wrapper */}
          <Route
              path="/app/*"
              element={
                  <ProtectedRoute>
                      <MainApp />
                  </ProtectedRoute>
              }
          />

          {/* Fallback for any other route */}
          <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  );
};


// The main App component now sets up providers and renders the AppRoutes.
function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <GlobalStyles />
            <AppRoutes />
          </AuthProvider>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;