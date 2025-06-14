import React from 'react';
import { 
  Calendar, 
  DollarSign, 
  Edit, 
  Archive, 
  ArchiveRestore,
  Trash2,
  AlertTriangle,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { WishlistItem } from '../../types';
import { useWishlist } from '../../hooks/useWishlist';
import { useToast } from '../../contexts/ToastContext';
import { formatRupiah } from '../../utils/currency';

interface WishlistItemCardProps {
  item: WishlistItem;
  onEdit: () => void;
}

const WishlistItemCard: React.FC<WishlistItemCardProps> = ({ item, onEdit }) => {
  const { deleteWishlistItem, archiveWishlistItem } = useWishlist();
  const { error: showError } = useToast();

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return urgency;
    }
  };

  const getDaysUntilDue = () => {
    if (!item.due_date) return null;
    
    const today = new Date();
    const dueDate = new Date(item.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const handleDelete = async () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus "${item.name}" dari wishlist?`)) {
      try {
        await deleteWishlistItem(item.id);
      } catch (error) {
        showError('Gagal menghapus item', 'Silakan coba lagi');
      }
    }
  };

  const handleArchive = async () => {
    try {
      await archiveWishlistItem(item.id, !item.is_archived);
    } catch (error) {
      showError('Gagal mengarsipkan item', 'Silakan coba lagi');
    }
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
      item.is_archived 
        ? 'border-gray-200 dark:border-gray-700 opacity-75' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Image */}
      {item.image_url ? (
        <div className="aspect-video w-full overflow-hidden rounded-t-xl">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.fallback-image') as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
          <div className="fallback-image hidden w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        </div>
      ) : (
        <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 rounded-t-xl flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-gray-400" />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
              {item.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(item.urgency)}`}>
                {getUrgencyLabel(item.urgency)}
              </span>
              {item.is_archived && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                  Diarsipkan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Cost */}
        <div className="flex items-center space-x-2 mb-3">
          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatRupiah(item.cost)}
          </span>
        </div>

        {/* Due Date */}
        {item.due_date && (
          <div className={`flex items-center space-x-2 mb-3 ${
            isOverdue ? 'text-red-600 dark:text-red-400' : 
            isDueSoon ? 'text-orange-600 dark:text-orange-400' : 
            'text-gray-600 dark:text-gray-400'
          }`}>
            {isOverdue ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            <span className="text-sm">
              {isOverdue ? (
                `Terlambat ${Math.abs(daysUntilDue!)} hari`
              ) : daysUntilDue === 0 ? (
                'Hari ini'
              ) : daysUntilDue === 1 ? (
                'Besok'
              ) : (
                `${daysUntilDue} hari lagi`
              )}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Edit item"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={handleArchive}
              className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
              title={item.is_archived ? 'Kembalikan dari arsip' : 'Arsipkan item'}
            >
              {item.is_archived ? (
                <ArchiveRestore className="w-4 h-4" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Hapus item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(item.created_at).toLocaleDateString('id-ID')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistItemCard;