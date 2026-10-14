// ===== أنواع العمليات =====
export const TRANSACTION_TYPES = [
  { value: "income", label: "إيراد", icon: "💰", color: "emerald" },
  { value: "expense", label: "مصروف", icon: "💸", color: "red" },
];

export const getTransactionTypeLabel = (value) =>
  TRANSACTION_TYPES.find((t) => t.value === value)?.label || value;

export const getTransactionTypeIcon = (value) =>
  TRANSACTION_TYPES.find((t) => t.value === value)?.icon || "💵";

export const getTransactionTypeColor = (value) =>
  TRANSACTION_TYPES.find((t) => t.value === value)?.color || "slate";

// ===== اقتراحات تصنيفات (المستخدم حر يختار أو يكتب) =====
export const INCOME_SUGGESTIONS = [
  "اشتراكات",
  "رعاية",
  "تبرعات",
  "بيع لاعب",
  "إيرادات مباريات",
  "منح",
  "أخرى",
];

export const EXPENSE_SUGGESTIONS = [
  "رواتب",
  "مواصلات",
  "أدوات رياضية",
  "صيانة ملاعب",
  "مكافآت",
  "مستلزمات طبية",
  "إعاشة",
  "أخرى",
];

// ===== تنسيق المبلغ =====
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `${num.toLocaleString("ar-EG")} ج.م`;
};

// ===== أسماء الشهور =====
export const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];