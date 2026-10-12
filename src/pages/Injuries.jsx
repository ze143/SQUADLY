import { useState } from 'react';
import {
  HeartPulse, Plus, Calendar, User, Edit, Trash2,
  CheckCircle, AlertTriangle, Clock, Stethoscope,
} from 'lucide-react';
import { useInjuries } from '../hooks/useInjuries';
import { usePlayers } from '../hooks/usePlayers';
import { useTeams } from '../hooks/useTeams';
import { useAuth } from '../context/AuthContext';
import { useSector } from '../context/SectorContext';
import { isAdmin, isTeamAdmin } from '../utils/permissions';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/reports/StatCard';
import InjuryForm from '../components/injuries/InjuryForm';
import {
  INJURY_STATUS, INJURY_SEVERITY, INJURY_TYPES,
  getInjuryTypeLabel, getInjuryTypeIcon,
  getInjurySeverityLabel, getInjurySeverityColor,
  getBodyPartLabel, getInjuryCauseLabel,
  getInjuryStatusLabel, getInjuryStatusColor,
} from '../utils/constants';
import { formatDate } from '../utils/formatters';

export default function Injuries() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const teamAdmin = isTeamAdmin(profile);
  const canManage = admin || teamAdmin;
  const { selectedSector } = useSector();
  const { teams } = useTeams();
  const { players } = usePlayers();

  const [filterTeam, setFilterTeam] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [search, setSearch] = useState('');

  const { injuries, loading, createInjury, updateInjury, removeInjury, markRecovered } =
    useInjuries({
      teamId: filterTeam || undefined,
      status: filterStatus || undefined,
    });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      const player = players.find((p) => p.id === data.player_id);
      const payload = {
        ...data,
        team_id: player?.team_id || null,
        sector_id: player?.teams?.sector_id || null,
      };

      if (editing) {
        await updateInjury(editing.id, payload);
      } else {
        await createInjury(payload);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذه الإصابة؟')) return;
    try {
      await removeInjury(id);
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleRecover = async (id) => {
    if (!confirm('تأكيد تعافي اللاعب؟')) return;
    try {
      await markRecovered(id);
      alert('تم تسجيل التعافي ✅');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  // ===== فلترة =====
  const filtered = injuries.filter((inj) => {
    if (!search) return true;
    const name = inj.players?.full_name || '';
    return name.includes(search);
  }).filter((inj) =>
    !filterSeverity ? true : inj.severity === filterSeverity
  );

  // ===== إحصائيات =====
  const stats = {
    total: injuries.length,
    active: injuries.filter((i) => i.status === 'active').length,
    minor: injuries.filter((i) => i.severity === 'minor' && i.status === 'active').length,
    severe: injuries.filter((i) => i.severity === 'severe' && i.status === 'active').length,
  };

  // ===== حساب الأيام =====
  const getDaysOut = (inj) => {
    const start = new Date(inj.injury_date);
    const end = inj.actual_return_date
      ? new Date(inj.actual_return_date)
      : new Date();
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <HeartPulse className="text-red-600" /> إدارة الإصابات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {filtered.length} إصابة
            {selectedSector && ` • ${selectedSector.name}`}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} /> تسجيل إصابة
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={HeartPulse} label="إجمالي" value={stats.total} color="slate" />
        <StatCard icon={AlertTriangle} label="نشطة" value={stats.active} color="red" />
        <StatCard icon={Clock} label="خفيفة" value={stats.minor} color="amber" />
        <StatCard icon={AlertTriangle} label="شديدة" value={stats.severe} color="red" />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="بحث باسم اللاعب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="كل الفرق"
            options={teams.map((t) => ({
              value: t.id,
              label: `${t.name} - ${t.category}`,
            }))}
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          />
          <Select
            placeholder="كل الحالات"
            options={INJURY_STATUS}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
          <Select
            placeholder="كل الشدائد"
            options={INJURY_SEVERITY}
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          />
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={HeartPulse}
            title="لا توجد إصابات"
            description={
              canManage
                ? 'ابدأ بتسجيل أول إصابة.'
                : 'لا توجد إصابات مطابقة للفلتر.'
            }
            action={
              canManage ? (
                <Button onClick={() => setShowForm(true)}>
                  <Plus size={18} /> تسجيل إصابة
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inj) => {
            const daysOut = getDaysOut(inj);
            const isActive = inj.status === 'active';

            return (
              <Card
                key={inj.id}
                padding="p-4"
                className={
                  isActive
                    ? 'border-r-4 border-r-red-500'
                    : 'border-r-4 border-r-emerald-500'
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-3 rounded-xl shrink-0 text-2xl ${
                        isActive
                          ? 'bg-red-100 dark:bg-red-900/40'
                          : 'bg-emerald-100 dark:bg-emerald-900/40'
                      }`}
                    >
                      {getInjuryTypeIcon(inj.injury_type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">
                          {inj.players?.full_name || 'لاعب محذوف'}
                        </h3>
                        <Badge
                          color={getInjurySeverityColor(inj.severity)}
                          size="sm"
                        >
                          {getInjurySeverityLabel(inj.severity)}
                        </Badge>
                        <Badge
                          color={getInjuryStatusColor(inj.status)}
                          size="sm"
                        >
                          {getInjuryStatusLabel(inj.status)}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {inj.players?.teams?.name} •{' '}
                        {getInjuryTypeLabel(inj.injury_type)}
                        {inj.body_part && ` • ${getBodyPartLabel(inj.body_part)}`}
                      </p>

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> إصابة:{' '}
                          {formatDate(inj.injury_date)}
                        </span>
                        {inj.expected_return_date && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> عودة متوقعة:{' '}
                            {formatDate(inj.expected_return_date)}
                          </span>
                        )}
                        {inj.actual_return_date && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={12} /> عاد:{' '}
                            {formatDate(inj.actual_return_date)}
                          </span>
                        )}
                        {isActive && (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                            <AlertTriangle size={12} /> منذ {daysOut} يوم
                          </span>
                        )}
                      </div>

                      {inj.cause && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          السبب: {getInjuryCauseLabel(inj.cause)}
                        </p>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex gap-1 shrink-0">
                      {isActive && (
                        <button
                          onClick={() => handleRecover(inj.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                          title="تسجيل التعافي"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditing(inj);
                          setShowForm(true);
                        }}
                        className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(inj.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {inj.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg mt-2">
                    {inj.description}
                  </p>
                )}

                {inj.treatment && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Stethoscope size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                    <span>العلاج: {inj.treatment}</span>
                  </div>
                )}

                {inj.doctor_name && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    👨‍⚕️ الطبيب: {inj.doctor_name}
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
          title={editing ? 'تعديل الإصابة' : 'تسجيل إصابة جديدة'}
          size="lg"
        >
          <InjuryForm
            injury={editing}
            players={players}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}