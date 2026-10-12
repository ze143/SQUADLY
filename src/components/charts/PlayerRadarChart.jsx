import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ChartCard from './ChartCard';
import { useTheme } from '../../context/ThemeContext';

export default function PlayerRadarChart({ players = [], stats = [] }) {
  const { isDark } = useTheme();

  const gridColor = isDark ? '#334155' : '#cbd5e1';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipText = isDark ? '#f1f5f9' : '#1e293b';
  const legendColor = isDark ? '#cbd5e1' : '#475569';

  if (players.length < 2 || stats.length < 2) {
    return (
      <ChartCard title="مقارنة بصرية">
        <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
          اختر لاعبين لعرض المقارنة البصرية
        </div>
      </ChartCard>
    );
  }

  const [p1, p2] = players;
  const [s1, s2] = stats;

  const maxGoals = Math.max(s1.goals, s2.goals, 1);
  const maxAssists = Math.max(s1.assists, s2.assists, 1);
  const maxMatches = Math.max(s1.matches, s2.matches, 1);

  const data = [
    {
      metric: 'الأهداف',
      [p1.full_name]: Math.round((s1.goals / maxGoals) * 100),
      [p2.full_name]: Math.round((s2.goals / maxGoals) * 100),
    },
    {
      metric: 'صناعة',
      [p1.full_name]: Math.round((s1.assists / maxAssists) * 100),
      [p2.full_name]: Math.round((s2.assists / maxAssists) * 100),
    },
    {
      metric: 'مشاركات',
      [p1.full_name]: Math.round((s1.matches / maxMatches) * 100),
      [p2.full_name]: Math.round((s2.matches / maxMatches) * 100),
    },
    {
      metric: 'التقييم',
      [p1.full_name]: Number(s1.avgRating) * 10 || 0,
      [p2.full_name]: Number(s2.avgRating) * 10 || 0,
    },
    {
      metric: 'الانضباط',
      [p1.full_name]: Math.max(0, 100 - s1.yellows * 20 - s1.reds * 40),
      [p2.full_name]: Math.max(0, 100 - s2.yellows * 20 - s2.reds * 40),
    },
  ];

  return (
    <ChartCard title="مقارنة بصرية" subtitle="القيم كنسبة من 100">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius={100}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fontSize: 11, fill: axisColor }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: axisColor }}
            />
            <Radar
              name={p1.full_name}
              dataKey={p1.full_name}
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name={p2.full_name}
              dataKey={p2.full_name}
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                paddingTop: 10,
                color: legendColor,
              }}
              iconType="circle"
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${tooltipBorder}`,
                fontSize: 12,
                direction: 'rtl',
                backgroundColor: tooltipBg,
                color: tooltipText,
              }}
              labelStyle={{ color: tooltipText, fontWeight: 'bold' }}
              itemStyle={{ color: tooltipText }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}