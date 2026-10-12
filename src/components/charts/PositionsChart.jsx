import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ChartCard from './ChartCard';
import { useTheme } from '../../context/ThemeContext';
import { getPositionLabel } from '../../utils/constants';

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

export default function PositionsChart({ players = [], loading = false }) {
  const { isDark } = useTheme();

  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipText = isDark ? '#f1f5f9' : '#1e293b';

  const grouped = {};
  players.forEach((p) => {
    const pos = p.position || 'other';
    if (!grouped[pos]) grouped[pos] = { name: getPositionLabel(pos), value: 0 };
    grouped[pos].value++;
  });

  const chartData = Object.values(grouped).sort((a, b) => b.value - a.value);
  const total = players.length;

  if (loading) {
    return (
      <ChartCard title="توزيع المراكز" subtitle="جارٍ التحميل...">
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ChartCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <ChartCard title="توزيع المراكز">
        <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
          لا توجد بيانات
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="توزيع المراكز" subtitle={`${total} لاعب`}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke={isDark ? '#0f172a' : '#ffffff'}
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${tooltipBorder}`,
                fontSize: 12,
                direction: 'rtl',
                backgroundColor: tooltipBg,
                color: tooltipText,
              }}
              itemStyle={{ color: tooltipText }}
              formatter={(value, name) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return [`${value} لاعب (${pct}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend خارجي */}
      <div className="flex flex-wrap justify-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {chartData.map((entry, index) => {
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <div
              key={index}
              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {entry.name}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {entry.value}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}