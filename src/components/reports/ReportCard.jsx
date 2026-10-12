import Card from '../ui/Card';

export default function ReportCard({
  icon: Icon,
  title,
  description,
  onClick,
  color = 'emerald',
}) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
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
          <h3 className="font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
      </div>
    </Card>
  );
}