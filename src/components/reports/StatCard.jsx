import Card from '../ui/Card';

const colorMap = {
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-600 dark:text-emerald-300',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-600 dark:text-blue-300',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-600 dark:text-amber-300',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-600 dark:text-red-300',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-600 dark:text-purple-300',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/40',
    text: 'text-indigo-600 dark:text-indigo-300',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
  },
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
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <p
              className={`text-xs mt-1 font-medium ${
                trend.type === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trend.type === 'down'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-500 dark:text-slate-400'
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