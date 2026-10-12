import { useEffect, useState } from 'react';
import { Save, UserCheck } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { REFEREE_ROLES } from '../../utils/constants';

export default function MatchReferees({
  initialReferees = [],
  onSave,
  disabled = false,
}) {
  const [referees, setReferees] = useState({});
  const [saving, setSaving] = useState(false);

  // ===== تهيئة الحالة من البيانات الموجودة =====
  useEffect(() => {
    const initial = {};
    REFEREE_ROLES.forEach((r) => {
      initial[r.value] = { name: '', region: '', phone: '' };
    });

    initialReferees.forEach((ref) => {
      if (initial[ref.role]) {
        initial[ref.role] = {
          name: ref.referee_name || '',
          region: ref.region || '',
          phone: ref.phone || '',
        };
      }
    });

    setReferees(initial);
  }, [initialReferees]);

  const updateField = (role, field, value) => {
    setReferees((prev) => ({
      ...prev,
      [role]: { ...prev[role], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = REFEREE_ROLES
        .filter((r) => referees[r.value]?.name?.trim())
        .map((r) => ({
          role: r.value,
          referee_name: referees[r.value].name.trim(),
          region: referees[r.value].region?.trim() || null,
          phone: referees[r.value].phone?.trim() || null,
        }));

      await onSave(payload);
      alert('تم حفظ بيانات الطاقم ✅');
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ===== تقسيم الأدوار لمجموعتين =====
  const refereesGroup = REFEREE_ROLES.filter((r) =>
    ['main', 'assistant1', 'assistant2', 'fourth'].includes(r.value)
  );
  const supervisorsGroup = REFEREE_ROLES.filter((r) =>
    ['competition_supervisor', 'referee_supervisor'].includes(r.value)
  );

  const renderRoleRow = (role) => {
    const data = referees[role.value] || { name: '', region: '', phone: '' };
    return (
      <div
        key={role.value}
        className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3"
      >
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {role.label}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="الاسم"
            placeholder="اسم كامل"
            value={data.name}
            disabled={disabled}
            onChange={(e) => updateField(role.value, 'name', e.target.value)}
          />
          <Input
            label="المنطقة"
            placeholder="مثال: القاهرة"
            value={data.region}
            disabled={disabled}
            onChange={(e) => updateField(role.value, 'region', e.target.value)}
          />
          <Input
            label="رقم التليفون"
            placeholder="01xxxxxxxxx"
            value={data.phone}
            disabled={disabled}
            onChange={(e) => updateField(role.value, 'phone', e.target.value)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* طاقم الحكام */}
      <Card padding="p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck size={18} className="text-emerald-600" />
          <h3 className="font-bold text-slate-800">طاقم الحكام</h3>
        </div>
        <div className="space-y-3">
          {refereesGroup.map(renderRoleRow)}
        </div>
      </Card>

      {/* المراقبون */}
      <Card padding="p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck size={18} className="text-purple-600" />
          <h3 className="font-bold text-slate-800">المراقبون</h3>
        </div>
        <div className="space-y-3">
          {supervisorsGroup.map(renderRoleRow)}
        </div>
      </Card>

      {/* زر الحفظ */}
      {!disabled && (
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            <Save size={16} /> حفظ بيانات الطاقم
          </Button>
        </div>
      )}
    </div>
  );
}