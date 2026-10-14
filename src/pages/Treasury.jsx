import { useMemo, useState } from "react";
import {
  Plus, Wallet, Edit, Trash2, X, Filter, Receipt,
  TrendingUp, TrendingDown, Search,
} from "lucide-react";
import { useTreasury } from "../hooks/useTreasury";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../utils/permissions";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import TransactionForm from "../components/treasury/TransactionForm";
import TreasuryStats from "../components/treasury/TreasuryStats";
import {
  TRANSACTION_TYPES,
  formatCurrency,
  getTransactionTypeLabel,
  getTransactionTypeIcon,
  getTransactionTypeColor,
} from "../utils/treasuryConstants";
import { formatDate } from "../utils/formatters";

// ===== عدد العمليات في الصفحة الواحدة (لتاب السجل) =====
const PAGE_SIZE = 20;

export default function Treasury() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);

  // ===== فلاتر =====
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");

  // ===== التبويبات =====
  const [activeTab, setActiveTab] = useState("operations"); // operations | log

  // ===== ترقيم الصفحات (لتاب السجل) =====
  const [currentPage, setCurrentPage] = useState(1);

  const {
    transactions,
    loading,
    createTransaction,
    updateTransaction,
    removeTransaction,
  } = useTreasury({
    type: filterType || undefined,
    category: filterCategory || undefined,
    from: filterFrom || undefined,
    to: filterTo || undefined,
    search: search || undefined,
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // ===== التصنيفات المتاحة =====
  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category));
    return Array.from(set).sort();
  }, [transactions]);

  // ===== الحفظ =====
  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await updateTransaction(editing.id, data);
      } else {
        await createTransaction(data);
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
    if (!confirm("حذف هذه العملية؟")) return;
    try {
      await removeTransaction(id);
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  const clearFilters = () => {
    setFilterType("");
    setFilterCategory("");
    setFilterFrom("");
    setFilterTo("");
    setSearch("");
    setCurrentPage(1);
  };

  const hasFilters =
    filterType || filterCategory || filterFrom || filterTo || search;

  // ===== بيانات ترقيم الصفحات (لتاب السجل) =====
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, currentPage]);

  // ===== لو مش أدمن =====
  if (!admin) {
    return (
      <Card>
        <EmptyState
          icon={Wallet}
          title="غير مصرح"
          description="هذه الصفحة متاحة للأدمن فقط."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Wallet className="text-emerald-600" /> الخزينة
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {transactions.length} عملية
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={18} /> إضافة عملية
        </Button>
      </div>

      {/* Stats */}
      <TreasuryStats transactions={transactions} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("operations")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition ${
            activeTab === "operations"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <TrendingUp size={16} /> العمليات
        </button>
        <button
          onClick={() => setActiveTab("log")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition ${
            activeTab === "log"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Receipt size={16} /> السجل
        </button>
      </div>

      {/* ============ TAB 1: العمليات (Dashboard مصغر) ============ */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          {/* العمليات الأخيرة */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                آخر 5 عمليات
              </h2>
              <button
                onClick={() => setActiveTab("log")}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                عرض الكل ←
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="لا توجد عمليات"
                description="ابدأ بإضافة أول عملية مالية."
                action={
                  <Button onClick={() => setShowForm(true)}>
                    <Plus size={18} /> إضافة عملية
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((t) => {
                  const isIncome = t.type === "income";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isIncome
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
                          }`}
                        >
                          {isIncome ? (
                            <TrendingUp size={16} />
                          ) : (
                            <TrendingDown size={16} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">
                            {t.category}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {t.description || "-"} •{" "}
                            {formatDate(t.transaction_date)}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`font-bold whitespace-nowrap ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ملخص سريع */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* أعلى الإيرادات */}
            <Card>
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingUp size={16} /> أعلى الإيرادات
              </h3>
              {transactions.filter((t) => t.type === "income").length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  لا توجد إيرادات
                </p>
              ) : (
                <div className="space-y-2">
                  {transactions
                    .filter((t) => t.type === "income")
                    .sort((a, b) => Number(b.amount) - Number(a.amount))
                    .slice(0, 3)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          {t.category}
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* أعلى المصروفات */}
            <Card>
              <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <TrendingDown size={16} /> أعلى المصروفات
              </h3>
              {transactions.filter((t) => t.type === "expense").length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  لا توجد مصروفات
                </p>
              ) : (
                <div className="space-y-2">
                  {transactions
                    .filter((t) => t.type === "expense")
                    .sort((a, b) => Number(b.amount) - Number(a.amount))
                    .slice(0, 3)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          {t.category}
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ============ TAB 2: السجل (جدول كامل بفلاتر) ============ */}
      {activeTab === "log" && (
        <>
          {/* Filters */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input
                placeholder="بحث في الوصف/الإيصال..."
                label="بحث"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Select
                placeholder="كل الأنواع"
                label="النوع"
                options={TRANSACTION_TYPES.map((t) => ({
                  value: t.value,
                  label: `${t.icon} ${t.label}`,
                }))}
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Select
                placeholder="كل التصنيفات"
                label="التصنيف"
                options={categories.map((c) => ({ value: c, label: c }))}
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Input
                type="date"
                label="من تاريخ"
                value={filterFrom}
                onChange={(e) => {
                  setFilterFrom(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Input
                type="date"
                label="إلى تاريخ"
                value={filterTo}
                onChange={(e) => {
                  setFilterTo(e.target.value);
                  setCurrentPage(1);
                }}
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

          {/* Table */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : transactions.length === 0 ? (
            <Card>
              <EmptyState
                icon={Receipt}
                title={hasFilters ? "لا توجد نتائج" : "لا توجد عمليات"}
                description={
                  hasFilters
                    ? "جرب تغيير الفلاتر."
                    : "ابدأ بإضافة أول عملية مالية."
                }
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">النوع</th>
                      <th className="p-3">التصنيف</th>
                      <th className="p-3">الوصف</th>
                      <th className="p-3">رقم الإيصال</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {paginatedTransactions.map((t) => {
                      const isIncome = t.type === "income";
                      return (
                        <tr
                          key={t.id}
                          className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="p-3 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                            {formatDate(t.transaction_date)}
                          </td>
                          <td className="p-3">
                            <Badge
                              color={getTransactionTypeColor(t.type)}
                              size="sm"
                            >
                              {getTransactionTypeIcon(t.type)}{" "}
                              {getTransactionTypeLabel(t.type)}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                            {t.category}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 text-xs max-w-xs truncate">
                            {t.description || "-"}
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 text-xs font-mono">
                            {t.receipt_number || "-"}
                          </td>
                          <td
                            className={`p-3 font-bold whitespace-nowrap ${
                              isIncome
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatCurrency(t.amount)}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditing(t);
                                  setShowForm(true);
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                                title="تعديل"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                title="حذف"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    صفحة {currentPage} من {totalPages} (
                    {transactions.length} عملية)
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      السابق
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          title={editing ? "تعديل العملية" : "إضافة عملية"}
          size="lg"
        >
          <TransactionForm
            transaction={editing}
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