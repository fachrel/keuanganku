import React, { useState } from 'react';
import { Plus, PiggyBank, Target, Calendar, TrendingUp, CheckCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { useSavingsGoals } from '../../hooks/useSavingsGoals';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';
import { useModal } from '../Layout/ModalProvider';

const SavingsGoals: React.FC = () => {
  const { savingsGoals, addSavingsGoal, deleteSavingsGoal, contributeToGoal, loadSavingsGoals } = useSavingsGoals();
  const { t } = useTheme();
  const { openModal } = useModal();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const handleContribute = (goalId: string) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal) {
      openModal('contributeGoal', {
        goal,
        onContribute: contributeToGoal
      });
    }
  };

  const handleDeleteGoal = (id: string, name: string) => {
    if (window.confirm(`${t('savings.deleteConfirm')} "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteSavingsGoal(id);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadSavingsGoals();
    } catch (error) {
      console.error('Error refreshing savings goals:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddGoal = () => {
    openModal('addGoal', { onAddGoal: addSavingsGoal });
  };

  const toggleExpandGoal = (goalId: string) => {
    setExpandedGoal(prev => prev === goalId ? null : goalId);
  };

  const activeGoals = savingsGoals.filter(goal => !goal.is_completed);
  const completedGoals = savingsGoals.filter(goal => goal.is_completed);

  const totalTargetAmount = savingsGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalCurrentAmount = savingsGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('savings.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('savings.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleAddGoal}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('savings.addGoal')}</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {savingsGoals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('savings.totalGoals')}</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{savingsGoals.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('savings.completed')}</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{completedGoals.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('savings.totalTarget')}</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{formatRupiah(totalTargetAmount)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('savings.overallProgress')}</p>
                <p className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{overallProgress.toFixed(1)}%</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('savings.activeGoals')}</h2>
          <div className="space-y-4">
            {activeGoals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const daysRemaining = getDaysRemaining(goal.target_date);
              const isExpanded = expandedGoal === goal.id;
              
              return (
                <div 
                  key={goal.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Goal Header - Always visible */}
                  <div 
                    className="p-4 sm:p-6 cursor-pointer"
                    onClick={() => toggleExpandGoal(goal.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: goal.color + '20' }}
                        >
                          <PiggyBank 
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            style={{ color: goal.color }}
                          />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{goal.description}</p>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{t('common.progress')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatRupiah(goal.current_amount)}</span>
                        <span>{formatRupiah(goal.target_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target Date</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(goal.target_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
                          <p className={`text-sm font-medium ${
                            daysRemaining > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {daysRemaining > 0 
                              ? `${daysRemaining} ${t('savings.daysRemaining')}`
                              : daysRemaining === 0 
                              ? t('savings.today')
                              : `${Math.abs(daysRemaining)} ${t('savings.daysLate')}`
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContribute(goal.id);
                          }}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          {t('savings.contribute')}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGoal(goal.id, goal.name);
                          }}
                          className="px-3 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm rounded-lg transition-colors"
                        >
                          {t('savings.delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('savings.completedGoals')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{goal.name}</h3>
                      {goal.description && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{goal.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('savings.targetReached')}</span>
                    <span className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                      {formatRupiah(goal.target_amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{t('savings.completedOn')}</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(goal.target_date).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(goal.id, goal.name)}
                    className="w-full px-3 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm rounded-lg transition-colors"
                  >
                    {t('savings.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {savingsGoals.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <PiggyBank className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('savings.noGoals')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {t('savings.noGoalsDesc')}
          </p>
          <button
            onClick={handleAddGoal}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>{t('savings.createFirst')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SavingsGoals;