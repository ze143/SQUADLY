import { useState } from "react";
import { X, AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Input from "../ui/Input";
import Card from "../ui/Card";
import { useTeams } from "../../hooks/useTeams";
import { useAddToPlayers } from "../../hooks/useAssessments";
import {
  getPlayerTypeIcon,
  getPlayerTypeLabel,
} from "../../utils/assessmentConstants";
import { PLAYER_TYPES, PAYMENT_TYPES } from "../../utils/constants";
import InstallmentsGenerator from "../finance/InstallmentsGenerator";

export default function AddToPlayersModal({
  participant,
  onSuccess,
  onCancel,
}) {
  const { teams } = useTeams();
  const { addParticipantToPlayers } = useAddToPlayers();

  const [teamId, setTeamId] = useState("");
  const [previousClubs, setPreviousClubs] = useState(
    participant?.previous_clubs || "",
  );

  // ✅ البيانات المالية
  const [playerType, setPlayerType] = useState(
    participant?.final_player_type || "free",
  );
  const [paymentType, setPaymentType] = useState("full");
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [installments, setInstallments] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isInvestment = playerType === "investment";
  const isInstallments = paymentType === "installments";
  const isPartial = paymentType === "partial";
  const isFull = paymentType === "full";

  // ✅ الباقي (للجزئية)
  const remainingAmount = Number(totalAmount) - Number(paidAmount);

  // ✅ تحقق قبل الإضافة
  const validateForm = () => {
    // ✅ الفريق إجباري
    if (!teamId) {
      setError("يرجى اختيار الفريق");
      return false;
    }

    if (!isInvestment) return true; // فري → مفيش تحقق

    const total = Number(totalAmount) || 0;

    if (total <= 0) {
      setError("يرجى إدخال المبلغ الإجمالي");
      return false;
    }

    if (isPartial) {
      const paid = Number(paidAmount) || 0;

      if (paid <= 0) {
        setError("يرجى إدخال المبلغ المدفوع مقدمًا");
        return false;
      }
      if (paid >= total) {
        setError("المبلغ المدفوع يجب أن يكون أقل من الإجمالي");
        return false;
      }
      if (installments.length === 0) {
        setError("يرجى إضافة أقساط الباقي");
        return false;
      }
    }

    if (isInstallments && installments.length === 0) {
      setError("يرجى إضافة الأقساط على الأقل قسط واحد");
      return false;
    }

    return true;
  };

  const handleAdd = async () => {
    setSaving(true);
    setError("");

    try {
      if (!validateForm()) {
        setSaving(false);
        return;
      }

      await addParticipantToPlayers(participant, {
        team_id: teamId || null,
        previous_clubs: previousClubs || null,
        // ✅ البيانات المالية
        player_type: playerType,
        payment_type: isInvestment ? paymentType : null,
        total_amount: isInvestment ? Number(totalAmount) || 0 : 0,
        paid_amount: isInvestment ? Number(paidAmount) || 0 : 0,
        // ✅ الأقساط (للتقسيط والجزئية)
        installments:
          isInvestment && (isInstallments || isPartial) ? installments : [],
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* معلومات المشارك */}
      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
          سيتم إضافة اللاعب التالي:
        </p>
        <p className="font-bold text-emerald-800 dark:text-emerald-200">
          {participant?.full_name}
        </p>
      </div>

      {/* الفريق */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="الفريق"
          required
          placeholder="-- اختر الفريق --"
          options={teams.map((t) => ({
            value: t.id,
            label: `${t.name} - ${t.category}`,
          }))}
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        />

        <Input
          label="الأندية السابقة"
          value={previousClubs}
          onChange={(e) => setPreviousClubs(e.target.value)}
        />
      </div>

      {/* ✅ البيانات المالية */}
      <Card padding="p-4">
        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
          <DollarSign size={16} className="text-emerald-600" />
          البيانات المالية
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              نوع اللاعب
            </label>
            <select
              value={playerType}
              onChange={(e) => setPlayerType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {PLAYER_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {isInvestment && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  طريقة الدفع
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {PAYMENT_TYPES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                type="number"
                label="المبلغ الإجمالي (ج.م)"
                min={0}
                step={100}
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />

              {/* ✅ المبلغ المدفوع — بس لو "جزئية" */}
              {isPartial && (
                <Input
                  type="number"
                  label="المبلغ المدفوع مقدمًا (ج.م)"
                  min={0}
                  step={100}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              )}
            </>
          )}
        </div>

        {playerType === "free" && (
          <p className="text-sm text-slate-500 mt-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            اللاعب الفري لا يحتاج إلى أي بيانات مالية.
          </p>
        )}

        {/* ✅ دفعة كاملة → تنبيه */}
        {isInvestment && isFull && Number(totalAmount) > 0 && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-sm">
            <p className="text-emerald-700 dark:text-emerald-300">
              ✅ هيتم إنشاء قسط واحد مسدد بقيمة{" "}
              <strong>{Number(totalAmount).toLocaleString()} ج.م</strong> في
              صفحة المالية.
            </p>
          </div>
        )}

        {/* ✅ مولّد الأقساط — للتقسيط والجزئية */}
        {isInvestment && (isInstallments || isPartial) && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {isPartial && (
              <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-sm">
                <p className="text-amber-700 dark:text-amber-300">
                  💰 المدفوع مقدمًا:{" "}
                  <strong>{Number(paidAmount).toLocaleString()} ج.م</strong>
                  {" • "}
                  الباقي:{" "}
                  <strong>
                    {remainingAmount > 0 ? remainingAmount.toLocaleString() : 0}{" "}
                    ج.م
                  </strong>
                </p>
              </div>
            )}

            <InstallmentsGenerator
              totalAmount={
                isPartial
                  ? remainingAmount > 0
                    ? remainingAmount
                    : 0
                  : Number(totalAmount) || 0
              }
              installments={installments}
              onChange={setInstallments}
              label={
                isPartial
                  ? `أقساط الباقي (${remainingAmount > 0 ? remainingAmount.toLocaleString() : 0} ج.م)`
                  : "أقساط المبلغ الكامل"
              }
            />
          </div>
        )}
      </Card>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={saving}
        >
          <X size={16} /> إلغاء
        </Button>
        <Button onClick={handleAdd} loading={saving}>
          <CheckCircle size={16} /> تأكيد الإضافة
        </Button>
      </div>
    </div>
  );
}
