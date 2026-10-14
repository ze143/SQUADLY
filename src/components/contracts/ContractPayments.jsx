import { useState } from "react";
import {
  Plus, Edit, Trash2, CheckCircle, Clock,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import EmptyState from "../ui/EmptyState";
import PaymentForm from "./PaymentForm";
import {
  formatCurrency,
  getPaymentStatusLabel,
  getPaymentStatusColor,
} from "../../utils/contractConstants";
import { formatDate } from "../../utils/formatters";

export default function ContractPayments({
  payments = [],
  contract,
  onAdd,
  onUpdate,
  onRemove,
  onMarkPaid,
  canEdit = true,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await onUpdate(editing.id, data);
      } else {
        await onAdd({ ...data, contract_id: contract.id });
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("حذف هذا القسط؟")) return;
    try {
      await onRemove(id);
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  const handleMarkPaid = async (payment) => {
    if (
      !confirm(
        `تأكيد دفع ${formatCurrency(payment.amount)}؟\nسيتم تسجيلها في الخزينة.`,
      )
    )
      return;
    try {
      await onMarkPaid(payment, contract);
      alert("تم تسجيل الدفعة في الخزينة ✅");
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  // ===== الإحصائيات =====
  const totalAmount = Number(contract.total_amount) || 0;
  const paidAmount = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);
  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + Number(p.amount), 0);
  const overdueAmount = payments
    .filter((p) => p.status === "overdue")
    .reduce((s, p) => s + Number(p.amount), 0);
  const remaining = totalAmount - paidAmount;

  return (
    <div className="space-y-4">
      {/* ملخص مالي */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card padding="p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إجمالي العقد
          </p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
            {formatCurrency(totalAmount)}
          </p>
        </Card>
        <Card padding="p-3">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            مدفوع
          </p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(paidAmount)}
          </p>
        </Card>
        <Card padding="p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            متبقي
          </p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(remaining)}
          </p>
        </Card>
        <Card padding="p-3">
          <p className="text-xs text-red-600 dark:text-red-400">
            متأخر
          </p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
            {formatCurrency(overdueAmount)}
          </p>
        </Card>
      </div>

      {/* قائمة الدفعات */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            جدول الدفعات ({payments.length})
          </h3>
          {canEdit && (
            <Button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              size="sm"
            >
              <Plus size={16} /> إضافة قسط
            </Button>
          )}
        </div>

        {payments.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="لا توجد أقساط"
            description="أضف أول قسط للعقد."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">الاستحقاق</th>
                  <th className="p-3">الدفع</th>
                  <th className="p-3">الحالة</th>
                  {canEdit && <th className="p-3">إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-200">
                      {p.installment_number}
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">
                      {formatDate(p.due_date)}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">
                      {p.paid_date ? formatDate(p.paid_date) : "-"}
                    </td>
                    <td className="p-3">
                      <Badge
                        color={getPaymentStatusColor(p.status)}
                        size="sm"
                      >
                        {getPaymentStatusLabel(p.status)}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td className="p-3">
                        <div className="flex gap-1">
                          {p.status !== "paid" && (
                            <button
                              onClick={() => handleMarkPaid(p)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                              title="تسجيل كمدفوع"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditing(p);
                              setShowForm(true);
                            }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                            title="تعديل"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          title={editing ? "تعديل القسط" : "إضافة قسط"}
          size="md"
        >
          <PaymentForm
            payment={editing}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}