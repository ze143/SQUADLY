import { useState } from "react";
import {
  Save,
  X,
  CheckCircle,
  HelpCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";
import { PLAYER_TYPES } from "../../utils/assessmentConstants";

const DECISION_OPTIONS = [
  {
    value: "accepted",
    label: "تمام",
    icon: CheckCircle,
    color: "emerald",
    description: "اللاعب مناسب ويستحق الإضافة",
  },
  {
    value: "needs_second_chance",
    label: "يحتاج فرصة تانية",
    icon: HelpCircle,
    color: "amber",
    description: "محتاج جلسة تقييم تانية",
  },
  {
    value: "rejected",
    label: "مرفوض",
    icon: XCircle,
    color: "red",
    description: "اللاعب غير مناسب",
  },
];

export default function EvaluationForm({
  participant,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const [form, setForm] = useState({
    attended: participant?.attended ?? false,
    attendance_date:
      participant?.attendance_date || new Date().toISOString().split("T")[0],
    physical_evaluation: participant?.physical_evaluation || "",
    technical_evaluation: participant?.technical_evaluation || "",
    tactical_evaluation: participant?.tactical_evaluation || "",
    mental_evaluation: participant?.mental_evaluation || "",
    general_notes: participant?.general_notes || "",
    admin_decision: participant?.admin_decision || "accepted",
    // لو تمام
    suggested_player_type: participant?.suggested_player_type || "free",
    suggested_percentage: participant?.suggested_percentage || "",
    committee_opinion: participant?.committee_opinion || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.attended) {
      if (!confirm("اللاعب مش حاضر. هل تريد الحفظ؟")) return;
    }

    if (!form.admin_decision) return alert("يرجى اختيار القرار");

    // لو تمام → مطلوب التفاصيل
    if (form.admin_decision === "accepted") {
      if (!form.suggested_player_type) return alert("يرجى اختيار نوع اللاعب");
      
      // ✅ النسبة مطلوبة بس لو استثماري
      if (
        form.suggested_player_type === "investment" &&
        (!form.suggested_percentage || Number(form.suggested_percentage) <= 0)
      ) {
        return alert("يرجى إدخال النسبة");
      }
    }

    const payload = {
      attended: form.attended,
      attendance_date: form.attendance_date || null,
      physical_evaluation: form.physical_evaluation?.trim() || null,
      technical_evaluation: form.technical_evaluation?.trim() || null,
      tactical_evaluation: form.tactical_evaluation?.trim() || null,
      mental_evaluation: form.mental_evaluation?.trim() || null,
      general_notes: form.general_notes?.trim() || null,
      admin_decision: form.admin_decision,
      suggested_player_type:
        form.admin_decision === "accepted" ? form.suggested_player_type : null,
      // ✅ النسبة بس لو استثماري
      suggested_percentage:
        form.admin_decision === "accepted" &&
        form.suggested_player_type === "investment"
          ? Number(form.suggested_percentage)
          : null,
      committee_opinion: form.committee_opinion?.trim() || null,
    };

    onSubmit(payload);
  };

  const isAccepted = form.admin_decision === "accepted";
  const isInvestment = form.suggested_player_type === "investment";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      {/* معلومات المشارك */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <p className="text-xs text-slate-500 dark:text-slate-400">المشارك</p>
        <p className="font-bold text-slate-800 dark:text-slate-100">
          {participant.full_name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          مواليد {participant.birth_year} • المركز: {participant.position}
        </p>
        {participant.session_number > 1 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            🔄 جلسة رقم {participant.session_number}
          </p>
        )}
      </div>

      {/* الحضور */}
      <Card padding="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-emerald-600" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100">
            الحضور
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <input
              type="checkbox"
              checked={form.attended}
              onChange={(e) => setForm({ ...form, attended: e.target.checked })}
              className="w-5 h-5 accent-emerald-600"
            />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                ✅ حضر الاختبار
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تم تسجيل حضوره في الجلسة
              </p>
            </div>
          </label>

          <Input
            type="date"
            label="تاريخ الحضور"
            value={form.attendance_date}
            onChange={(e) =>
              setForm({ ...form, attendance_date: e.target.value })
            }
          />
        </div>
      </Card>

      {/* التقييمات الفنية - خانات مفتوحة */}
      <Card padding="p-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">
          📋 التقييمات الفنية
        </h3>

        <div className="space-y-4">
          <EvalField
            label="التقييم البدني"
            placeholder="سرعة، تحمل، قوة، رشاقة..."
            value={form.physical_evaluation}
            onChange={(v) => setForm({ ...form, physical_evaluation: v })}
            color="blue"
          />

          <EvalField
            label="التقييم المهاري (فني)"
            placeholder="تمرير، تسديد، مراوغة، تحكم بالكرة..."
            value={form.technical_evaluation}
            onChange={(v) => setForm({ ...form, technical_evaluation: v })}
            color="emerald"
          />

          <EvalField
            label="التقييم التكتيكي"
            placeholder="التمركز، الرؤية، اتخاذ القرار..."
            value={form.tactical_evaluation}
            onChange={(v) => setForm({ ...form, tactical_evaluation: v })}
            color="purple"
          />

          <EvalField
            label="التقييم النفسي والذهني"
            placeholder="الانضباط، الروح، الاستجابة..."
            value={form.mental_evaluation}
            onChange={(v) => setForm({ ...form, mental_evaluation: v })}
            color="amber"
          />

          <EvalField
            label="ملاحظات عامة"
            placeholder="أي ملاحظات إضافية..."
            value={form.general_notes}
            onChange={(v) => setForm({ ...form, general_notes: v })}
            color="slate"
          />
        </div>
      </Card>

      {/* قرار الإداري */}
      <Card
        padding="p-4"
        className="border-2 border-amber-200 dark:border-amber-900/40"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🟡</span>
          <h3 className="font-bold text-amber-700 dark:text-amber-300">
            رأيك كإداري
          </h3>
        </div>

        <div className="space-y-3">
          {DECISION_OPTIONS.map((opt) => {
            const selected = form.admin_decision === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, admin_decision: opt.value })}
                className={`w-full p-3 rounded-lg border-2 transition text-right flex items-center gap-3 ${
                  selected
                    ? opt.color === "emerald"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                      : opt.color === "amber"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30"
                        : "border-red-500 bg-red-50 dark:bg-red-900/30"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon
                  size={20}
                  className={
                    selected
                      ? opt.color === "emerald"
                        ? "text-emerald-600"
                        : opt.color === "amber"
                          ? "text-amber-600"
                          : "text-red-600"
                      : "text-slate-400"
                  }
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-bold ${
                      selected
                        ? opt.color === "emerald"
                          ? "text-emerald-700 dark:text-emerald-300"
                          : opt.color === "amber"
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-red-700 dark:text-red-300"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* لو تمام: التفاصيل المالية والفنية */}
      {isAccepted && (
        <Card
          padding="p-4"
          className="border-2 border-emerald-200 dark:border-emerald-900/40"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">✅</span>
            <h3 className="font-bold text-emerald-700 dark:text-emerald-300">
              تفاصيل القبول
            </h3>
          </div>

          <div className="space-y-4">
            {/* نوع اللاعب */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                نوع اللاعب <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PLAYER_TYPES.map((t) => {
                  const selected = form.suggested_player_type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          suggested_player_type: t.value,
                          // ✅ لو فري، نصفر النسبة
                          suggested_percentage:
                            t.value === "free" ? "" : form.suggested_percentage,
                        })
                      }
                      className={`p-3 rounded-lg border-2 transition text-center ${
                        selected
                          ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{t.icon}</div>
                      <p
                        className={`text-xs font-medium ${
                          selected
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {t.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* النسبة — بس لو استثماري */}
            {isInvestment && (
              <Input
                type="number"
                label="النسبة المقترحة (%)"
                required
                min={0}
                max={100}
                value={form.suggested_percentage}
                onChange={(e) =>
                  setForm({ ...form, suggested_percentage: e.target.value })
                }
              />
            )}

            {/* رأي اللجنة الفني */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                رأي اللجنة الفني
              </label>
              <textarea
                rows={3}
                value={form.committee_opinion}
                onChange={(e) =>
                  setForm({ ...form, committee_opinion: e.target.value })
                }
                placeholder="رأي اللجنة الفني في اللاعب..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
              />
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={saving}
          >
            <X size={16} /> إلغاء
          </Button>
        )}
        <Button type="submit" loading={saving}>
          <Save size={16} /> حفظ التقييم
        </Button>
      </div>
    </form>
  );
}

// ===== Helper Component =====
function EvalField({ label, placeholder, value, onChange, color }) {
  const colors = {
    blue: "focus:ring-blue-500",
    emerald: "focus:ring-emerald-500",
    purple: "focus:ring-purple-500",
    amber: "focus:ring-amber-500",
    slate: "focus:ring-slate-500",
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${colors[color]} placeholder:text-slate-400`}
      />
    </div>
  );
}