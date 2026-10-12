import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, Eye, Edit, Trash2, Target } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useSector } from "../context/SectorContext";
import { isAdmin, isTeamAdmin, getAllowedTeamIds } from "../utils/permissions";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import Badge, { MatchStatusBadge } from "../components/ui/Badge";
import {
  VENUE_TYPES,
  getVenueTypeLabel,
  getVenueTypeColor,
} from "../utils/constants";
import { formatDateTime } from "../utils/formatters";

export default function Matches() {
  const { profile, loading: authLoading } = useAuth();
  const { selectedSectorId, selectedSector } = useSector();

  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [form, setForm] = useState({
    team_id: "",
    competition_id: "",
    opponent: "",
    match_date: "",
    venue: "",
    venue_type: "home",
  });

  const canManageMatches = isAdmin(profile);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        // ===== المباريات =====
        let q = supabase
          .from("matches")
          .select(
            "*, teams(id, name, category, sector_id), competitions(id, name, season, type), penalty_shots(team_side, is_scored)",
          )
          .order("match_date", { ascending: false });

        if (!isAdmin(profile)) {
          const allowed = getAllowedTeamIds(profile) || [];
          if (allowed.length === 0) {
            setMatches([]);
            setLoading(false);
            return;
          }
          q = q.in("team_id", allowed);
        }

        // ✅ فلترة حسب القطاع
        if (selectedSectorId) {
          q = q.eq("sector_id", selectedSectorId);
        }

        // ===== الفرق =====
        let teamsQ = supabase
          .from("teams")
          .select("id, name, category, sector_id")
          .order("name");

        if (selectedSectorId) {
          teamsQ = teamsQ.eq("sector_id", selectedSectorId);
        }

        // ===== المسابقات =====
        let compsQ = supabase
          .from("competitions")
          .select("id, name, season, sector_id");

        if (selectedSectorId) {
          compsQ = compsQ.eq("sector_id", selectedSectorId);
        }

        const [matchesRes, teamsRes, compsRes] = await Promise.all([
          q,
          teamsQ,
          compsQ,
        ]);

        setMatches(matchesRes.data || []);
        setTeams(teamsRes.data || []);
        setCompetitions(compsRes.data || []);
      } catch (err) {
        console.error("خطأ في تحميل المباريات:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    setFilterTeam(""); // نصفر فلتر الفريق لما يتغير القطاع
  }, [profile, authLoading, selectedSectorId]);

  const reload = async () => {
    let q = supabase
      .from("matches")
      .select(
        "*, teams(id, name, category, sector_id), competitions(id, name, season, type), penalty_shots(team_side, is_scored)",
      )
      .order("match_date", { ascending: false });

    if (selectedSectorId) q = q.eq("sector_id", selectedSectorId);

    const { data } = await q;
    setMatches(data || []);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      team_id: "",
      competition_id: "",
      opponent: "",
      match_date: "",
      venue: "",
      venue_type: "home",
    });
    setShowForm(true);
  };

  const openEdit = (match) => {
    setEditing(match);
    setForm({
      team_id: match.team_id || "",
      competition_id: match.competition_id || "",
      opponent: match.opponent || "",
      match_date: match.match_date ? match.match_date.slice(0, 16) : "",
      venue: match.venue || "",
      venue_type: match.venue_type || "home",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.team_id || !form.opponent || !form.match_date) {
      alert("يرجى ملء الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      // جلب sector_id من الفريق المختار
      const selectedTeam = teams.find((t) => t.id === form.team_id);

      const payload = {
        team_id: form.team_id,
        competition_id: form.competition_id || null,
        opponent: form.opponent.trim(),
        match_date: form.match_date,
        venue: form.venue?.trim() || null,
        venue_type: form.venue_type || "home",
        sector_id: selectedTeam?.sector_id || null,
      };

      if (editing) {
        const { error } = await supabase
          .from("matches")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        payload.home_score = 0;
        payload.away_score = 0;
        payload.status = "scheduled";
        const { error } = await supabase.from("matches").insert(payload);
        if (error) throw error;
      }

      setShowForm(false);
      setEditing(null);
      await reload();
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("حذف هذه المباراة؟")) return;
    try {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
      setMatches((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  const filtered = matches.filter((m) => {
    if (filterStatus && m.status !== filterStatus) return false;
    if (filterTeam && m.team_id !== filterTeam) return false;
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">المباريات</h1>
          <p className="text-sm text-slate-500 mt-1">
            إجمالي: {filtered.length} مباراة
            {selectedSector && ` • ${selectedSector.name}`}
          </p>
        </div>
        {canManageMatches && (
          <Button onClick={openCreate}>
            <Plus size={18} /> إضافة مباراة
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">كل الحالات</option>
            <option value="scheduled">مجدولة</option>
            <option value="in_progress">جارية</option>
            <option value="closed">مغلقة</option>
          </select>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">كل الفرق</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} - {t.category}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="لا توجد مباريات"
            description={
              canManageMatches
                ? "ابدأ بإضافة أول مباراة في النظام."
                : "لم تُضف أي مباريات بعد."
            }
            action={
              canManageMatches ? (
                <Button onClick={openCreate}>
                  <Plus size={18} /> إضافة مباراة
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Card
              key={m.id}
              hover
              className={
                m.penalty_shots?.length > 0 || m.penalties_locked
                  ? "border-2 border-amber-300"
                  : ""
              }
            >
              {" "}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                    {m.teams?.name} <span className="text-slate-400">ضد</span>{" "}
                    {m.opponent}
                  </h3>
                  {m.competitions && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {m.competitions.name} - {m.competitions.season}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <MatchStatusBadge status={m.status} />
                  {m.venue_type && (
                    <Badge color={getVenueTypeColor(m.venue_type)} size="sm">
                      {getVenueTypeLabel(m.venue_type)}
                    </Badge>
                  )}
                </div>
              </div>
              {/* Score + Penalties */}
              {(() => {
                const penaltyShots = m.penalty_shots || [];
                const homePens = penaltyShots.filter(
                  (s) => s.team_side === "home" && s.is_scored,
                ).length;
                const awayPens = penaltyShots.filter(
                  (s) => s.team_side === "away" && s.is_scored,
                ).length;
                const hasPenalties =
                  penaltyShots.length > 0 || m.penalties_locked === true;
                const penWinner =
                  hasPenalties && homePens !== awayPens
                    ? homePens > awayPens
                      ? "home"
                      : "away"
                    : null;

                return (
                  <div
                    className={`my-3 rounded-lg border ${
                      hasPenalties
                        ? "border-2 border-amber-300 bg-slate-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    {/* النتيجة الأساسية */}
                    <div className="flex items-center justify-center gap-3 py-3">
                      <span className="text-2xl font-bold text-slate-800">
                        {m.home_score ?? 0}
                      </span>
                      <span className="text-slate-300">-</span>
                      <span className="text-2xl font-bold text-slate-800">
                        {m.away_score ?? 0}
                      </span>
                    </div>

                    {/* 🎯 ركلات الترجيح */}
                    {hasPenalties && (
                      <div className="border-t border-slate-200 px-3 py-2">
                        <div className="flex items-center justify-center gap-2 flex-wrap text-slate-700">
                          <Target size={14} />
                          <span className="text-xs font-bold">
                            ركلات الترجيح
                          </span>
                          <span className="bg-slate-200 px-2 py-0.5 rounded-full text-xs font-bold">
                            {homePens} - {awayPens}
                          </span>
                          {penWinner === "home" && (
                            <span className="text-xs font-bold">
                              🏆 فريقنا فاز
                            </span>
                          )}
                          {penWinner === "away" && (
                            <span className="text-xs font-bold">
                              ❌ خسرنا بالترجيح
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ⚠️ تعادل بدون ترجيح */}
                    {!hasPenalties &&
                      m.status === "closed" &&
                      m.home_score === m.away_score && (
                        <div className="border-t border-slate-200 px-3 py-2 text-center">
                          <p className="text-xs text-slate-600 font-medium">
                            ⚠️ تعادل — لم تُسجَّل ركلات الترجيح بعد
                          </p>
                        </div>
                      )}
                  </div>
                );
              })()}
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {formatDateTime(m.match_date)}
                </span>
                {m.venue && <span>📍 {m.venue}</span>}
              </div>
              <div className="flex justify-end gap-1 pt-3 border-t border-slate-100">
                <Link
                  to={`/matches/${m.id}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="التفاصيل"
                >
                  <Eye size={16} />
                </Link>
                {canManageMatches && (
                  <>
                    <button
                      onClick={() => openEdit(m)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                      title="تعديل"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title={editing ? "تعديل المباراة" : "إضافة مباراة جديدة"}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  الفريق <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.team_id}
                  onChange={(e) =>
                    setForm({ ...form, team_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  المسابقة (اختياري)
                </label>
                <select
                  value={form.competition_id}
                  onChange={(e) =>
                    setForm({ ...form, competition_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">-- بدون مسابقة --</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.season}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  الملعب <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.venue_type}
                  onChange={(e) =>
                    setForm({ ...form, venue_type: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm"
                  required
                >
                  {VENUE_TYPES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="الفريق المنافس"
                required
                value={form.opponent}
                onChange={(e) => setForm({ ...form, opponent: e.target.value })}
              />

              <Input
                type="datetime-local"
                label="تاريخ ووقت المباراة"
                required
                value={form.match_date}
                onChange={(e) =>
                  setForm({ ...form, match_date: e.target.value })
                }
              />

              <Input
                containerClassName="md:col-span-2"
                label="الملعب"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </div>

            <div className="bg-dark-50 border border-slate-200 text-blue-700 text-sm p-3 rounded-lg">
              ℹ️ سيتم تسجيل النتيجة لاحقاً من صفحة تفاصيل المباراة بواسطة
              الإداري.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                إلغاء
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "تحديث" : "حفظ"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
