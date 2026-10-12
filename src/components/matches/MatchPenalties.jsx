import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { isAdmin } from "../../utils/permissions";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { formatDateTime } from "../../utils/formatters";

export default function MatchPenalties({
  match,
  players = [],
  lineup = [],
  events = [],
  disabled = false,
  onRefresh,
}) {
  const { profile } = useAuth();
  const admin = isAdmin(profile);

  const [shots, setShots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);

  // حالة إدخال فريقنا
  const [ourPlayerId, setOurPlayerId] = useState("");
  const [ourScored, setOurScored] = useState(true);

  // حالة إدخال الخصم
  const [opponentScored, setOpponentScored] = useState(true);

  // ===== اللاعبون المتاحون (شاركوا للنهاية) =====
  const getPlayersOnField = () => {
    const starterIds = lineup
      .filter((l) => l.lineup_type === "starter")
      .map((l) => l.player_id);

    const subInIds = events
      .filter((e) => e.event_type === "substitution_in")
      .map((e) => e.player_id);

    const subOutIds = events
      .filter((e) => e.event_type === "substitution_out")
      .map((e) => e.player_id);

    const onFieldIds = [
      ...new Set([
        ...starterIds.filter((id) => !subOutIds.includes(id)),
        ...subInIds,
      ]),
    ];

    return players.filter((p) => onFieldIds.includes(p.id));
  };

  const ourShotPlayerIds = shots
    .filter((s) => s.team_side === "home")
    .map((s) => s.player_id);

  const availablePlayers = getPlayersOnField().filter(
    (p) => !ourShotPlayerIds.includes(p.id),
  );

  // ===== تحميل الركلات =====
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("penalty_shots")
        .select("*")
        .eq("match_id", match.id)
        .order("shot_order", { ascending: true });
      setShots(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (match?.id) load();
  }, [match?.id]);

  // ===== إضافة ركلة لفريقنا (Optimistic) =====
  const handleAddOurShot = async () => {
    if (!ourPlayerId) return alert("يرجى اختيار اللاعب");
    if (match.penalties_locked) return;

    const tempId = `temp-${Date.now()}`;
    const scored = ourScored;
    const nextOrder = shots.length + 1;

    // 1) Optimistic: ضيف فوراً في الواجهة
    setShots((prev) => [
      ...prev,
      {
        id: tempId,
        match_id: match.id,
        player_id: ourPlayerId,
        team_side: "home",
        is_scored: scored,
        shot_order: nextOrder,
      },
    ]);
    setOurPlayerId("");
    setOurScored(true);
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("penalty_shots")
        .insert({
          match_id: match.id,
          player_id: ourPlayerId,
          team_side: "home",
          is_scored: scored,
          shot_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;

      // 2) استبدل الـ temp بالحقيقي
      setShots((prev) => prev.map((s) => (s.id === tempId ? data : s)));

      // 3) شغّل الـ RPC في الخلفية
      supabase
        .rpc("recalculate_penalties", { p_match_id: match.id })
        .then(() => onRefresh?.());
    } catch (err) {
      // 4) Rollback
      setShots((prev) => prev.filter((s) => s.id !== tempId));
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ===== إضافة ركلة للخصم (Optimistic) =====
  const handleAddOpponentShot = async () => {
    if (match.penalties_locked) return;

    const placeholderPlayerId = players[0]?.id;
    if (!placeholderPlayerId) {
      alert("لا يوجد لاعبون في النظام — أضف لاعباً واحداً على الأقل لتسجيل ركلات الخصم");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const scored = opponentScored;
    const nextOrder = shots.length + 1;

    setShots((prev) => [
      ...prev,
      {
        id: tempId,
        match_id: match.id,
        player_id: placeholderPlayerId,
        team_side: "away",
        is_scored: scored,
        shot_order: nextOrder,
      },
    ]);
    setOpponentScored(true);
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("penalty_shots")
        .insert({
          match_id: match.id,
          player_id: placeholderPlayerId,
          team_side: "away",
          is_scored: scored,
          shot_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      setShots((prev) => prev.map((s) => (s.id === tempId ? data : s)));
      supabase
        .rpc("recalculate_penalties", { p_match_id: match.id })
        .then(() => onRefresh?.());
    } catch (err) {
      setShots((prev) => prev.filter((s) => s.id !== tempId));
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ===== حذف ركلة (Optimistic) =====
  const handleRemove = async (id) => {
    if (match.penalties_locked) return;
    if (String(id).startsWith("temp-")) return;
    if (!confirm("حذف هذه الركلة؟")) return;

    const backup = shots;
    setShots((prev) => prev.filter((s) => s.id !== id));

    try {
      const { error } = await supabase
        .from("penalty_shots")
        .delete()
        .eq("id", id);
      if (error) throw error;

      supabase
        .rpc("recalculate_penalties", { p_match_id: match.id })
        .then(() => onRefresh?.());
    } catch (err) {
      setShots(backup);
      alert("خطأ: " + err.message);
    }
  };

  // ===== اعتماد الركلات =====
  const handleLock = async () => {
    if (!confirm("اعتماد الركلات نهائياً؟ لن يمكن التعديل بعد ذلك.")) return;

    setLocking(true);
    try {
      const { error } = await supabase
        .from("matches")
        .update({
          penalties_locked: true,
          penalties_locked_at: new Date().toISOString(),
          penalties_locked_by: profile.id,
        })
        .eq("id", match.id);
      if (error) throw error;
      alert("تم اعتماد الركلات ✅");
      onRefresh?.();
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setLocking(false);
    }
  };

  // ===== إلغاء الاعتماد =====
  const handleUnlock = async () => {
    if (!confirm("إلغاء الاعتماد؟ سيتمكن الإداري من التعديل مرة أخرى.")) return;

    setLocking(true);
    try {
      const { error } = await supabase
        .from("matches")
        .update({
          penalties_locked: false,
          penalties_locked_at: null,
          penalties_locked_by: null,
        })
        .eq("id", match.id);
      if (error) throw error;
      alert("تم إلغاء الاعتماد ✅");
      onRefresh?.();
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setLocking(false);
    }
  };

  // ===== الإحصائيات =====
  const homeShots = shots.filter((s) => s.team_side === "home");
  const awayShots = shots.filter((s) => s.team_side === "away");

  const homeScored = homeShots.filter((s) => s.is_scored).length;
  const awayScored = awayShots.filter((s) => s.is_scored).length;

  const winner =
    homeScored > awayScored
      ? "home"
      : awayScored > homeScored
        ? "away"
        : "draw";

  const isLocked = match?.penalties_locked === true;

  // ===== منطق isComplete (يدعم sudden death) =====
  const isComplete = (() => {
    const h = homeShots.length;
    const a = awayShots.length;

    // لازم نفس العدد
    if (h !== a) return false;

    // الحد الأدنى 3 ركلات لكل فريق
    if (h < 3) return false;

    // أول 5 ركلات: أي عدد >= 3 ومتساوي = مقبول
    if (h < 5) return true;

    // بعد 5: sudden death — لازم الفرق مش متعادل
    return homeScored !== awayScored;
  })();

  // ===== هل يمكن التعديل؟ =====
  const canEdit = !disabled && !isLocked;

  return (
    <div className="space-y-4" dir="rtl">
      {/* ====== بانر الاعتماد ====== */}
      {isLocked && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle
            size={20}
            className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
          />
          <div className="flex-1">
            <p className="font-bold text-emerald-800 dark:text-emerald-300">
              🔒 الركلات معتمدة نهائياً
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
              تم الاعتماد في{" "}
              <strong>
                {match.penalties_locked_at
                  ? formatDateTime(match.penalties_locked_at)
                  : "-"}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* ====== رأس الصفحة: النتيجة النهائية ====== */}
      <Card padding="p-5">
        <div className="grid grid-cols-3 gap-3 items-center text-center">
          <div
            className={`p-4 rounded-xl transition ${
              winner === "home"
                ? "bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500"
                : "bg-slate-50 dark:bg-slate-800/50"
            }`}
          >
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              فريقنا
            </p>
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
              {match.teams?.name || "-"}
            </p>
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              {homeScored}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              من {homeShots.length} ركلة
            </p>
            {winner === "home" && (
              <Badge color="emerald" size="sm" className="mt-2">
                🏆 الفائز
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-400">VS</span>
          </div>

          <div
            className={`p-4 rounded-xl transition ${
              winner === "away"
                ? "bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500"
                : "bg-slate-50 dark:bg-slate-800/50"
            }`}
          >
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              الخصم
            </p>
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
              {match.opponent}
            </p>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400 mt-2">
              {awayScored}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              من {awayShots.length} ركلة
            </p>
            {winner === "away" && (
              <Badge color="emerald" size="sm" className="mt-2">
                🏆 الفائز
              </Badge>
            )}
          </div>
        </div>

        {/* ====== زر الاعتماد ====== */}
        {admin && !isLocked && isComplete && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              onClick={handleLock}
              loading={locking}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Lock size={16} /> اعتماد الركلات نهائياً
            </Button>
          </div>
        )}

        {admin && isLocked && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button variant="warning" onClick={handleUnlock} loading={locking}>
              <Unlock size={16} /> إلغاء الاعتماد للتعديل
            </Button>
          </div>
        )}

        {/* ====== تنبيهات ====== */}
        {!isLocked && !isComplete && homeShots.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              الركلات لم تكتمل. لازم نفس العدد من الفريقين (على الأقل 3 لكل
              فريق) قبل الاعتماد.
            </span>
          </div>
        )}
      </Card>

      {/* ====== جدولين جنب بعض ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ============ فريقنا ============ */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              فريقنا — {match.teams?.name}
            </h3>
            <Badge color="emerald" size="sm">
              {homeScored} / {homeShots.length}
            </Badge>
          </div>

          {canEdit && (
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-4">
              <select
                value={ourPlayerId}
                onChange={(e) => setOurPlayerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">
                  {availablePlayers.length === 0
                    ? "لا يوجد لاعبون متاحون"
                    : "-- اختر اللاعب --"}
                </option>
                {availablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOurScored(true)}
                  className={`py-2 rounded-lg text-xs font-medium transition ${
                    ourScored
                      ? "bg-emerald-500 text-white"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                  }`}
                >
                  ⚽ سجل
                </button>
                <button
                  type="button"
                  onClick={() => setOurScored(false)}
                  className={`py-2 rounded-lg text-xs font-medium transition ${
                    !ourScored
                      ? "bg-red-500 text-white"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                  }`}
                >
                  ❌ أضاع
                </button>
              </div>

              <Button
                onClick={handleAddOurShot}
                loading={saving}
                fullWidth
                size="sm"
                disabled={availablePlayers.length === 0}
              >
                <Plus size={14} /> إضافة ركلة
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : homeShots.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm py-6">
              لم تُسجل ركلات بعد
            </p>
          ) : (
            <div className="space-y-2">
              {homeShots.map((shot, idx) => {
                const player = players.find((p) => p.id === shot.player_id);
                const isTemp = String(shot.id).startsWith("temp-");
                return (
                  <div
                    key={shot.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg ${
                      isTemp
                        ? "bg-amber-50 dark:bg-amber-900/20 opacity-60"
                        : "bg-slate-50 dark:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-lg shrink-0">
                        {shot.is_scored ? "⚽" : "❌"}
                      </span>
                      <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">
                        {player?.full_name || "لاعب محذوف"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        color={shot.is_scored ? "emerald" : "red"}
                        size="sm"
                      >
                        {shot.is_scored ? "سجل" : "أضاع"}
                      </Badge>
                      {canEdit && !isTemp && (
                        <button
                          onClick={() => handleRemove(shot.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="حذف"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ============ الخصم ============ */}
        <Card padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              الخصم — {match.opponent}
            </h3>
            <Badge color="red" size="sm">
              {awayScored} / {awayShots.length}
            </Badge>
          </div>

          {canEdit && (
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOpponentScored(true)}
                  className={`py-2 rounded-lg text-xs font-medium transition ${
                    opponentScored
                      ? "bg-emerald-500 text-white"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                  }`}
                >
                  ⚽ سجل
                </button>
                <button
                  type="button"
                  onClick={() => setOpponentScored(false)}
                  className={`py-2 rounded-lg text-xs font-medium transition ${
                    !opponentScored
                      ? "bg-red-500 text-white"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                  }`}
                >
                  ❌ أضاع
                </button>
              </div>

              <Button
                onClick={handleAddOpponentShot}
                loading={saving}
                fullWidth
                size="sm"
              >
                <Plus size={14} /> إضافة ركلة
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : awayShots.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm py-6">
              لم تُسجل ركلات بعد
            </p>
          ) : (
            <div className="space-y-2">
              {awayShots.map((shot, idx) => {
                const isTemp = String(shot.id).startsWith("temp-");
                return (
                  <div
                    key={shot.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg ${
                      isTemp
                        ? "bg-amber-50 dark:bg-amber-900/20 opacity-60"
                        : "bg-slate-50 dark:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-lg shrink-0">
                        {shot.is_scored ? "⚽" : "❌"}
                      </span>
                      <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">
                        ركلة رقم {idx + 1}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        color={shot.is_scored ? "emerald" : "red"}
                        size="sm"
                      >
                        {shot.is_scored ? "سجل" : "أضاع"}
                      </Badge>
                      {canEdit && !isTemp && (
                        <button
                          onClick={() => handleRemove(shot.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="حذف"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}