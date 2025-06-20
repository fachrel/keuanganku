import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Heart, 
  Archive, 
  AlertTriangle, 
  Calendar,
  DollarSign,
  Filter,
  Search,
  Target,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { useTheme } from '../../contexts/ThemeContext';
import { formatRupiah } from '../../utils/currency';
import WishlistItemCard from './WishlistItemCard';
import { useModal } from '../Layout/ModalProvider';

const WishlistPage: React.FC = () => {
  const { 
    wishlistItems, 
    loading,
    getActiveItems, 
    getArchivedItems, 
    getTotalCost, 
    getItemsByUrgency,
    getOverdueItems,
    getUpcomingItems,
    loadWishlistItems
  } = useWishlist();
  const { t } = useTheme();
  const { openModal } = useModal();
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Memoize computed values to prevent unnecessary recalculations
  const activeItems = useMemo(() => getActiveItems(), [wishlistItems]);
  const archivedItems = useMemo(() => getArchivedItems(), [wishlistItems]);
  const overdueItems = useMemo(() => getOverdueItems(), [wishlistItems]);
  const upcomingItems = useMemo(() => getUpcomingItems(), [wishlistItems]);
  const totalCost = useMemo(() => getTotalCost(), [wishlistItems]);
  const highPriorityItems = useMemo(() => getItemsByUrgency('high'), [wishlistItems]);

  const filteredItems = useMemo(() => {
    const items = activeTab === 'active' ? activeItems : archivedItems;
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUrgency = urgencyFilter === 'all' || item.urgency === urgencyFilter;
      return matchesSearch && matchesUrgency;
    });
  }, [activeItems, archivedItems, activeTab, searchTerm, urgencyFilter]);

  const handleEditItem = (itemId: string) => {
    const itemToEdit = wishlistItems.find(item => item.id === itemId);
    if (itemToEdit) {
      openModal('editWishlist', itemToEdit);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadWishlistItems();
    } catch (error) {
      console.error('Error refreshing wishlist:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wishlist</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola keinginan Anda dan hindari pembelian impulsif
          </p>
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
            onClick={() => openModal('addWishlist')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Item</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {activeItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Item</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{activeItems.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Biaya</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{formatRupiah(totalCost)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Prioritas Tinggi</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {highPriorityItems.length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Mendekati Deadline</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {upcomingItems.length}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {overdueItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-medium mb-1">Peringatan Deadline!</p>
              <p>Anda memiliki {overdueItems.length} item yang sudah melewati deadline.</p>
            </div>
          </div>
        </div>
      )}

      {upcomingItems.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Deadline Mendekati</p>
              <p>Anda memiliki {upcomingItems.length} item dengan deadline dalam 7 hari ke depan.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'active'
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Wishlist Aktif ({activeItems.length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'archived'
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Arsip ({archivedItems.length})
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari item wishlist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            {activeTab === 'active' && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value as any)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">Semua Prioritas</option>
                  <option value="high">Prioritas Tinggi</option>
                  <option value="medium">Prioritas Sedang</option>
                  <option value="low">Prioritas Rendah</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="p-4 sm:p-6">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredItems.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEditItem(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {activeTab === 'active' ? (
                  <Heart className="w-8 h-8 text-gray-400" />
                ) : (
                  <Archive className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeTab === 'active' ? 'Belum ada item wishlist' : 'Belum ada item yang diarsipkan'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {activeTab === 'active' 
                  ? 'Mulai dengan menambahkan item pertama ke wishlist Anda'
                  : 'Item yang diarsipkan akan muncul di sini'
                }
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={() => openModal('addWishlist')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Item Pertama</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Anti-Impulse Tips */}
      {activeItems.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-purple-900 dark:text-purple-200 mb-2">
                Tips Menghindari Pembelian Impulsif
              </h3>
              <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
                <li>• Tunggu minimal 24 jam sebelum membeli item prioritas tinggi</li>
                <li>• Tanyakan pada diri sendiri: "Apakah saya benar-benar membutuhkan ini?"</li>
                <li>• Bandingkan harga dari berbagai sumber sebelum membeli</li>
                <li>• Pertimbangkan untuk menabung terlebih dahulu sebelum membeli</li>
                <li>• Arsipkan item yang sudah tidak relevan untuk mengurangi godaan</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;