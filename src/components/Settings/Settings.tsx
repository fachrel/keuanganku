import React from 'react';
import { User, Trash2, Download, Upload, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTheme();
  const { error: showError, success: showSuccess } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleExportData = async () => {
    if (!user) return;

    setIsExporting(true);
    try {
      // Ambil semua data pengguna dari Supabase
      const [transactionsResult, categoriesResult, budgetsResult] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('budgets').select('*').eq('user_id', user.id),
      ]);

      const data = {
        transactions: transactionsResult.data || [],
        categories: categoriesResult.data || [],
        budgets: budgetsResult.data || [],
        exported_at: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data-keuangan-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      showSuccess('Data berhasil diekspor', 'File telah diunduh ke perangkat Anda');
    } catch (error) {
      console.error('Error exporting data:', error);
      showError(t('settings.exportError'), 'Silakan coba lagi');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = async () => {
    if (!user) return;

    if (window.confirm(t('settings.deleteConfirm'))) {
      setIsDeleting(true);
      try {
        // Hapus semua data pengguna dari Supabase
        await Promise.all([
          supabase.from('transactions').delete().eq('user_id', user.id),
          supabase.from('budgets').delete().eq('user_id', user.id),
          supabase.from('categories').delete().eq('user_id', user.id),
        ]);

        showSuccess(t('settings.dataDeleted'), 'Semua data telah dihapus');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Error clearing data:', error);
        showError(t('settings.deleteError'), 'Silakan coba lagi');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('settings.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('settings.accountInfo')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.accountDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.name')}</label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
              {user?.name}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.email')}</label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
              {user?.email}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.memberSince')}</label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : t('settings.unknown')}
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('settings.dataManagement')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.dataDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.exportData')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.exportDesc')}</p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
              <span>{isExporting ? 'Mengekspor...' : t('settings.export')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-red-900 dark:text-red-400">{t('settings.dangerZone')}</h2>
            <p className="text-sm text-red-600 dark:text-red-400">{t('settings.dangerDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 gap-4">
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-400">{t('settings.deleteAllData')}</h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {t('settings.deleteAllDesc')}
              </p>
            </div>
            <button
              onClick={handleClearData}
              disabled={isDeleting}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
              <span>{isDeleting ? 'Menghapus...' : t('settings.deleteData')}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 gap-4">
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-400">{t('settings.logout')}</h3>
              <p className="text-sm text-red-600 dark:text-red-400">{t('settings.logoutDesc')}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('settings.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;