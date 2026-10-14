// ===== حالات الاختبار =====
export const ASSESSMENT_STATUS = [
  { value: "active", label: "نشط", color: "blue" },
  { value: "in_progress", label: "قيد التسجيل", color: "amber" },
  { value: "pending_approval", label: "للاعتماد", color: "purple" },
  { value: "approved", label: "معتمد", color: "emerald" },
  { value: "locked", label: "مقفول", color: "slate" },
  { value: "cancelled", label: "ملغي", color: "red" },
];

export const getAssessmentStatusLabel = (value) =>
  ASSESSMENT_STATUS.find((s) => s.value === value)?.label || value;

export const getAssessmentStatusColor = (value) =>
  ASSESSMENT_STATUS.find((s) => s.value === value)?.color || "slate";

// ===== قرار الإداري =====
export const ADMIN_DECISION = [
  { value: "accepted", label: "تمام", color: "emerald", icon: "✅" },
  {
    value: "needs_second_chance",
    label: "فرصة تانية",
    color: "amber",
    icon: "🔄",
  },
  { value: "rejected", label: "مرفوض", color: "red", icon: "❌" },
];

export const getAdminDecisionLabel = (value) =>
  ADMIN_DECISION.find((d) => d.value === value)?.label || "-";

export const getAdminDecisionColor = (value) =>
  ADMIN_DECISION.find((d) => d.value === value)?.color || "slate";

export const getAdminDecisionIcon = (value) =>
  ADMIN_DECISION.find((d) => d.value === value)?.icon || "⏳";

// ===== قرار الأدمن النهائي =====
export const FINAL_DECISION = [
  { value: "pending", label: "معلق", color: "amber", icon: "⏳" },
  { value: "accepted", label: "مقبول", color: "emerald", icon: "✅" },
  { value: "rejected", label: "مرفوض", color: "red", icon: "❌" },
  {
    value: "needs_second_chance",
    label: "فرصة تانية",
    color: "blue",
    icon: "🔄",
  },
];

export const getFinalDecisionLabel = (value) =>
  FINAL_DECISION.find((d) => d.value === value)?.label || "-";

export const getFinalDecisionColor = (value) =>
  FINAL_DECISION.find((d) => d.value === value)?.color || "slate";

export const getFinalDecisionIcon = (value) =>
  FINAL_DECISION.find((d) => d.value === value)?.icon || "⏳";

// ===== نوع اللاعب =====
export const PLAYER_TYPES = [
  { value: "free", label: "فري", icon: "🆓", color: "slate" },
  { value: "investment", label: "استثماري", icon: "💰", color: "indigo" },
];

export const getPlayerTypeLabel = (value) =>
  PLAYER_TYPES.find((t) => t.value === value)?.label || value;

export const getPlayerTypeIcon = (value) =>
  PLAYER_TYPES.find((t) => t.value === value)?.icon || "👤";

export const getPlayerTypeColor = (value) =>
  PLAYER_TYPES.find((t) => t.value === value)?.color || "slate";

// ===== حساب الـ Grade =====
export const calculateGrade = (percentage) => {
  const p = Number(percentage) || 0;
  if (p >= 90) return "ممتاز";
  if (p >= 80) return "جيد جدًا";
  if (p >= 70) return "جيد";
  if (p >= 60) return "مقبول";
  if (p >= 50) return "ضعيف";
  return "راسب";
};

export const getGradeColor = (percentage) => {
  const p = Number(percentage) || 0;
  if (p >= 90) return "emerald";
  if (p >= 80) return "green";
  if (p >= 70) return "blue";
  if (p >= 60) return "amber";
  if (p >= 50) return "orange";
  return "red";
};