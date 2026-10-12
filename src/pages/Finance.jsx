import { useState } from 'react';
import { DollarSign, Search, Plus, Download, ArrowUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useFinance } from '../hooks/useFinance';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { useSector } from '../context/SectorContext';
import { isAdmin } from '../utils/permissions';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import InstallmentTable, { FinanceSummary } from '../components/finance/InstallmentTable';
import { PAYMENT_STATUS } from '../utils/constants';

const SORT_OPTIONS = [
  { value: 'due_asc', label: 'الاستحقاق: الأقرب أولاً' },
  { value: 'due_desc', label: 'الاستحقاق: الأبعد أولاً' },
  { value: 'amount_asc', label: 'المبلغ: الأقل أولاً' },
  { value: 'amount_desc', label: 'المبلغ: الأعلى أولاً' },
  { value: 'status', label: 'الحالة (غير مسدد أولاً)' },
];

export default function Finance() {
  const { profile } = useAuth();
  const { selectedSector } = useSector();
  const admin = isAdmin(profile);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('due_asc');
  const [showForm, setShowForm] = useState(false);

  const {
    installments,
    summary,
    loading,
    createInstallment,
    markAsPaid,
    removeInstallment,
  } = useFinance({ status: statusFilter || undefined });

  const { players } = usePlayers();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const filtered = installments.filter((i) => {
    if (!search) return true;
    const name = i.players?.full_name || '';
    const nid = i.players?.national_id || '';
    return name.includes(search) || nid.includes(search);
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'due_asc':
        return (a.due_date || '').localeCompare(b.due_date || '');
      case 'due_desc':
        return (b.due_date || '').localeCompare(a.due_date || '');
      case 'amount_asc':
        return Number(a.amount || 0) - Number(b.amount || 0);
      case 'amount_desc':
        return Number(b.amount || 0) - Number(a.amount || 0);
      case 'status': {
        const order = { unpaid: 1, pending: 2, paid: 3 };
        return (order[a.status] || 4) - (order[b.status] || 4);
      }
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSortBy('due_asc');
  };

  const hasFilters = search || statusFilter || sortBy !== 'due_asc';

  const openCreate = () => {
    reset({ player_id: '', amount: '', due_date: '', notes: '' });
    setShowForm(true);
  };

  const onSubmit = async (data) => {
    try {
      await createInstallment({
        player_id: data.player_id,
        amount: Number(data.amount),
        due_date: data.due_date,
        notes: data.notes?.trim() || null,
        status: 'unpaid',
      });
      setShowForm(false);
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['اللاعب', 'الرقم القومي', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة'];
    const rows = sorted.map((i) => [
      i.players?.full_name || '',
      i.players?.national_id || '',
      i.amount,
      i.due_date,
      i.status === 'paid' ? 'مسدد' : i.status === 'unpaid' ? 'غير مسدد' : 'قيد الانتظار',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `installments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الإدارة المالية</h1>
          <p className="text-sm text-slate-500 mt-1">
            {admin
              ? 'متابعة الأقساط والمستحقات المالية'
              : 'عرض الأقساط والمستحقات المالية (قراءة فقط)'}
            {selectedSector && ` • ${selectedSector.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download size={16} /> تصدير CSV
          </Button>
          {admin && (
            <Button onClick={openCreate}>
              <Plus size={18} /> إضافة قسط
            </Button>
          )}
        </div>
      </div>

      {!admin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm p-3 rounded-lg">
          ℹ️ <strong>وضع العرض.</strong> أنت ترى أقساط فرقك فقط. إدارة الأقساط
          (إضافة/تعديل/حذف) من مسؤولية المدير الإداري.
        </div>
      )}

      <FinanceSummary summary={summary} />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="بحث بالاسم أو الرقم القومي..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="كل الحالات"
            options={PAYMENT_STATUS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            placeholder="ترتيب حسب"
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <ArrowUpDown size={14} />
            النتائج: <strong>{sorted.length}</strong> قسط
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              ✕ إعادة الضبط
            </button>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="جدول الأقساط" subtitle={`${sorted.length} قسط`} />
        {sorted.length === 0 && !loading ? (
          <EmptyState
            icon={DollarSign}
            title={hasFilters ? 'لا توجد نتائج' : 'لا توجد أقساط'}
            description={
              hasFilters
                ? 'جرّب تغيير البحث أو الفلاتر.'
                : admin
                ? 'ابدأ بإضافة أول قسط للاعب.'
                : 'لم تُضف أي أقساط بعد.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  إعادة الضبط
                </Button>
              ) : admin ? (
                <Button onClick={openCreate}>
                  <Plus size={18} /> إضافة قسط
                </Button>
              ) : null
            }
          />
        ) : (
          <InstallmentTable
            installments={sorted}
            loading={loading}
            onMarkPaid={admin ? markAsPaid : undefined}
            onRemove={admin ? removeInstallment : undefined}
            canEdit={admin}
            showPlayer
          />
        )}
      </Card>

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="إضافة قسط جديد"
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Select
              label="اللاعب"
              required
              options={players.map((p) => ({
                value: p.id,
                label: `${p.full_name} - ${p.teams?.name || 'بدون فريق'}`,
              }))}
              error={errors.player_id?.message}
              {...register('player_id', { required: 'اللاعب مطلوب' })}
            />
            <Input
              type="number"
              label="المبلغ (ج.م)"
              required
              min={0}
              step={100}
              error={errors.amount?.message}
              {...register('amount', { required: 'المبلغ مطلوب' })}
            />
            <Input
              type="date"
              label="تاريخ الاستحقاق"
              required
              error={errors.due_date?.message}
              {...register('due_date', { required: 'التاريخ مطلوب' })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ملاحظات (اختياري)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                {...register('notes')}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                إلغاء
              </Button>
              <Button type="submit">حفظ</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}