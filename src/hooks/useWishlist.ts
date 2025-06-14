import { useState, useEffect } from 'react';
import { WishlistItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { logError } from '../utils/errorHandler';

export const useWishlist = () => {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadWishlistItems();
    }
  }, [user]);

  const loadWishlistItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logError(error, 'Loading wishlist items');
        showError('Gagal memuat wishlist', 'Silakan refresh halaman');
        return;
      }

      setWishlistItems(data || []);
    } catch (error) {
      logError(error, 'Loading wishlist items');
      showError('Gagal memuat wishlist', 'Silakan refresh halaman');
    } finally {
      setLoading(false);
    }
  };

  const addWishlistItem = async (item: Omit<WishlistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .insert([
          {
            ...item,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        logError(error, 'Adding wishlist item');
        throw error;
      }

      // Immediate optimistic update
      setWishlistItems(prev => [data, ...prev]);
      showSuccess('Item berhasil ditambahkan', `${data.name} telah ditambahkan ke wishlist`);

    } catch (error) {
      logError(error, 'Adding wishlist item');
      throw error;
    }
  };

  const updateWishlistItem = async (id: string, updates: Partial<WishlistItem>) => {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logError(error, 'Updating wishlist item');
        showError('Gagal mengupdate item', 'Silakan coba lagi');
        return;
      }

      // Immediate optimistic update
      setWishlistItems(prev => prev.map(item => item.id === id ? data : item));
      showSuccess('Item berhasil diupdate', 'Perubahan telah disimpan');

    } catch (error) {
      logError(error, 'Updating wishlist item');
      showError('Gagal mengupdate item', 'Silakan coba lagi');
    }
  };

  const deleteWishlistItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', id);

      if (error) {
        logError(error, 'Deleting wishlist item');
        showError('Gagal menghapus item', 'Silakan coba lagi');
        return;
      }

      // Immediate optimistic update
      setWishlistItems(prev => prev.filter(item => item.id !== id));
      showSuccess('Item berhasil dihapus', 'Item telah dihapus dari wishlist');

    } catch (error) {
      logError(error, 'Deleting wishlist item');
      showError('Gagal menghapus item', 'Silakan coba lagi');
    }
  };

  const archiveWishlistItem = async (id: string, archived: boolean = true) => {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .update({ is_archived: archived })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logError(error, 'Archiving wishlist item');
        showError('Gagal mengarsipkan item', 'Silakan coba lagi');
        return;
      }

      // Immediate optimistic update
      setWishlistItems(prev => prev.map(item => item.id === id ? data : item));
      showSuccess(
        archived ? 'Item berhasil diarsipkan' : 'Item berhasil dikembalikan',
        archived ? 'Item telah dipindahkan ke arsip' : 'Item telah dikembalikan ke wishlist aktif'
      );

    } catch (error) {
      logError(error, 'Archiving wishlist item');
      showError('Gagal mengarsipkan item', 'Silakan coba lagi');
    }
  };

  const getActiveItems = () => {
    return wishlistItems.filter(item => !item.is_archived);
  };

  const getArchivedItems = () => {
    return wishlistItems.filter(item => item.is_archived);
  };

  const getTotalCost = (includeArchived: boolean = false) => {
    const items = includeArchived ? wishlistItems : getActiveItems();
    return items.reduce((total, item) => total + item.cost, 0);
  };

  const getItemsByUrgency = (urgency: 'low' | 'medium' | 'high') => {
    return getActiveItems().filter(item => item.urgency === urgency);
  };

  const getOverdueItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return getActiveItems().filter(item => {
      if (!item.due_date) return false;
      const dueDate = new Date(item.due_date);
      return dueDate < today;
    });
  };

  const getUpcomingItems = (days: number = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return getActiveItems().filter(item => {
      if (!item.due_date) return false;
      const dueDate = new Date(item.due_date);
      return dueDate >= today && dueDate <= futureDate;
    });
  };

  return {
    wishlistItems,
    loading,
    addWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    archiveWishlistItem,
    loadWishlistItems,
    getActiveItems,
    getArchivedItems,
    getTotalCost,
    getItemsByUrgency,
    getOverdueItems,
    getUpcomingItems,
  };
};