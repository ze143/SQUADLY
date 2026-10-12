import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  User,
  DollarSign,
  Trophy,
  Calendar,
  ArrowUpCircle,
  MapPin,
  Hash,
  Edit,
  Star,
  Ban,
  Power,
  PowerOff,
  Dumbbell,
  MessageSquare,
  HeartPulse,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isTeamAdmin } from "../utils/permissions";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Badge, {
  PaymentStatusBadge,
  EscalationStatusBadge,
} from "../components/ui/Badge";
import PlayerStats from "../components/players/PlayerStats";
import PlayerSuspensions from "../components/players/PlayerSuspensions";
import { usePlayerAttendance } from "../hooks/useEvents";
import { usePlayerInjuries } from "../hooks/useInjuries";
import {
  ATTENDANCE_STATUS,
  getAttendanceEmoji,
  getAttendanceLabel,
  getAttendanceColor,
  getTrainingTypeLabel,
  getMeetingTypeLabel,
  getPositionLabel,
  getEventIcon,
  getEventLabel,
  getInjuryTypeLabel,
  getInjuryTypeIcon,
  getInjurySeverityLabel,
  getInjurySeverityColor,
  getBodyPartLabel,
  getInjuryCauseLabel,
  getInjuryStatusLabel,
  getInjuryStatusColor,
} from "../utils/constants";
import InstallmentTable, {
  FinanceSummary,
} from "../components/finance/InstallmentTable";
import EmptyState from "../components/ui/EmptyState";
import EscalationForm from "../components/escalation/EscalationForm";
import { formatDate, getInitials } from "../utils/formatters";
import GoalsTrendChart from "../components/charts/GoalsTrendChart";

const TABS = [
  { id: "info", label: "البيانات", icon: User },
  { id: "stats", label: "الإحصائيات", icon: Trophy },
  { id: "attendance", label: "الحضور", icon: Dumbbell },
  { id: "injuries", label: "الإصابات", icon: HeartPulse },
  { id: "ratings", label: "التقييمات", icon: Star },
  { id: "suspensions", label: "الإيقافات", icon: Ban },
  { id: "finance", label: "السجل المالي", icon: DollarSign },
  { id: "history", label: "تاريخ المشاركات", icon: Calendar },
  { id: "escalations", label: "طلبات التصعيد", icon: ArrowUpCircle },
];

