import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { TRAINING_TYPES, TRAINING_STATUS } from '../../utils/constants';

export default function TrainingForm({
  session = null,
  teams = [],
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = Boolean(session);

  const [form, setForm] = useState({
    team_id: session?.team_id || '',
    session_date: session?.session_date || new Date().toISOString().split('T')[0],
    start_time: session?.start_time || '17:00',
    duration_minutes: session?.duration_minutes || 90,
    location: session?.location || '',
    session_type: session?.session_type || 'tactical',
    title: session?.title || '',
    notes: session?.notes || '',
    status: session?.status || 'scheduled',
  });

  useEffect(() => {
    if (session) {
      setForm({
        team_id: session.team_id || '',
        session_date: session.session_date || '',
        start_time: session.start_time || '17:00',
        duration_minutes: session.duration_minutes || 90,
        location: session.location || '',
        session_type: session.session_type || 'tactical',
        title: session.title || '',
        notes: session.notes || '',
        status: session.status || 'scheduled',
      });
    }
  }, [session]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.team_id) return alert('يرجى اختيار الفريق');
    if (!form.session_date) return alert('يرجى اختيار التاريخ');

    onSubmit({
      ...form,
      duration_minutes: Number(form.duration_minutes) || 90,
      start_time: form.start_time || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* الفريق (مش بيظهر في التعديل) */}
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            الفريق <span className="text-red-500">*</span>
          </label>
          <select
            value={form.team_id}
            onChange={(e) => setForm({ ...form, team_id: e.target.value })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          >
            <option value="">-- اختر الفريق --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} - {t.category}
              </option>
            ))}
          </select>
        </div>
      )}

      <Input
        label="عنوان الحصة (اختياري)"
        placeholder="مثال: تدريب تكتيكي للمباراة القادمة"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="التاريخ"
          required
          value={form.session_date}
          onChange={(e) => setForm({ ...form, session_date: e.target.value })}
        />

        <Input
          type="time"
          label="وقت البداية"
          value={form.start_time}
          onChange={(e) => setForm({ ...form, start_time: e.target.value })}
        />

        <Input
          type="number"
          label="المدة (دقيقة)"
          min={15}
          step={15}
          value={form.duration_minutes}
          onChange={(e) =>
            setForm({ ...form, duration_minutes: e.target.value })
          }
        />

        <Select
          label="نوع التدريب"
          options={TRAINING_TYPES}
          value={form.session_type}
          onChange={(e) => setForm({ ...form, session_type: e.target.value })}
        />

        <Input
          label="المكان"
          placeholder="مثال: ملعب النادي"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <Select
          label="الحالة"
          options={TRAINING_STATUS}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          ملاحظات
        </label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="أي ملاحظات عن الحصة..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
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
        <Button type="submit" loading={saving}>
          <Save size={16} /> {isEdit ? 'تحديث' : 'حفظ'}
        </Button>
      </div>
    </form>
  );
}