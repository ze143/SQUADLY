import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ChartCard from "./ChartCard";
import { useTheme } from "../../context/ThemeContext";

export default function TeamPerformanceChart({ data = [], loading = false }) {
  const { isDark } = useTheme();

  // ألوان حسب الوضع
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const tooltipText = isDark ? "#f1f5f9" : "#1e293b";
  const legendColor = isDark ? "#cbd5e1" : "#475569";

  const chartData = data.map((t) => ({
    name: t.name || "-", // ← الاسم الكامل زي ما هو
    fullName: t.name,
    category: t.category,
    فوز: t.wins,
    تعادل: t.draws,
    خسارة: t.losses,
    points: t.points,
    played: t.played,
  }));

  if (loading) {
    return (
      <ChartCard title="أداء الفرق" subtitle="جارٍ التحميل...">
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ChartCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <ChartCard title="أداء الفرق">
        <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
          لا توجد بيانات
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="أداء الفرق"
      subtitle="مقارنة بين الانتصارات والتعادلات والخسائر"
    >
      {/* Chart Area */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barSize={24}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="name"
              tick={{
                fontSize: 11,
                fill: axisColor,
                writingMode: "vertical-rl",
                dy: 6,
              }}
              stroke={axisColor}
              interval={0}
              angle={-90}
              textAnchor="end"
              height={22}
            />
            <YAxis
              tick={{ fontSize: 11, fill: axisColor }}
              stroke={axisColor}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${tooltipBorder}`,
                fontSize: 12,
                direction: "rtl",
                backgroundColor: tooltipBg,
                color: tooltipText,
              }}
              labelStyle={{ color: tooltipText, fontWeight: "bold" }}
              itemStyle={{ color: tooltipText }}
              formatter={(value, name) => [`${value} مباراة`, name]}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const d = payload[0].payload;
                  return `${d.fullName}${
                    d.category ? ` • ${d.category}` : ""
                  } • ${d.points} نقطة`;
                }
                return label;
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                paddingTop: 10,
                color: legendColor,
              }}
              iconType="circle"
            />
            <Bar dataKey="فوز" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="تعادل" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="خسارة" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend خارجي - ملخص سريع */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {chartData.slice(0, 8).map((team, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {team.fullName}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {team.played} مباراة
              </p>
            </div>
            <div className="text-center shrink-0">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {team.points}
              </p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400">
                نقطة
              </p>
            </div>
          </div>
        ))}
      </div>

      {chartData.length > 8 && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
          +{chartData.length - 8} فرق أخرى
        </p>
      )}
    </ChartCard>
  );
}
