import { useEffect, useState } from 'react';
import { Save, X, Users, Check, Search } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { supabase } from '../../lib/supabase';
import { ATTENDANCE_STATUS, getPositionLabel } from '../../utils/constants';

export default function AttendanceForm({
  session,
  onSave,
  onCancel,
  saving = false,
}) {
  const [players, setPlayers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ===== تحميل اللاعبين + الحضور الحالي =====
  useEffect(() => {
    if (!session?.team_id) return;

    const load = async () => {
      setLoading(true);
      try {
        const [playersRes, attendanceRes] = await Promise.all([
          supabase
            .from('players')
            .select('id, full_name, position, is_active')
            .eq('team_id', session.team_id)
            .order('full_name'),
          supabase
            .from('event_attendance')
            .select('player_id, status, notes')
            .eq('event_id', session.id),
        ]);

        setPlayers(playersRes.data || []);

        // بناء map للحضور
        const map = {};
        (attendanceRes.data || []).forEach((a) => {
          map[a.player_id] = {
            status: a.status,
            notes: a.notes || '',
          };
        });
        setAttendance(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session]);

  // ===== تعيين حالة لاعب =====
  const setStatus = (playerId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        status,
      },
    }));
  };

  // ===== تعيين كل اللاعبين لحالة معينة =====
  const setAllStatus = (status) => {
    const newAtt = {};
    players.forEach((p) => {
      newAtt[p.id] = { ...attendance[p.id], status };
    });
    setAttendance(newAtt);
  };

  const handleSave = () => {
    const list = players
      .filter((p) => attendance[p.id]?.status)
      .map((p) => ({
        player_id: p.id,
        status: attendance[p.id].status,
        notes: attendance[p.id].notes || null,
      }));

    if (list.length === 0) {
      return alert('يرجى تسجيل حضور لاعب واحد على الأقل');
    }

    onSave(list);
  };

  const filtered = players.filter((p) =>
    !search ? true : p.full_name?.includes(search)
  );

  // إحصائيات سريعة
  const stats = Object.values(attendance).reduce(
    (acc, a) => {
      acc.total++;
      if (a.status === 'present') acc.present++;
      else if (a.status === 'absent') acc.absent++;
      else if (a.status === 'late') acc.late++;
      else if (a.status === 'excused') acc.excused++;
      else if (a.status === 'injured') acc.injured++;
      return acc;
    },
    { total: 0, present: 0, absent: 0, late: 0, excused: 0, injured: 0 }
  );

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Session Info */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
        <p className="text-xs text-slate-500 dark:text-slate-400">الحصة</p>
        <p className="font-bold text-slate-800 dark:text-slate-100">
          {session.title || `${session.session_date}`}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
  {session.event_date} • {session.start_time?.slice(0, 5) || '-'} •{' '}
  {session.duration_minutes} دقيقة
</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          تعيين الكل:
        </span>
        {ATTENDANCE_STATUS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setAllStatus(s.value)}
            className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
          <p className="text-slate-500 dark:text-slate-400">إجمالي</p>
          <p className="font-bold text-slate-800 dark:text-slate-100">
            {stats.total}
          </p>
        </div>
        {ATTENDANCE_STATUS.map((s) => (
          <div
            key={s.value}
            className={`p-2 rounded-lg bg-${s.color}-50 dark:bg-${s.color}-900/20`}
          >
            <p className="text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className={`font-bold text-${s.color}-700 dark:text-${s.color}-300`}>
              {stats[s.value] || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="ابحث عن لاعب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Players List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filtered.map((p) => {
          const currentStatus = attendance[p.id]?.status;
          return (
            <div
              key={p.id}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">
                    {p.full_name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {getPositionLabel(p.position)}
                    {p.is_active === false && ' • غير نشط'}
                  </p>
                </div>
                {currentStatus && (
                  <Badge
                    color={
                      ATTENDANCE_STATUS.find((s) => s.value === currentStatus)
                        ?.color || 'slate'
                    }
                    size="sm"
                  >
                    {ATTENDANCE_STATUS.find((s) => s.value === currentStatus)
                      ?.emoji}{' '}
                    {ATTENDANCE_STATUS.find((s) => s.value === currentStatus)
                      ?.label}
                  </Badge>
                )}
              </div>

              {/* Status Buttons */}
              <div className="grid grid-cols-5 gap-1">
                {ATTENDANCE_STATUS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(p.id, s.value)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition ${
                      currentStatus === s.value
                        ? `bg-${s.color}-500 text-white ring-2 ring-${s.color}-300`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.emoji}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-6 text-sm">
            لا يوجد لاعبون
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={saving}
          >
            <X size={16} /> إلغاء
          </Button>
        )}
        <Button onClick={handleSave} loading={saving}>
          <Save size={16} /> حفظ الحضور
        </Button>
      </div>
    </div>
  );
}