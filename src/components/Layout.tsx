import React, { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  PieChart, 
  Target, 
  Settings, 
  LogOut,
  Menu,
  X,
  DollarSign,
  BarChart3,
  PiggyBank,
  Moon,
  Sun,
  Globe,
  Wallet,
  Heart,
  Repeat
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ModalProvider } from './Layout/ModalProvider';
import ModalContainer from './Layout/ModalContainer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, language, toggleTheme, setLanguage, t } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const navigation = [
    { name: t('nav.dashboard'), icon: Home, path: '/app/dashboard' },
    { name: t('nav.transactions'), icon: CreditCard, path: '/app/transactions' },
    // Example of a badge
    { name: t('nav.recurring'), icon: Repeat, path: '/app/recurring', badge: 'New' },
    { name: t('nav.accounts'), icon: Wallet, path: '/app/accounts' },
    { name: t('nav.categories'), icon: PieChart, path: '/app/categories' },
    { name: t('nav.budgets'), icon: Target, path: '/app/budgets' },
    { name: t('nav.savings'), icon: PiggyBank, path: '/app/goals' },
    { name: t('nav.wishlist'), icon: Heart, path: '/app/wishlist' },
    { name: t('nav.reports'), icon: BarChart3, path: '/app/reports' },
    { name: t('nav.settings'), icon: Settings, path: '/app/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <ModalProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Keuangan<span className="text-violet-500">Ku</span></span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-400 dark:text-gray-300" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col p-4">
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path} className="relative">
                      <button
                        onClick={() => handleNavigation(item.path)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isCurrentPath(item.path)
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left whitespace-nowrap">{item.name}</span>
                      </button>
                      {/* Badge positioned absolutely on the top right */}
                      {item.badge && (
                        <span className="absolute top-1.5 right-2 bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 pointer-events-none">
                          {item.badge}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                  {t('nav.loggedInAs')}<br />
                  <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Keuangan<span className="text-violet-500">Ku</span></span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path} className="relative">
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isCurrentPath(item.path)
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1 text-left whitespace-nowrap">{item.name}</span>
                    </button>
                    {/* Badge positioned absolutely on the top right */}
                    {item.badge && (
                      <span className="absolute top-1.5 right-2 bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 pointer-events-none">
                        {item.badge}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                {t('nav.loggedInAs')}<br />
                <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1" /> {/* Spacer */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                Selamat datang kembali, <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
              </div>
              
              {/* Theme and Language Controls */}
              <div className="flex items-center space-x-2">
                {/* Language Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Change Language"
                  >
                    <Globe className="w-5 h-5" />
                  </button>
                  {showLanguageMenu && (
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <button
                        onClick={() => {
                          setLanguage('id');
                          setShowLanguageMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors ${
                          language === 'id' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        🇮🇩 Indonesia
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('en');
                          setShowLanguageMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors ${
                          language === 'en' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        🇺🇸 English
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* Modal Container */}
        <ModalContainer />
      </div>
    </ModalProvider>
  );
};

export default Layout;
