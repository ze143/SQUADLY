import { useState, useEffect } from 'react';
import {
  Plus, Shield, Users, Edit, Trash2, ChevronDown, ChevronLeft,
  Layers, FolderTree,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTeams } from '../hooks/useTeams';
import { useAuth } from '../context/AuthContext';
import { isAdmin as checkIsAdmin } from '../utils/permissions';
import { supabase } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const GROUP_OPTIONS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

export default function Teams() {
  const { profile } = useAuth();
  const admin = checkIsAdmin(profile);
  const { teams, loading, createTeam, updateTeam, removeTeam, refetch } = useTeams();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [parentTeam, setParentTeam] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [playerCounts, setPlayerCounts] = useState({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // ===== تحميل عدد اللاعبين لكل فريق =====
  useEffect(() => {
    if (!teams.length) return;
    const loadCounts = async () => {
      const counts = {};
      await Promise.all(
        teams.map(async (t) => {
          const { count } = await supabase
            .from('players')
            .select('id', { count: 'exact', head: true })
            .eq('team_id', t.id);
          counts[t.id] = count || 0;
        })
      );
      setPlayerCounts(counts);
    };
    loadCounts();
  }, [teams]);

  // ===== تصنيف الفرق =====
  const parentTeams = teams.filter((t) => !t.parent_team_id);
  const getChildren = (parentId) =>
    teams.filter((t) => t.parent_team_id === parentId);

  // ===== فتح/طي =====
  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ===== فتح نموذج الإضافة =====
  const openCreate = (parent = null) => {
    setEditing(null);
    setParentTeam(parent);

    if (parent) {
      // إضافة مجموعة لفريق
      reset({
        name: '',
        category: parent.category,
        birth_year: parent.birth_year,
        age_group: parent.age_group || '',
        parent_team_id: parent.id,
        group_label: '',
      });
    } else {
      // إضافة فريق أم جديد
      reset({
        name: '',
        category: '',
        birth_year: '',
        age_group: '',
        parent_team_id: '',
        group_label: '',
      });
    }
    setShowForm(true);
  };

  const openEdit = (team) => {
    setEditing(team);
    setParentTeam(null);
    reset({
      name: team.name,
      category: team.category,
      birth_year: team.birth_year,
      age_group: team.age_group || '',
      parent_team_id: team.parent_team_id || '',
      group_label: team.group_label || '',
    });
    setShowForm(true);
  };

  // ===== الحفظ =====
  const onSubmit = async (data) => {
    try {
      const isGroup = !!data.parent_team_id;

      const payload = {
        name: data.name.trim(),
        category: data.category.trim(),
        birth_year: Number(data.birth_year),
        age_group: data.age_group?.trim() || null,
        parent_team_id: data.parent_team_id || null,
        group_label: isGroup ? data.group_label : null,
      };

      if (editing) {
        await updateTeam(editing.id, payload);
      } else {
        await createTeam(payload);
      }

      setShowForm(false);
      setEditing(null);
      setParentTeam(null);
      await refetch();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    const children = getChildren(id);
    const msg = children.length > 0
      ? `حذف هذا الفريق؟ سيتم حذف ${children.length} مجموعة تابعة له أيضاً.`
      : 'حذف هذا الفريق؟';
    if (!confirm(msg)) return;

    try {
      await removeTeam(id);
      await refetch();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الفرق والقطاعات</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'جارٍ التحميل...' : `${parentTeams.length} فئة`}
          </p>
        </div>
        {admin && (
          <Button onClick={() => openCreate(null)}>
            <Plus size={18} /> إضافة فئة جديدة
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : parentTeams.length === 0 ? (
        <Card>
          <EmptyState
            icon={Shield}
            title="لا توجد فرق"
            description="ابدأ بإضافة أول فئة في النظام."
            action={
              admin ? (
                <Button onClick={() => openCreate(null)}>
                  <Plus size={18} /> إضافة فئة
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {parentTeams.map((parent) => {
            const children = getChildren(parent.id);
            const hasGroups = children.length > 0;
            const isExpanded = expanded[parent.id] !== false;

            // ===== عدد اللاعبين =====
            const totalPlayers = hasGroups
              ? children.reduce((sum, c) => sum + (playerCounts[c.id] || 0), 0)
              : playerCounts[parent.id] || 0;

            // =========================================================
            // كارت فريق بدون مجموعات (بسيط)
            // =========================================================
            if (!hasGroups) {
              return (
                <Card key={parent.id} hover padding="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                        <Shield size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 text-lg">
                          {parent.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {parent.category} • مواليد {parent.birth_year}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge color="blue" size="sm" icon={Users}>
                            {totalPlayers} لاعب
                          </Badge>
                          {parent.age_group && (
                            <Badge color="slate" size="sm">
                              {parent.age_group}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {admin && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => openCreate(parent)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="إضافة مجموعة"
                        >
                          <FolderTree size={16} />
                        </button>
                        <button
                          onClick={() => openEdit(parent)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(parent.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            }

            // =========================================================
            // كارت فريق مع مجموعات (هرمي)
            // =========================================================
            return (
              <Card key={parent.id} padding="p-0">
                {/* الفريق الأم */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleExpand(parent.id)}
                        className="p-1 hover:bg-slate-100 rounded shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronLeft size={18} className="rotate-180" />
                        )}
                      </button>
                      <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                        <Shield size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-lg">
                          {parent.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {parent.category} • مواليد {parent.birth_year}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge color="purple" size="sm" icon={Layers}>
                            {children.length} مجموعة
                          </Badge>
                          <Badge color="blue" size="sm" icon={Users}>
                            {totalPlayers} لاعب
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {admin && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => openCreate(parent)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="إضافة مجموعة"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => openEdit(parent)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(parent.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* المجموعات */}
                {isExpanded && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {children.map((child) => {
                      const count = playerCounts[child.id] || 0;

                      return (
                        <div
                          key={child.id}
                          className="p-3 rounded-lg border-2 border-slate-200 bg-slate-50 hover:border-emerald-300 transition"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 bg-blue-100 text-blue-700 text-lg">
                                {child.group_label}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 text-sm truncate">
                                  {child.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  مجموعة {child.group_label}
                                </p>
                              </div>
                            </div>

                            {admin && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => openEdit(child)}
                                  className="p-1 text-amber-600 hover:bg-amber-100 rounded"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => handleDelete(child.id)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                            <Users size={14} className="text-slate-500" />
                            <span className="text-sm text-slate-600">
                              {count} لاعب
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* زر إضافة مجموعة سريع */}
                    {admin && (
                      <button
                        onClick={() => openCreate(parent)}
                        className="p-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-2 min-h-[100px] text-slate-500 hover:text-emerald-600"
                      >
                        <Plus size={24} />
                        <span className="text-sm font-medium">إضافة مجموعة</span>
                      </button>
                    )}
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
            setParentTeam(null);
          }}
          title={
            editing
              ? 'تعديل الفريق'
              : parentTeam
              ? `إضافة مجموعة لـ ${parentTeam.name}`
              : 'إضافة فئة جديدة'
          }
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* لو بنضيف مجموعة */}
            {parentTeam && !editing && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">الفريق الأم</p>
                <p className="font-bold text-slate-800">{parentTeam.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {parentTeam.category} • مواليد {parentTeam.birth_year}
                </p>
              </div>
            )}

            <Input
              label="اسم الفريق / المجموعة"
              required
              placeholder={
                parentTeam
                  ? `مثال: ${parentTeam.category} - أ`
                  : 'مثال: مواليد 2013'
              }
              error={errors.name?.message}
              {...register('name', { required: 'الاسم مطلوب' })}
            />

            {/* حقول الفريق الأم */}
            {!parentTeam && (
              <>
                <Input
                  label="الفئة (مثال: مواليد 2013)"
                  required
                  error={errors.category?.message}
                  {...register('category', { required: 'الفئة مطلوبة' })}
                />
                <Input
                  type="number"
                  label="سنة المواليد"
                  required
                  error={errors.birth_year?.message}
                  {...register('birth_year', {
                    required: 'سنة المواليد مطلوبة',
                  })}
                />
                <Input
                  label="الفئة العمرية (اختياري)"
                  placeholder="مثال: تحت 15، براعم"
                  {...register('age_group')}
                />
              </>
            )}

            {/* حقل اسم المجموعة (لو بنضيف مجموعة) */}
            {(parentTeam || editing?.parent_team_id) && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  اسم المجموعة <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('group_label', {
                    required: parentTeam ? 'اسم المجموعة مطلوب' : false,
                  })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- اختر --</option>
                  {GROUP_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      مجموعة {g}
                    </option>
                  ))}
                </select>
                {errors.group_label && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.group_label.message}
                  </p>
                )}
              </div>
            )}

            {/* Hidden fields */}
            {parentTeam && (
              <>
                <input
                  type="hidden"
                  {...register('parent_team_id')}
                  value={parentTeam.id}
                />
                <input
                  type="hidden"
                  {...register('category')}
                  value={parentTeam.category}
                />
                <input
                  type="hidden"
                  {...register('birth_year')}
                  value={parentTeam.birth_year}
                />
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setParentTeam(null);
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