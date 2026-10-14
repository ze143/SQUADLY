import {
  FileText, AlertTriangle, Clock, CheckCircle, DollarSign,
} from "lucide-react";
import Card from "../ui/Card";
import {
  formatCurrency,
  calculateContractStatus,
} from "../../utils/contractConstants";

export default function ContractStats({ contracts = [] }) {
  // ✅ نحسب الحالة الفعلية لكل عقد
  const withStatus = contracts.map((c) => ({
    ...c,
    _status: calculateContractStatus(c),
  }));

  const active = withStatus.filter((c) => c._status === "active").length;
  const expiring = withStatus.filter((c) => c._status === "expiring").length;
  const expired = withStatus.filter((c) => c._status === "expired").length;
  const totalValue = withStatus
    .filter((c) => c._status === "active" || c._status === "expiring")
    .reduce((s, c) => s + Number(c.total_amount || 0), 0);

  const stats = [
    {
      label: "عقود نشطة",
      value: active,
      icon: CheckCircle,
      color: "emerald",
    },
    {
      label: "تنتهي قريب",
      value: expiring,
      icon: Clock,
      color: "amber",
    },
    {
      label: "منتهية",
      value: expired,
      icon: FileText,
      color: "slate",
    },
    {
      label: "القيمة الإجمالية",
      value: formatCurrency(totalValue),
      icon: DollarSign,
      color: "blue",
    },
  ];

  const colors = {
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} padding="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {s.label}
                </p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
                  {s.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg shrink-0 ${colors[s.color]}`}>
                <Icon size={18} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}