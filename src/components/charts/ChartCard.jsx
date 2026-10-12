import Card from '../ui/Card';

export default function ChartCard({
  title,
  subtitle,
  children,
  action,
  className = '',
}) {
  return (
    <Card padding="p-5" className={className}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="w-full">{children}</div>
    </Card>
  );
}