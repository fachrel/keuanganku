import React, { useState } from 'react';
import { X, PiggyBank } from 'lucide-react';
import { SavingsGoal } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';

interface AddGoalModalProps {
  onClose: () => void;
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at' | 'current_amount' | 'is_completed'>) => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onAddGoal }) => {
  const { t } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    target_date: '',
    color: '#10B981',
  });

  const predefinedColors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.target_amount || !formData.target_date) {
      return;
    }

    const targetAmount = parseFloat(formData.target_amount);
    if (targetAmount <= 0) {
      alert('Jumlah target harus lebih dari 0');
      return;
    }

    const targetDate = new Date(formData.target_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (targetDate < today) {
      alert('Tanggal target tidak boleh di masa lalu');
      return;
    }

    onAddGoal({
      name: formData.name.trim(),
      description: formData.description.trim(),
      target_amount: targetAmount,
      target_date: formData.target_date,
      color: formData.color,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('savings.addGoalModal')}</h2>
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
              {t('savings.goalName')}
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder={t('savings.goalNamePlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('savings.description')}
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder={t('savings.descriptionPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('savings.targetAmount')}
            </label>
            <input
              type="number"
              id="target_amount"
              step="10000"
              min="1"
              required
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="target_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('savings.targetDate')}
            </label>
            <input
              type="date"
              id="target_date"
              required
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('categories.color')}
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

          {/* Preview */}
          <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.color + '20' }}
            >
              <PiggyBank 
                className="w-6 h-6"
                style={{ color: formData.color }}
              />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{formData.name || t('savings.goalNameDefault')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('savings.target')} {formData.target_amount ? formatRupiah(parseFloat(formData.target_amount)) : 'Rp 0'}
              </p>
              {formData.target_date && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('savings.deadline')} {new Date(formData.target_date).toLocaleDateString('id-ID')}
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200"
            >
              {t('savings.addGoal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;