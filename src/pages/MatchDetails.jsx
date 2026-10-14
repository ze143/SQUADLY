import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Trophy,
  Lock,
  Unlock,
  Save,
  Users,
  Flag,
  Star,
  Target,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useMatches } from "../hooks/useMatches";
import { isAdmin, isTeamAdmin } from "../utils/permissions";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge, { MatchStatusBadge } from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import MatchLineup from "../components/matches/MatchLineup";
import MatchEvents from "../components/matches/MatchEvents";
import MatchReferees from "../components/matches/MatchReferees";
import MatchReport from "../components/matches/MatchReport";
import MatchRatings from "../components/matches/MatchRatings";
import { formatDateTime } from "../utils/formatters";
import { getVenueTypeLabel, getVenueTypeColor } from "../utils/constants";
import MatchPenalties from "../components/matches/MatchPenalties";

const TABS = [
  { id: "info", label: "معلومات المباراة", icon: Trophy },
  { id: "lineup", label: "التشكيل", icon: Users },
  { id: "events", label: "الأحداث", icon: Flag },
  { id: "penalties", label: "ركلات الترجيح", icon: Target },
  { id: "ratings", label: "التقييمات", icon: Star },
  { id: "referees", label: "الحكام", icon: Users },
  { id: "report", label: "التقرير", icon: Save },
];

