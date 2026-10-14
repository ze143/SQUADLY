import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import {
  CONTRACT_TYPES,
  PAYMENT_METHODS,
  PARTY_TYPES,
  CONTRACT_STATUS,
} from "../../utils/contractConstants";

export default function ContractForm({
  contract = null,
  players = [],
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = Boolean(contract);

  const [form, setForm] = useState({
    contract_number: contract?.contract_number || "",
    contract_type: contract?.contract_type || "player",
    party_name: contract?.party_name || "",
    party_type: contract?.party_type || "person",
    player_id: contract?.player_id || "",
    start_date: contract?.start_date || new Date().toISOString().split("T")[0],
    end_date: contract?.end_date || "",
    total_amount: contract?.total_amount || 0,
    payment_method: contract?.payment_method || "one_time",
    installments_count: contract?.installments_count || 0,
    installment_amount: contract?.installment_amount || 0,
    description: contract?.description || "",
    terms: contract?.terms || "",
    notes: contract?.notes || "",
    status: contract?.status || "active",
  });

  useEffect(() => {
    if (contract) {
      setForm({
        contract_number: contract.contract_number || "",
        contract_type: contract.contract_type || "player",
        party_name: contract.party_name || "",
        party_type: contract.party_type || "person",
        player_id: contract.player_id || "",
        start_date: contract.start_date || "",
        end_date: contract.end_date || "",
        total_amount: contract.total_amount || 0,
        payment_method: contract.payment_method || "one_time",
        installments_count: contract.installments_count || 0,
        installment_amount: contract.installment_amount || 0,
        description: contract.description || "",
        terms: contract.terms || "",
        notes: contract.notes || "",
        status: contract.status || "active",
      });
    }
  }, [contract]);

  // ✅ لما يختار لاعب → نملأ اسم الطرف تلقائيًا
  const handlePlayerChange = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    setForm({
      ...form,
      player_id: playerId,
      party_name: player?.full_name || form.party_name,
      party_type: "person",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.contract_type) return alert("يرجى اختيار نوع العقد");
    if (!form.party_name.trim()) return alert("يرجى إدخال اسم الطرف");
    if (!form.start_date) return alert("يرجى اختيار تاريخ البداية");

    onSubmit({
      ...form,
      player_id: form.player_id || null,
      end_date: form.end_date || null,
      total_amount: Number(form.total_amount) || 0,
      installments_count: Number(form.installments_count) || 0,
      installment_amount: Number(form.installment_amount) || 0,
      party_name: form.party_name.trim(),
    });
  };

  const isPlayerContract = form.contract_type === "player";
  const isLoanOrSale =
    form.contract_type === "loan" || form.contract_type === "sale";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      {/* نوع العقد - كروت */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          نوع العقد <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CONTRACT_TYPES.map((t) => {
            const selected = form.contract_type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, contract_type: t.value })}
                className={`p-3 rounded-lg border-2 transition text-center ${
                  selected
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
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

      {/* رقم العقد */}
      <Input
        label="رقم العقد (اختياري)"
        placeholder="مثال: CNT-2026-001"
        value={form.contract_number}
        onChange={(e) =>
          setForm({ ...form, contract_number: e.target.value })
        }
      />

      {/* ربط بلاعب (اختياري) */}
      {(isPlayerContract || isLoanOrSale) && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            ربط بلاعب من السيستم (اختياري)
          </label>
          <select
            value={form.player_id}
            onChange={(e) => handlePlayerChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- بدون ربط (طرف حر) --</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} {p.teams?.name ? `- ${p.teams.name}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* اسم الطرف */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="اسم الطرف التاني"
          required
          placeholder="اسم الشخص/النادي/الشركة"
          value={form.party_name}
          onChange={(e) => setForm({ ...form, party_name: e.target.value })}
        />
        <Select
          label="نوع الطرف"
          options={PARTY_TYPES}
          value={form.party_type}
          onChange={(e) => setForm({ ...form, party_type: e.target.value })}
        />
      </div>

      {/* التواريخ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="تاريخ البداية"
          required
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
        />
        <Input
          type="date"
          label="تاريخ النهاية (اختياري)"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
        />
      </div>

      {/* البيانات المالية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="number"
          label="المبلغ الإجمالي (ج.م)"
          min={0}
          step="0.01"
          value={form.total_amount}
          onChange={(e) =>
            setForm({ ...form, total_amount: e.target.value })
          }
        />
        <Select
          label="طريقة الدفع"
          options={PAYMENT_METHODS}
          value={form.payment_method}
          onChange={(e) =>
            setForm({ ...form, payment_method: e.target.value })
          }
        />
        {form.payment_method !== "one_time" && (
          <>
            <Input
              type="number"
              label="عدد الأقساط"
              min={1}
              value={form.installments_count}
              onChange={(e) =>
                setForm({ ...form, installments_count: e.target.value })
              }
            />
            <Input
              type="number"
              label="مبلغ القسط (ج.م)"
              min={0}
              step="0.01"
              value={form.installment_amount}
              onChange={(e) =>
                setForm({ ...form, installment_amount: e.target.value })
              }
            />
          </>
        )}
      </div>

      {/* الحالة */}
      {isEdit && (
        <Select
          label="الحالة"
          options={CONTRACT_STATUS}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        />
      )}

      {/* الوصف والبنود */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          الوصف
        </label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="تفاصيل العقد..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          بنود العقد
        </label>
        <textarea
          rows={3}
          value={form.terms}
          onChange={(e) => setForm({ ...form, terms: e.target.value })}
          placeholder="الشروط والبنود..."
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