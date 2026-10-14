import {
  ClipboardList, Clock, CheckCircle, Lock, Users,
} from "lucide-react";
import Card from "../ui/Card";

export default function AssessmentStats({ assessments = [] }) {
  const stats = [
    {
      label: "إجمالي الاختبارات",
      value: assessments.length,
      icon: ClipboardList,
      color: "blue",
    },
    {
      label: "شغالة",
      value: assessments.filter((a) =>
        ["active", "in_progress"].includes(a.status),
      ).length,
      icon: Clock,
      color: "amber",
    },
    {
      label: "معتمدة",
      value: assessments.filter((a) => a.status === "approved").length,
      icon: CheckCircle,
      color: "emerald",
    },
    {
      label: "مقفولة",
      value: assessments.filter((a) =>
        ["locked", "cancelled"].includes(a.status),
      ).length,
      icon: Lock,
      color: "slate",
    },
  ];

  const colors = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
    slate:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
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
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
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