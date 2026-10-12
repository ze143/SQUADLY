import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, User } from 'lucide-react';
import Card from '../ui/Card';
import Badge, { PaymentStatusBadge } from '../ui/Badge';
import { getPositionLabel } from '../../utils/constants';
import { getInitials } from '../../utils/formatters';

export default function PlayerCard({
  player,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) {
  return (
    <Card hover padding="p-4" className="flex flex-col">
      {/* Header: avatar + name + actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {getInitials(player.full_name)}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 truncate">{player.full_name}</h3>
            <p className="text-xs text-slate-500 truncate">
              {player.teams?.name || 'بدون فريق'}
            </p>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <Link
            to={`/players/${player.id}`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="عرض الملف"
          >
            <Eye size={16} />
          </Link>
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(player)}
              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
              title="تعديل"
            >
              <Edit size={16} />
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(player.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="حذف"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body: info grid */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-xs text-slate-500">المركز</p>
          <p className="font-medium text-slate-700">
            {getPositionLabel(player.position)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">سنة المواليد</p>
          <p className="font-medium text-slate-700">{player.birth_year || '-'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-slate-500">الرقم القومي</p>
          <p className="font-mono text-xs text-slate-700 truncate">
            {player.national_id}
          </p>
        </div>
      </div>

      {/* Footer: badges */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
        {player.player_type === 'investment' ? (
          <Badge color="indigo">استثماري</Badge>
        ) : (
          <Badge color="slate">فري</Badge>
        )}
        {player.player_type === 'investment' && (
          <PaymentStatusBadge status={player.payment_status} />
        )}
      </div>
    </Card>
  );
}