import { useState } from 'react';
import {
  Plus, CheckCircle, Trash2, DollarSign, Edit, Ban, XCircle,
  Calendar, Target, Clock,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import SuspensionForm from './SuspensionForm';
import {
  getSuspensionTypeLabel,
  getSuspensionStatusLabel,
} from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function PlayerSuspensions({
  player,
  suspensions = [],
  onAdd,
  onUpdate,
  onRemove,
  onMarkFinePaid,
  canEdit = false,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await onUpdate(editing.id, data);
      } else {
        await onAdd(data);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSuspension = async (id) => {
    if (!confirm('هل تريد رفع هذا الإيقاف؟ اللاعب سيتمكن من اللعب مباشرة.'))
      return;
    try {
      await onUpdate(id, { status: 'cancelled' });
      alert('تم رفع الإيقاف ✅');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const getTypeColor = (type) => {
    if (type === 'red_card') return 'red';
    if (type === 'yellow_accumulation') return 'amber';
    if (type === 'club_decision') return 'purple';
    return 'slate';
  };

  const getStatusColor = (status) => {
    if (status === 'active') return 'red';
    if (status === 'completed') return 'emerald';
    if (status === 'cancelled') return 'slate';
    return 'slate';
  };

  const activeCount = suspensions.filter((s) => s.status === 'active').length;

  // ===== تحليل حالة الإيقاف =====
  const analyzeSuspension = (s) => {
    const hasMatches = Number(s.matches_suspended) > 0;
    const hasDate = !!s.end_date;

    const matchesDone =
      hasMatches && Number(s.matches_served) >= Number(s.matches_suspended);
    const matchesRemaining = hasMatches
      ? Math.max(0, Number(s.matches_suspended) - Number(s.matches_served))
      : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = hasDate ? new Date(s.end_date) : null;
    if (endDate) endDate.setHours(0, 0, 0, 0);

    const dateDone = hasDate && endDate <= today;
    const daysRemaining = hasDate
      ? Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)))
      : 0;

    // ===== تحديد "الأبعد" =====
    let conditionType = 'none'; // matches | date | both
    if (hasMatches && hasDate) conditionType = 'both';
    else if (hasMatches) conditionType = 'matches';
    else if (hasDate) conditionType = 'date';

    // ===== هل هيتلغى؟ =====
    let willComplete = false;
    if (conditionType === 'matches') willComplete = matchesDone;
    else if (conditionType === 'date') willComplete = dateDone;
    else if (conditionType === 'both') willComplete = matchesDone && dateDone;

    return {
      hasMatches,
      hasDate,
      matchesDone,
      matchesRemaining,
      dateDone,
      daysRemaining,
      conditionType,
      willComplete,
    };
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ban size={18} className="text-red-600" />
            <h3 className="font-bold text-slate-800">الإيقافات والعقوبات</h3>
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && <Badge color="red">{activeCount} نشط</Badge>}
            {canEdit && (
              <Button onClick={openCreate} size="sm">
                <Plus size={16} /> إضافة إيقاف
              </Button>
            )}
          </div>
        </div>

        {suspensions.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="لا توجد إيقافات"
            description="اللاعب ليس عليه أي عقوبات حالياً."
          />
        ) : (
          <div className="space-y-3">
            {suspensions.map((s) => {
              const info = analyzeSuspension(s);

              return (
                <div
                  key={s.id}
                  className={`p-4 rounded-lg border-2 ${
                    s.status === 'active'
                      ? 'border-red-200 bg-red-50'
                      : s.status === 'cancelled'
                      ? 'border-slate-200 bg-slate-100 opacity-70'
                      : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color={getTypeColor(s.type)}>
                        {getSuspensionTypeLabel(s.type)}
                      </Badge>
                      <Badge color={getStatusColor(s.status)}>
                        {getSuspensionStatusLabel(s.status)}
                      </Badge>
                      {/* شارة "الأبعد" لو فيه مباريات + تاريخ */}
                      {s.status === 'active' && info.conditionType === 'both' && (
                        <Badge color="amber">⚡ أبعد شرط</Badge>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        {s.status === 'active' && (
                          <button
                            onClick={() => handleCancelSuspension(s.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="رفع الإيقاف"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="تعديل"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('حذف هذا الإيقاف؟')) onRemove(s.id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {s.reason && (
                    <p className="text-sm text-slate-700 mb-3">{s.reason}</p>
                  )}

                  {/* ===== التواريخ ===== */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {/* المباريات */}
                    {info.hasMatches && (
                      <div className="bg-white p-2.5 rounded-lg">
                        <p className="text-xs text-slate-500">المباريات</p>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {s.matches_served} / {s.matches_suspended}
                        </p>
                        {info.matchesDone && s.status === 'active' && (
                          <p className="text-xs text-emerald-600 mt-0.5">
                            ✅ اكتمل
                          </p>
                        )}
                      </div>
                    )}

                    {/* تاريخ القرار */}
                    <div className="bg-white p-2.5 rounded-lg">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={10} /> تاريخ القرار
                      </p>
                      <p className="font-medium text-slate-800 mt-0.5 text-sm">
                        {formatDate(s.start_date)}
                      </p>
                    </div>

                    {/* تاريخ المباراة */}
                    {s.source_match_date && (
                      <div className="bg-white p-2.5 rounded-lg">
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Target size={10} /> تاريخ المباراة
                        </p>
                        <p className="font-medium text-slate-800 mt-0.5 text-sm">
                          {formatDate(s.source_match_date)}
                        </p>
                      </div>
                    )}

                    {/* تاريخ النهاية */}
                    {info.hasDate && (
                      <div className="bg-white p-2.5 rounded-lg">
                        <p className="text-xs text-slate-500">تاريخ النهاية</p>
                        <p className="font-medium text-slate-800 mt-0.5 text-sm">
                          {formatDate(s.end_date)}
                        </p>
                        {info.dateDone && s.status === 'active' && (
                          <p className="text-xs text-emerald-600 mt-0.5">
                            ✅ عدّى
                          </p>
                        )}
                      </div>
                    )}

                    {/* الغرامة */}
                    {Number(s.fine_amount) > 0 && (
                      <div className="bg-white p-2.5 rounded-lg">
                        <p className="text-xs text-slate-500">الغرامة</p>
                        <p className="font-bold text-red-600 mt-0.5 text-sm">
                          {formatCurrency(s.fine_amount)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ===== الحالة الذكية ===== */}
                  {s.status === 'active' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-bold text-blue-700 mb-1.5 flex items-center gap-1">
                        <Clock size={12} /> متى ينتهي الإيقاف؟
                      </p>
                      <ul className="space-y-1 text-xs text-blue-700">
                        {info.conditionType === 'matches' && (
                          <>
                            <li>
                              ⏳ يلعب{' '}
                              <strong>{info.matchesRemaining}</strong>{' '}
                              {info.matchesRemaining === 1
                                ? 'مباراة'
                                : 'مباريات'}{' '}
                              أخرى
                            </li>
                            <li className="text-blue-600 text-[11px] italic">
                              (يُرفع تلقائياً عند غلق المباراة المطلوبة)
                            </li>
                          </>
                        )}

                        {info.conditionType === 'date' && (
                          <>
                            <li>
                              📅 ينتظر انتهاء تاريخ{' '}
                              <strong>{formatDate(s.end_date)}</strong>
                            </li>
                            <li className="text-blue-600 text-[11px]">
                              باقي{' '}
                              <strong>{info.daysRemaining}</strong>{' '}
                              {info.daysRemaining === 1 ? 'يوم' : 'أيام'}
                            </li>
                          </>
                        )}

                        {info.conditionType === 'both' && (
                          <>
                            <li>
                              • لعب{' '}
                              <strong>{info.matchesRemaining}</strong>{' '}
                              {info.matchesRemaining === 1
                                ? 'مباراة'
                                : 'مباريات'}{' '}
                              أخرى
                            </li>
                            <li>
                              • انتهاء التاريخ{' '}
                              <strong>{formatDate(s.end_date)}</strong>{' '}
                              (باقي {info.daysRemaining} يوم)
                            </li>
                            <li className="text-amber-700 font-bold mt-1.5 pt-1.5 border-t border-amber-200">
                              ⚡ <strong>الأبعد</strong> — لازم الشرطين يخلصوا
                            </li>
                          </>
                        )}

                        {info.conditionType === 'none' && (
                          <li>⚠️ لا يوجد شرط محدد — يمكن رفعه يدوياً</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* ===== اكتمل الإيقاف ===== */}
                  {s.status === 'completed' && s.auto_lift_date && (
                    <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-1">
                      <CheckCircle size={12} />
                      تم الرفع تلقائياً بتاريخ{' '}
                      <strong>{formatDate(s.auto_lift_date)}</strong>
                    </div>
                  )}

                  {/* الغرامة */}
                  {Number(s.fine_amount) > 0 && (
                    <div className="mt-3 flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={14} className="text-amber-600" />
                        <span className="text-amber-800">
                          الغرامة:{' '}
                          {s.fine_status === 'paid' ? 'مسددة ✅' : 'غير مسددة'}
                        </span>
                      </div>
                      {canEdit && s.fine_status !== 'paid' && (
                        <button
                          onClick={() => onMarkFinePaid(s.id)}
                          className="text-xs bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700"
                        >
                          تسجيل السداد
                        </button>
                      )}
                    </div>
                  )}

                  {s.notes && (
                    <p className="mt-3 text-xs text-slate-500 bg-white p-2 rounded-lg">
                      📝 {s.notes}
                    </p>
                  )}

                  {/* زر رفع الإيقاف */}
                  {s.status === 'active' && canEdit && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <button
                        onClick={() => handleCancelSuspension(s.id)}
                        className="w-full flex items-center justify-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg transition font-medium"
                      >
                        <XCircle size={16} /> رفع الإيقاف الآن
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          title={editing ? 'تعديل الإيقاف' : 'إضافة إيقاف جديد'}
          size="lg"
        >
          <SuspensionForm
            player={player}
            initialData={editing}
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