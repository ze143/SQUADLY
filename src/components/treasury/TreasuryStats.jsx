import { Wallet, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import Card from "../ui/Card";
import { formatCurrency } from "../../utils/treasuryConstants";

export default function TreasuryStats({ transactions = [] }) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const stats = [
    {
      label: "الرصيد الحالي",
      value: formatCurrency(balance),
      icon: Wallet,
      color: balance >= 0 ? "emerald" : "red",
    },
    {
      label: "إجمالي الإيرادات",
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "إجمالي المصروفات",
      value: formatCurrency(totalExpense),
      icon: TrendingDown,
      color: "red",
    },
    {
      label: "عدد العمليات",
      value: transactions.length,
      icon: Receipt,
      color: "blue",
    },
  ];

  const colors = {
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
    green: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300",
    red: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
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