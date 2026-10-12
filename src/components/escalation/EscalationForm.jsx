import { useEffect, useState } from 'react';
import { Send, ArrowUpCircle, Info, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { isAdmin, getAllowedTeamIds } from '../../utils/permissions';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';

export default function EscalationForm({ player, onSuccess, onCancel }) {
  const { profile } = useAuth();
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ to_team_id: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const admin = isAdmin(profile);
  const myTeamIds = getAllowedTeamIds(profile) || [];

  useEffect(() => {
    const load = async () => {
      setLoadingTeams(true);

      // ✅ نعرض كل الفرق (مع استبعاد فريق اللاعب الحالي)
      const { data } = await supabase
        .from('teams')
        .select('id, name, category, birth_year, age_group')
        .neq('id', player?.team_id || '')
        .order('birth_year', { ascending: false });

      setTeams(data || []);
      setLoadingTeams(false);
    };
    if (player) load();
  }, [player]);

  useEffect(() => {
    const t = teams.find((x) => x.id === form.to_team_id);
    setSelectedTeam(t || null);
  }, [form.to_team_id, teams]);

  // ✅ هل الفريق المستهدف من فرق الإداري الحالي؟
  const isTargetInMyTeams =
    selectedTeam && myTeamIds.includes(selectedTeam.id);

  // ✅ هل الطلب يتعتمد تلقائياً؟ (الفريق المستهدف من فرقي)
  const autoApprove = !admin && isTargetInMyTeams;

  const submit = async () => {
    if (!form.to_team_id) return alert('يرجى اختيار الفريق المطلوب');
    if (!form.reason.trim()) return alert('يرجى كتابة سبب التصعيد');

    setSaving(true);
    try {
      const payload = {
        player_id: player.id,
        from_team_id: player.team_id,
        to_team_id: form.to_team_id,
        requested_by: profile.id,
        reason: form.reason.trim(),
      };

      // ✅ لو الفريق المستهدف من فرقي → اعتماد تلقائي
      if (autoApprove) {
        payload.status = 'approved';
        payload.reviewed_by = profile.id;
        payload.review_notes = 'نقل داخلي داخل نفس الإداري';
      }

      const { error } = await supabase
        .from('escalation_requests')
        .insert(payload);
      if (error) throw error;

      // ✅ لو معتمد تلقائياً، ننقل اللاعب فعلاً
      if (autoApprove) {
        const { error: moveErr } = await supabase
          .from('players')
          .update({ team_id: form.to_team_id })
          .eq('id', player.id);
        if (moveErr) throw moveErr;
      }

      alert(
        autoApprove
          ? 'تم نقل اللاعب مباشرة ✅'
          : 'تم إرسال طلب التصعيد، في انتظار موافقة الإداري المسؤول ✅'
      );
      onSuccess?.();
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="p-5">
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpCircle size={20} className="text-emerald-600" />
        <h3 className="font-bold text-slate-800">طلب تصعيد لاعب</h3>
      </div>

      {/* بطاقة اللاعب */}
      <div className="bg-slate-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-slate-500">اللاعب</p>
        <p className="font-bold text-slate-800">{player?.full_name}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          الفريق الحالي: {player?.teams?.name || 'بدون فريق'} • مواليد{' '}
          {player?.birth_year}
        </p>
      </div>

      <div className="space-y-4">
        <Select
          label="الفريق المطلوب التصعيد إليه"
          required
          placeholder={loadingTeams ? 'جارٍ التحميل...' : '-- اختر الفريق --'}
          disabled={loadingTeams}
          options={teams.map((t) => ({
            value: t.id,
            label: `${t.name} - ${t.category}${t.birth_year ? ` (${t.birth_year})` : ''}`,
          }))}
          value={form.to_team_id}
          onChange={(e) => setForm({ ...form, to_team_id: e.target.value })}
        />

        {/* ✅ تنبيه: نقل داخلي (تلقائي) */}
        {selectedTeam && isTargetInMyTeams && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded-lg flex gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong>نقل داخلي.</strong> فريق{' '}
              <strong>{selectedTeam.name}</strong> من فرقك. سيتم نقل اللاعب
              مباشرة بدون الحاجة لموافقة.
            </div>
          </div>
        )}

        {/* ⏳ تنبيه: يحتاج موافقة إداري آخر */}
        {selectedTeam && !isTargetInMyTeams && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-lg flex gap-2">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong>يحتاج موافقة.</strong> فريق{' '}
              <strong>{selectedTeam.name}</strong> ليس من فرقك. سيُرسل الطلب
              إلى الإداري المسؤول عنه للموافقة.
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            سبب التصعيد <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="اذكر أسباب طلب التصعيد..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            إلغاء
          </Button>
        )}
        <Button onClick={submit} loading={saving}>
          <Send size={16} />
          {autoApprove ? 'نقل مباشر' : 'إرسال الطلب'}
        </Button>
      </div>
    </Card>
  );
}