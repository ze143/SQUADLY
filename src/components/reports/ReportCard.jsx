import Card from '../ui/Card';

export default function ReportCard({
  icon: Icon,
  title,
  description,
  onClick,
  color = 'emerald',
}) {
  const colors = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300',
  };

  return (
    <Card hover onClick={onClick} padding="p-4">
      <div className="flex items-start gap-3">
        <div
          className={`p-3 rounded-lg shrink-0 ${
            colors[color] || colors.emerald
          }`}
        >
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}