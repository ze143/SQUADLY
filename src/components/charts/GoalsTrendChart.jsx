import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import ChartCard from './ChartCard';

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export default function GoalsTrendChart({ data = [], loading = false }) {
  // تجميع حسب الشهر
  const grouped = {};
  data.forEach((ev) => {
    if (!ev.matches?.match_date) return;
    const d = new Date(ev.matches.match_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) {
      grouped[key] = { key, month: MONTHS[d.getMonth()], year: d.getFullYear(), goals: 0, assists: 0 };
    }
    if (ev.event_type === 'goal') grouped[key].goals++;
    else if (ev.event_type === 'assist') grouped[key].assists++;
  });

  const chartData = Object.values(grouped)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((g) => ({
      name: `${g.month} ${g.year}`,
      أهداف: g.goals,
      صناعة: g.assists,
    }));

  if (loading) {
    return (
      <ChartCard title="تطور الأداء" subtitle="جارٍ التحميل...">
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ChartCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <ChartCard title="تطور الأداء">
        <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
          لا توجد بيانات
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="تطور الأهداف شهرياً"
      subtitle="عدد الأهداف وصناعتها على مدار الوقت"
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 12,
                direction: 'rtl',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="أهداف"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="صناعة"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}