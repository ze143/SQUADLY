import { useState } from "react";
import {
  Save, X, CheckCircle, XCircle, HelpCircle, AlertCircle,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";
import {
  PLAYER_TYPES,
  FINAL_DECISION,
  getPlayerTypeLabel,
  getPlayerTypeIcon,
  getAdminDecisionLabel,
  getAdminDecisionIcon,
} from "../../utils/assessmentConstants";

export default function DecisionForm({
  participant,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const [form, setForm] = useState({
    final_decision: participant?.final_decision || "pending",
    final_player_type:
      participant?.final_player_type ||
      participant?.suggested_player_type ||
      "free",
    final_percentage:
      participant?.final_percentage ||
      participant?.suggested_percentage ||
      "",
    manager_opinion: participant?.manager_opinion || "",
  });

  const hasAdminDecision = !!participant?.admin_decision;

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("🔍 DecisionForm submitting:", form);

    if (!form.final_decision || form.final_decision === "pending")
      return alert("يرجى اختيار القرار النهائي");

    if (form.final_decision === "accepted") {
      if (!form.final_player_type)
        return alert("يرجى اختيار نوع اللاعب");
      
      // ✅ النسبة مطلوبة بس لو استثماري
      if (
        form.final_player_type === "investment" &&
        (!form.final_percentage || Number(form.final_percentage) <= 0)
      ) {
        return alert("يرجى إدخال النسبة النهائية");
      }
    }

    const payload = {
      final_decision: form.final_decision,
      final_player_type:
        form.final_decision === "accepted"
          ? form.final_player_type
          : null,
      // ✅ النسبة بس لو استثماري
      final_percentage:
        form.final_decision === "accepted" &&
        form.final_player_type === "investment"
          ? Number(form.final_percentage)
          : null,
      manager_opinion: form.manager_opinion?.trim() || null,
    };

    console.log("📤 onSubmit payload:", payload);
    onSubmit(payload);
  };

  const isAccepted = form.final_decision === "accepted";
  const isInvestment = form.final_player_type === "investment";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      {/* معلومات المشارك */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <p className="text-xs text-slate-500 dark:text-slate-400">المشارك</p>
        <p className="font-bold text-slate-800 dark:text-slate-100">
          {participant.full_name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          🎂 مواليد {participant.birth_year} • المركز: {participant.position}
        </p>
      </div>

      {/* رأي الإداري */}
      {hasAdminDecision && (
        <Card
          padding="p-4"
          className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-900/40"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🟡</span>
            <h3 className="font-bold text-amber-700 dark:text-amber-300">
              رأي الإداري
            </h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">
                القرار:
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {getAdminDecisionIcon(participant.admin_decision)}{" "}
                {getAdminDecisionLabel(participant.admin_decision)}
              </span>
            </div>

            {participant.suggested_player_type && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">
                    نوع اللاعب:
                  </span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {getPlayerTypeIcon(participant.suggested_player_type)}{" "}
                    {getPlayerTypeLabel(participant.suggested_player_type)}
                  </span>
                </div>
                {/* ✅ النسبة بس لو استثماري */}
                {participant.suggested_player_type === "investment" &&
                  participant.suggested_percentage && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        النسبة:
                      </span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        {participant.suggested_percentage}%
                      </span>
                    </div>
                  )}
              </>
            )}
          </div>
        </Card>
      )}

      {/* القرار النهائي */}
      <Card
        padding="p-4"
        className="border-2 border-emerald-200 dark:border-emerald-900/40"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🟢</span>
          <h3 className="font-bold text-emerald-700 dark:text-emerald-300">
            قرارك النهائي
          </h3>
        </div>

        <div className="space-y-4">
          {/* القرار */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              القرار النهائي <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FINAL_DECISION.filter((d) => d.value !== "pending").map(
                (d) => {
                  const selected = form.final_decision === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, final_decision: d.value })
                      }
                      className={`p-3 rounded-lg border-2 transition text-center ${
                        selected
                          ? d.color === "emerald"
                            ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40"
                            : d.color === "red"
                              ? "border-red-500 bg-red-100 dark:bg-red-900/40"
                              : "border-blue-500 bg-blue-100 dark:bg-blue-900/40"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{d.icon}</div>
                      <p
                        className={`text-xs font-medium ${
                          selected
                            ? d.color === "emerald"
                              ? "text-emerald-700 dark:text-emerald-300"
                              : d.color === "red"
                                ? "text-red-700 dark:text-red-300"
                                : "text-blue-700 dark:text-blue-300"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {d.label}
                      </p>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* تفاصيل القبول */}
          {isAccepted && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  نوع اللاعب <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLAYER_TYPES.map((t) => {
                    const selected = form.final_player_type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            final_player_type: t.value,
                            // ✅ لو فري، نصفر النسبة
                            final_percentage:
                              t.value === "free" ? "" : form.final_percentage,
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
                  label="النسبة النهائية (%)"
                  required
                  min={0}
                  max={100}
                  value={form.final_percentage}
                  onChange={(e) =>
                    setForm({ ...form, final_percentage: e.target.value })
                  }
                />
              )}
            </>
          )}

          {/* رأي المدير */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              رأيك / ملاحظاتك
            </label>
            <textarea
              rows={3}
              value={form.manager_opinion}
              onChange={(e) =>
                setForm({ ...form, manager_opinion: e.target.value })
              }
              placeholder="رأيك النهائي في اللاعب..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>
        </div>
      </Card>

      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm p-3 rounded-lg flex items-start gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <p>
          بعد التأكيد، لو القرار "مقبول" → تقدر تضيف اللاعب لجدول اللاعبين.
          لو القرار "فرصة تانية" → النظام هينشئ جلسة جديدة للاعب.
        </p>
      </div>

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
          <CheckCircle size={16} /> تأكيد القرار
        </Button>
      </div>
    </form>
  );
}