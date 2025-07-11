import React, { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, Building, PiggyBank, Banknote } from 'lucide-react';
import { Account } from '../../types';
import { useAccounts } from '../../hooks/useAccounts';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { formatRupiah } from '../../utils/currency';

interface EditAccountModalProps {
  isOpen: boolean;
  account: Account;
  onClose: () => void;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  account,
  onClose,
}) => {
  const { updateAccount } = useAccounts();
  const { t } = useTheme();
  const { error: showError, success: showSuccess } = useToast();
  const [formData, setFormData] = useState({
    name: account.name,
    type: account.type,
    balance: account.balance,
    color: account.color,
    icon: account.icon,
  });
  const [loading, setLoading] = useState(false);

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const accountTypes = [
    { value: 'cash', label: t('accounts.types.cash'), icon: Banknote },
    { value: 'bank', label: t('accounts.types.bank'), icon: Building },
    { value: 'emoney', label: t('accounts.types.emoney'), icon: CreditCard },
    { value: 'other', label: t('accounts.types.other'), icon: Wallet },
  ];

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const iconOptions = [
    { value: 'Wallet', icon: Wallet },
    { value: 'CreditCard', icon: CreditCard },
    { value: 'Building', icon: Building },
    { value: 'PiggyBank', icon: PiggyBank },
    { value: 'Banknote', icon: Banknote },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Nama akun diperlukan', 'Masukkan nama akun yang valid');
      return;
    }

    setLoading(true);
    try {
      const result = await updateAccount(account.id, {
        name: formData.name.trim(),
        type: formData.type,
        balance: formData.balance,
        color: formData.color,
        icon: formData.icon,
      });

      if (result) {
        showSuccess('Akun berhasil diupdate', `Perubahan pada ${result.name} telah disimpan`);
        onClose();
      } else {
        showError('Gagal mengupdate akun', 'Silakan coba lagi');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      showError('Gagal mengupdate akun', 'Silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{t('accounts.editAccount')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('accounts.accountName')}
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={t('accounts.enterAccountName')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('accounts.accountType')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {accountTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value, icon: type.icon.name })}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('accounts.currentBalance')}
              </label>
              <input
                type="number"
                id="balance"
                required
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={t('accounts.enterBalance')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('common.color')}
              </label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 transition-all ${
                      formData.color === color
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-8 sm:h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: option.value })}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                        formData.icon === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: formData.color + '20' }}
              >
                {iconOptions.find(i => i.value === formData.icon) && 
                  React.createElement(iconOptions.find(i => i.value === formData.icon)!.icon, {
                    className: "w-5 h-5 sm:w-6 sm:h-6",
                    style: { color: formData.color }
                  })
                }
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{formData.name || t('accounts.accountName')}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {accountTypes.find(t => t.value === formData.type)?.label} • {formatRupiah(account.balance)}
                </p>
              </div>
            </div>
          </form>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAccountModal;