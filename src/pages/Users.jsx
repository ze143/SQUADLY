import { useEffect, useState } from 'react';
import { UserPlus, Edit, Trash2, UserCog, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { ROLE_LABELS, ROLES } from '../utils/constants';
import { validateEmail } from '../utils/validation';

const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: ROLE_LABELS.admin },
  { value: ROLES.TEAM_ADMIN, label: ROLE_LABELS.team_admin },
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [creatingAuth, setCreatingAuth] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const watchedRole = watch('role');

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select(`
        *,
        user_teams(team_id, teams(id, name, category))
      `)
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const loadTeams = async () => {
    const { data } = await supabase.from('teams').select('*').order('name');
    setTeams(data || []);
  };

  useEffect(() => {
    loadUsers();
    loadTeams();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setSelectedTeams([]);
    reset({
      full_name: '',
      email: '',
      phone: '',
      role: ROLES.TEAM_ADMIN,
      password: '',
    });
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setSelectedTeams((user.user_teams || []).map((ut) => ut.team_id));
    reset({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
    });
    setShowForm(true);
  };

  const handleSaveUserTeams = async (userId, teamIds) => {
    await supabase.from('user_teams').delete().eq('user_id', userId);
    if (teamIds.length > 0) {
      const records = teamIds.map((tid) => ({ user_id: userId, team_id: tid }));
      await supabase.from('user_teams').insert(records);
    }
  };

  const onSubmit = async (data) => {
    if (!validateEmail(data.email)) {
      alert('البريد الإلكتروني غير صحيح');
      return;
    }

    try {
      if (editing) {
        // تعديل مستخدم موجود
        const { error } = await supabase
          .from('users')
          .update({
            full_name: data.full_name.trim(),
            phone: data.phone?.trim() || null,
            role: data.role,
          })
          .eq('id', editing.id);
        if (error) throw error;

        await handleSaveUserTeams(editing.id, selectedTeams);
        await loadUsers();
        setShowForm(false);
      } else {
        // إنشاء مستخدم جديد عبر Edge Function
        if (!data.password || data.password.length < 6) {
          alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
          return;
        }

        setCreatingAuth(true);
        const { data: result, error } = await supabase.functions.invoke(
          'create-user',
          {
            body: {
              email: data.email.trim(),
              password: data.password,
              full_name: data.full_name.trim(),
              phone: data.phone?.trim() || null,
              role: data.role,
              team_ids: selectedTeams,
            },
          }
        );

        if (error) throw new Error(error.message || 'فشل إنشاء المستخدم');
        if (result?.error) throw new Error(result.error);

        await loadUsers();
        setShowForm(false);
      }
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setCreatingAuth(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`حذف المستخدم "${user.full_name}"؟`)) return;
    try {
      // حذف السجل من جدول users (الحساب في auth.users يبقى، يُحذف يدوياً إن أردت)
      const { error } = await supabase.from('users').delete().eq('id', user.id);
      if (error) throw error;
      await loadUsers();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const toggleTeam = (teamId) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  const filtered = users.filter(
    (u) =>
      u.full_name?.includes(search) ||
      u.email?.includes(search)
  );

  const columns = [
    {
      key: 'full_name',
      label: 'الاسم',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.full_name}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'الدور',
      render: (row) => (
        <Badge color={row.role === 'admin' ? 'purple' : 'blue'}>
          {ROLE_LABELS[row.role]}
        </Badge>
      ),
    },
    {
      key: 'teams',
      label: 'الفرق المسؤولة',
      render: (row) => {
        if (row.role === 'admin') {
          return <Badge color="purple">كل الفرق</Badge>;
        }
        const teamsList = row.user_teams || [];
        if (teamsList.length === 0) {
          return <span className="text-xs text-slate-400">لا توجد فرق</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {teamsList.slice(0, 3).map((ut) => (
              <Badge key={ut.team_id} color="emerald" size="sm">
                {ut.teams?.name}
              </Badge>
            ))}
            {teamsList.length > 3 && (
              <Badge color="slate" size="sm">+{teamsList.length - 3}</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'phone',
      label: 'الهاتف',
      render: (row) => (
        <span className="text-sm text-slate-600">{row.phone || '-'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (row) => (
        <div className="flex gap-1">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة المستخدمين</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'جارٍ التحميل...' : `إجمالي: ${users.length} مستخدم`}
          </p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus size={18} /> إضافة مستخدم
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="بحث بالاسم أو البريد..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="قائمة المستخدمين" />
        {filtered.length === 0 && !loading ? (
          <EmptyState
            icon={UserCog}
            title="لا يوجد مستخدمون"
            action={
              <Button onClick={openCreate}>
                <UserPlus size={18} /> إضافة مستخدم
              </Button>
            }
          />
        ) : (
          <Table columns={columns} data={filtered} loading={loading} />
        )}
      </Card>

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title={editing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="الاسم الكامل"
              required
              error={errors.full_name?.message}
              {...register('full_name', { required: 'الاسم مطلوب' })}
            />

            <Input
              type="email"
              label="البريد الإلكتروني"
              required
              disabled={!!editing}
              error={errors.email?.message}
              {...register('email', { required: 'البريد مطلوب' })}
            />

            {!editing && (
              <Input
                type="password"
                label="كلمة المرور"
                required
                placeholder="6 أحرف على الأقل"
                error={errors.password?.message}
                {...register('password', {
                  required: 'كلمة المرور مطلوبة',
                  minLength: { value: 6, message: '6 أحرف على الأقل' },
                })}
              />
            )}

            <Input
              label="رقم الهاتف (اختياري)"
              placeholder="01xxxxxxxxx"
              {...register('phone')}
            />

            <Select
              label="الدور"
              required
              options={ROLE_OPTIONS}
              error={errors.role?.message}
              {...register('role', { required: 'الدور مطلوب' })}
            />

            {watchedRole === ROLES.TEAM_ADMIN && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  الفرق المسؤولة
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                  {teams.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(t.id)}
                        onChange={() => toggleTeam(t.id)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="text-sm">
                        {t.name} - {t.category}
                      </span>
                    </label>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-3">
                      لا توجد فرق
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" loading={creatingAuth}>
                {editing ? 'تحديث' : 'إنشاء'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}