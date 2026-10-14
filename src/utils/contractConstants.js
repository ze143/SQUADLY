// ===== أنواع العقود =====
export const CONTRACT_TYPES = [
  { value: "player", label: "عقد لاعب", icon: "🏃", color: "emerald" },
  { value: "coach", label: "عقد مدرب", icon: "👨‍🏫", color: "blue" },
  { value: "sponsor", label: "عقد رعاية", icon: "💼", color: "purple" },
  { value: "sale", label: "بيع لاعب", icon: "📤", color: "amber" },
  { value: "loan", label: "إعارة", icon: "🔄", color: "orange" },
  { value: "service", label: "عقد خدمات", icon: "🛠️", color: "slate" },
];

export const getContractTypeLabel = (value) =>
  CONTRACT_TYPES.find((t) => t.value === value)?.label || value;

export const getContractTypeIcon = (value) =>
  CONTRACT_TYPES.find((t) => t.value === value)?.icon || "📄";

export const getContractTypeColor = (value) =>
  CONTRACT_TYPES.find((t) => t.value === value)?.color || "slate";

// ===== حالات العقد =====
export const CONTRACT_STATUS = [
  { value: "active", label: "نشط", color: "emerald" },
  { value: "expiring", label: "ينتهي قريب", color: "amber" },
  { value: "expired", label: "منتهي", color: "slate" },
  { value: "cancelled", label: "ملغي", color: "red" },
  { value: "renewed", label: "تم التجديد", color: "blue" },
];

export const getContractStatusLabel = (value) =>
  CONTRACT_STATUS.find((s) => s.value === value)?.label || value;

export const getContractStatusColor = (value) =>
  CONTRACT_STATUS.find((s) => s.value === value)?.color || "slate";

// ===== حالات الدفعات =====
export const PAYMENT_STATUS = [
  { value: "pending", label: "قيد الانتظار", color: "amber" },
  { value: "paid", label: "مدفوع", color: "emerald" },
  { value: "overdue", label: "متأخر", color: "red" },
  { value: "cancelled", label: "ملغي", color: "slate" },
];

export const getPaymentStatusLabel = (value) =>
  PAYMENT_STATUS.find((s) => s.value === value)?.label || value;

export const getPaymentStatusColor = (value) =>
  PAYMENT_STATUS.find((s) => s.value === value)?.color || "slate";

// ===== طرق الدفع =====
export const PAYMENT_METHODS = [
  { value: "one_time", label: "دفعة واحدة" },
  { value: "monthly", label: "شهري" },
  { value: "installments", label: "أقساط" },
];

export const getPaymentMethodLabel = (value) =>
  PAYMENT_METHODS.find((m) => m.value === value)?.label || value;

// ===== أنواع الأطراف =====
export const PARTY_TYPES = [
  { value: "person", label: "شخص" },
  { value: "club", label: "نادي" },
  { value: "company", label: "شركة" },
];

export const getPartyTypeLabel = (value) =>
  PARTY_TYPES.find((p) => p.value === value)?.label || value;

// ===== تنسيق المبلغ =====
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `${num.toLocaleString("ar-EG")} ج.م`;
};

// ===== حساب حالة العقد =====
export const calculateContractStatus = (contract) => {
  if (contract.status === "cancelled" || contract.status === "renewed") {
    return contract.status;
  }
  if (!contract.end_date) return "active";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(contract.end_date);
  endDate.setHours(0, 0, 0, 0);

  if (endDate < today) return "expired";

  const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 30) return "expiring";

  return "active";
};

// ===== حساب الأيام المتبقية =====
export const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};