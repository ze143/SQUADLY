import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight, FileText, Edit, Trash2, User, Calendar,
  DollarSign, RefreshCw, XCircle, Clock,
} from "lucide-react";
import { useContracts } from "../hooks/useContracts";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isTeamAdmin } from "../utils/permissions";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import ContractPayments from "../components/contracts/ContractPayments";
import ContractForm from "../components/contracts/ContractForm";
import { usePlayers } from "../hooks/usePlayers";
import {
  getContractTypeLabel,
  getContractTypeIcon,
  getContractTypeColor,
  getContractStatusLabel,
  getContractStatusColor,
  getPaymentMethodLabel,
  getPartyTypeLabel,
  calculateContractStatus,
  formatCurrency,
} from "../utils/contractConstants";
import { formatDate } from "../utils/formatters";

export default function ContractDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const teamAdmin = isTeamAdmin(profile);
  const canManage = admin || teamAdmin;

  const {
    getContractById,
    getContractPayments,
    updateContract,
    createPayment,
    updatePayment,
    removePayment,
    markPaymentAsPaid,
  } = useContracts();

  const { players } = usePlayers();

  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("info");

  const [showEditForm, setShowEditForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [contractData, paymentsData] = await Promise.all([
        getContractById(id),
        getContractPayments(id),
      ]);
      setContract(contractData);
      setPayments(paymentsData);
    } catch (err) {
      console.error(err);
      alert("خطأ في تحميل العقد: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  const handleUpdateContract = async (data) => {
    setSaving(true);
    try {
      await updateContract(id, data);
      setShowEditForm(false);
      await loadAll();
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = async (data) => {
    await createPayment(data);
    await loadAll();
  };

  const handleUpdatePayment = async (paymentId, data) => {
    await updatePayment(paymentId, data);
    await loadAll();
  };

  const handleRemovePayment = async (paymentId) => {
    await removePayment(paymentId);
    await loadAll();
  };

  const handleMarkPaid = async (payment, contractData) => {
    await markPaymentAsPaid(payment, contractData);
    await loadAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contract) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="العقد غير موجود"
          action={
            <Button onClick={() => navigate("/contracts")}>
              رجوع للعقود
            </Button>
          }
        />
      </Card>
    );
  }

  const status = calculateContractStatus(contract);
  const typeColor = getContractTypeColor(contract.contract_type);
  const statusColor = getContractStatusColor(status);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm"
        >
          <ArrowRight size={18} /> رجوع
        </button>
        {canManage && (
          <Button onClick={() => setShowEditForm(true)}>
            <Edit size={16} /> تعديل العقد
          </Button>
        )}
      </div>

      {/* Header Card */}
      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 bg-${typeColor}-100 dark:bg-${typeColor}-900/40`}
          >
            {getContractTypeIcon(contract.contract_type)}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {contract.party_name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge color={typeColor}>
                {getContractTypeLabel(contract.contract_type)}
              </Badge>
              <Badge color={statusColor}>{getContractStatusLabel(status)}</Badge>
              <Badge color="slate">
                {getPartyTypeLabel(contract.party_type)}
              </Badge>
              {contract.contract_number && (
                <Badge color="blue">#{contract.contract_number}</Badge>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              القيمة الإجمالية
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(contract.total_amount)}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab("info")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition ${
            tab === "info"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText size={16} /> معلومات
        </button>
        <button
          onClick={() => setTab("payments")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition ${
            tab === "payments"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <DollarSign size={16} /> الدفعات ({payments.length})
        </button>
      </div>

      {/* Info Tab */}
      {tab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">
              بيانات العقد
            </h3>
            <div className="space-y-3 text-sm">
              <Row icon={User} label="الطرف" value={contract.party_name} />
              {contract.player_id && contract.players && (
                <Row
                  icon={User}
                  label="اللاعب المرتبط"
                  value={
                    <Link
                      to={`/players/${contract.players.id}`}
                      className="text-emerald-600 hover:underline"
                    >
                      {contract.players.full_name}
                    </Link>
                  }
                />
              )}
              <Row
                icon={Calendar}
                label="تاريخ البداية"
                value={formatDate(contract.start_date)}
              />
              <Row
                icon={Calendar}
                label="تاريخ النهاية"
                value={contract.end_date ? formatDate(contract.end_date) : "-"}
              />
              <Row
                icon={DollarSign}
                label="طريقة الدفع"
                value={getPaymentMethodLabel(contract.payment_method)}
              />
              {contract.installments_count > 0 && (
                <Row
                  icon={DollarSign}
                  label="عدد الأقساط"
                  value={`${contract.installments_count} قسط × ${formatCurrency(contract.installment_amount)}`}
                />
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">
              الوصف والبنود
            </h3>
            <div className="space-y-4 text-sm">
              {contract.description && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    الوصف
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                    {contract.description}
                  </p>
                </div>
              )}
              {contract.terms && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    البنود
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                    {contract.terms}
                  </p>
                </div>
              )}
              {contract.notes && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    ملاحظات
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line">
                    {contract.notes}
                  </p>
                </div>
              )}
              {!contract.description && !contract.terms && !contract.notes && (
                <p className="text-center text-slate-500 py-4">
                  لا توجد تفاصيل إضافية
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Payments Tab */}
      {tab === "payments" && (
        <ContractPayments
          payments={payments}
          contract={contract}
          onAdd={handleAddPayment}
          onUpdate={handleUpdatePayment}
          onRemove={handleRemovePayment}
          onMarkPaid={handleMarkPaid}
          canEdit={canManage}
        />
      )}

      {/* Edit Modal */}
      {showEditForm && (
        <Modal
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          title="تعديل العقد"
          size="xl"
        >
          <ContractForm
            contract={contract}
            players={players}
            onSubmit={handleUpdateContract}
            onCancel={() => setShowEditForm(false)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 shrink-0">
        <Icon size={14} /> {label}
      </span>
      <span className="font-medium text-slate-800 dark:text-slate-100 text-left">
        {value}
      </span>
    </div>
  );
}