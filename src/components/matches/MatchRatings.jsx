import { useEffect, useState } from 'react';
import { Star, Save, User } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { getPositionLabel } from '../../utils/constants';

export default function MatchRatings({
  participants = [], // اللاعبين اللي شاركوا (أساسي + احتياطي دخل)
  initialRatings = [],
  onSave,
  disabled = false,
}) {
  const [ratings, setRatings] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial = {};
    initialRatings.forEach((r) => {
      initial[r.player_id] = {
        rating: r.rating ?? '',
        notes: r.notes ?? '',
      };
    });
    setRatings(initial);
  }, [initialRatings]);

  const updateRating = (playerId, field, value) => {
    setRatings((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    // تحقق إن كل اللاعبين لهم تقييم
    const missing = participants.filter(
      (p) => !ratings[p.id]?.rating && ratings[p.id]?.rating !== 0
    );

    if (missing.length > 0) {
      return alert(
        `يرجى تقييم جميع اللاعبين. المتبقي: ${missing.length}`
      );
    }

    setSaving(true);
    try {
      const payload = participants
        .filter((p) => ratings[p.id]?.rating !== '' && ratings[p.id]?.rating != null)
        .map((p) => ({
          player_id: p.id,
          rating: Number(ratings[p.id].rating),
          notes: ratings[p.id].notes?.trim() || null,
        }));

      await onSave(payload);
      alert('تم حفظ التقييمات ✅');
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (participants.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={User}
          title="لا يوجد لاعبون شاركوا"
          description="يجب تحديد التشكيل الأساسي والاحتياطيين أولاً."
        />
      </Card>
    );
  }

  const ratedCount = participants.filter(
    (p) => ratings[p.id]?.rating !== '' && ratings[p.id]?.rating != null
  ).length;

  const getRatingColor = (rating) => {
    const r = Number(rating);
    if (!r && r !== 0) return 'text-slate-400';
    if (r >= 8) return 'text-emerald-600';
    if (r >= 6) return 'text-blue-600';
    if (r >= 4) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRatingBg = (rating) => {
    const r = Number(rating);
    if (!r && r !== 0) return 'bg-slate-50';
    if (r >= 8) return 'bg-emerald-50 border-emerald-200';
    if (r >= 6) return 'bg-blue-50 border-blue-200';
    if (r >= 4) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Card padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-amber-500" />
            <h3 className="font-bold text-slate-800">
              تقييم اللاعبين في المباراة
            </h3>
          </div>
          <Badge color={ratedCount === participants.length ? 'emerald' : 'amber'}>
            {ratedCount} / {participants.length}
          </Badge>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          قيّم كل لاعب شارك في المباراة من 0 إلى 10. يمكنك إضافة ملاحظات فنية.
        </p>

        <div className="space-y-3">
          {participants.map((p) => {
            const r = ratings[p.id] || { rating: '', notes: '' };
            return (
              <div
                key={p.id}
                className={`p-4 rounded-lg border transition ${
                  r.rating !== '' && r.rating != null
                    ? getRatingBg(r.rating)
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User size={18} className="text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {p.full_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color="blue" size="sm">
                        {getPositionLabel(p.position)}
                      </Badge>
                      {p.lineup_type === 'substitute' && (
                        <Badge color="amber" size="sm">
                          احتياطي
                        </Badge>
                      )}
                      {p._escalated && (
                        <Badge color="amber" size="sm">
                          ⚡ مصعّد
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* التقييم */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={r.rating}
                      disabled={disabled}
                      onChange={(e) =>
                        updateRating(p.id, 'rating', e.target.value)
                      }
                      placeholder="—"
                      className={`w-20 text-center text-2xl font-bold rounded-lg border-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        r.rating !== '' && r.rating != null
                          ? getRatingColor(r.rating) + ' border-current'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    />
                    <span className="text-lg font-bold text-slate-400">/10</span>
                  </div>
                </div>

                {/* ملاحظات */}
                <textarea
                  rows={2}
                  value={r.notes}
                  disabled={disabled}
                  onChange={(e) =>
                    updateRating(p.id, 'notes', e.target.value)
                  }
                  placeholder="ملاحظات فنية عن أداء اللاعب..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
                />
              </div>
            );
          })}
        </div>

        {!disabled && (
          <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
            <Button onClick={handleSave} loading={saving}>
              <Save size={16} /> حفظ التقييمات
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}