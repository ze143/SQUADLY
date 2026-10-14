import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, FileText, Edit, Trash2, Eye, Search, X,
  AlertTriangle, Clock,
} from "lucide-react";
import { useContracts } from "../hooks/useContracts";
import { usePlayers } from "../hooks/usePlayers";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isTeamAdmin } from "../utils/permissions";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import ContractForm from "../components/contracts/ContractForm";
import ContractStats from "../components/contracts/ContractStats";
import {
  CONTRACT_TYPES,
  CONTRACT_STATUS,
  getContractTypeLabel,
  getContractTypeIcon,
  getContractTypeColor,
  getContractStatusLabel,
  getContractStatusColor,
  calculateContractStatus,
  getDaysRemaining,
  formatCurrency,
} from "../utils/contractConstants";
import { formatDate } from "../utils/formatters";

export default function Contracts() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const teamAdmin = isTeamAdmin(profile);
  const canManage = admin || teamAdmin;

  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");

  const {
    contracts,
    loading,
    createContract,
    updateContract,
    removeContract,
  } = useContracts({
    type: filterType || undefined,
    status: filterStatus || undefined,
    from: filterFrom || undefined,
    to: filterTo || undefined,
    search: search || undefined,
  });

  const { players } = usePlayers();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ نحسب الحالة الفعلية للعقود
  const contractsWithStatus = useMemo(() => {
    return contracts.map((c) => ({
      ...c,
      _status: calculateContractStatus(c),
      _daysLeft: getDaysRemaining(c.end_date),
    }));
  }, [contracts]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await updateContract(editing.id, data);
      } else {
        await createContract(data);
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
    if (!confirm("حذف هذا العقد؟ سيتم حذف كل الدفعات المرتبطة به.")) return;
    try {
      await removeContract(id);
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  const clearFilters = () => {
    setFilterType("");
    setFilterStatus("");
    setFilterFrom("");
    setFilterTo("");
    setSearch("");
  };

  const hasFilters =
    filterType || filterStatus || filterFrom || filterTo || search;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="text-emerald-600" /> العقود
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {contracts.length} عقد
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus size={18} /> إضافة عقد
          </Button>
        )}
      </div>

      {/* Stats */}
      <ContractStats contracts={contracts} />

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input
            placeholder="بحث بالطرف/الرقم..."
            label="بحث"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="كل الأنواع"
            label="النوع"
            options={CONTRACT_TYPES.map((t) => ({
              value: t.value,
              label: `${t.icon} ${t.label}`,
            }))}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          />
          <Select
            placeholder="كل الحالات"
            label="الحالة"
            options={CONTRACT_STATUS}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
          <Input
            type="date"
            label="من تاريخ"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
          <Input
            type="date"
            label="إلى تاريخ"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>
        {hasFilters && (
          <div className="flex justify-end mt-3">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
            >
              <X size={12} /> مسح الفلاتر
            </button>
          </div>
        )}
      </Card>

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : contractsWithStatus.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={hasFilters ? "لا توجد نتائج" : "لا توجد عقود"}
            description={
              hasFilters
                ? "جرب تغيير الفلاتر."
                : "ابدأ بإضافة أول عقد."
            }
            action={
              !hasFilters && canManage ? (
                <Button onClick={() => setShowForm(true)}>
                  <Plus size={18} /> إضافة عقد
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {contractsWithStatus.map((c) => {
            const typeColor = getContractTypeColor(c.contract_type);
            const statusColor = getContractStatusColor(c._status);
            const isExpiring = c._status === "expiring";
            const isExpired = c._status === "expired";

            return (
              <Card
                key={c.id}
                padding="p-4"
                className={
                  isExpiring
                    ? "border-r-4 border-r-amber-500"
                    : isExpired
                      ? "border-r-4 border-r-slate-400"
                      : "border-r-4 border-r-emerald-500"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-3 rounded-xl shrink-0 text-2xl bg-${typeColor}-100 dark:bg-${typeColor}-900/40`}
                    >
                      {getContractTypeIcon(c.contract_type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">
                          {c.party_name}
                        </h3>
                        <Badge color={typeColor} size="sm">
                          {getContractTypeLabel(c.contract_type)}
                        </Badge>
                        <Badge color={statusColor} size="sm">
                          {getContractStatusLabel(c._status)}
                        </Badge>
                        {isExpiring && c._daysLeft !== null && (
                          <Badge color="amber" size="sm">
                            <Clock size={12} /> {c._daysLeft} يوم
                          </Badge>
                        )}
                      </div>

                      {c.contract_number && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                          #{c.contract_number}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          📅 من {formatDate(c.start_date)}
                          {c.end_date && ` إلى ${formatDate(c.end_date)}`}
                        </span>
                        {Number(c.total_amount) > 0 && (
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            💰 {formatCurrency(c.total_amount)}
                          </span>
                        )}
                      </div>

                      {c.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                          {c.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Link
                      to={`/contracts/${c.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="التفاصيل"
                    >
                      <Eye size={16} />
                    </Link>
                    {canManage && (
                      <>
                        <button
                          onClick={() => {
                            setEditing(c);
                            setShowForm(true);
                          }}
                          className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          title={editing ? "تعديل العقد" : "إضافة عقد جديد"}
          size="xl"
        >
          <ContractForm
            contract={editing}
            players={players}
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