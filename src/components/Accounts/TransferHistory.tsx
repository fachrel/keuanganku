import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Calendar, Filter, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/currency';
import { Account } from '../../types';

interface TransferRecord {
  id: string;
  amount: number;
  description: string;
  date: string;
  sourceAccount: string;
  destinationAccount: string;
  created_at: string;
}

const TransferHistory: React.FC = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const loadTransferHistory = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          account:accounts!inner(id, name)
        `)
        .eq('user_id', user.id)
        .eq('type', 'transfer')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading transfer history:', error);
        return;
      }

      const transferMap = new Map<string, TransferRecord>();
      
      transactions?.forEach(transaction => {
        const key = `${transaction.date}-${transaction.description.replace(/Transfer (ke|dari) .+?: /, '')}`;
        const accountName = (transaction.account as unknown as Account)?.name || 'Unknown';

        if (transferMap.has(key)) {
          const existing = transferMap.get(key)!;
          if (transaction.description.includes('Transfer ke')) {
            existing.destinationAccount = accountName;
          } else {
            existing.sourceAccount = accountName;
          }
        } else {
          transferMap.set(key, {
            id: transaction.id,
            amount: transaction.amount,
            description: transaction.description.replace(/Transfer (ke|dari) .+?: /, ''),
            date: transaction.date,
            sourceAccount: transaction.description.includes('Transfer dari') ? accountName : '',
            destinationAccount: transaction.description.includes('Transfer ke') ? accountName : '',
            created_at: transaction.created_at,
          });
        }
      });

      setTransfers(Array.from(transferMap.values()).filter(t => t.sourceAccount && t.destinationAccount));
    } catch (error) {
      console.error('Error loading transfer history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTransferHistory();
  }, [loadTransferHistory]);

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.sourceAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.destinationAccount.toLowerCase().includes(searchTerm.toLowerCase());

    if (dateFilter === 'all') {
      return matchesSearch;
    }

    const transferDate = new Date(transfer.date);
    const now = new Date();
    let matchesDate = false;

    switch (dateFilter) {
      case 'today': {
        matchesDate = transferDate.toDateString() === now.toDateString();
        break;
      }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = transferDate >= weekAgo;
        break;
      }
      case 'month': {
        matchesDate = transferDate.getMonth() === now.getMonth() && 
                     transferDate.getFullYear() === now.getFullYear();
        break;
      }
    }

    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari transfer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
          </select>
        </div>
      </div>

      {filteredTransfers.length > 0 ? (
        <div className="space-y-3">
          {filteredTransfers.map((transfer) => (
            <div key={transfer.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="text-sm truncate">
                      <span className="font-medium text-gray-900 dark:text-white truncate">{transfer.sourceAccount}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="text-sm truncate">
                      <span className="font-medium text-gray-900 dark:text-white truncate">{transfer.destinationAccount}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {formatRupiah(transfer.amount)}
                  </div>
                  <div className="flex items-center justify-end space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(transfer.date).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
              
              {transfer.description && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {transfer.description}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <ArrowRight className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Belum ada riwayat transfer
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Transfer antar akun akan muncul di sini
          </p>
        </div>
      )}
    </div>
  );
};

export default TransferHistory;