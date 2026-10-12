import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight, User, DollarSign, Trophy, Calendar, ArrowUpCircle,
  MapPin, Hash, Edit, Star, Ban, Power, PowerOff,
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
import InstallmentTable, {
  FinanceSummary,
} from "../components/finance/InstallmentTable";
import EmptyState from "../components/ui/EmptyState";
import EscalationForm from "../components/escalation/EscalationForm";
import {
  getPositionLabel,
  getEventIcon,
  getEventLabel,
} from "../utils/constants";
import { formatDate, getInitials } from "../utils/formatters";

const TABS = [
  { id: "info", label: "البيانات", icon: User },
  { id: "stats", label: "الإحصائيات", icon: Trophy },
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
      const [playerRes, eventsRes, instRes, escRes, ratingsRes, suspRes] =
        await Promise.all([
          supabase
            .from("players")
            .select("*, teams(id, name, category)")
            .eq("id", id)
            .single(),
          supabase
            .from("match_events")
            .select(`
              *,
              matches(id, opponent, match_date, home_score, away_score),
              assist:players!match_events_assist_player_id_fkey(full_name)
            `)
            .eq("player_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("installments")
            .select("*")
            .eq("player_id", id)
            .order("due_date", { ascending: true }),
          supabase
            .from("escalation_requests")
            .select(`
              *,
              from_team:teams!escalation_requests_from_team_id_fkey(name, category),
              to_team:teams!escalation_requests_to_team_id_fkey(name, category)
            `)
            .eq("player_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("match_ratings")
            .select(`
              *,
              matches(id, opponent, match_date, teams(name))
            `)
            .eq("player_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("suspensions")
            .select("*")
            .eq("player_id", id)
            .order("created_at", { ascending: false }),
        ]);

      if (playerRes.error) throw playerRes.error;
      setPlayer(playerRes.data);
      setEvents(eventsRes.data || []);
      setInstallments(instRes.data || []);
      setEscalations(escRes.data || []);
      setRatings(ratingsRes.data || []);
      setSuspensions(suspRes.data || []);
    } catch (err) {
      console.error(err);
      alert("خطأ في تحميل البيانات");
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
  const matchesPlayed = new Set(events.map((e) => e.match_id)).size;
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
            <h1 className="text-2xl font-bold text-slate-800">
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
              <p className="text-xs text-slate-500">أهداف</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{assists}</p>
              <p className="text-xs text-slate-500">صناعة</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {matchesPlayed}
              </p>
              <p className="text-xs text-slate-500">مباريات</p>
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${
                  avgRating ? getRatingColor(avgRating) : "text-slate-400"
                }`}
              >
                {avgRating ? `${avgRating}` : "—"}
              </p>
              <p className="text-xs text-slate-500">التقييم</p>
            </div>
          </div>
        </div>
      </Card>

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
              {t.id === "suspensions" && activeSuspensions > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeSuspensions}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
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
                <p className="text-slate-500 mb-2">المستوى الفني</p>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-line text-sm">
                  {player.technical_level || "لا توجد ملاحظات"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "stats" && (
        <PlayerStats
          goals={goals}
          assists={assists}
          yellowCards={yellows}
          redCards={reds}
          matchesPlayed={matchesPlayed}
          activeSuspensions={activeSuspensions}
        />
      )}

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
                  className="flex items-start justify-between gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/matches/${r.match_id}`}
                      className="font-medium text-slate-800 text-sm hover:text-emerald-600"
                    >
                      ضد {r.matches?.opponent || "-"}
                    </Link>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(r.matches?.match_date)}
                      {r.matches?.teams?.name && ` • ${r.matches.teams.name}`}
                    </p>
                    {r.notes && (
                      <div className="mt-2 bg-white p-2.5 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">
                          📝 ملاحظات فنية
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-line">
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
                    <p className="text-xs text-slate-500">/10</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

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

      {tab === "finance" && (
        <div className="space-y-4">
          <FinanceSummary summary={summary} />
          <Card>
            <CardHeader title="جدول الأقساط" />
            <InstallmentTable installments={installments} showPlayer={false} />
          </Card>
        </div>
      )}

      {tab === "history" && (
        <Card>
          <CardHeader title="سجل الأحداث والمشاركات" />
          {events.length === 0 ? (
            <EmptyState icon={Calendar} title="لا توجد أحداث مسجلة" />
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <Link
                  key={ev.id}
                  to={`/matches/${ev.match_id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">
                      {getEventIcon(ev.event_type)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        ضد {ev.matches?.opponent || "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getEventLabel(ev.event_type)}
                        {ev.assist && ` • صناعة: ${ev.assist.full_name}`}
                        {" • "}
                        {formatDate(ev.matches?.match_date)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600 text-sm shrink-0">
                    {ev.minute}'
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

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
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="text-sm">
                    <p className="text-slate-700">
                      من <strong>{e.from_team?.name}</strong> إلى{" "}
                      <strong>{e.to_team?.name}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
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
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
      <span className="text-slate-500 flex items-center gap-2">
        <Icon size={14} /> {label}
      </span>
      <span className="font-medium text-slate-800 truncate">{value}</span>
    </div>
  );
}