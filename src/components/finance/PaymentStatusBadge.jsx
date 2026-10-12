import { CheckCircle, XCircle, Clock } from 'lucide-react';
import Badge from '../ui/Badge';

const config = {
  paid: { color: 'emerald', label: 'مسدد', icon: CheckCircle },
  unpaid: { color: 'red', label: 'غير مسدد', icon: XCircle },
  pending: { color: 'amber', label: 'قيد الانتظار', icon: Clock },
};

export default function PaymentStatusBadge({ status, size = 'md', withIcon = true }) {
  const c = config[status] || config.pending;
  return (
    <Badge color={c.color} size={size} icon={withIcon ? c.icon : undefined}>
      {c.label}
    </Badge>
  );
}