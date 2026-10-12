const colorMap = {
  emerald: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  slate: 'bg-slate-100 text-slate-700',
  indigo: 'bg-indigo-100 text-indigo-700',
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export default function Badge({
  children,
  color = 'slate',
  size = 'md',
  icon: Icon,
  className = '',
}) {
  const classes = [
    'inline-flex items-center gap-1 rounded-full font-medium',
    colorMap[color] || colorMap.slate,
    sizeMap[size] || sizeMap.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
      {children}
    </span>
  );
}

// ====== Badge جاهز لحالة السداد ======
export function PaymentStatusBadge({ status }) {
  const config = {
    paid: { color: 'emerald', label: 'مسدد' },
    unpaid: { color: 'red', label: 'غير مسدد' },
    pending: { color: 'amber', label: 'قيد الانتظار' },
  };
  const c = config[status] || config.pending;
  return <Badge color={c.color}>{c.label}</Badge>;
}

// ====== Badge جاهز لحالة المباراة ======
export function MatchStatusBadge({ status }) {
  const config = {
    scheduled: { color: 'blue', label: 'مجدولة' },
    in_progress: { color: 'amber', label: 'جارية' },
    closed: { color: 'slate', label: 'مغلقة' },
  };
  const c = config[status] || config.scheduled;
  return <Badge color={c.color}>{c.label}</Badge>;
}

// ====== Badge جاهز لحالة التصعيد ======
export function EscalationStatusBadge({ status }) {
  const config = {
    pending: { color: 'amber', label: 'قيد المراجعة' },
    approved: { color: 'emerald', label: 'تمت الموافقة' },
    rejected: { color: 'red', label: 'مرفوض' },
  };
  const c = config[status] || config.pending;
  return <Badge color={c.color}>{c.label}</Badge>;
}