import { useState } from "react";
import { Save, X } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import {
  validateNationalId,
  extractBirthDateFromNID,
} from "../../utils/validation";
import { POSITIONS } from "../../utils/constants";

export default function ParticipantForm({
  participant = null,
  assessment = null,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = Boolean(participant);

  const [form, setForm] = useState({
    full_name: participant?.full_name || "",
    national_id: participant?.national_id || "",
    birth_date: participant?.birth_date || "",
    birth_year: participant?.birth_year || "",
    position: participant?.position || "",
    previous_clubs: participant?.previous_clubs || "",
    technical_level: participant?.technical_level || "",
    notes: participant?.notes || "",
  });

  const [nidError, setNidError] = useState("");

  const handleNationalIdChange = (value) => {
    setForm({ ...form, national_id: value });

    if (value.length === 14) {
      if (validateNationalId(value)) {
        const birthDate = extractBirthDateFromNID(value);
        const birthYear = parseInt(birthDate.split("-")[0]);

        // ✅ التحقق: المواليد أصغر أو يساوي
        if (
          assessment?.birth_year &&
          birthYear < Number(assessment.birth_year)
        ) {
          setNidError(
            `⚠️ مواليد المشارك (${birthYear}) أكبر من موااليد الاختبار (${assessment.birth_year}). لازم يكون مواليد ${assessment.birth_year} أو أصغر.`,
          );
          setForm((prev) => ({
            ...prev,
            national_id: value,
            birth_date: birthDate,
            birth_year: birthYear,
          }));
          return;
        }

        setNidError("");
        setForm((prev) => ({
          ...prev,
          national_id: value,
          birth_date: birthDate,
          birth_year: birthYear,
        }));
      } else {
        setNidError("الرقم القومي غير صحيح");
      }
    } else {
      setNidError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return alert("يرجى إدخال الاسم");
    if (!validateNationalId(form.national_id))
      return alert("الرقم القومي غير صحيح (14 رقم)");
    if (!form.birth_year) return alert("يرجى إدخال سنة المواليد");
    if (!form.position) return alert("يرجى اختيار المركز");

    if (
      assessment?.birth_year &&
      Number(form.birth_year) < Number(assessment.birth_year)
    ) {
      return alert(
        `⚠️ موااليد المشارك (${form.birth_year}) أكبر من موااليد الاختبار (${assessment.birth_year}).`,
      );
    }

    onSubmit({
      ...form,
      full_name: form.full_name.trim(),
      birth_year: Number(form.birth_year),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="الاسم الرباعي"
          required
          value={form.full_name}
          onChange={(e) =>
            setForm({ ...form, full_name: e.target.value })
          }
          placeholder="مثال: أحمد محمد علي حسن"
        />

        <div>
          <Input
            label="الرقم القومي"
            required
            value={form.national_id}
            onChange={(e) => handleNationalIdChange(e.target.value)}
            maxLength={14}
            placeholder="14 رقم"
          />
          {nidError && (
            <p className="text-red-500 text-xs mt-1">{nidError}</p>
          )}
        </div>

        <Input
          type="date"
          label="تاريخ الميلاد"
          value={form.birth_date}
          disabled
        />

        <Input
          type="number"
          label="سنة المواليد"
          required
          value={form.birth_year}
          disabled
        />

        <Select
          label="المركز"
          required
          placeholder="-- اختر المركز --"
          options={POSITIONS}
          value={form.position}
          onChange={(e) =>
            setForm({ ...form, position: e.target.value })
          }
        />

        <Input
          label="الأندية السابقة"
          value={form.previous_clubs}
          onChange={(e) =>
            setForm({ ...form, previous_clubs: e.target.value })
          }
          placeholder="مثال: نادي الشباب"
        />

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            المستوى الفني
          </label>
          <textarea
            rows={2}
            value={form.technical_level}
            onChange={(e) =>
              setForm({ ...form, technical_level: e.target.value })
            }
            placeholder="ملاحظات فنية..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
        </div>

        <div className="md:col-span-2">
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
          <Save size={16} /> {isEdit ? "تحديث" : "إضافة"}
        </Button>
      </div>
    </form>
  );
}