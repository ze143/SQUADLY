import { useEffect, useState } from "react";
import { Save, X, AlertCircle } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import {
  INJURY_TYPES,
  INJURY_SEVERITY,
  BODY_PARTS,
  INJURY_CAUSES,
  INJURY_STATUS,
} from "../../utils/constants";

export default function InjuryForm({
  injury = null,
  player = null,
  players = [],
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = Boolean(injury);

  const [form, setForm] = useState({
    player_id: injury?.player_id || player?.id || "",
    injury_type: injury?.injury_type || "muscle",
    severity: injury?.severity || "minor",
    body_part: injury?.body_part || "",
    cause: injury?.cause || "training",
    injury_date: injury?.injury_date || new Date().toISOString().split("T")[0],
    expected_return_date: injury?.expected_return_date || "",
    actual_return_date: injury?.actual_return_date || "",
    description: injury?.description || "",
    treatment: injury?.treatment || "",
    doctor_name: injury?.doctor_name || "",
    status: injury?.status || "active",
    notes: injury?.notes || "",
  });

  useEffect(() => {
    if (injury) {
      setForm({
        player_id: injury.player_id || "",
        injury_type: injury.injury_type || "muscle",
        severity: injury.severity || "minor",
        body_part: injury.body_part || "",
        cause: injury.cause || "training",
        injury_date: injury.injury_date || "",
        expected_return_date: injury.expected_return_date || "",
        actual_return_date: injury.actual_return_date || "",
        description: injury.description || "",
        treatment: injury.treatment || "",
        doctor_name: injury.doctor_name || "",
        status: injury.status || "active",
        notes: injury.notes || "",
      });
    }
  }, [injury]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.player_id) return alert("يرجى اختيار اللاعب");
    if (!form.injury_date) return alert("يرجى إدخال تاريخ الإصابة");

    // ✅ body_part إلزامي لأن CHECK constraint مش بيسمح بـ null
    if (!form.body_part) {
      return alert("يرجى اختيار الجزء المصاب");
    }

    onSubmit({
      ...form,
      body_part: form.body_part, // ← إلزامي
      expected_return_date: form.expected_return_date || null,
      actual_return_date: form.actual_return_date || null,
      description: form.description || null,
      treatment: form.treatment || null,
      doctor_name: form.doctor_name || null,
      notes: form.notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      {player ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400">اللاعب</p>
          <p className="font-bold text-slate-800 dark:text-slate-100">
            {player.full_name}
          </p>
          {player.teams && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {player.teams.name}
            </p>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            اللاعب <span className="text-red-500">*</span>
          </label>
          <select
            value={form.player_id}
            onChange={(e) => setForm({ ...form, player_id: e.target.value })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
            disabled={isEdit}
          >
            <option value="">-- اختر اللاعب --</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} {p.teams?.name ? `- ${p.teams.name}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="نوع الإصابة"
          required
          options={INJURY_TYPES.map((t) => ({
            value: t.value,
            label: `${t.icon} ${t.label}`,
          }))}
          value={form.injury_type}
          onChange={(e) => setForm({ ...form, injury_type: e.target.value })}
        />

        <Select
          label="شدة الإصابة"
          required
          options={INJURY_SEVERITY}
          value={form.severity}
          onChange={(e) => setForm({ ...form, severity: e.target.value })}
        />

        <Select
          label="الجزء المصاب"
          required // 👈 ضيف دي
          placeholder="-- اختر --"
          options={BODY_PARTS}
          value={form.body_part}
          onChange={(e) => setForm({ ...form, body_part: e.target.value })}
        />

        <Select
          label="سبب الإصابة"
          options={INJURY_CAUSES}
          value={form.cause}
          onChange={(e) => setForm({ ...form, cause: e.target.value })}
        />

        <Input
          type="date"
          label="تاريخ الإصابة"
          required
          value={form.injury_date}
          onChange={(e) => setForm({ ...form, injury_date: e.target.value })}
        />

        <Input
          type="date"
          label="تاريخ العودة المتوقع"
          value={form.expected_return_date}
          onChange={(e) =>
            setForm({ ...form, expected_return_date: e.target.value })
          }
        />

        <Input
          type="date"
          label="تاريخ العودة الفعلي"
          value={form.actual_return_date}
          onChange={(e) =>
            setForm({ ...form, actual_return_date: e.target.value })
          }
        />

        <Select
          label="الحالة"
          options={INJURY_STATUS}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        />

        <Input
          label="اسم الطبيب"
          placeholder="د. محمد أحمد"
          value={form.doctor_name}
          onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          وصف الإصابة
        </label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="تفاصيل الإصابة..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          العلاج
        </label>
        <textarea
          rows={2}
          value={form.treatment}
          onChange={(e) => setForm({ ...form, treatment: e.target.value })}
          placeholder="العلاج المتبع..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          ملاحظات
        </label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="أي ملاحظات..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
        />
      </div>

      {/* ⚠️ تحذير إصابة شديدة */}
      {form.severity === "severe" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>إصابة شديدة.</strong> تأكد من مراجعة الطبيب المختص.
            <br />
            <span className="text-xs">
              ⚠️ سيتم إلغاء تنشيط اللاعب تلقائيًا حتى يتعافى.
            </span>
          </div>
        </div>
      )}

      {/* ⚠️ تحذير إصابة متوسطة */}
      {form.severity === "moderate" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-sm p-3 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>إصابة متوسطة.</strong>
            <br />
            <span className="text-xs">
              ⚠️ سيتم إلغاء تنشيط اللاعب تلقائيًا حتى يتعافى.
            </span>
          </div>
        </div>
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
          <Save size={16} /> {isEdit ? "تحديث" : "حفظ"}
        </Button>
      </div>
    </form>
  );
}
