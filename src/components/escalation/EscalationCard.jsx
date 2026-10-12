import {
  ArrowLeft, User, Clock, CheckCircle, XCircle, Calendar,
  MessageSquare, Target, FileText, ShieldCheck, Award,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDateTime } from '../../utils/formatters';
import {
  getEscalationStatusLabel,
} from '../../utils/constants';

const statusConfig = {
  pending: { color: 'amber', icon: Clock, label: 'في انتظار الإداري الأصلي' },
  pending_admin: { color: 'blue', icon: ShieldCheck, label: 'في انتظار المدير الإداري' },
  approved: { color: 'emerald', icon: CheckCircle, label: 'معتمد نهائياً' },
  rejected: { color: 'red', icon: XCircle, label: 'مرفوض' },
};

export default function EscalationCard({
  request,
  onApprove,
  onReject,
  onAdminApprove,
  onAdminReject,
  canReview = false,
  canAdminReview = false,
  reviewing = false,
}) {
  const status = statusConfig[request.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const isMatchType = request.escalation_type === 'match';
  const TypeIcon = isMatchType ? Target : FileText;
  const typeLabel = isMatchType ? 'تصعيد لمباراة' : 'تصعيد عام (دائم)';

  const isPending = request.status === 'pending';
  const isPendingAdmin = request.status === 'pending_admin';

  return (
    <Card padding="p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <User size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 truncate">
              {request.player?.full_name || 'لاعب محذوف'}
            </h3>
            <p className="text-xs text-slate-500">
              {request.player?.position} • مواليد {request.player?.birth_year}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge color={isMatchType ? 'blue' : 'purple'} size="sm" icon={TypeIcon}>
            {typeLabel}
          </Badge>
          <Badge color={status.color} icon={StatusIcon}>
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Teams transfer */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex-1 text-center">
          <p className="text-xs text-slate-500 mb-1">من</p>
          <p className="font-medium text-slate-800 text-sm">
            {request.from_team?.name || '-'}
          </p>
          <p className="text-xs text-slate-500">{request.from_team?.category}</p>
        </div>
        <ArrowLeft size={20} className="text-emerald-600 shrink-0" />
        <div className="flex-1 text-center">
          <p className="text-xs text-slate-500 mb-1">إلى</p>
          <p className="font-medium text-slate-800 text-sm">
            {request.to_team?.name || '-'}
          </p>
          <p className="text-xs text-slate-500">{request.to_team?.category}</p>
        </div>
      </div>

      {/* Match (لو تصعيد لمباراة) */}
      {isMatchType && request.matches && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
            <Target size={12} /> المباراة المستهدفة
          </p>
          <p className="text-sm font-medium text-blue-900">
            {request.matches.teams?.name} × {request.matches.opponent}
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            {formatDateTime(request.matches.match_date)}
          </p>
        </div>
      )}

      {/* Reason */}
      {request.reason && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <MessageSquare size={12} /> سبب الطلب
          </div>
          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
            {request.reason}
          </p>
        </div>
      )}

      {/* Notes */}
      {request.notes && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <MessageSquare size={12} /> ملاحظات إضافية
          </div>
          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
            {request.notes}
          </p>
        </div>
      )}

      {/* Review notes */}
      {request.review_notes && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <MessageSquare size={12} /> ملاحظات المراجعة
          </div>
          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
            {request.review_notes}
          </p>
        </div>
      )}

      {/* Admin approval badge */}
      {request.admin_approved && (
        <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
          <Award size={14} />
          <span>موافقة المدير الإداري</span>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1">
          <Calendar size={12} /> {formatDateTime(request.created_at)}
        </span>
        {request.requester && (
          <span className="flex items-center gap-1">
            <User size={12} /> طُلب من: {request.requester.full_name}
          </span>
        )}
      </div>

      {/* Actions */}
      {isPending && canReview && (
        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Button
            variant="success"
            onClick={() => onApprove?.(request.id)}
            loading={reviewing}
            fullWidth
          >
            <CheckCircle size={16} /> موافقة (الإداري الأصلي)
          </Button>
          <Button
            variant="danger"
            onClick={() => onReject?.(request.id)}
            disabled={reviewing}
            fullWidth
          >
            <XCircle size={16} /> رفض
          </Button>
        </div>
      )}

      {isPendingAdmin && canAdminReview && (
        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Button
            variant="success"
            onClick={() => onAdminApprove?.(request.id)}
            loading={reviewing}
            fullWidth
          >
            <Award size={16} /> موافقة المدير الإداري
          </Button>
          <Button
            variant="danger"
            onClick={() => onAdminReject?.(request.id)}
            disabled={reviewing}
            fullWidth
          >
            <XCircle size={16} /> رفض نهائي
          </Button>
        </div>
      )}

      {isPending && !canReview && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          <Clock size={16} /> في انتظار موافقة الإداري المسؤول عن الفرقة المصدر
        </div>
      )}

      {isPendingAdmin && !canAdminReview && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          <ShieldCheck size={16} /> في انتظار موافقة المدير الإداري
        </div>
      )}
    </Card>
  );
}