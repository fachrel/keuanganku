import React, { useState } from 'react';
import { X, Wallet, CreditCard, Building, PiggyBank, Banknote } from 'lucide-react';
import { Account } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
}) => {
  const { t } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    balance: '',
    color: '#3B82F6',
    icon: 'Wallet',
  });

  const accountTypes = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'checking', label: 'Checking Account', icon: CreditCard },
    { value: 'savings', label: 'Savings Account', icon: PiggyBank },
    { value: 'credit', label: 'Credit Card', icon: CreditCard },
    { value: 'investment', label: 'Investment', icon: Building },
    { value: 'other', label: 'Other', icon: Wallet },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    onAddAccount({
      name: formData.name.trim(),
      type: formData.type,
      balance: parseFloat(formData.balance) || 0,
      color: formData.color,
      icon: formData.icon,
    });

    // Reset form
    setFormData({
      name: '',
      type: 'cash',
      balance: '',
      color: '#3B82F6',
      icon: 'Wallet',
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Account</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter account name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {accountTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value, icon: type.icon.name })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <IconComponent className="w-5 h-5" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Balance
            </label>
            <input
              type="number"
              id="balance"
              step="0.01"
              min="0"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
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
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer bg-white dark:bg-gray-700"
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
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.icon === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.color + '20' }}
            >
              {iconOptions.find(i => i.value === formData.icon) && 
                React.createElement(iconOptions.find(i => i.value === formData.icon)!.icon, {
                  className: "w-6 h-6",
                  style: { color: formData.color }
                })
              }
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{formData.name || 'Account Name'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {accountTypes.find(t => t.value === formData.type)?.label} • {formatRupiah(parseFloat(formData.balance) || 0)}
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200"
            >
              Add Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;