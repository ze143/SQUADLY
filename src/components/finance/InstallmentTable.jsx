import { CheckCircle, Trash2, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PaymentStatusBadge from './PaymentStatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function InstallmentTable({
  installments = [],
  loading = false,
  onMarkPaid,
  onRemove,
  canEdit = false,
  showPlayer = true,
}) {
  const today = new Date().toISOString().split('T')[0];

  const isOverdue = (inst) =>
    inst.status !== 'paid' && inst.due_date && inst.due_date < today;

  const columns = [
    ...(showPlayer
      ? [
          {
            key: 'player',
            label: 'اللاعب',
            render: (row) => (
              <div>
                <p className="font-medium text-slate-800">
                  {row.players?.full_name || '-'}
                </p>
                <p className="text-xs text-slate-500">
                  {row.players?.teams?.name || ''}
                </p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'amount',
      label: 'المبلغ',
      render: (row) => (
        <span className="font-bold text-slate-800">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: 'due_date',
      label: 'تاريخ الاستحقاق',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-slate-400" />
          <span className={isOverdue(row) ? 'text-red-600 font-medium' : ''}>
            {formatDate(row.due_date)}
          </span>
          {isOverdue(row) && (
            <AlertCircle size={14} className="text-red-500" title="متأخر" />
          )}
        </div>
      ),
    },
    {
      key: 'paid_date',
      label: 'تاريخ السداد',
      render: (row) =>
        row.paid_date ? (
          <span className="text-emerald-600">{formatDate(row.paid_date)}</span>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (row) => <PaymentStatusBadge status={row.status} size="sm" />,
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            label: 'الإجراءات',
            render: (row) => (
              <div className="flex gap-1">
                {row.status !== 'paid' && onMarkPaid && (
                  <button
                    onClick={() => onMarkPaid(row.id)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    title="تسجيل السداد"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => {
                      if (confirm('حذف هذا القسط؟')) onRemove(row.id);
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <Table
      columns={columns}
      data={installments}
      loading={loading}
      emptyMessage="لا توجد أقساط مسجلة"
    />
  );
}

// ====== ملخص مالي بسيط ======
export function FinanceSummary({ summary = { total: 0, paid: 0, unpaid: 0, pending: 0 } }) {
  const items = [
    {
      label: 'الإجمالي',
      value: summary.total,
      color: 'text-slate-800',
      bg: 'bg-slate-100',
      icon: DollarSign,
    },
    {
      label: 'المدفوع',
      value: summary.paid,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
      icon: CheckCircle,
    },
    {
      label: 'المتأخر',
      value: summary.unpaid,
      color: 'text-red-700',
      bg: 'bg-red-100',
      icon: AlertCircle,
    },
    {
      label: 'قيد الانتظار',
      value: summary.pending,
      color: 'text-amber-700',
      bg: 'bg-amber-100',
      icon: Calendar,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">{item.label}</p>
              <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                <Icon size={16} />
              </div>
            </div>
            <p className={`text-xl font-bold ${item.color}`}>
              {formatCurrency(item.value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}