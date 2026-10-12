import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { SUSPENSION_TYPES } from "../../utils/constants";

export default function SuspensionForm({
  player,
  initialData = null,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const [form, setForm] = useState({
    type: initialData?.type || "club_decision",
    reason: initialData?.reason || "",
    matches_suspended: initialData?.matches_suspended || 1,
    start_date:
      initialData?.start_date || new Date().toISOString().split("T")[0],
    end_date: initialData?.end_date || "",
    source_match_date: initialData?.source_match_date || "",
    related_match_id: initialData?.related_match_id || "",
    fine_amount: initialData?.fine_amount || 0,
    fine_status: initialData?.fine_status || "unpaid",
    notes: initialData?.notes || "",
  });

  const [playerMatches, setPlayerMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // ====== تحميل مباريات اللاعب ======
  useEffect(() => {
    if (!player?.team_id) return;

    const loadMatches = async () => {
      setLoadingMatches(true);
      const { data } = await supabase
        .from("matches")
        .select("id, opponent, match_date, teams(name)")
        .eq("team_id", player.team_id)
        .order("match_date", { ascending: false })
        .limit(30);
      setPlayerMatches(data || []);
      setLoadingMatches(false);
    };

    loadMatches();
  }, [player?.team_id]);

  // ====== لما يختار مباراة ======
  useEffect(() => {
    if (!form.related_match_id) {
      setSelectedMatch(null);
      return;
    }
    const match = playerMatches.find((m) => m.id === form.related_match_id);
    setSelectedMatch(match || null);
    if (match) {
      // عيّن تاريخ المباراة تلقائياً
      const date = new Date(match.match_date).toISOString().split("T")[0];
      setForm((prev) => ({
        ...prev,
        source_match_date: date,
      }));
    }
  }, [form.related_match_id, playerMatches]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      return alert("يرجى إدخال سبب الإيقاف");
    }
    if (!form.start_date) {
      return alert("يرجى إدخال تاريخ بداية الإيقاف");
    }

    onSubmit({
      ...form,
      matches_suspended: Number(form.matches_suspended) || 1,
      fine_amount: Number(form.fine_amount) || 0,
      end_date: form.end_date || null,
      source_match_date: form.source_match_date || null,
      related_match_id: form.related_match_id || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {player && (
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500">اللاعب</p>
          <p className="font-bold text-slate-800">{player.full_name}</p>
        </div>
      )}

      <Select
        label="نوع الإيقاف"
        required
        options={SUSPENSION_TYPES}
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value })}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          سبب الإيقاف <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="اذكر سبب الإيقاف..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* ====== المباراة المرتبطة (اختياري) ====== */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          المباراة المرتبطة (اختياري)
        </label>
        <select
          value={form.related_match_id}
          onChange={(e) =>
            setForm({ ...form, related_match_id: e.target.value })
          }
          disabled={loadingMatches}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
        >
          <option value="">
            {loadingMatches ? "جارٍ التحميل..." : "-- بدون مباراة مرتبطة --"}
          </option>
          {playerMatches.map((m) => (
            <option key={m.id} value={m.id}>
              ضد {m.opponent} —{" "}
              {new Date(m.match_date).toLocaleDateString("ar-EG")}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          لو الإيقاف بسبب مباراة معينة، اخترها هنا لتوثيق التاريخ.
        </p>
      </div>

      {/* ====== التواريخ ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            تاريخ القرار <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            required
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
          <p className="text-xs text-slate-500 mt-1">
            تاريخ بداية الإيقاف (يوم القرار).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            تاريخ المباراة (اختياري)
          </label>
          <Input
            type="date"
            value={form.source_match_date}
            onChange={(e) =>
              setForm({ ...form, source_match_date: e.target.value })
            }
          />
          <p className="text-xs text-slate-500 mt-1">
            التاريخ اللي حصل فيه الحدث (تلقائي لو اخترت مباراة).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            تاريخ النهاية (اختياري)
          </label>
          <Input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
          <p className="text-xs text-slate-500 mt-1">لو معروف مقدماً.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            عدد المباريات
          </label>
          <Input
            type="number"
            min={0}
            value={form.matches_suspended}
            onChange={(e) =>
              setForm({ ...form, matches_suspended: e.target.value })
            }
          />
          <p className="text-xs text-slate-500 mt-1">
            اتركها 0 لو الإيقاف بالتاريخ فقط.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            الغرامة المالية (ج.م)
          </label>
          <Input
            type="number"
            min={0}
            step={100}
            value={form.fine_amount}
            onChange={(e) => setForm({ ...form, fine_amount: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          ملاحظات (اختياري)
        </label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="أي ملاحظات إضافية..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <Save size={16} /> حفظ
        </Button>
      </div>
    </form>
  );
}
