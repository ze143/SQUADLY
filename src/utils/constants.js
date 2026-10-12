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

// ====== نوع الملعب (داخل/خارج) ======
export const VENUE_TYPES = [
  { value: 'home', label: 'داخل الأرض (Home)' },
  { value: 'away', label: 'خارج الأرض (Away)' },
];

export const getVenueTypeLabel = (value) => {
  if (value === 'home') return 'داخل';
  if (value === 'away') return 'خارج';
  return '-';
};

export const getVenueTypeColor = (value) => {
  if (value === 'home') return 'emerald';
  if (value === 'away') return 'red';
  return 'slate';
};

// ====== أنواع التدريبات ======
export const TRAINING_TYPES = [
  { value: 'fitness', label: 'لياقة بدنية' },
  { value: 'tactical', label: 'تكتيك' },
  { value: 'technical', label: 'مهارات' },
  { value: 'friendly', label: 'مباراة تجريبية' },
  { value: 'recovery', label: 'استشفاء' },
  { value: 'other', label: 'أخرى' },
];

export const getTrainingTypeLabel = (value) =>
  TRAINING_TYPES.find((t) => t.value === value)?.label || value;

// ====== حالات التدريب ======
export const TRAINING_STATUS = [
  { value: 'scheduled', label: 'مجدول' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغى' },
];

export const getTrainingStatusLabel = (value) =>
  TRAINING_STATUS.find((s) => s.value === value)?.label || value;

// ====== حالات الحضور ======
export const ATTENDANCE_STATUS = [
  { value: 'present', label: 'حاضر', color: 'emerald', emoji: '✅' },
  { value: 'absent', label: 'غايب', color: 'red', emoji: '❌' },
  { value: 'late', label: 'متأخر', color: 'amber', emoji: '⏰' },
  { value: 'excused', label: 'إذن', color: 'blue', emoji: '📝' },
  { value: 'injured', label: 'مصاب', color: 'purple', emoji: '🏥' },
];

export const getAttendanceLabel = (value) =>
  ATTENDANCE_STATUS.find((s) => s.value === value)?.label || value;

export const getAttendanceColor = (value) =>
  ATTENDANCE_STATUS.find((s) => s.value === value)?.color || 'slate';

export const getAttendanceEmoji = (value) =>
  ATTENDANCE_STATUS.find((s) => s.value === value)?.emoji || '•';

// ====== أنواع الأحداث ======
export const EVENT_CATEGORIES = [
  { value: 'training', label: 'تدريب', icon: '💪', color: 'blue' },
  { value: 'meeting', label: 'اجتماع', icon: '👥', color: 'purple' },
  { value: 'friendly', label: 'مباراة تجريبية', icon: '⚽', color: 'emerald' },
  { value: 'other', label: 'أخرى', icon: '📌', color: 'slate' },
];

export const getEventCategoryLabel = (value) =>
  EVENT_CATEGORIES.find((c) => c.value === value)?.label || value;

export const getEventCategoryIcon = (value) =>
  EVENT_CATEGORIES.find((c) => c.value === value)?.icon || '📌';

export const getEventCategoryColor = (value) =>
  EVENT_CATEGORIES.find((c) => c.value === value)?.color || 'slate';

// ====== أنواع الاجتماعات ======
export const MEETING_TYPES = [
  { value: 'administrative', label: 'إداري' },
  { value: 'technical', label: 'فني' },
  { value: 'urgent', label: 'طارئ' },
  { value: 'regular', label: 'دوري' },
  { value: 'board', label: 'مجلس إدارة' },
];

export const getMeetingTypeLabel = (value) =>
  MEETING_TYPES.find((t) => t.value === value)?.label || value;

// ====== المدعوون ======
export const ATTENDEES_TYPES = [
  { value: 'team', label: 'فريق كامل' },
  { value: 'players', label: 'لاعبون فقط' },
  { value: 'admins', label: 'إداريون فقط' },
  { value: 'all', label: 'الكل' },
];

export const getAttendeesTypeLabel = (value) =>
  ATTENDEES_TYPES.find((t) => t.value === value)?.label || value;

// ====== حالات الأحداث ======
export const EVENT_STATUS = [
  { value: 'scheduled', label: 'مجدول' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغى' },
];

export const getEventStatusLabel = (value) =>
  EVENT_STATUS.find((s) => s.value === value)?.label || value;

// ====== أنواع الإصابات ======
export const INJURY_TYPES = [
  { value: 'muscle', label: 'عضلية', icon: '💪' },
  { value: 'ligament', label: 'رباط', icon: '🦵' },
  { value: 'fracture', label: 'كسر', icon: '🦴' },
  { value: 'bruise', label: 'كدمة', icon: '🟣' },
  { value: 'head', label: 'رأس', icon: '🧠' },
  { value: 'other', label: 'أخرى', icon: '🏥' },
];

export const getInjuryTypeLabel = (value) =>
  INJURY_TYPES.find((t) => t.value === value)?.label || value;

export const getInjuryTypeIcon = (value) =>
  INJURY_TYPES.find((t) => t.value === value)?.icon || '🏥';

// ====== شدة الإصابة ======
export const INJURY_SEVERITY = [
  { value: 'minor', label: 'خفيفة', color: 'amber' },
  { value: 'moderate', label: 'متوسطة', color: 'orange' },
  { value: 'severe', label: 'شديدة', color: 'red' },
];

export const getInjurySeverityLabel = (value) =>
  INJURY_SEVERITY.find((s) => s.value === value)?.label || value;

export const getInjurySeverityColor = (value) =>
  INJURY_SEVERITY.find((s) => s.value === value)?.color || 'slate';

// ====== أجزاء الجسم ======
export const BODY_PARTS = [
  { value: 'knee', label: 'الركبة' },
  { value: 'ankle', label: 'الكاحل' },
  { value: 'thigh', label: 'الفخذ' },
  { value: 'calf', label: 'السمانة' },
  { value: 'shoulder', label: 'الكتف' },
  { value: 'arm', label: 'الذراع' },
  { value: 'head', label: 'الرأس' },
  { value: 'back', label: 'الظهر' },
  { value: 'other', label: 'أخرى' },
];

export const getBodyPartLabel = (value) =>
  BODY_PARTS.find((b) => b.value === value)?.label || value;

// ====== أسباب الإصابة ======
export const INJURY_CAUSES = [
  { value: 'training', label: 'تدريب' },
  { value: 'match', label: 'مباراة' },
  { value: 'outside', label: 'خارج الملعب' },
  { value: 'other', label: 'أخرى' },
];

export const getInjuryCauseLabel = (value) =>
  INJURY_CAUSES.find((c) => c.value === value)?.label || value;

// ====== حالات الإصابة ======
export const INJURY_STATUS = [
  { value: 'active', label: 'نشطة', color: 'red' },
  { value: 'recovered', label: 'متعافي', color: 'emerald' },
  { value: 'worsened', label: 'متفاقمة', color: 'purple' },
];

export const getInjuryStatusLabel = (value) =>
  INJURY_STATUS.find((s) => s.value === value)?.label || value;

export const getInjuryStatusColor = (value) =>
  INJURY_STATUS.find((s) => s.value === value)?.color || 'slate';