export default function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [player, setPlayer] = useState(null);
  const [events, setEvents] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [suspensions, setSuspensions] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const {
    attendance,
    stats: attendanceStats,
    loading: attendanceLoading,
  } = usePlayerAttendance(id);
  const {
    injuries,
    stats: injuriesStats,
    loading: injuriesLoading,
  } = usePlayerInjuries(id);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("info");
  const [showEscalation, setShowEscalation] = useState(false);

  // ✅ التعريفات
  const admin = isAdmin(profile);
  const teamAdmin = isTeamAdmin(profile) && !admin;
  const canEscalate = teamAdmin && player?.team_id;
  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        playerRes,
        eventsRes,
        instRes,
        escRes,
        ratingsRes,
        suspRes,
        lineupsRes,
      ] = await Promise.all([
        // 1) اللاعب
        supabase
          .from("players")
          .select("*, teams(id, name, category)")
          .eq("id", id)
          .single(),

        // 2) الأحداث
        supabase
          .from("match_events")
          .select(`
            *,
            matches(id, opponent, match_date, home_score, away_score),
            assist:players!match_events_assist_player_id_fkey(full_name)
          `)
          .eq("player_id", id)
          .order("created_at", { ascending: false }),

        // 3) الأقساط
        supabase
          .from("installments")
          .select("*")
          .eq("player_id", id)
          .order("due_date", { ascending: true }),

        // 4) طلبات التصعيد
        supabase
          .from("escalation_requests")
          .select(`
            *,
            from_team:teams!escalation_requests_from_team_id_fkey(name, category),
            to_team:teams!escalation_requests_to_team_id_fkey(name, category)
          `)
          .eq("player_id", id)
          .order("created_at", { ascending: false }),

        // 5) التقييمات
        supabase
          .from("match_ratings")
          .select(`
            *,
            matches(id, opponent, match_date, teams(name))
          `)
          .eq("player_id", id)
          .order("created_at", { ascending: false }),

        // 6) الإيقافات
        supabase
          .from("suspensions")
          .select("*")
          .eq("player_id", id)
          .order("created_at", { ascending: false }),

        // 7) المشاركات
        supabase
          .from("match_lineups")
          .select(`
            *,
            matches(id, opponent, match_date, home_score, away_score, status, venue_type, teams(name))
          `)
          .eq("player_id", id),
      ]);

      if (playerRes.error) throw playerRes.error;
      setPlayer(playerRes.data);
      setEvents(eventsRes.data || []);
      setInstallments(instRes.data || []);
      setEscalations(escRes.data || []);
      setRatings(ratingsRes.data || []);
      setSuspensions(suspRes.data || []);

      // ✅ بناء تاريخ المشاركات
      const lineups = lineupsRes.data || [];
      const allEvents = eventsRes.data || [];
      const allRatings = ratingsRes.data || [];

      const history = lineups
        .filter((l) => l.matches)
        .map((l) => {
          const matchEvents = allEvents.filter(
            (e) => e.match_id === l.match_id
          );
          const matchRating = allRatings.find(
            (r) => r.match_id === l.match_id
          );

          // ✅ هل دخل بديل؟
          const subbedIn = matchEvents.some(
            (e) => e.event_type === "substitution_in"
          );
          // ✅ هل خرج؟
          const subbedOut = matchEvents.some(
            (e) => e.event_type === "substitution_out"
          );

          // ✅ نوع المشاركة
          let participationType = "bench";
          if (l.lineup_type === "starter") {
            participationType = "starter";
          } else if (subbedIn) {
            participationType = "sub_in";
          }

          return {
            id: l.id,
            match_id: l.match_id,
            match: l.matches,
            lineup_type: l.lineup_type,
            participationType,
            subbedIn,
            subbedOut,
            events: matchEvents,
            rating: matchRating?.rating,
            ratingNotes: matchRating?.notes,
          };
        })
        .sort((a, b) => {
          const dateA = new Date(a.match?.match_date || 0).getTime();
          const dateB = new Date(b.match?.match_date || 0).getTime();
          return dateB - dateA;
        });

      setMatchHistory(history);
    } catch (err) {
      console.error(err);
      alert("خطأ في تحميل البيانات: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  // ===== تنشيط/إلغاء تنشيط =====
  const handleToggleActive = async () => {
    const newStatus = !player.is_active;
    const action = newStatus ? "تنشيط" : "إلغاء تنشيط";
    if (!confirm(`هل تريد ${action} هذا اللاعب؟`)) return;

    try {
      const { error } = await supabase
        .from("players")
        .update({ is_active: newStatus })
        .eq("id", id);
      if (error) throw error;
      alert(`تم ${action} اللاعب ✅`);
      await loadAll();
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  // ===== إدارة الإيقافات =====
  const handleAddSuspension = async (data) => {
    const { error } = await supabase.from("suspensions").insert({
      player_id: id,
      ...data,
      created_by: profile.id,
    });
    if (error) throw error;

    if (Number(data.fine_amount) > 0) {
      const { data: created } = await supabase
        .from("suspensions")
        .select("id")
        .eq("player_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      await supabase.from("fines").insert({
        player_id: id,
        suspension_id: created?.id || null,
        amount: Number(data.fine_amount),
        reason: data.reason || "غرامة إيقاف",
        status: "unpaid",
        created_by: profile.id,
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      await supabase.from("installments").insert({
        player_id: id,
        amount: Number(data.fine_amount),
        due_date: dueDate.toISOString().split("T")[0],
        status: "unpaid",
        notes: `غرامة: ${data.reason || "إيقاف"}`,
      });
    }

    await loadAll();
  };

  const handleUpdateSuspension = async (suspensionId, data) => {
    const { error } = await supabase
      .from("suspensions")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", suspensionId);
    if (error) throw error;
    await loadAll();
  };

  const handleRemoveSuspension = async (suspensionId) => {
    const { error } = await supabase
      .from("suspensions")
      .delete()
      .eq("id", suspensionId);
    if (error) throw error;
    await loadAll();
  };

  const handleMarkFinePaid = async (suspensionId) => {
    const { error } = await supabase
      .from("suspensions")
      .update({ fine_status: "paid" })
      .eq("id", suspensionId);
    if (error) throw error;

    await supabase
      .from("fines")
      .update({
        status: "paid",
        paid_date: new Date().toISOString().split("T")[0],
      })
      .eq("suspension_id", suspensionId);

    await loadAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <Card>
        <EmptyState
          icon={User}
          title="اللاعب غير موجود"
          action={
            <Button onClick={() => navigate("/players")}>رجوع للاعبين</Button>
          }
        />
      </Card>
    );
  }

  // ===== الإحصائيات =====
  const goals = events.filter((e) => e.event_type === "goal").length;
  const assists = events.filter((e) => e.event_type === "assist").length;
  const yellows = events.filter((e) => e.event_type === "yellow_card").length;
  const reds = events.filter((e) => e.event_type === "red_card").length;
const matchesPlayed = matchHistory.length;
  const activeSuspensions = suspensions.filter(
    (s) => s.status === "active"
  ).length;
  const isInactive = player.is_active === false;

  // ===== متوسط التقييم =====
  const avgRating = ratings.length
    ? (
        ratings.reduce((s, r) => s + Number(r.rating), 0) / ratings.length
      ).toFixed(1)
    : null;

  // ===== الملخص المالي =====
  const summary = installments.reduce(
    (acc, i) => {
      const amount = Number(i.amount) || 0;
      acc.total += amount;
      if (i.status === "paid") acc.paid += amount;
      else if (i.status === "unpaid") acc.unpaid += amount;
      else acc.pending += amount;
      return acc;
    },
    { total: 0, paid: 0, unpaid: 0, pending: 0 }
  );

  const getRatingColor = (rating) => {
    const r = Number(rating);
    if (r >= 8) return "text-emerald-600";
    if (r >= 6) return "text-blue-600";
    if (r >= 4) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Back + Actions */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm"
        >
          <ArrowRight size={18} /> رجوع
        </button>
        <div className="flex gap-2 flex-wrap">
          {admin && (
            <Button
              variant={isInactive ? "success" : "danger"}
              onClick={handleToggleActive}
            >
              {isInactive ? (
                <>
                  <Power size={16} /> تنشيط
                </>
              ) : (
                <>
                  <PowerOff size={16} /> إلغاء تنشيط
                </>
              )}
            </Button>
          )}
          {canEscalate && (
            <Button variant="warning" onClick={() => setShowEscalation(true)}>
              <ArrowUpCircle size={16} /> طلب تصعيد
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => navigate(`/players?edit=${player.id}`)}
          >
            <Edit size={16} /> تعديل
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <Card>
        <div className="flex flex-wrap items-center gap-6">
          <div
            className={`w-24 h-24 rounded-2xl text-white flex items-center justify-center text-3xl font-bold shrink-0 ${
              isInactive
                ? "bg-gradient-to-br from-slate-400 to-slate-600"
                : "bg-gradient-to-br from-emerald-500 to-emerald-700"
            }`}
          >
            {getInitials(player.full_name)}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {player.full_name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge color="blue">{getPositionLabel(player.position)}</Badge>
              <Badge color="slate">مواليد {player.birth_year}</Badge>
              {player.teams && (
                <Badge color="emerald">{player.teams.name}</Badge>
              )}
              {player.player_type === "investment" ? (
                <Badge color="indigo">استثماري</Badge>
              ) : (
                <Badge color="slate">فري</Badge>
              )}
              {player.player_type === "investment" && (
                <PaymentStatusBadge status={player.payment_status} />
              )}
              {activeSuspensions > 0 && (
                <Badge color="red" icon={Ban}>
                  {activeSuspensions} إيقاف نشط
                </Badge>
              )}
              {isInactive && (
                <Badge color="slate" icon={PowerOff}>
                  غير نشط
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center shrink-0">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{goals}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أهداف
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{assists}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                صناعة
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {matchesPlayed}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مباريات
              </p>
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${
                  avgRating ? getRatingColor(avgRating) : "text-slate-400"
                }`}
              >
                {avgRating ? `${avgRating}` : "—"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                التقييم
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
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
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-medium"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              ].join(" ")}
            >
              <Icon size={16} /> {t.label}
              {t.id === "suspensions" && activeSuspensions > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeSuspensions}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============ Content ============ */}

      {/* Info Tab */}
      {tab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="البيانات الشخصية" />
            <div className="space-y-3 text-sm">
              <Row
                icon={Hash}
                label="الرقم القومي"
                value={player.national_id}
              />
              <Row
                icon={Calendar}
                label="تاريخ الميلاد"
                value={formatDate(player.birth_date)}
              />
              <Row icon={User} label="سنة المواليد" value={player.birth_year} />
              <Row
                icon={Trophy}
                label="المركز"
                value={getPositionLabel(player.position)}
              />
              <Row
                icon={isInactive ? PowerOff : Power}
                label="الحالة"
                value={isInactive ? "غير نشط" : "نشط"}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="معلومات إضافية" />
            <div className="space-y-3 text-sm">
              <Row
                icon={MapPin}
                label="الأندية السابقة"
                value={player.previous_clubs || "-"}
              />
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                  المستوى الفني
                </p>
                <p className="text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg whitespace-pre-line text-sm">
                  {player.technical_level || "لا توجد ملاحظات"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Tab */}
      {tab === "stats" && (
        <div className="space-y-6">
          <PlayerStats
            goals={goals}
            assists={assists}
            yellowCards={yellows}
            redCards={reds}
            matchesPlayed={matchesPlayed}
            activeSuspensions={activeSuspensions}
          />

          {events.length > 0 && (
            <GoalsTrendChart
              data={events.map((e) => ({
                event_type: e.event_type,
                matches: e.matches,
              }))}
            />
          )}
        </div>
      )}

      {/* Injuries Tab */}
      {tab === "injuries" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card padding="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إجمالي الإصابات
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                {injuriesStats.total}
              </p>
            </Card>
            <Card padding="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                نشطة حالياً
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {injuriesStats.active}
              </p>
            </Card>
            <Card padding="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تعافى
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {injuriesStats.recovered}
              </p>
            </Card>
            <Card padding="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أيام الغياب
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {injuriesStats.totalDaysOut}
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="سجل الإصابات"
              subtitle={`${injuries.length} إصابة`}
            />
            {injuries.length === 0 ? (
              <EmptyState
                icon={HeartPulse}
                title="لا توجد إصابات"
                description="اللاعب لم يتعرض لأي إصابات مسجلة."
              />
            ) : (
              <div className="space-y-3">
                {injuries.map((inj) => {
                  const isActive = inj.status === "active";
                  return (
                    <div
                      key={inj.id}
                      className={`p-4 rounded-lg border-2 ${
                        isActive
                          ? "border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {getInjuryTypeIcon(inj.injury_type)}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {getInjuryTypeLabel(inj.injury_type)}
                              {inj.body_part &&
                                ` - ${getBodyPartLabel(inj.body_part)}`}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(inj.injury_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end">
                          <Badge
                            color={getInjurySeverityColor(inj.severity)}
                            size="sm"
                          >
                            {getInjurySeverityLabel(inj.severity)}
                          </Badge>
                          <Badge
                            color={getInjuryStatusColor(inj.status)}
                            size="sm"
                          >
                            {getInjuryStatusLabel(inj.status)}
                          </Badge>
                        </div>
                      </div>

                      {inj.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                          {inj.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {inj.expected_return_date && (
                          <span>
                            عودة متوقعة: {formatDate(inj.expected_return_date)}
                          </span>
                        )}
                        {inj.actual_return_date && (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ✅ عاد: {formatDate(inj.actual_return_date)}
                          </span>
                        )}
                        {inj.cause && (
                          <span>السبب: {getInjuryCauseLabel(inj.cause)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Attendance Tab */}
      {tab === "attendance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card padding="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300">
                  <Dumbbell size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    حضور التدريبات
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {attendanceStats.training.percentage}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {attendanceStats.training.present} /{" "}
                    {attendanceStats.training.total}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    حضور الاجتماعات
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {attendanceStats.meeting.percentage}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {attendanceStats.meeting.present} /{" "}
                    {attendanceStats.meeting.total}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    الحضور الإجمالي
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {attendanceStats.overall.percentage}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {attendanceStats.overall.present} /{" "}
                    {attendanceStats.overall.total}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="تفاصيل الحضور" />
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <Dumbbell size={16} className="text-emerald-600" /> التدريبات
                </p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {ATTENDANCE_STATUS.map((s) => (
                    <div
                      key={s.value}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center"
                    >
                      <p className="text-lg">{s.emoji}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {s.label}
                      </p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">
                        {attendanceStats.training[s.value] || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <MessageSquare size={16} className="text-purple-600" />{" "}
                  الاجتماعات
                </p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {ATTENDANCE_STATUS.map((s) => (
                    <div
                      key={s.value}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center"
                    >
                      <p className="text-lg">{s.emoji}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {s.label}
                      </p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">
                        {attendanceStats.meeting[s.value] || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="سجل الحضور"
              subtitle={`${attendance.length} سجل`}
            />
            {attendance.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title="لا يوجد سجل حضور"
                description="لم يسجل اللاعب أي حضور بعد."
              />
            ) : (
              <div className="space-y-2">
                {attendance.map((a) => {
                  const ev = a.event;
                  if (!ev) return null;
                  const isTraining = ev.event_type === "training";
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-2xl shrink-0">
                          {isTraining ? "💪" : "👥"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">
                            {ev.title ||
                              (isTraining
                                ? getTrainingTypeLabel(ev.training_type)
                                : `${getMeetingTypeLabel(ev.meeting_type)} اجتماع`)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(ev.event_date)}
                          </p>
                        </div>
                      </div>
                      <Badge color={getAttendanceColor(a.status)} size="sm">
                        {getAttendanceEmoji(a.status)}{" "}
                        {getAttendanceLabel(a.status)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Ratings Tab */}
      {tab === "ratings" && (
        <Card>
          <CardHeader
            title="التقييمات الفنية"
            subtitle={
              ratings.length > 0
                ? `${ratings.length} مباراة مقيّمة${
                    avgRating ? ` • المتوسط: ${avgRating}/10` : ""
                  }`
                : "لم يتم تقييم اللاعب بعد"
            }
          />
          {ratings.length === 0 ? (
            <EmptyState
              icon={Star}
              title="لا توجد تقييمات"
              description="لم يتم تقييم اللاعب في أي مباراة بعد."
            />
          ) : (
            <div className="space-y-3">
              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/matches/${r.match_id}`}
                      className="font-medium text-slate-800 dark:text-slate-100 text-sm hover:text-emerald-600"
                    >
                      ضد {r.matches?.opponent || "-"}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatDate(r.matches?.match_date)}
                      {r.matches?.teams?.name && ` • ${r.matches.teams.name}`}
                    </p>
                    {r.notes && (
                      <div className="mt-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          📝 ملاحظات فنية
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">
                          {r.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-center shrink-0">
                    <p
                      className={`text-3xl font-bold ${getRatingColor(r.rating)}`}
                    >
                      {r.rating}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      /10
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Suspensions Tab */}
      {tab === "suspensions" && (
        <PlayerSuspensions
          player={player}
          suspensions={suspensions}
          onAdd={handleAddSuspension}
          onUpdate={handleUpdateSuspension}
          onRemove={handleRemoveSuspension}
          onMarkFinePaid={handleMarkFinePaid}
          canEdit={teamAdmin || admin}
        />
      )}

      {/* Finance Tab */}
      {tab === "finance" && (
        <div className="space-y-4">
          <FinanceSummary summary={summary} />
          <Card>
            <CardHeader title="جدول الأقساط" />
            <InstallmentTable installments={installments} showPlayer={false} />
          </Card>
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <Card>
          <CardHeader
            title="سجل المشاركات"
            subtitle={`${matchHistory.length} مباراة`}
          />
          {matchHistory.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="لا توجد مشاركات"
              description="لم يشارك اللاعب في أي مباراة بعد."
            />
          ) : (
            <div className="space-y-3">
              {matchHistory.map((h) => {
                const m = h.match;
                if (!m) return null;

                const isHome = m.home_score != null && m.away_score != null;
                const result = isHome
                  ? m.home_score > m.away_score
                    ? "فوز"
                    : m.home_score < m.away_score
                      ? "خسارة"
                      : "تعادل"
                  : null;

                return (
                  <div
                    key={h.id}
                    className="p-4 rounded-lg border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 transition-colors"
                  >
                    <Link
                      to={`/matches/${h.match_id}`}
                      className="flex items-center justify-between gap-3 mb-3 hover:opacity-80 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">
                            ضد {m.opponent}
                          </h4>

                          {h.participationType === "starter" && (
                            <Badge color="emerald" size="sm">
                              أساسي
                            </Badge>
                          )}

                          {h.participationType === "sub_in" && (
                            <>
                              <Badge color="amber" size="sm">
                                احتياطي
                              </Badge>
                              <Badge color="blue" size="sm">
                                🔄 دخل بديل
                              </Badge>
                            </>
                          )}

                          {h.participationType === "bench" && (
                            <Badge color="slate" size="sm">
                              احتياطي
                            </Badge>
                          )}

                          {h.subbedOut && h.participationType === "starter" && (
                            <Badge color="red" size="sm">
                              🔁 خرج
                            </Badge>
                          )}

                          {result && (
                            <Badge
                              color={
                                result === "فوز"
                                  ? "emerald"
                                  : result === "خسارة"
                                    ? "red"
                                    : "slate"
                              }
                              size="sm"
                            >
                              {result}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(m.match_date)}
                        </p>
                      </div>
                      {isHome && (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shrink-0">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {m.home_score}
                          </span>
                          <span className="text-slate-400">-</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {m.away_score}
                          </span>
                        </div>
                      )}
                    </Link>

                    {h.events.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {h.events.map((ev) => {
                          const assist = ev.assist;
                          return (
                            <div
                              key={ev.id}
                              className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900 p-2 rounded"
                            >
                              <span className="text-lg">
                                {getEventIcon(ev.event_type)}
                              </span>
                              <span className="text-slate-700 dark:text-slate-200">
                                {getEventLabel(ev.event_type)}
                              </span>
                              {assist && (
                                <span className="text-slate-500 dark:text-slate-400">
                                  (صناعة: {assist.full_name})
                                </span>
                              )}
                              <span className="mr-auto font-bold text-emerald-600 dark:text-emerald-400">
                                {ev.minute}'
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {h.rating && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Star
                            size={14}
                            className="text-amber-500 fill-amber-500"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            تقييم المباراة
                          </span>
                        </div>
                        <span
                          className={`text-lg font-bold ${getRatingColor(h.rating)}`}
                        >
                          {h.rating}/10
                        </span>
                      </div>
                    )}

                    {h.ratingNotes && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded">
                        📝 {h.ratingNotes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Escalations Tab */}
      {tab === "escalations" && (
        <Card>
          <CardHeader title="طلبات التصعيد" />
          {escalations.length === 0 ? (
            <EmptyState icon={ArrowUpCircle} title="لا توجد طلبات تصعيد" />
          ) : (
            <div className="space-y-2">
              {escalations.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <div className="text-sm">
                    <p className="text-slate-700 dark:text-slate-200">
                      من <strong>{e.from_team?.name}</strong> إلى{" "}
                      <strong>{e.to_team?.name}</strong>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(e.created_at)}
                    </p>
                  </div>
                  <EscalationStatusBadge status={e.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modal: طلب تصعيد */}
      {showEscalation && (
        <Modal
          isOpen={showEscalation}
          onClose={() => setShowEscalation(false)}
          title="طلب تصعيد لاعب"
          size="md"
        >
          <EscalationForm
            player={player}
            onSuccess={() => {
              setShowEscalation(false);
              alert("تم إرسال طلب التصعيد ✅");
              loadAll();
            }}
            onCancel={() => setShowEscalation(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Icon size={14} /> {label}
      </span>
      <span className="font-medium text-slate-800 dark:text-slate-100 truncate">
        {value}
      </span>
    </div>
  );
}