import { useState } from "react";
import { Plus, Trash2, Wand2, Calendar, DollarSign } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";
import { formatCurrency } from "../../utils/formatters";

const FREQUENCIES = [
  { value: "monthly", label: "شهري", days: 30 },
  { value: "biweekly", label: "كل أسبوعين", days: 14 },
  { value: "weekly", label: "أسبوعي", days: 7 },
  { value: "quarterly", label: "ربع سنوي", days: 90 },
  { value: "custom", label: "مخصص", days: 30 },
];

/**
 * مولد الأقساط
 * @param {number} totalAmount - المبلغ الإجمالي
 * @param {Array} installments - الأقساط الحالية (للتعديل)
 * @param {Function} onChange - callback لما الأقساط تتغير
 * @param {boolean} disabled - تعطيل الفورم
 * @param {string} label - عنوان المولد (اختياري)
 */
export default function InstallmentsGenerator({
  totalAmount = 0,
  installments = [],
  onChange,
  disabled = false,
  label = "أقساط المبلغ الكامل",
}) {
  const [frequency, setFrequency] = useState("monthly");
  const [firstDueDate, setFirstDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [count, setCount] = useState(12);

  // ✅ توليد الأقساط
  const generateInstallments = () => {
    if (!totalAmount || totalAmount <= 0) {
      alert("يرجى إدخال المبلغ الإجمالي أولاً");
      return;
    }
    if (!count || count <= 0) {
      alert("يرجى إدخال عدد الأقساط");
      return;
    }
    if (!firstDueDate) {
      alert("يرجى اختيار تاريخ أول قسط");
      return;
    }

    const freq = FREQUENCIES.find((f) => f.value === frequency);
    const daysPerInstallment = freq?.days || 30;
    const amountPerInstallment = totalAmount / count;

    const newInstallments = [];
    const startDate = new Date(firstDueDate);

    for (let i = 0; i < count; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + i * daysPerInstallment);

      newInstallments.push({
        amount: Math.round(amountPerInstallment * 100) / 100,
        due_date: dueDate.toISOString().split("T")[0],
        status: "unpaid",
        notes: `قسط ${i + 1} من ${count}`,
      });
    }

    // ✅ تعديل بسيط عشان الفرق في التقريب
    const totalGenerated = newInstallments.reduce(
      (s, inst) => s + inst.amount,
      0,
    );
    const diff = totalAmount - totalGenerated;
    if (Math.abs(diff) > 0.01) {
      newInstallments[newInstallments.length - 1].amount += diff;
    }

    onChange(newInstallments);
  };

  // ✅ إضافة قسط يدوي
  const addManualInstallment = () => {
    const lastDate =
      installments.length > 0
        ? new Date(installments[installments.length - 1].due_date)
        : new Date();

    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 30);

    onChange([
      ...installments,
      {
        amount: 0,
        due_date: nextDate.toISOString().split("T")[0],
        status: "unpaid",
        notes: "",
      },
    ]);
  };

  // ✅ تعديل قسط
  const updateInstallment = (index, field, value) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  // ✅ حذف قسط
  const removeInstallment = (index) => {
    if (!confirm("حذف هذا القسط؟")) return;
    onChange(installments.filter((_, i) => i !== index));
  };

  // ✅ مسح كل الأقساط
  const clearAll = () => {
    if (!confirm("مسح كل الأقساط؟")) return;
    onChange([]);
  };

  const totalGenerated = installments.reduce(
    (s, inst) => s + (Number(inst.amount) || 0),
    0,
  );
  const remaining = totalAmount - totalGenerated;

  return (
    <div className="space-y-4">
      {/* المولد التلقائي */}
      <Card
        padding="p-4"
        className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/40"
      >
        <div className="flex items-center gap-2 mb-4">
          <Wand2 size={18} className="text-emerald-600" />
          <h4 className="font-bold text-emerald-800 dark:text-emerald-300">
            🪄 توليد الأقساط تلقائيًا
            {label && (
              <span className="text-xs font-normal mr-2 text-emerald-600">
                ({label})
              </span>
            )}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            type="date"
            label="تاريخ أول قسط"
            value={firstDueDate}
            onChange={(e) => setFirstDueDate(e.target.value)}
            disabled={disabled}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              التكرار
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              disabled={disabled}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            type="number"
            label="عدد الأقساط"
            min={1}
            max={60}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={disabled}
          />

          <div className="flex items-end">
            <Button
              type="button"
              onClick={generateInstallments}
              disabled={disabled || !totalAmount}
              className="w-full"
            >
              <Wand2 size={16} /> توليد
            </Button>
          </div>
        </div>

        {totalAmount > 0 && count > 0 && (
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-3">
            💡 القسط الواحد:{" "}
            <strong>{formatCurrency(totalAmount / count)}</strong>
          </p>
        )}
      </Card>

      {/* الجدول */}
      {installments.length > 0 && (
        <Card padding="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-600" />
              <h4 className="font-bold text-slate-800 dark:text-slate-100">
                جدول الأقساط ({installments.length})
              </h4>
            </div>

            <div className="flex gap-2">
              {!disabled && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addManualInstallment}
                  >
                    <Plus size={14} /> إضافة قسط
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={clearAll}
                  >
                    <Trash2 size={14} /> مسح الكل
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase">
                <tr>
                  <th className="p-2 text-center">#</th>
                  <th className="p-2 text-center">التاريخ</th>
                  <th className="p-2 text-center">المبلغ (ج.م)</th>
                  <th className="p-2 text-center">ملاحظات</th>
                  {!disabled && <th className="p-2 text-center">حذف</th>}
                </tr>
              </thead>
              <tbody>
                {installments.map((inst, index) => (
                  <tr
                    key={index}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="p-2 text-center font-bold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={inst.due_date}
                        onChange={(e) =>
                          updateInstallment(index, "due_date", e.target.value)
                        }
                        disabled={disabled}
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={inst.amount}
                        onChange={(e) =>
                          updateInstallment(
                            index,
                            "amount",
                            Number(e.target.value),
                          )
                        }
                        disabled={disabled}
                        min={0}
                        step={100}
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={inst.notes || ""}
                        onChange={(e) =>
                          updateInstallment(index, "notes", e.target.value)
                        }
                        disabled={disabled}
                        placeholder="ملاحظات..."
                        className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    {!disabled && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeInstallment(index)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* الإجماليات */}
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-slate-500">المبلغ الإجمالي:</span>
              <strong className="mr-2 text-slate-800 dark:text-slate-100">
                {formatCurrency(totalAmount)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">مجموع الأقساط:</span>
              <strong className="mr-2 text-emerald-600">
                {formatCurrency(totalGenerated)}
              </strong>
            </div>
            {Math.abs(remaining) > 0.01 && (
              <div>
                <span className="text-slate-500">المتبقي:</span>
                <strong
                  className={`mr-2 ${
                    remaining > 0 ? "text-amber-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(remaining)}
                </strong>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}