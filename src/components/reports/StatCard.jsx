import Card from '../ui/Card';

const colorMap = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = 'emerald',
  trend,
}) {
  const c = colorMap[color] || colorMap.emerald;

  return (
    <Card padding="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`text-xs mt-1 font-medium ${
                trend.type === 'up'
                  ? 'text-emerald-600'
                  : trend.type === 'down'
                  ? 'text-red-600'
                  : 'text-slate-500'
              }`}
            >
              {trend.type === 'up' ? '▲' : trend.type === 'down' ? '▼' : '•'}{' '}
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg shrink-0 ${c.bg} ${c.text}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </Card>
  );
}