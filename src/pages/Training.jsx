import { useEffect, useState } from 'react';
import {
  Dumbbell, Plus, Calendar, MapPin, Clock, Users, Edit, Trash2,
  CheckCircle, XCircle, ClipboardCheck,
} from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useTeams } from '../hooks/useTeams';
import { useAuth } from '../context/AuthContext';
import { useSector } from '../context/SectorContext';
import { isAdmin, isTeamAdmin } from '../utils/permissions';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import EventForm from '../components/events/EventForm';
import AttendanceForm from '../components/events/AttendanceForm';
import {
  TRAINING_TYPES, EVENT_STATUS,
  getTrainingTypeLabel, getEventStatusLabel,
} from '../utils/constants';
import { formatDate } from '../utils/formatters';

export default function Training() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const teamAdmin = isTeamAdmin(profile);
  const canManage = admin || teamAdmin;
  const { selectedSector } = useSector();
  const { teams } = useTeams();

  const [filterTeam, setFilterTeam] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const {
    events,
    loading,
    createEvent,
    updateEvent,
    removeEvent,
    saveAttendance,
  } = useEvents({
    teamId: filterTeam || undefined,
    eventType: 'training',
    status: filterStatus || undefined,
    from: filterFrom || undefined,
    to: filterTo || undefined,
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceEvent, setAttendanceEvent] = useState(null);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      const selectedTeam = teams.find((t) => t.id === data.team_id);
      const payload = {
        ...data,
        event_type: 'training',
        sector_id: selectedTeam?.sector_id || null,
      };

      if (editing) {
        await updateEvent(editing.id, payload);
      } else {
        await createEvent(payload);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAttendance = (ev) => {
    setAttendanceEvent(ev);
    setShowAttendance(true);
  };

  const handleSaveAttendance = async (list) => {
    setSaving(true);
    try {
      await saveAttendance(attendanceEvent.id, list);
      setShowAttendance(false);
      setAttendanceEvent(null);
      alert('تم حفظ الحضور ✅');
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذه الحصة؟ سيتم حذف الحضور أيضاً.')) return;
    try {
      await removeEvent(id);
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const stats = {
    total: events.length,
    scheduled: events.filter((e) => e.status === 'scheduled').length,
    completed: events.filter((e) => e.status === 'completed').length,
    cancelled: events.filter((e) => e.status === 'cancelled').length,
  };

  const isToday = (date) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Dumbbell className="text-emerald-600" /> التدريبات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {events.length} حصة
            {selectedSector && ` • ${selectedSector.name}`}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} /> إضافة حصة
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card padding="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {stats.total}
          </p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">مجدولة</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.scheduled}
          </p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">مكتملة</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.completed}
          </p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">ملغاة</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {stats.cancelled}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select
          label="الفرقة"
            placeholder="كل الفرق"
            options={teams.map((t) => ({
              value: t.id,
              label: `${t.name} - ${t.category}`,
            }))}
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          />
          <Select
          label="الحالة"
            placeholder="كل الحالات"
            options={EVENT_STATUS}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
          <Input
            type="date"
            label="من تاريخ"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
          <Input
            type="date"
            label="إلى تاريخ"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <EmptyState
            icon={Dumbbell}
            title="لا توجد حصص تدريب"
            description={
              canManage
                ? 'ابدأ بإضافة أول حصة تدريب.'
                : 'لم تُضف أي حصص بعد.'
            }
            action={
              canManage ? (
                <Button onClick={() => setShowForm(true)}>
                  <Plus size={18} /> إضافة حصة
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const todaySession = isToday(ev.event_date);
            const attendanceCount = (ev.attendance || []).filter(
              (a) => a.status === 'present' || a.status === 'late'
            ).length;
            const totalAttendance = (ev.attendance || []).length;

            return (
              <Card
                key={ev.id}
                padding="p-4"
                className={todaySession ? 'ring-2 ring-emerald-400' : ''}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-3 rounded-xl shrink-0 ${
                        ev.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300'
                          : ev.status === 'cancelled'
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                      }`}
                    >
                      <Dumbbell size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">
                          {ev.title || getTrainingTypeLabel(ev.training_type)}
                        </h3>
                        {todaySession && (
                          <Badge color="emerald" size="sm">
                            النهاردة
                          </Badge>
                        )}
                        <Badge
                          color={
                            ev.status === 'completed'
                              ? 'emerald'
                              : ev.status === 'cancelled'
                              ? 'red'
                              : 'blue'
                          }
                          size="sm"
                        >
                          {getEventStatusLabel(ev.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {ev.teams?.name} •{' '}
                        {getTrainingTypeLabel(ev.training_type)}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {formatDate(ev.event_date)}
                        </span>
                        {ev.start_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {ev.start_time.slice(0, 5)}
                            {ev.duration_minutes &&
                              ` • ${ev.duration_minutes} د`}
                          </span>
                        )}
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {ev.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {canManage && (
                      <>
                        <button
                          onClick={() => openAttendance(ev)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                          title="تسجيل الحضور"
                        >
                          <ClipboardCheck size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditing(ev);
                            setShowForm(true);
                          }}
                          className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {totalAttendance > 0 && (
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={14} />
                      <span className="font-medium">
                        {attendanceCount} حاضر
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                      <XCircle size={14} />
                      <span className="font-medium">
                        {totalAttendance - attendanceCount} غايب
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Users size={14} />
                      <span>
                        نسبة الحضور:{' '}
                        {Math.round(
                          (attendanceCount / totalAttendance) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                )}

                {ev.notes && (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    📝 {ev.notes}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          title={editing ? 'تعديل الحصة' : 'إضافة حصة تدريب'}
          size="lg"
        >
          <EventForm
            event={editing}
            teams={teams}
            defaultType="training"
            allowedTypes={["training", "friendly" , "other"]} 
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            saving={saving}
          />
        </Modal>
      )}

      {/* Attendance Modal */}
      {showAttendance && attendanceEvent && (
        <Modal
          isOpen={showAttendance}
          onClose={() => {
            setShowAttendance(false);
            setAttendanceEvent(null);
          }}
          title="تسجيل حضور التدريب"
          size="xl"
        >
          <AttendanceForm
            session={attendanceEvent}
            onSave={handleSaveAttendance}
            onCancel={() => {
              setShowAttendance(false);
              setAttendanceEvent(null);
            }}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}