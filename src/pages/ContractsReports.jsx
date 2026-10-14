import { useMemo } from "react";
import { BarChart3, TrendingUp, FileText, DollarSign, AlertTriangle } from "lucide-react";
import { useContracts } from "../hooks/useContracts";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isTeamAdmin } from "../utils/permissions";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import {
  CONTRACT_TYPES,
  calculateContractStatus,
  getContractTypeLabel,
  getContractTypeIcon,
  formatCurrency,
} from "../utils/contractConstants";

export default function ContractsReports() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const teamAdmin = isTeamAdmin(profile);
  const canView = admin || teamAdmin;

  const { contracts, loading } = useContracts();

  // ===== التقرير حسب النوع =====
  const typeReport = useMemo(() => {
    const map = {};
    contracts.forEach((c) => {
      if (!map[c.contract_type]) {
        map[c.contract_type] = {
          type: c.contract_type,
          count: 0,
          totalAmount: 0,
          activeCount: 0,
        };
      }
      map[c.contract_type].count += 1;
      map[c.contract_type].totalAmount += Number(c.total_amount || 0);
      if (calculateContractStatus(c) === "active") {
        map[c.contract_type].activeCount += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [contracts]);

  // ===== التقرير حسب الحالة =====
  const statusReport = useMemo(() => {
    const map = { active: 0, expiring: 0, expired: 0, cancelled: 0, renewed: 0 };
    contracts.forEach((c) => {
      const s = calculateContractStatus(c);
      if (map[s] !== undefined) map[s] += 1;
    });
    return map;
  }, [contracts]);

  // ===== إجمالي القيمة =====
  const totals = useMemo(() => {
    let activeValue = 0;
    let expiringValue = 0;
    let expiredValue = 0;

    contracts.forEach((c) => {
      const s = calculateContractStatus(c);
      const amount = Number(c.total_amount || 0);
      if (s === "active") activeValue += amount;
      else if (s === "expiring") expiringValue += amount;
      else if (s === "expired") expiredValue += amount;
    });

    return { activeValue, expiringValue, expiredValue };
  }, [contracts]);

  if (!canView) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="غير مصرح"
          description="هذه الصفحة متاحة للأدمن وإداري الفريق فقط."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="text-emerald-600" /> تقارير العقود
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {contracts.length} عقد
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : contracts.length === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="لا توجد بيانات"
            description="أضف عقود عشان تشوف التقارير."
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
                    عقود نشطة
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {statusReport.active}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatCurrency(totals.activeValue)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <FileText size={22} />
                </div>
              </div>
            </Card>
            <Card padding="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    تنتهي قريب
                  </p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {statusReport.expiring}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatCurrency(totals.expiringValue)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                  <AlertTriangle size={22} />
                </div>
              </div>
            </Card>
            <Card padding="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    منتهية
                  </p>
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-1">
                    {statusReport.expired}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatCurrency(totals.expiredValue)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <FileText size={22} />
                </div>
              </div>
            </Card>
          </div>

          {/* تقرير حسب النوع */}
          <Card>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              التقرير حسب النوع
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs">
                  <tr>
                    <th className="p-3">النوع</th>
                    <th className="p-3">عدد العقود</th>
                    <th className="p-3">نشطة</th>
                    <th className="p-3">إجمالي القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {typeReport.map((t) => (
                    <tr
                      key={t.type}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-100">
                        {getContractTypeIcon(t.type)}{" "}
                        {getContractTypeLabel(t.type)}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {t.count}
                      </td>
                      <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        {t.activeCount}
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                        {formatCurrency(t.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* تقرير الحالات */}
          <Card>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-600" />
              التقرير حسب الحالة
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {statusReport.active}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  نشط
                </p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {statusReport.expiring}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  ينتهي قريب
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                  {statusReport.expired}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  منتهي
                </p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {statusReport.cancelled}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  ملغي
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {statusReport.renewed}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  مجدد
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}