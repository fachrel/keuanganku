export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const parseRupiah = (rupiahString: string): number => {
  // Remove currency symbol, spaces, and dots used as thousand separators
  const cleanString = rupiahString
    .replace(/Rp\s?/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  
  return parseFloat(cleanString) || 0;
};

export const formatCurrency = (amount: number, currency: string = 'IDR'): string => {
  const locale = currency === 'IDR' ? 'id-ID' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};