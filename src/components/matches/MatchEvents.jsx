import { useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Input from "../ui/Input";
import EmptyState from "../ui/EmptyState";
import { supabase } from '../../lib/supabase';

import {
  EVENT_TYPES,
  getEventIcon,
  getEventLabel,
} from "../../utils/constants";

const HALF_OPTIONS = [
  { value: "1", label: "الشوط الأول" },
  { value: "2", label: "الشوط الثاني" },
  { value: "3", label: "وقت إضافي 1" },
  { value: "4", label: "وقت إضافي 2" },
];

export default function MatchEvents({
  players = [],
  initialEvents = [],
  onAdd,
  onRemove,
  disabled = false,
  matchId,
}) {
  const [events, setEvents] = useState(initialEvents);
  const [form, setForm] = useState({
    event_type: "goal",
    player_id: "",
    assist_player_id: "",
    half: "1",
    minute: "",
  });
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!form.player_id || !form.minute || !form.half) {
      return alert("يرجى اختيار اللاعب وإدخال الشوط والدقيقة");
    }

    setAdding(true);
    try {
      const payload = {
        event_type: form.event_type,
        player_id: form.player_id,
        assist_player_id:
          form.event_type === "goal" && form.assist_player_id
            ? form.assist_player_id
            : null,
        half: Number(form.half),
        minute: Number(form.minute),
      };
      const created = await onAdd(payload);
      setEvents([...events, created]);

      // ✅ لو الحدث إنذار → فحص تراكم الإنذارات
      if (form.event_type === "yellow_card" && matchId) {
        const { data: result, error: checkErr } = await supabase.rpc(
          "check_yellow_accumulation",
          {
            p_player_id: form.player_id,
            p_match_id: matchId,
          },
        );

        if (!checkErr && result?.created) {
          const player = players.find((p) => p.id === form.player_id);
          alert(
            `⚠️ تنبيه: اللاعب ${
              player?.full_name || ""
            } وصل إلى 3 إنذارات.\nتم إضافة إيقاف تلقائي لمباراة واحدة.`,
          );
        } else if (!checkErr && result?.yellow_count) {
          const remaining = result.remaining;
          if (remaining === 1) {
            const player = players.find((p) => p.id === form.player_id);
            alert(
              `ℹ️ تنبيه: اللاعب ${player?.full_name || ""} عنده ${
                result.yellow_count
              } إنذار. باقي إنذار واحد للإيقاف.`,
            );
          }
        }
      }

      setForm({
        event_type: "goal",
        player_id: "",
        assist_player_id: "",
        half: "1",
        minute: "",
      });
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm("حذف هذا الحدث؟")) return;
    try {
      await onRemove(id);
      setEvents(events.filter((e) => e.id !== id));
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    if ((a.half || 0) !== (b.half || 0)) return (a.half || 0) - (b.half || 0);
    return (a.minute || 0) - (b.minute || 0);
  });

  const getHalfLabel = (half) =>
    HALF_OPTIONS.find((h) => Number(h.value) === Number(half))?.label || "-";

  return (
    <Card padding="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-emerald-600" />
        <h3 className="font-bold text-slate-800">أحداث المباراة</h3>
      </div>

      {/* ====== نموذج الإضافة ====== */}
      {!disabled && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-5 p-4 bg-slate-50 rounded-lg">
          <Select
            options={EVENT_TYPES.map((e) => ({
              value: e.value,
              label: `${e.icon} ${e.label}`,
            }))}
            placeholder=""
            value={form.event_type}
            onChange={(e) => setForm({ ...form, event_type: e.target.value })}
          />
          <Select
            options={players.map((p) => ({ value: p.id, label: p.full_name }))}
            placeholder="-- اللاعب --"
            value={form.player_id}
            onChange={(e) => setForm({ ...form, player_id: e.target.value })}
          />
          {form.event_type === "goal" ? (
            <Select
              options={players
                .filter((p) => p.id !== form.player_id)
                .map((p) => ({ value: p.id, label: p.full_name }))}
              placeholder="-- صانع الهدف --"
              value={form.assist_player_id}
              onChange={(e) =>
                setForm({ ...form, assist_player_id: e.target.value })
              }
            />
          ) : (
            <div className="hidden md:block" />
          )}
          <Select
            options={HALF_OPTIONS}
            placeholder=""
            value={form.half}
            onChange={(e) => setForm({ ...form, half: e.target.value })}
          />
          <Input
            type="number"
            placeholder="الدقيقة"
            min={1}
            max={120}
            value={form.minute}
            onChange={(e) => setForm({ ...form, minute: e.target.value })}
          />
          <Button onClick={handleAdd} loading={adding} fullWidth>
            <Plus size={16} /> إضافة
          </Button>
        </div>
      )}

      {/* ====== قائمة الأحداث ====== */}
      {sortedEvents.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="لا توجد أحداث"
          description="لم يتم تسجيل أي حدث في هذه المباراة بعد."
        />
      ) : (
        <div className="space-y-2">
          {sortedEvents.map((ev) => {
            const player = players.find((p) => p.id === ev.player_id);
            const assist = players.find((p) => p.id === ev.assist_player_id);

            return (
              <div
                key={ev.id}
                className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">
                    {getEventIcon(ev.event_type)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {player?.full_name || "لاعب محذوف"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getEventLabel(ev.event_type)}
                      {assist && ` • صناعة: ${assist.full_name}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-left">
                    <p className="text-sm font-bold text-emerald-600">
                      {ev.minute}'
                    </p>
                    <p className="text-xs text-slate-500">
                      {getHalfLabel(ev.half)}
                    </p>
                  </div>
                  {!disabled && (
                    <button
                      onClick={() => handleRemove(ev.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
