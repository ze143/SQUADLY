// ====== المراكز ======
export const POSITIONS = [
  { value: "GK", label: "حارس مرمى" },
  { value: "CB", label: "قلب دفاع" },
  { value: "LB", label: "ظهير أيسر" },
  { value: "RB", label: "ظهير أيمن" },
  { value: "DM", label: "وسط مدافع" },
  { value: "CM", label: "وسط ملعب" },
  { value: "AM", label: "صانع ألعاب" },
  { value: "LW", label: "جناح أيسر" },
  { value: "RW", label: "جناح أيمن" },
  { value: "ST", label: "مهاجم" },
];

export const getPositionLabel = (value) =>
  POSITIONS.find((p) => p.value === value)?.label || value;

// ====== الأدوار ======
export const ROLES = {
  ADMIN: "admin",
  TEAM_ADMIN: "team_admin",
};

export const ROLE_LABELS = {
  admin: "مدير النظام",
  team_admin: "إداري فريق",
};

// ====== أنواع اللاعب المالي ======
export const PLAYER_TYPES = [
  { value: "free", label: "فري (مجاني)" },
  { value: "investment", label: "استثماري" },
];

export const PAYMENT_TYPES = [
  { value: "full", label: "دفعة كاملة" },
  { value: "partial", label: "دفعة جزئية" },
  { value: "installments", label: "تقسيط" },
];

export const PAYMENT_STATUS = [
  { value: "paid", label: "مؤكد السداد" },
  { value: "unpaid", label: "غير مسدد" },
  { value: "pending", label: "قيد الانتظار" },
];

// ====== حالات المباراة ======
export const MATCH_STATUS = [
  { value: "scheduled", label: "مجدولة" },
  { value: "in_progress", label: "جارية" },
  { value: "closed", label: "مغلقة" },
];

export const getMatchStatusLabel = (value) =>
  MATCH_STATUS.find((s) => s.value === value)?.label || value;

// ====== أنواع الأحداث ======
export const EVENT_TYPES = [
  { value: "goal", label: "هدف", icon: "⚽" },
  { value: "assist", label: "صناعة هدف", icon: "🎯" },
  { value: "yellow_card", label: "بطاقة صفراء", icon: "🟨" },
  { value: "red_card", label: "بطاقة حمراء", icon: "🟥" },
  { value: "substitution_in", label: "دخول بديل", icon: "🔄" },
  { value: "substitution_out", label: "خروج لاعب", icon: "🔁" },
];

export const getEventLabel = (value) =>
  EVENT_TYPES.find((e) => e.value === value)?.label || value;

export const getEventIcon = (value) =>
  EVENT_TYPES.find((e) => e.value === value)?.icon || "•";

// ====== أدوار الحكام ======
export const REFEREE_ROLES = [
  { value: "main", label: "حكم ساحة" },
  { value: "assistant1", label: "مساعد أول" },
  { value: "assistant2", label: "مساعد ثاني" },
  { value: "fourth", label: "حكم رابع" },
  { value: "competition_supervisor", label: "مراقب المسابقات" },
  { value: "referee_supervisor", label: "مراقب الحكام" },
];

// ====== حالات طلب التصعيد ======
export const ESCALATION_STATUS = [
  { value: "pending", label: "في انتظار الإداري الأصلي" },
  { value: "pending_admin", label: "في انتظار المدير الإداري" },
  { value: "approved", label: "معتمد" },
  { value: "rejected", label: "مرفوض" },
];

export const getEscalationStatusLabel = (value) =>
  ESCALATION_STATUS.find((s) => s.value === value)?.label || value;

// ====== أنواع طلب التصعيد ======
export const ESCALATION_TYPES = [
  { value: "match", label: "🎯 لمباراة (مؤقت)" },
  { value: "general", label: "📋 عام (دائم)" },
];

export const getEscalationTypeLabel = (value) =>
  ESCALATION_TYPES.find((t) => t.value === value)?.label || value;

// ====== أنواع المسابقات ======
export const COMPETITION_TYPES = [
  { value: "league", label: "دوري" },
  { value: "cup", label: "كأس" },
  { value: "regional", label: "دوري مناطق" },
];

// ====== أنواع الإيقافات ======
export const SUSPENSION_TYPES = [
  { value: 'yellow_accumulation', label: 'تراكم إنذارات (3 إنذارات)' },
  { value: 'red_card', label: 'بطاقة حمراء' },
  { value: 'club_decision', label: 'قرار النادي' },
  { value: 'other', label: 'أخرى' },
];

export const getSuspensionTypeLabel = (value) =>
  SUSPENSION_TYPES.find((t) => t.value === value)?.label || value;

export const SUSPENSION_STATUS = [
  { value: 'active', label: 'جارٍ' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغى' },
];

export const getSuspensionStatusLabel = (value) =>
  SUSPENSION_STATUS.find((s) => s.value === value)?.label || value;

// ====== قواعد الإنذارات ======
export const YELLOW_THRESHOLD = 3;        // عدد الإنذارات للإيقاف
export const RED_DEFAULT_SUSPENSION = 2;  // إيقاف افتراضي للطرد