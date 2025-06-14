import React, { useState, useEffect } from 'react';
import { X, Heart, DollarSign, Calendar, FileText, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { WishlistItem } from '../../types';
import { useWishlist } from '../../hooks/useWishlist';
import { useToast } from '../../contexts/ToastContext';
import { formatRupiah } from '../../utils/currency';

interface EditWishlistModalProps {
  isOpen: boolean;
  item: WishlistItem;
  onClose: () => void;
}

const EditWishlistModal: React.FC<EditWishlistModalProps> = ({ isOpen, item, onClose }) => {
  const { updateWishlistItem } = useWishlist();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || '',
    cost: item.cost.toString(),
    urgency: item.urgency,
    image_url: item.image_url || '',
    due_date: item.due_date || '',
  });

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama item diperlukan';
    }

    if (!formData.cost) {
      newErrors.cost = 'Biaya diperlukan';
    } else {
      const cost = parseFloat(formData.cost);
      if (isNaN(cost) || cost <= 0) {
        newErrors.cost = 'Biaya harus lebih besar dari 0';
      }
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.due_date = 'Tanggal deadline tidak boleh di masa lalu';
      }
    }

    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'URL gambar tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Data tidak valid', 'Periksa kembali form Anda');
      return;
    }

    setLoading(true);
    try {
      await updateWishlistItem(item.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        cost: parseFloat(formData.cost),
        urgency: formData.urgency,
        image_url: formData.image_url.trim() || undefined,
        due_date: formData.due_date || undefined,
      });

      onClose();
    } catch (error) {
      console.error('Error updating wishlist item:', error);
      showError('Gagal mengupdate item', 'Silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  const handleCostChange = (value: string) => {
    // Allow empty string and valid numbers with decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, cost: value }));
      // Clear cost error when user starts typing
      if (errors.cost) {
        setErrors(prev => ({ ...prev, cost: '' }));
      }
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      default: return 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300';
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Item Wishlist</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Item *
              </label>
              <div className="relative">
                <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Contoh: iPhone 15 Pro, Laptop Gaming, dll"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi (Opsional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Jelaskan mengapa Anda menginginkan item ini..."
                />
              </div>
            </div>

            {/* Cost */}
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Perkiraan Biaya *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  id="cost"
                  required
                  value={formData.cost}
                  onChange={(e) => handleCostChange(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.cost ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="1000000"
                />
              </div>
              {errors.cost && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.cost}</p>
              )}
              {formData.cost && !errors.cost && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatRupiah(parseFloat(formData.cost))}
                </p>
              )}
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tingkat Prioritas
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'low', label: 'Rendah', desc: 'Bisa ditunda' },
                  { value: 'medium', label: 'Sedang', desc: 'Cukup penting' },
                  { value: 'high', label: 'Tinggi', desc: 'Sangat diinginkan' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, urgency: option.value as any }))}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      formData.urgency === option.value
                        ? getUrgencyColor(option.value)
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs opacity-75">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL Gambar (Opsional)
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="url"
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, image_url: e.target.value }));
                    if (errors.image_url) {
                      setErrors(prev => ({ ...prev, image_url: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.image_url ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {errors.image_url && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.image_url}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Pembelian (Opsional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="date"
                  id="due_date"
                  value={formData.due_date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, due_date: e.target.value }));
                    if (errors.due_date) {
                      setErrors(prev => ({ ...prev, due_date: '' }));
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.due_date ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
              {errors.due_date && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.due_date}</p>
              )}
            </div>
          </form>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditWishlistModal;