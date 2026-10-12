import { useEffect, useState } from 'react';
import {
  Plus, Layers, Edit, Trash2, Users, Shield, AlertCircle,
  Power, PowerOff,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useSectors } from '../hooks/useSectors';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/permissions';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { supabase } from '../lib/supabase';

const COLOR_OPTIONS = [
  { value: 'emerald', label: 'أخضر (ناشئين)' },
  { value: 'blue', label: 'أزرق (براعم)' },
  { value: 'purple', label: 'بنفسجي' },
  { value: 'amber', label: 'برتقالي' },
  { value: 'red', label: 'أحمر' },
];

export default function Sectors() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const {
    sectors,
    loading,
    createSector,
    updateSector,
    removeSector,
    toggleActive,
  } = useSectors();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sectorStats, setSectorStats] = useState({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // ===== تحميل الإحصائيات =====
  useEffect(() => {
    if (!sectors.length) return;

    const loadStats = async () => {
      const stats = {};
      await Promise.all(
        sectors.map(async (s) => {
          const teamsRes = await supabase
            .from('teams')
            .select('id', { count: 'exact', head: true })
            .eq('sector_id', s.id);

          const playersRes = await supabase
            .from('players')
            .select('id, teams!inner(sector_id)', {
              count: 'exact',
              head: true,
            })
            .eq('teams.sector_id', s.id);

          const { data: sectorTeams } = await supabase
            .from('teams')
            .select('id')
            .eq('sector_id', s.id);

          const teamIds = (sectorTeams || []).map((t) => t.id);

          let adminsCount = 0;
          if (teamIds.length > 0) {
            const { data: userTeamsData } = await supabase
              .from('user_teams')
              .select('user_id')
              .in('team_id', teamIds);

            const uniqueUsers = new Set(
              (userTeamsData || []).map((ut) => ut.user_id)
            );
            adminsCount = uniqueUsers.size;
          }

          stats[s.id] = {
            teams: teamsRes.count || 0,
            players: playersRes.count || 0,
            admins: adminsCount,
          };
        })
      );
      setSectorStats(stats);
    };
    loadStats();
  }, [sectors]);

  const openCreate = () => {
    setEditing(null);
    reset({
      name: '',
      code: '',
      description: '',
      color: 'emerald',
    });
    setShowForm(true);
  };

  const openEdit = (sector) => {
    setEditing(sector);
    reset({
      name: sector.name,
      code: sector.code,
      description: sector.description || '',
      color: sector.color || 'emerald',
    });
    setShowForm(true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toLowerCase().replace(/\s+/g, '_'),
        description: data.description?.trim() || null,
        color: data.color,
      };

      if (editing) {
        await updateSector(editing.id, payload);
      } else {
        await createSector(payload);
      }

      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleToggleActive = async (sector) => {
    const newStatus = !sector.is_active;
    const action = newStatus ? 'تنشيط' : 'تعطيل';
    if (!confirm(`هل تريد ${action} قطاع "${sector.name}"؟`)) return;

    try {
      await toggleActive(sector.id, newStatus);
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا القطاع؟ لا يمكن الحذف لو فيه فرق مرتبطة.')) return;
    try {
      await removeSector(id);
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const getColorClasses = (color) => {
    const map = {
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
      red: { bg: 'bg-red-100', text: 'text-red-700' },
    };
    return map[color] || map.emerald;
  };

  if (!admin) {
    return (
      <Card>
        <EmptyState
          icon={Shield}
          title="صلاحيات غير كافية"
          description="هذه الصفحة مخصصة للمدير الإداري فقط."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-emerald-600" /> إدارة القطاعات
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'جارٍ التحميل...' : `${sectors.length} قطاع`}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} /> إضافة قطاع
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : sectors.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="لا توجد قطاعات"
            description="ابدأ بإضافة أول قطاع."
            action={
              <Button onClick={openCreate}>
                <Plus size={18} /> إضافة قطاع
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectors.map((sector) => {
            const c = getColorClasses(sector.color);
            const stats = sectorStats[sector.id] || {
              teams: 0,
              players: 0,
              admins: 0,
            };

            return (
              <Card
                key={sector.id}
                padding="p-5"
                hover
                className={!sector.is_active ? 'opacity-60 bg-slate-50' : ''}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-3 rounded-xl shrink-0 ${
                        sector.is_active
                          ? `${c.bg} ${c.text}`
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Layers size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-lg">
                        {sector.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {sector.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleActive(sector)}
                      className={`p-2 rounded-lg ${
                        sector.is_active
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={
                        sector.is_active ? 'تعطيل القطاع' : 'تنشيط القطاع'
                      }
                    >
                      {sector.is_active ? (
                        <PowerOff size={16} />
                      ) : (
                        <Power size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(sector)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                      title="تعديل"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(sector.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {sector.description && (
                  <p className="text-sm text-slate-600 mb-4">
                    {sector.description}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">
                      {stats.teams}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1">
                      <Shield size={12} /> فرق
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">
                      {stats.players}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1">
                      <Users size={12} /> لاعبين
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">
                      {stats.admins}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1">
                      <Users size={12} /> إداريين
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Badge color={sector.is_active ? 'emerald' : 'slate'}>
                    {sector.is_active ? 'نشط' : 'معطّل'}
                  </Badge>
                </div>
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
          title={editing ? 'تعديل القطاع' : 'إضافة قطاع جديد'}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="اسم القطاع"
              required
              placeholder="مثال: الناشئين، البراعم"
              error={errors.name?.message}
              {...register('name', { required: 'الاسم مطلوب' })}
            />

            <Input
              label="الكود (بالإنجليزي)"
              required
              placeholder="مثال: youth, juniors"
              disabled={!!editing}
              error={errors.code?.message}
              {...register('code', {
                required: 'الكود مطلوب',
                pattern: {
                  value: /^[a-z_]+$/,
                  message: 'حروف إنجليزية صغيرة فقط (a-z، _)',
                },
              })}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                الوصف (اختياري)
              </label>
              <textarea
                rows={2}
                placeholder="مثال: مواليد 2003-2011"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                {...register('description')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                اللون
              </label>
              <select
                {...register('color')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {editing && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div>
                  تغيير كود القطاع قد يأثر على الروابط والفلاتر. خليك حريص.
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                إلغاء
              </Button>
              <Button type="submit">{editing ? 'تحديث' : 'حفظ'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}