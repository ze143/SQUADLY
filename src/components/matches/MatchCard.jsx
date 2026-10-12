import { Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Eye, Edit, Trash2, Target } from 'lucide-react';
import Card from '../ui/Card';
import Badge, { MatchStatusBadge } from '../ui/Badge';
import { formatDateTime } from '../../utils/formatters';
import { getVenueTypeLabel, getVenueTypeColor } from '../../utils/constants';

export default function MatchCard({
  match,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) {
  const hasScore = match.home_score !== null && match.away_score !== null;
  const isDraw = hasScore && match.home_score === match.away_score;

  // ===== حساب ركلات الترجيح من penalty_shots مباشرة =====
  const penaltyShots = match.penalty_shots || [];

  const homePens = penaltyShots.filter(
    (s) => s.team_side === 'home' && s.is_scored
  ).length;

  const awayPens = penaltyShots.filter(
    (s) => s.team_side === 'away' && s.is_scored
  ).length;

  // هل فيه ركلات مسجلة؟ (3 طرق للكشف)
  const hasPenalties =
    penaltyShots.length > 0 ||
    match.has_penalties === true ||
    match.penalties_locked === true;

  const penHome =
    penaltyShots.length > 0 ? homePens : (match.penalty_home_score ?? 0);
  const penAway =
    penaltyShots.length > 0 ? awayPens : (match.penalty_away_score ?? 0);

  const penWinner =
    hasPenalties && penHome !== penAway
      ? penHome > penAway
        ? 'home'
        : 'away'
      : null;

  // هل المباراة محتاجة ترجيح (تعادل + منتهية)؟
  const needsPenalties =
    match.status === 'closed' && isDraw && !hasPenalties;

  return (
    <Card
      hover
      padding="p-4"
      className={hasPenalties ? 'border-2 border-amber-300 dark:border-amber-700' : ''}
    >
      {/* ===== Header ===== */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
              {match.teams?.name || 'فريقنا'}
            </h3>
            <span className="text-slate-400 text-sm">ضد</span>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
              {match.opponent}
            </h3>
          </div>
          {match.competitions && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Trophy size={12} />
              {match.competitions.name} - {match.competitions.season}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          <MatchStatusBadge status={match.status} />
          {match.venue_type && (
            <Badge color={getVenueTypeColor(match.venue_type)} size="sm">
              {getVenueTypeLabel(match.venue_type)}
            </Badge>
          )}
        </div>
      </div>

      {/* ===== Score ===== */}
      {hasScore && (
        <div className="my-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          {/* النتيجة الأساسية */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                فريقنا
              </p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {match.home_score}
              </p>
            </div>
            <span className="text-2xl text-slate-300 dark:text-slate-600">
              -
            </span>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                الخصم
              </p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {match.away_score}
              </p>
            </div>
          </div>

          {/* ===== 🎯 ركلات الترجيح ===== */}
          {hasPenalties && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-2 flex-wrap text-slate-700 dark:text-slate-300">
                <Target size={16} className="shrink-0" />
                <span className="text-xs font-bold">ركلات الترجيح</span>
                <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-sm font-bold">
                  {penHome} - {penAway}
                </span>
                {penWinner === 'home' && (
                  <span className="text-xs font-bold flex items-center gap-1">
                    🏆 فريقنا فاز
                  </span>
                )}
                {penWinner === 'away' && (
                  <span className="text-xs font-bold flex items-center gap-1">
                    ❌ خسرنا بالترجيح
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ===== ⚠️ تعادل بدون ترجيح ===== */}
          {needsPenalties && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                ⚠️ تعادل — لم تُسجَّل ركلات الترجيح بعد
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===== Meta ===== */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
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

      {/* ===== Actions ===== */}
      <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          to={`/matches/${match.id}`}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
          title="التفاصيل"
        >
          <Eye size={16} />
        </Link>
        {canEdit && onEdit && (
          <button
            onClick={() => onEdit(match)}
            className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
            title="تعديل"
          >
            <Edit size={16} />
          </button>
        )}
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(match.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            title="حذف"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </Card>
  );
}