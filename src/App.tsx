import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionList from './components/Transactions/TransactionList';
import CategoryList from './components/Categories/CategoryList';
import BudgetList from './components/Budget/BudgetList';
import MonthlyBudgetList from './components/Budget/MonthlyBudgetList';
import SavingsGoals from './components/SavingsGoals/SavingsGoals';
import AccountList from './components/Accounts/AccountList';
import Reports from './components/Reports/Reports';
import Settings from './components/Settings/Settings';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignupForm />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<TransactionList />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="budgets" element={<BudgetList />} />
                <Route path="monthly-budgets" element={<MonthlyBudgetList />} />
                <Route path="savings" element={<SavingsGoals />} />
                <Route path="accounts" element={<AccountList />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;