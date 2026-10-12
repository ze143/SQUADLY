import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import {
  EVENT_CATEGORIES, MEETING_TYPES, ATTENDEES_TYPES,
  TRAINING_TYPES, EVENT_STATUS,
} from '../../utils/constants';

export default function EventForm({
  event = null,
  teams = [],
  defaultType = 'training',
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = Boolean(event);

  const [form, setForm] = useState({
    team_id: event?.team_id || '',
    event_type: event?.event_type || defaultType,
    title: event?.title || '',
    event_date: event?.event_date || new Date().toISOString().split('T')[0],
    start_time: event?.start_time || '17:00',
    duration_minutes: event?.duration_minutes || 90,
    location: event?.location || '',
    training_type: event?.training_type || 'tactical',
    meeting_type: event?.meeting_type || 'administrative',
    attendees_type: event?.attendees_type || 'team',
    agenda: event?.agenda || '',
    notes: event?.notes || '',
    minutes: event?.minutes || '',
    decisions: event?.decisions || '',
    status: event?.status || 'scheduled',
  });

  useEffect(() => {
    if (event) {
      setForm({
        team_id: event.team_id || '',
        event_type: event.event_type || 'training',
        title: event.title || '',
        event_date: event.event_date || '',
        start_time: event.start_time || '17:00',
        duration_minutes: event.duration_minutes || 90,
        location: event.location || '',
        training_type: event.training_type || 'tactical',
        meeting_type: event.meeting_type || 'administrative',
        attendees_type: event.attendees_type || 'team',
        agenda: event.agenda || '',
        notes: event.notes || '',
        minutes: event.minutes || '',
        decisions: event.decisions || '',
        status: event.status || 'scheduled',
      });
    }
  }, [event]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.team_id) return alert('يرجى اختيار الفريق');
    if (!form.event_date) return alert('يرجى اختيار التاريخ');

    const payload = {
      ...form,
      duration_minutes: Number(form.duration_minutes) || 90,
      start_time: form.start_time || null,
    };

    // شيل الحقول مش المناسبة
    if (form.event_type !== 'training' && form.event_type !== 'friendly') {
      payload.training_type = null;
    }
    if (form.event_type !== 'meeting') {
      payload.meeting_type = null;
      payload.agenda = null;
      payload.minutes = null;
      payload.decisions = null;
    }

    onSubmit(payload);
  };

  const isMeeting = form.event_type === 'meeting';
  const isTraining = form.event_type === 'training' || form.event_type === 'friendly';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      {/* نوع الحدث */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          نوع الحدث <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {EVENT_CATEGORIES.map((c) => {
            const selected = form.event_type === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm({ ...form, event_type: c.value })}
                className={`p-3 rounded-lg border-2 transition text-center ${
                  selected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="text-2xl mb-1">{c.icon}</div>
                <p
                  className={`text-xs font-medium ${
                    selected
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {c.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

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
        label="العنوان (اختياري)"
        placeholder={
          isMeeting
            ? 'مثال: اجتماع إداري قبل المباراة'
            : 'مثال: تدريب تكتيكي'
        }
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="التاريخ"
          required
          value={form.event_date}
          onChange={(e) => setForm({ ...form, event_date: e.target.value })}
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

        <Input
          label="المكان"
          placeholder={isMeeting ? 'قاعة الاجتماعات' : 'ملعب النادي'}
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        {/* نوع التدريب */}
        {isTraining && (
          <Select
            label="نوع التدريب"
            options={TRAINING_TYPES}
            value={form.training_type}
            onChange={(e) =>
              setForm({ ...form, training_type: e.target.value })
            }
          />
        )}

        {/* نوع الاجتماع */}
        {isMeeting && (
          <>
            <Select
              label="نوع الاجتماع"
              options={MEETING_TYPES}
              value={form.meeting_type}
              onChange={(e) =>
                setForm({ ...form, meeting_type: e.target.value })
              }
            />
            <Select
              label="المدعوون"
              options={ATTENDEES_TYPES}
              value={form.attendees_type}
              onChange={(e) =>
                setForm({ ...form, attendees_type: e.target.value })
              }
            />
          </>
        )}

        <Select
          label="الحالة"
          options={EVENT_STATUS}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        />
      </div>

      {/* Agenda (للاجتماعات) */}
      {isMeeting && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            جدول الأعمال
          </label>
          <textarea
            rows={3}
            value={form.agenda}
            onChange={(e) => setForm({ ...form, agenda: e.target.value })}
            placeholder="بنود الاجتماع..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          ملاحظات
        </label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="أي ملاحظات..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
        />
      </div>

      {/* محضر الاجتماع (للاجتماعات) */}
      {isMeeting && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              محضر الاجتماع
            </label>
            <textarea
              rows={4}
              value={form.minutes}
              onChange={(e) => setForm({ ...form, minutes: e.target.value })}
              placeholder="تفاصيل ما تم مناقشته..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              القرارات
            </label>
            <textarea
              rows={3}
              value={form.decisions}
              onChange={(e) => setForm({ ...form, decisions: e.target.value })}
              placeholder="القرارات التي تم اتخاذها..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>
        </>
      )}

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