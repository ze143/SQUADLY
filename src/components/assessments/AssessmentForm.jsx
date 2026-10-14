import { useState } from "react";
import { Save, X } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { useTeams } from "../../hooks/useTeams";

export default function AssessmentForm({
  assessment = null,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = Boolean(assessment);
  const { teams } = useTeams();

  const [form, setForm] = useState({
    name: assessment?.name || "",
    birth_year: assessment?.birth_year || 2008,
    team_id: assessment?.team_id || "",
    start_date:
      assessment?.start_date || new Date().toISOString().split("T")[0],
    end_date: assessment?.end_date || "",
    description: assessment?.description || "",
    notes: assessment?.notes || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("يرجى إدخال اسم الاختبار");
    if (!form.birth_year) return alert("يرجى إدخال سنة المواليد");
    if (!form.team_id) return alert("يرجى اختيار الفرقة");
    if (!form.start_date) return alert("يرجى اختيار تاريخ البداية");

    const selectedTeam = teams.find((t) => t.id === form.team_id);

    onSubmit({
      ...form,
      name: form.name.trim(),
      birth_year: Number(form.birth_year),
      sector_id: selectedTeam?.sector_id || null,
      end_date: form.end_date || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      {/* اسم الاختبار */}
      <Input
        label="اسم الاختبار"
        required
        placeholder="مثال: اختبار كشف مواليد 2008"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      {/* المواليد + الفرقة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="number"
          label="سنة المواليد"
          required
          placeholder="مثال: 2008"
          value={form.birth_year}
          onChange={(e) =>
            setForm({ ...form, birth_year: e.target.value })
          }
        />

        <Select
          label="الفرقة"
          required
          placeholder="-- اختر الفرقة --"
          options={teams.map((t) => ({
            value: t.id,
            label: `${t.name} - ${t.category}`,
          }))}
          value={form.team_id}
          onChange={(e) => setForm({ ...form, team_id: e.target.value })}
        />
      </div>

      {/* التواريخ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="تاريخ البداية"
          required
          value={form.start_date}
          onChange={(e) =>
            setForm({ ...form, start_date: e.target.value })
          }
        />
        <Input
          type="date"
          label="تاريخ النهاية (اختياري)"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
        />
      </div>

      {/* الوصف */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          الوصف
        </label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          placeholder="وصف الاختبار..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
        />
      </div>

      {/* ملاحظات */}
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
          <Save size={16} /> {isEdit ? "تحديث" : "إنشاء الاختبار"}
        </Button>
      </div>
    </form>
  );
}