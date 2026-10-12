import { format, parseISO, isValid } from 'date-fns';

// ====== تنسيق التاريخ ======
export const formatDate = (date, pattern = 'yyyy-MM-dd') => {
  if (!date) return '-';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsed) ? format(parsed, pattern) : '-';
  } catch {
    return '-';
  }
};

// ====== تنسيق التاريخ والوقت ======
export const formatDateTime = (date) => formatDate(date, 'yyyy-MM-dd HH:mm');

// ====== تنسيق المبلغ بالجنيه المصري ======
export const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  return `${value.toLocaleString('ar-EG')} ج.م`;
};

// ====== تنسيق الرقم بشكل عام ======
export const formatNumber = (num) => {
  return (Number(num) || 0).toLocaleString('ar-EG');
};

// ====== اختصار الاسم ======
export const getInitials = (name) => {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
};

// ====== الاسم المختصر ======
export const getShortName = (name, parts = 2) => {
  if (!name) return '-';
  return name.split(/\s+/).slice(0, parts).join(' ');
};

// ====== نسبة السداد ======
export const getPaymentPercentage = (paid, total) => {
  const p = Number(paid) || 0;
  const t = Number(total) || 0;
  if (t === 0) return 0;
  return Math.min(100, Math.round((p / t) * 100));
};