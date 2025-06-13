import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionList from './components/Transactions/TransactionList';
import CategoryList from './components/Categories/CategoryList';
import BudgetList from './components/Budget/BudgetList';
import SavingsGoals from './components/SavingsGoals/SavingsGoals';
import Reports from './components/Reports/Reports';
import Settings from './components/Settings/Settings';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
  ) : (
    <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
  );
};

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

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

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <TransactionList />;
      case 'categories':
        return <CategoryList />;
      case 'budgets':
        return <BudgetList />;
      case 'savings':
        return <SavingsGoals />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;