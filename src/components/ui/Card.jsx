export default function Card({
  children,
  className = '',
  padding = 'p-5',
  hover = false,
  onClick,
}) {
  const classes = [
    'app-card rounded-xl shadow-sm transition-colors',
    padding,
    hover
      ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        <h3 className="text-lg font-bold app-text-primary">{title}</h3>
        {subtitle && (
          <p className="text-sm app-text-secondary mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-bold app-text-primary ${className}`}>
      {children}
    </h3>
  );
}