export default function MatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const teamAdmin = isTeamAdmin(profile);
  const [suspendedPlayers, setSuspendedPlayers] = useState([]);
  const [injuredPlayers, setInjuredPlayers] = useState([]);

  const { getMatchDetails, saveLineup, addEvent, removeEvent, saveReferees } =
    useMatches();

  const [match, setMatch] = useState(null);
  const [lineup, setLineup] = useState([]);
  const [events, setEvents] = useState([]);
  const [referees, setReferees] = useState([]);
  const [players, setPlayers] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [escalatedCount, setEscalatedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("info");
  const [scores, setScores] = useState({ home_score: 0, away_score: 0 });
  const [savingScore, setSavingScore] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await getMatchDetails(id);
      setMatch(data.match);
      setLineup(data.lineup);
      setEvents(data.events);
      setReferees(data.referees);
      setScores({
        home_score: data.match.home_score ?? 0,
        away_score: data.match.away_score ?? 0,
      });

      // ✅ هنجهز قائمة اللاعبين الأول، وبعدين نفلتر الإيقافات والإصابات
      if (data.match?.team_id) {
        // 1) لاعبي الفريق الأساسي
        const { data: teamPlayers } = await supabase
          .from("players")
          .select("id, full_name, position, is_active")
          .eq("team_id", data.match.team_id)
          .order("full_name");

        // 2) اللاعبين المصعّدين
        const escalated = (data.escalatedPlayers || []).map((e) => ({
          id: e.players?.id,
          full_name: e.players?.full_name,
          position: e.players?.position,
          _escalated: true,
          _fromTeam: e.from_team?.name,
        }));

        setEscalatedCount(escalated.length);

        // 3) دمج بدون تكرار
        const allIds = new Set();
        const combined = [];
        [...(teamPlayers || []), ...escalated].forEach((p) => {
          if (p.id && !allIds.has(p.id)) {
            allIds.add(p.id);
            combined.push(p);
          }
        });

        // ✅ 4) دلوقتي نفلتر الإيقافات والإصابات على لاعييين الفريق بس
        const teamPlayerIds = new Set(combined.map((p) => p.id));

        const suspendedIds = new Set(
          (data.activeSuspensions || [])
            .filter((s) => teamPlayerIds.has(s.player_id))
            .map((s) => s.player_id),
        );
        setSuspendedPlayers(Array.from(suspendedIds));

        // ✅ الإصابات: نحسبها بتاريخ المباراة (زي الإيقافات)
        const matchDate = new Date(data.match.match_date);
        matchDate.setHours(0, 0, 0, 0);

        const injuredIds = new Set(
          (data.activeInjuries || [])
            .filter((i) => {
              // لازم يكون من لاعييين الفريق
              if (!teamPlayerIds.has(i.player_id)) return false;

              const injuryDate = new Date(i.injury_date);
              injuryDate.setHours(0, 0, 0, 0);

              // لو الإصابة حصلت بعد المباراة → اللاعب كان سليم وقتها
              if (injuryDate > matchDate) return false;

              // لو اللاعب رجع فعلاً (actual_return_date) قبل المباراة → كان سليم
              if (i.actual_return_date) {
                const actualReturn = new Date(i.actual_return_date);
                actualReturn.setHours(0, 0, 0, 0);
                if (actualReturn <= matchDate) return false;
              }

              // لو التاريخ المتوقع للعودة عدّى قبل المباراة → مفروض كان رجع
              if (i.expected_return_date) {
                const expectedReturn = new Date(i.expected_return_date);
                expectedReturn.setHours(0, 0, 0, 0);
                if (expectedReturn < matchDate) return false;
              }

              // لسه مصاب وقت المباراة
              return true;
            })
            .map((i) => i.player_id),
        );
        setInjuredPlayers(Array.from(injuredIds));

        // 5) علّم اللاعبين بحالتهم
        const playersWithStatus = combined.map((p) => ({
          ...p,
          _suspended: suspendedIds.has(p.id),
          _inactive: p.is_active === false,
          _injured: injuredIds.has(p.id),
        }));
        setPlayers(playersWithStatus);
      }

      // ✅ جلب التقييمات
      const { data: ratingsData } = await supabase
        .from("match_ratings")
        .select("*")
        .eq("match_id", id);
      setRatings(ratingsData || []);
    } catch (err) {
      console.error(err);
      alert("خطأ في تحميل تفاصيل المباراة: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  const isClosed = match?.status === "closed";
  const canEdit = teamAdmin && !admin && !isClosed;
  const canCloseOpen = admin;

  const handleSaveScore = async () => {
    setSavingScore(true);
    try {
      const { error } = await supabase
        .from("matches")
        .update({
          home_score: Number(scores.home_score) || 0,
          away_score: Number(scores.away_score) || 0,
        })
        .eq("id", id);
      if (error) throw error;
      alert("تم حفظ النتيجة ✅");
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setSavingScore(false);
    }
  };

  const handleCloseMatch = async () => {
    if (!confirm("هل تريد غلق المباراة نهائياً؟")) return;
    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: "closed" })
        .eq("id", id);
      if (error) throw error;

      // ✅ فحص الإيقافات تلقائياً
      const { data: result } = await supabase.rpc("check_and_lift_suspensions");
      if (result?.lifted > 0) {
        alert(`✅ تم غلق المباراة\n🎉 تم رفع ${result.lifted} إيقاف تلقائياً`);
      } else {
        alert("✅ تم غلق المباراة");
      }

      await loadAll();
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  const handleReopenMatch = async () => {
    if (!confirm("هل تريد إعادة فتح المباراة للتعديل؟")) return;
    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: "in_progress" })
        .eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  const handleSaveLineup = async (starters, subs) => {
    await saveLineup(id, starters, subs);
    await loadAll();
  };

  const handleAddEvent = async (payload) => {
    const created = await addEvent({ ...payload, match_id: id });
    setEvents((prev) => [...prev, created]);
    return created;
  };

  const handleRemoveEvent = async (eventId) => {
    await removeEvent(eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleSaveReferees = async (list) => {
    await saveReferees(id, list);
    await loadAll();
  };

  const handleSaveReport = async ({ technical_report, admin_report }) => {
    const { error } = await supabase
      .from("matches")
      .update({ technical_report, admin_report })
      .eq("id", id);
    if (error) throw error;
  };

  // ✅ حفظ التقييمات
  const handleSaveRatings = async (list) => {
    if (!list.length) return;

    // احذف القديم
    const { error: delErr } = await supabase
      .from("match_ratings")
      .delete()
      .eq("match_id", id);
    if (delErr) throw delErr;

    // أضف الجديد
    const records = list.map((r) => ({
      match_id: id,
      player_id: r.player_id,
      rating: r.rating,
      notes: r.notes,
      created_by: profile.id,
    }));

    const { error } = await supabase.from("match_ratings").insert(records);
    if (error) throw error;

    await loadAll();
  };

  // ✅ استخراج المشاركين (الأساسيين + الاحتياطيين اللي دخلوا)
  const getParticipants = () => {
    const starterIds = lineup
      .filter((l) => l.lineup_type === "starter")
      .map((l) => l.player_id);

    const subInIds = events
      .filter((e) => e.event_type === "substitution_in")
      .map((e) => e.player_id);

    const subOutIds = events
      .filter((e) => e.event_type === "substitution_out")
      .map((e) => e.player_id);

    const allIds = [...new Set([...starterIds, ...subInIds])];

    return players
      .filter((p) => allIds.includes(p.id))
      .map((p) => {
        const isStarter = starterIds.includes(p.id);
        const isSubbedOut = subOutIds.includes(p.id);
        const isSubbedIn = subInIds.includes(p.id);

        return {
          ...p,
          lineup_type: isStarter ? "starter" : "substitute",
          _subbedOut: isSubbedOut,
          _subbedIn: isSubbedIn,
        };
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <Card>
        <EmptyState
          icon={Trophy}
          title="المباراة غير موجودة"
          action={
            <Button onClick={() => navigate("/matches")}>رجوع للمباريات</Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm"
        >
          <ArrowRight size={18} /> رجوع
        </button>
        {canCloseOpen && (
          <div className="flex gap-2">
            {isClosed ? (
              <Button variant="warning" onClick={handleReopenMatch}>
                <Unlock size={16} /> إعادة فتح للتعديل
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleCloseMatch}>
                <Lock size={16} /> غلق واعتماد
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Match Header Card */}
      <Card>
        <div className="flex items-center justify-center gap-6 py-4">
          <div className="text-center flex-1">
            <p className="text-xs text-slate-500 mb-1">فريقنا</p>
            <p className="font-bold text-slate-800 text-lg">
              {match.teams?.name || "-"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-emerald-600">
              {match.home_score}
              <span className="text-slate-300 mx-2">-</span>
              {match.away_score}
            </p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-slate-500 mb-1">الخصم</p>
            <p className="font-bold text-slate-800 text-lg">{match.opponent}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
          <MatchStatusBadge status={match.status} />
          {match.venue_type && (
            <Badge color={getVenueTypeColor(match.venue_type)} size="sm">
              {getVenueTypeLabel(match.venue_type)}
            </Badge>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={12} /> {formatDateTime(match.match_date)}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {match.venue}
            </span>
          )}
        </div>
      </Card>

      {/* تنبيه المصعّدين */}
      {escalatedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-lg">
          ⚡ يوجد <strong>{escalatedCount}</strong> لاعب مصعّد لهذه المباراة.
          تجدهم في تاب "التشكيل" بشارة <strong>مصعّد</strong>.
        </div>
      )}

      {suspendedPlayers.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg">
          🚫 يوجد <strong>{suspendedPlayers.length}</strong> لاعب موقوف. لا يمكن
          إضافتهم للتشكيل حتى يتم رفع الإيقاف.
        </div>
      )}

      {injuredPlayers.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/40 text-orange-800 dark:text-orange-300 text-sm p-3 rounded-lg">
          🏥 يوجد <strong>{injuredPlayers.length}</strong> لاعب مصاب. يفضل عدم
          إضافتهم للتشكيل حتى يتعافوا.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap text-sm transition",
                active
                  ? "border-emerald-600 text-emerald-600 font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Info Tab */}
      {tab === "info" && (
        <Card>
          <CardHeader title="تحديث النتيجة" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <Input
              type="number"
              label="أهداف فريقنا"
              min={0}
              value={scores.home_score}
              disabled={!canEdit}
              onChange={(e) =>
                setScores({ ...scores, home_score: e.target.value })
              }
            />
            <Input
              type="number"
              label="أهداف الخصم"
              min={0}
              value={scores.away_score}
              disabled={!canEdit}
              onChange={(e) =>
                setScores({ ...scores, away_score: e.target.value })
              }
            />
            {canEdit ? (
              <Button onClick={handleSaveScore} loading={savingScore}>
                <Save size={16} /> حفظ النتيجة
              </Button>
            ) : (
              <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg text-center">
                {admin ? "وضع الإشراف" : "المباراة مغلقة"}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Lineup Tab */}
      {tab === "lineup" && (
        <MatchLineup
          players={players}
          initialLineup={lineup}
          onSave={handleSaveLineup}
          disabled={!canEdit}
        />
      )}

      {/* Events Tab */}
      {tab === "events" && (
        <MatchEvents
          players={players}
          initialEvents={events}
          onAdd={handleAddEvent}
          onRemove={handleRemoveEvent}
          disabled={!canEdit}
          matchId={id}
          lineup={lineup}
        />
      )}

      {/* Ratings Tab */}
      {tab === "ratings" && (
        <MatchRatings
          participants={getParticipants()}
          initialRatings={ratings}
          onSave={handleSaveRatings}
          disabled={!canEdit}
        />
      )}

      {/* Penalties Tab */}
      {tab === "penalties" && (
        <MatchPenalties
          match={match}
          players={players}
          lineup={lineup}
          events={events}
          disabled={!canEdit}
          onRefresh={loadAll}
        />
      )}

      {/* Referees Tab */}
      {tab === "referees" && (
        <MatchReferees
          initialReferees={referees}
          onSave={handleSaveReferees}
          disabled={!canEdit}
        />
      )}

      {/* Report Tab */}
      {tab === "report" && (
        <MatchReport
          initialReport={{
            technical_report: match.technical_report || "",
            admin_report: match.admin_report || "",
          }}
          onSave={handleSaveReport}
          disabled={!canEdit}
          canClose={admin}
          matchStatus={match.status}
          onClose={handleCloseMatch}
        />
      )}
    </div>
  );
}