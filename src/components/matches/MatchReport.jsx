import { useEffect, useState } from 'react';
import { Save, FileText, Lock } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function MatchReport({
  initialReport = { technical_report: '', admin_report: '' },
  onSave,
  disabled = false,
  canClose = false,
  matchStatus = 'scheduled',
  onClose,
}) {
  const [technical, setTechnical] = useState('');
  const [admin, setAdmin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTechnical(initialReport.technical_report || '');
    setAdmin(initialReport.admin_report || '');
  }, [initialReport]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        technical_report: technical.trim(),
        admin_report: admin.trim(),
      });
      alert('تم حفظ التقرير ✅');
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-emerald-600" />
          <h3 className="font-bold text-slate-800">تقرير المباراة</h3>
        </div>
        {matchStatus === 'closed' && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full flex items-center gap-1">
            <Lock size={12} /> مغلق
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            التقرير الفني
          </label>
          <textarea
            rows={6}
            disabled={disabled}
            value={technical}
            onChange={(e) => setTechnical(e.target.value)}
            placeholder="تقييم الأداء الفني، الخطط، أبرز اللاعبين..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            التقرير الإداري
          </label>
          <textarea
            rows={6}
            disabled={disabled}
            value={admin}
            onChange={(e) => setAdmin(e.target.value)}
            placeholder="ملاحظات إدارية، انضباط، أحداث خاصة..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
      </div>

      {!disabled && (
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
          <div>
            {canClose && matchStatus !== 'closed' && onClose && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (confirm('هل تريد غلق تقرير المباراة؟ لن يمكن التعديل بعد ذلك.')) {
                    onClose();
                  }
                }}
              >
                <Lock size={16} /> غلق التقرير
              </Button>
            )}
          </div>
          <Button onClick={handleSave} loading={saving}>
            <Save size={16} /> حفظ التقرير
          </Button>
        </div>
      )}
    </Card>
  );
}