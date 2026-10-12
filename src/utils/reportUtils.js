// =========================================================
// دوال مساعدة للتقارير
// =========================================================

// ===== تصدير CSV =====
export const exportToCSV = (data, columns, filename = 'report') => {
  if (!data || data.length === 0) {
    alert('لا توجد بيانات للتصدير');
    return;
  }

  const headers = columns.map((c) => c.label);
  const rows = data.map((row) =>
    columns.map((c) => {
      const value = c.accessor ? c.accessor(row) : row[c.key];
      if (value === null || value === undefined) return '';
      return String(value).replace(/,/g, '،').replace(/\n/g, ' ');
    })
  );

  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ===== حساب النسبة =====
export const calcPercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

// ===== تنسيق الأرقام =====
export const formatNumber = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString('ar-EG');
};

// ===== حساب متوسط =====
export const average = (arr, key) => {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((s, item) => s + (Number(item[key]) || 0), 0);
  return (sum / arr.length).toFixed(1);
};

// ===== ترتيب تنازلي =====
export const sortDesc = (arr, key) => {
  return [...arr].sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0));
};

// ===== فلترة حسب التاريخ =====
export const filterByDateRange = (arr, dateKey, from, to) => {
  return arr.filter((item) => {
    const date = item[dateKey];
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });
};

// ===== تنسيق التاريخ للعرض =====
export const formatDateShort = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};