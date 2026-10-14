import { useState } from "react";
import { Save, X } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { PAYMENT_STATUS } from "../../utils/contractConstants";

export default function PaymentForm({
  payment = null,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = Boolean(payment);

  const [form, setForm] = useState({
    installment_number: payment?.installment_number || 1,
    amount: payment?.amount || "",
    due_date:
      payment?.due_date || new Date().toISOString().split("T")[0],
    paid_date: payment?.paid_date || "",
    status: payment?.status || "pending",
    notes: payment?.notes || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0)
      return alert("يرجى إدخال مبلغ صحيح");
    if (!form.due_date) return alert("يرجى اختيار تاريخ الاستحقاق");

    onSubmit({
      ...form,
      installment_number: Number(form.installment_number) || 1,
      amount: Number(form.amount),
      paid_date: form.paid_date || null,
      notes: form.notes?.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="number"
          label="رقم القسط"
          min={1}
          value={form.installment_number}
          onChange={(e) =>
            setForm({ ...form, installment_number: e.target.value })
          }
        />

        <Input
          type="number"
          label="المبلغ (ج.م)"
          required
          min={0}
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />

        <Input
          type="date"
          label="تاريخ الاستحقاق"
          required
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
        />

        <Input
          type="date"
          label="تاريخ الدفع (لو مدفوع)"
          value={form.paid_date}
          onChange={(e) => setForm({ ...form, paid_date: e.target.value })}
        />

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            الحالة
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {PAYMENT_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
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