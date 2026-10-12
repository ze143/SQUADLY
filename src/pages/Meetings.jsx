import { useState } from "react";
import {
  Users,
  Plus,
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
  FileText,
  CheckSquare,
  UserCheck,
} from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import { useTeams } from "../hooks/useTeams";
import { useAuth } from "../context/AuthContext";
import { useSector } from "../context/SectorContext";
import { isAdmin, isTeamAdmin } from "../utils/permissions";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import EventForm from "../components/events/EventForm";
import AttendanceForm from "../components/events/AttendanceForm";
import {
  EVENT_STATUS,
  ATTENDEES_TYPES,
  getMeetingTypeLabel,
  getEventStatusLabel,
} from "../utils/constants";
import { formatDate } from "../utils/formatters";

const MEETING_COLORS = {
  administrative: "purple",
  technical: "blue",
  urgent: "red",
  regular: "slate",
  board: "amber",
};

export default function Meetings() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const teamAdmin = isTeamAdmin(profile);
  const canManage = admin || teamAdmin;
  const { selectedSector } = useSector();
  const { teams } = useTeams();

  const [filterTeam, setFilterTeam] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const {
    events,
    loading,
    createEvent,
    updateEvent,
    removeEvent,
    saveAttendance,
  } = useEvents({
    teamId: filterTeam || undefined,
    eventType: "meeting",
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
        event_type: "meeting",
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
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAttendance = async (list) => {
    setSaving(true);
    try {
      await saveAttendance(attendanceEvent.id, list);
      setShowAttendance(false);
      setAttendanceEvent(null);
      alert("تم حفظ الحضور ✅");
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("حذف هذا الاجتماع؟")) return;
    try {
      await removeEvent(id);
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  const stats = {
    total: events.length,
    scheduled: events.filter((e) => e.status === "scheduled").length,
    completed: events.filter((e) => e.status === "completed").length,
    cancelled: events.filter((e) => e.status === "cancelled").length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="text-purple-600" /> الاجتماعات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {events.length} اجتماع
            {selectedSector && ` • ${selectedSector.name}`}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} /> إضافة اجتماع
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
            icon={Users}
            title="لا توجد اجتماعات"
            description={
              canManage ? "ابدأ بإضافة أول اجتماع." : "لم تُضف أي اجتماعات بعد."
            }
            action={
              canManage ? (
                <Button onClick={() => setShowForm(true)}>
                  <Plus size={18} /> إضافة اجتماع
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const color = MEETING_COLORS[ev.meeting_type] || "slate";
            return (
              <Card key={ev.id} padding="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-3 rounded-xl shrink-0 bg-${color}-100 dark:bg-${color}-900/40 text-${color}-600 dark:text-${color}-300`}
                    >
                      <Users size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">
                          {ev.title ||
                            `${getMeetingTypeLabel(ev.meeting_type)} اجتماع`}
                        </h3>
                        <Badge color={color} size="sm">
                          {getMeetingTypeLabel(ev.meeting_type)}
                        </Badge>
                        <Badge
                          color={
                            ev.status === "completed"
                              ? "emerald"
                              : ev.status === "cancelled"
                                ? "red"
                                : "blue"
                          }
                          size="sm"
                        >
                          {getEventStatusLabel(ev.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {ev.teams?.name}
                        {ev.attendees_type &&
                          ` • ${
                            ATTENDEES_TYPES.find(
                              (a) => a.value === ev.attendees_type,
                            )?.label
                          }`}
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
                          onClick={() => {
                            setAttendanceEvent(ev);
                            setShowAttendance(true);
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                          title="تسجيل الحضور"
                        >
                          <UserCheck size={16} />
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

                {ev.agenda && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                      <FileText size={12} /> جدول الأعمال
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">
                      {ev.agenda}
                    </p>
                  </div>
                )}

                {ev.decisions && (
                  <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
                      <CheckSquare size={12} /> القرارات
                    </p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-line">
                      {ev.decisions}
                    </p>
                  </div>
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
          title={editing ? "تعديل الاجتماع" : "إضافة اجتماع"}
          size="lg"
        >
          <EventForm
            event={editing}
            teams={teams}
            defaultType="meeting"
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
          title="تسجيل حضور الاجتماع"
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
