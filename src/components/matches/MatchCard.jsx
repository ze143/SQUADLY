import { Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Eye, Edit, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import { MatchStatusBadge } from '../ui/Badge';
import { formatDateTime } from '../../utils/formatters';

export default function MatchCard({
  match,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) {
  const isHome = match.home_score !== null && match.away_score !== null;

  return (
    <Card hover padding="p-4">
      {/* Header: teams + status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-slate-800 truncate">{match.teams?.name || 'فريقنا'}</h3>
            <span className="text-slate-400 text-sm">ضد</span>
            <h3 className="font-bold text-slate-800 truncate">{match.opponent}</h3>
          </div>
          {match.competitions && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Trophy size={12} />
              {match.competitions.name} - {match.competitions.season}
            </p>
          )}
        </div>
        <MatchStatusBadge status={match.status} />
      </div>

      {/* Score */}
      {isHome && (
        <div className="flex items-center justify-center gap-4 my-4 py-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">فريقنا</p>
            <p className="text-3xl font-bold text-emerald-600">{match.home_score}</p>
          </div>
          <span className="text-2xl text-slate-300">-</span>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">الخصم</p>
            <p className="text-3xl font-bold text-slate-700">{match.away_score}</p>
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {formatDateTime(match.match_date)}
        </span>
        {match.venue && (
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {match.venue}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-100">
        <Link
          to={`/matches/${match.id}`}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="التفاصيل"
        >
          <Eye size={16} />
        </Link>
        {canEdit && onEdit && (
          <button
            onClick={() => onEdit(match)}
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
            title="تعديل"
          >
            <Edit size={16} />
          </button>
        )}
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(match.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="حذف"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </Card>
  );
}