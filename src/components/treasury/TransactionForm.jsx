import { useState } from "react";
import { Save, X } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import {
  TRANSACTION_TYPES,
  INCOME_SUGGESTIONS,
  EXPENSE_SUGGESTIONS,
} from "../../utils/treasuryConstants";

export default function TransactionForm({
  transaction = null,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = Boolean(transaction);

  const [form, setForm] = useState({
    type: transaction?.type || "income",
    category: transaction?.category || "",
    amount: transaction?.amount || "",
    description: transaction?.description || "",
    receipt_number: transaction?.receipt_number || "",
    transaction_date:
      transaction?.transaction_date ||
      new Date().toISOString().split("T")[0],
  });

  const suggestions =
    form.type === "income" ? INCOME_SUGGESTIONS : EXPENSE_SUGGESTIONS;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.type) return alert("يرجى اختيار النوع");
    if (!form.category.trim()) return alert("يرجى إدخال التصنيف");
    if (!form.amount || Number(form.amount) <= 0)
      return alert("يرجى إدخال مبلغ صحيح");
    if (!form.transaction_date) return alert("يرجى اختيار التاريخ");

    onSubmit({
      ...form,
      amount: Number(form.amount),
      category: form.category.trim(),
      description: form.description?.trim() || null,
      receipt_number: form.receipt_number?.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      {/* نوع العملية */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          نوع العملية <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TRANSACTION_TYPES.map((t) => {
            const selected = form.type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() =>
                  setForm({ ...form, type: t.value, category: "" })
                }
                className={`p-4 rounded-lg border-2 transition text-center ${
                  selected
                    ? t.value === "income"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                      : "border-red-500 bg-red-50 dark:bg-red-900/30"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="text-3xl mb-2">{t.icon}</div>
                <p
                  className={`text-sm font-medium ${
                    selected
                      ? t.value === "income"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-red-700 dark:text-red-300"
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

      {/* التصنيف */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          التصنيف <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          list="category-suggestions"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="اكتب التصنيف..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          required
        />
        <datalist id="category-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm({ ...form, category: s })}
              className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-700 transition"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          label="التاريخ"
          required
          value={form.transaction_date}
          onChange={(e) =>
            setForm({ ...form, transaction_date: e.target.value })
          }
        />

        <Input
          label="رقم الإيصال (اختياري)"
          placeholder="مثال: RCP-001"
          value={form.receipt_number}
          onChange={(e) =>
            setForm({ ...form, receipt_number: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          الوصف (اختياري)
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="تفاصيل العملية..."
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