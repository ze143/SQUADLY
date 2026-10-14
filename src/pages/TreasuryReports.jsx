import { useMemo, useState } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Calendar as CalendarIcon,
  Filter, Wallet, Download,
} from "lucide-react";
import { useTreasury } from "../hooks/useTreasury";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../utils/permissions";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import EmptyState from "../components/ui/EmptyState";
import {
  formatCurrency,
  MONTH_NAMES,
} from "../utils/treasuryConstants";

export default function TreasuryReports() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);

  // ===== فلتر الفترة =====
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const { transactions, loading } = useTreasury({
    from: filterFrom || undefined,
    to: filterTo || undefined,
  });

  // ===== التقرير الشهري =====
  const monthlyReport = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const d = new Date(t.transaction_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) {
        map[key] = {
          key,
          year: d.getFullYear(),
          month: d.getMonth(),
          income: 0,
          expense: 0,
          incomeCount: 0,
          expenseCount: 0,
        };
      }
      if (t.type === "income") {
        map[key].income += Number(t.amount);
        map[key].incomeCount += 1;
      } else {
        map[key].expense += Number(t.amount);
        map[key].expenseCount += 1;
      }
    });
    return Object.values(map)
      .map((m) => ({ ...m, balance: m.income - m.expense }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [transactions]);

  // ===== التقرير السنوي =====
  const yearlyReport = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const year = new Date(t.transaction_date).getFullYear();
      if (!map[year]) {
        map[year] = { year, income: 0, expense: 0 };
      }
      if (t.type === "income") map[year].income += Number(t.amount);
      else map[year].expense += Number(t.amount);
    });
    return Object.values(map)
      .map((y) => ({ ...y, balance: y.income - y.expense }))
      .sort((a, b) => b.year - a.year);
  }, [transactions]);

  // ===== تقرير التصنيفات =====
  const categoryReport = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const key = `${t.type}::${t.category}`;
      if (!map[key]) {
        map[key] = { type: t.type, category: t.category, total: 0, count: 0 };
      }
      map[key].total += Number(t.amount);
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // ===== إحصائيات عامة =====
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  // ===== تصدير CSV =====
  const exportCSV = () => {
    const headers = ["التاريخ", "النوع", "التصنيف", "الوصف", "رقم الإيصال", "المبلغ"];
    const rows = transactions.map((t) => [
      t.transaction_date,
      t.type === "income" ? "إيراد" : "مصروف",
      t.category,
      t.description || "",
      t.receipt_number || "",
      t.amount,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treasury-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!admin) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
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
            <BarChart3 className="text-emerald-600" /> تقارير الخزينة
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            تقارير مالية على أعلى مستوى
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Download size={16} /> تصدير CSV
        </button>
      </div>

      {/* فلتر الفترة */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        {(filterFrom || filterTo) && (
          <div className="flex justify-end mt-3">
            <button
              onClick={() => {
                setFilterFrom("");
                setFilterTo("");
              }}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              مسح الفلتر
            </button>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="لا توجد بيانات"
            description="أضف عمليات في الخزينة عشان تشوف التقارير."
          />
        </Card>
      ) : (
        <>
          {/* ملخص عام */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card padding="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    إجمالي الإيرادات
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <TrendingUp size={22} />
                </div>
              </div>
            </Card>
            <Card padding="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    إجمالي المصروفات
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(totalExpense)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                  <TrendingDown size={22} />
                </div>
              </div>
            </Card>
            <Card padding="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    الصافي
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      totalIncome - totalExpense >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(totalIncome - totalExpense)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                  <Wallet size={22} />
                </div>
              </div>
            </Card>
          </div>

          {/* التقرير الشهري */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon size={18} className="text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                التقرير الشهري
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs">
                  <tr>
                    <th className="p-3">الشهر</th>
                    <th className="p-3">الإيرادات</th>
                    <th className="p-3">المصروفات</th>
                    <th className="p-3">الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyReport.map((m) => (
                    <tr
                      key={m.key}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >
                      <td className="p-3 font-medium">
                        {MONTH_NAMES[m.month]} {m.year}
                      </td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(m.income)}
                      </td>
                      <td className="p-3 text-red-600 dark:text-red-400 font-medium">
                        {formatCurrency(m.expense)}
                      </td>
                      <td
                        className={`p-3 font-bold ${
                          m.balance >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(m.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* التقرير السنوي */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                التقرير السنوي
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs">
                  <tr>
                    <th className="p-3">السنة</th>
                    <th className="p-3">الإيرادات</th>
                    <th className="p-3">المصروفات</th>
                    <th className="p-3">الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyReport.map((y) => (
                    <tr
                      key={y.year}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >
                      <td className="p-3 font-medium">{y.year}</td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(y.income)}
                      </td>
                      <td className="p-3 text-red-600 dark:text-red-400 font-medium">
                        {formatCurrency(y.expense)}
                      </td>
                      <td
                        className={`p-3 font-bold ${
                          y.balance >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(y.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* تقرير التصنيفات */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Filter size={18} className="text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                تقرير التصنيفات
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* الإيرادات */}
              <div>
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                  <TrendingUp size={14} /> تصنيفات الإيرادات
                </h3>
                <div className="space-y-2">
                  {categoryReport
                    .filter((c) => c.type === "income")
                    .map((c) => (
                      <div
                        key={`${c.type}-${c.category}`}
                        className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {c.category}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(c.total)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {c.count} عملية
                          </p>
                        </div>
                      </div>
                    ))}
                  {categoryReport.filter((c) => c.type === "income").length ===
                    0 && (
                    <p className="text-xs text-slate-500 text-center py-3">
                      لا توجد إيرادات
                    </p>
                  )}
                </div>
              </div>

              {/* المصروفات */}
              <div>
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                  <TrendingDown size={14} /> تصنيفات المصروفات
                </h3>
                <div className="space-y-2">
                  {categoryReport
                    .filter((c) => c.type === "expense")
                    .map((c) => (
                      <div
                        key={`${c.type}-${c.category}`}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {c.category}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(c.total)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {c.count} عملية
                          </p>
                        </div>
                      </div>
                    ))}
                  {categoryReport.filter((c) => c.type === "expense").length ===
                    0 && (
                    <p className="text-xs text-slate-500 text-center py-3">
                      لا توجد مصروفات
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}