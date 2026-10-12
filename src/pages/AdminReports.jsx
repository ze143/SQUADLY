import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  Ban,
  ArrowUpCircle,
  TrendingUp,
  Award,
  AlertTriangle,
  FileText,
  Trophy,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../utils/permissions";
import { useSector } from "../context/SectorContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import StatCard from "../components/reports/StatCard";
import ReportCard from "../components/reports/ReportCard";
import ReportTable from "../components/reports/ReportTable";
import {
  formatNumber,
  calcPercentage,
  formatDateShort,
  filterByDateRange,
} from "../utils/reportUtils";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  getPositionLabel,
  getSuspensionTypeLabel,
  getEscalationStatusLabel,
  getMatchStatusLabel,
} from "../utils/constants";

// ===== قائمة التقارير =====
const REPORTS = [
  {
    id: "teams",
    title: "أداء الفرق",
    description: "نتائج وأهداف كل فريق",
    icon: TrendingUp,
    color: "emerald",
  },
  {
    id: "players",
    title: "أفضل اللاعبين",
    description: "أهداف وصناعة وتقييمات",
    icon: Award,
    color: "blue",
  },
  {
    id: "matches",
    title: "المباريات",
    description: "كل المباريات ونتائجها",
    icon: Calendar,
    color: "purple",
  },
  {
    id: "finance",
    title: "المالية",
    description: "أقساط ومدفوعات ومتأخرات",
    icon: DollarSign,
    color: "amber",
  },
  {
    id: "suspensions",
    title: "الإيقافات",
    description: "الموقوفين والغرامات",
    icon: Ban,
    color: "red",
  },
  {
    id: "escalations",
    title: "التصعيدات",
    description: "طلبات النقل والتصعيد",
    icon: ArrowUpCircle,
    color: "indigo",
  },
];

export default function AdminReports() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const { selectedSectorId, selectedSector } = useSector();

  const [activeReport, setActiveReport] = useState("teams");
  const [teams, setTeams] = useState([]);
  const [filterTeam, setFilterTeam] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    teams: [],
    players: [],
    matches: [],
    finance: [],
    suspensions: [],
    escalations: [],
  });

  if (!admin) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="صلاحيات غير كافية"
          description="هذه الصفحة مخصصة للمدير الإداري فقط."
        />
      </Card>
    );
  }

  // ===== تحميل الفرق (مفلترة حسب القطاع) =====
  useEffect(() => {
    const load = async () => {
      const { data: activeSectorsData } = await supabase
        .from("sectors")
        .select("id")
        .eq("is_active", true);
      const activeIds = (activeSectorsData || []).map((s) => s.id);

      let q = supabase.from("teams").select("id, name, category").order("name");

      if (selectedSectorId) {
        q = q.eq("sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        q = q.in("sector_id", activeIds);
      }

      const { data } = await q;
      setTeams(data || []);
    };
    load();
  }, [selectedSectorId]);

  // ===== تحميل البيانات (كلها مفلترة حسب القطاع) =====
  const loadData = async () => {
    setLoading(true);
    try {
      // ✅ نجيب القطاعات النشطة مرة واحدة
      const { data: activeSectorsData } = await supabase
        .from("sectors")
        .select("id")
        .eq("is_active", true);
      const activeIds = (activeSectorsData || []).map((s) => s.id);

      // ===== الفرق =====
      let teamsQ = supabase
        .from("teams")
        .select("*")
        .order("birth_year", { ascending: false });

      if (selectedSectorId) {
        teamsQ = teamsQ.eq("sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        teamsQ = teamsQ.in("sector_id", activeIds);
      }

      // ===== اللاعبين =====
      let playersQ = supabase
        .from("players")
        .select(
          "id, full_name, position, birth_year, team_id, player_type, teams!inner(name, category, sector_id)"
        );

      if (selectedSectorId) {
        playersQ = playersQ.eq("teams.sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        playersQ = playersQ.in("teams.sector_id", activeIds);
      }

      // ===== المباريات =====
      let matchesQ = supabase
        .from("matches")
        .select("*, teams(name, category), competitions(name, season)")
        .order("match_date", { ascending: false });

      if (selectedSectorId) {
        matchesQ = matchesQ.eq("sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        matchesQ = matchesQ.in("sector_id", activeIds);
      }

      // ===== الأقساط =====
      let instQ = supabase
        .from("installments")
        .select(
          "*, players!inner(full_name, team_id, teams!inner(name, sector_id))"
        );

      if (selectedSectorId) {
        instQ = instQ.eq("players.teams.sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        instQ = instQ.in("players.teams.sector_id", activeIds);
      }

      // ===== الإيقافات =====
      let suspQ = supabase
        .from("suspensions")
        .select(
          "*, players!inner(full_name, team_id, teams!inner(name, sector_id))"
        );

      if (selectedSectorId) {
        suspQ = suspQ.eq("players.teams.sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        suspQ = suspQ.in("players.teams.sector_id", activeIds);
      }

      // ===== التصعيدات =====
      let escQ = supabase
        .from("escalation_requests")
        .select(
          `
          *,
          player:players(full_name),
          from_team:teams!escalation_requests_from_team_id_fkey(name, sector_id),
          to_team:teams!escalation_requests_to_team_id_fkey(name, sector_id)
        `
        )
        .order("created_at", { ascending: false });

      const [teamsRes, playersRes, matchesRes, instRes, suspRes, escRes] =
        await Promise.all([teamsQ, playersQ, matchesQ, instQ, suspQ, escQ]);

      // ===== فلترة التصعيدات (في الكود) =====
      let escalationsData = escRes.data || [];
      if (selectedSectorId) {
        escalationsData = escalationsData.filter(
          (e) =>
            e.from_team?.sector_id === selectedSectorId ||
            e.to_team?.sector_id === selectedSectorId
        );
      } else if (activeIds.length > 0) {
        escalationsData = escalationsData.filter(
          (e) =>
            activeIds.includes(e.from_team?.sector_id) ||
            activeIds.includes(e.to_team?.sector_id)
        );
      }

      // ===== حساب أداء الفرق =====
      const teamsStats = (teamsRes.data || []).map((team) => {
        const teamMatches = (matchesRes.data || []).filter(
          (m) => m.team_id === team.id && m.home_score !== null
        );
        const wins = teamMatches.filter(
          (m) => m.home_score > m.away_score
        ).length;
        const draws = teamMatches.filter(
          (m) => m.home_score === m.away_score
        ).length;
        const losses = teamMatches.filter(
          (m) => m.home_score < m.away_score
        ).length;
        const goalsFor = teamMatches.reduce(
          (s, m) => s + (m.home_score || 0),
          0
        );
        const goalsAgainst = teamMatches.reduce(
          (s, m) => s + (m.away_score || 0),
          0
        );

        return {
          id: team.id,
          name: team.name,
          category: team.category,
          birth_year: team.birth_year,
          played: teamMatches.length,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          diff: goalsFor - goalsAgainst,
          points: wins * 3 + draws,
        };
      });

      // ===== إحصائيات اللاعبين =====
      const playersStats = await Promise.all(
        (playersRes.data || []).map(async (p) => {
          const [goalsRes, assistsRes, yellowsRes, redsRes, ratingsRes] =
            await Promise.all([
              supabase
                .from("match_events")
                .select("id", { count: "exact", head: true })
                .eq("player_id", p.id)
                .eq("event_type", "goal"),
              supabase
                .from("match_events")
                .select("id", { count: "exact", head: true })
                .eq("player_id", p.id)
                .eq("event_type", "assist"),
              supabase
                .from("match_events")
                .select("id", { count: "exact", head: true })
                .eq("player_id", p.id)
                .eq("event_type", "yellow_card"),
              supabase
                .from("match_events")
                .select("id", { count: "exact", head: true })
                .eq("player_id", p.id)
                .eq("event_type", "red_card"),
              supabase
                .from("match_ratings")
                .select("rating")
                .eq("player_id", p.id),
            ]);

          const ratings = ratingsRes.data || [];
          const avgRating = ratings.length
            ? (
                ratings.reduce((s, r) => s + Number(r.rating), 0) /
                ratings.length
              ).toFixed(1)
            : null;

          return {
            ...p,
            goals: goalsRes.count || 0,
            assists: assistsRes.count || 0,
            yellows: yellowsRes.count || 0,
            reds: redsRes.count || 0,
            avgRating,
            team_name: p.teams?.name || "-",
          };
        })
      );

      setData({
        teams: teamsStats,
        players: playersStats,
        matches: matchesRes.data || [],
        finance: instRes.data || [],
        suspensions: suspRes.data || [],
        escalations: escalationsData,
      });
    } catch (err) {
      console.error(err);
      alert("خطأ في تحميل البيانات: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setFilterTeam(""); // نصفر فلتر الفريق لما يتغير القطاع
  }, [selectedSectorId]);

  // ===== فلترة حسب الفريق والتاريخ =====
  const applyFilters = (arr, teamKey = "team_id", dateKey = "created_at") => {
    let filtered = arr;
    if (filterTeam) {
      filtered = filtered.filter((item) => item[teamKey] === filterTeam);
    }
    if (filterFrom || filterTo) {
      filtered = filterByDateRange(filtered, dateKey, filterFrom, filterTo);
    }
    return filtered;
  };

  const totalPlayers = data.players.length;
  const totalMatches = data.matches.length;
  const totalTeams = data.teams.length;
  const totalActiveSuspensions = data.suspensions.filter(
    (s) => s.status === "active"
  ).length;
  const totalUnpaid = data.finance
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const pendingEscalations = data.escalations.filter(
    (e) => e.status === "pending"
  ).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-emerald-600" /> التقارير والتحليلات
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            تقارير شاملة لكل الأنشطة الإدارية والمالية
          </p>
        </div>
        {selectedSector && (
          <Badge color="emerald" size="lg">
            القطاع: {selectedSector.name}
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={Trophy}
          label="الفرق"
          value={formatNumber(totalTeams)}
          color="emerald"
        />
        <StatCard
          icon={Users}
          label="اللاعبون"
          value={formatNumber(totalPlayers)}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          label="المباريات"
          value={formatNumber(totalMatches)}
          color="purple"
        />
        <StatCard
          icon={DollarSign}
          label="غير مسدد"
          value={formatCurrency(totalUnpaid)}
          color="red"
        />
        <StatCard
          icon={Ban}
          label="إيقافات نشطة"
          value={formatNumber(totalActiveSuspensions)}
          color="amber"
        />
        <StatCard
          icon={ArrowUpCircle}
          label="تصعيدات معلقة"
          value={formatNumber(pendingEscalations)}
          color="indigo"
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select
            label="الفريق"
            placeholder="كل الفرق"
            options={teams.map((t) => ({
              value: t.id,
              label: `${t.name} - ${t.category}`,
            }))}
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          />
          <Input
            type="date"
            label="من تاريخ"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
          <Input
            type="date"
            label="إلى تاريخ"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>
        {(filterTeam || filterFrom || filterTo) && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                setFilterTeam("");
                setFilterFrom("");
                setFilterTo("");
              }}
              className="text-sm text-emerald-600 hover:underline"
            >
              ✕ مسح الفلاتر
            </button>
          </div>
        )}
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id)}
            className={[
              "text-right transition",
              activeReport === r.id ? "ring-2 ring-emerald-500 rounded-xl" : "",
            ].join(" ")}
          >
            <ReportCard
              icon={r.icon}
              title={r.title}
              description={r.description}
              color={r.color}
            />
          </button>
        ))}
      </div>

      {/* Active Report */}
      {activeReport === "teams" && (
        <TeamReport
          data={applyFilters(data.teams, null, null)}
          filterTeam={filterTeam}
        />
      )}
      {activeReport === "players" && (
        <PlayerReport data={applyFilters(data.players, "team_id", null)} />
      )}
      {activeReport === "matches" && (
        <MatchReport
          data={applyFilters(data.matches, "team_id", "match_date")}
        />
      )}
      {activeReport === "finance" && (
        <FinanceReport data={applyFilters(data.finance, null, null)} />
      )}
      {activeReport === "suspensions" && (
        <SuspensionReport data={applyFilters(data.suspensions, null, null)} />
      )}
      {activeReport === "escalations" && (
        <EscalationReport data={data.escalations} />
      )}
    </div>
  );
}

// =========================================================
// Team Report
// =========================================================
function TeamReport({ data }) {
  const columns = [
    { key: "name", label: "الفريق" },
    { key: "category", label: "الفئة" },
    { key: "played", label: "لعب" },
    {
      key: "wins",
      label: "فاز",
      render: (r) => (
        <span className="text-emerald-600 font-medium">{r.wins}</span>
      ),
    },
    {
      key: "draws",
      label: "تعادل",
      render: (r) => (
        <span className="text-amber-600 font-medium">{r.draws}</span>
      ),
    },
    {
      key: "losses",
      label: "خسر",
      render: (r) => (
        <span className="text-red-600 font-medium">{r.losses}</span>
      ),
    },
    { key: "goalsFor", label: "له" },
    { key: "goalsAgainst", label: "عليه" },
    {
      key: "diff",
      label: "الفارق",
      render: (r) => (
        <span
          className={
            r.diff > 0 ? "text-emerald-600" : r.diff < 0 ? "text-red-600" : ""
          }
        >
          {r.diff > 0 ? "+" : ""}
          {r.diff}
        </span>
      ),
    },
    {
      key: "points",
      label: "النقاط",
      render: (r) => (
        <span className="font-bold text-emerald-700">{r.points}</span>
      ),
    },
  ];

  return (
    <ReportTable
      title="تقرير أداء الفرق"
      subtitle={`${data.length} فريق`}
      columns={columns}
      data={data}
      exportFilename="teams-report"
    />
  );
}

// =========================================================
// Player Report
// =========================================================
function PlayerReport({ data }) {
  const sorted = [...data].sort(
    (a, b) => b.goals - a.goals || b.assists - a.assists
  );

  const columns = [
    { key: "full_name", label: "اللاعب" },
    { key: "team_name", label: "الفريق" },
    {
      key: "position",
      label: "المركز",
      render: (r) => getPositionLabel(r.position),
    },
    { key: "birth_year", label: "المواليد" },
    {
      key: "goals",
      label: "أهداف",
      render: (r) => (
        <span className="font-bold text-emerald-600">{r.goals}</span>
      ),
    },
    {
      key: "assists",
      label: "صناعة",
      render: (r) => (
        <span className="font-bold text-blue-600">{r.assists}</span>
      ),
    },
    {
      key: "yellows",
      label: "إنذارات",
      render: (r) => <span className="text-amber-600">{r.yellows}</span>,
    },
    {
      key: "reds",
      label: "طرد",
      render: (r) => <span className="text-red-600">{r.reds}</span>,
    },
    {
      key: "avgRating",
      label: "التقييم",
      render: (r) =>
        r.avgRating ? (
          <Badge color={Number(r.avgRating) >= 7 ? "emerald" : "slate"}>
            {r.avgRating}
          </Badge>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  return (
    <ReportTable
      title="تقرير اللاعبين"
      subtitle={`${sorted.length} لاعب — مرتب حسب الأهداف`}
      columns={columns}
      data={sorted}
      exportFilename="players-report"
    />
  );
}

// =========================================================
// Match Report
// =========================================================
function MatchReport({ data }) {
  const columns = [
    {
      key: "team",
      label: "فريقنا",
      accessor: (r) => r.teams?.name || "-",
    },
    { key: "opponent", label: "الخصم" },
    {
      key: "competition",
      label: "المسابقة",
      accessor: (r) => r.competitions?.name || "-",
    },
    {
      key: "match_date",
      label: "التاريخ",
      render: (r) => formatDate(r.match_date),
    },
    {
      key: "score",
      label: "النتيجة",
      render: (r) => (
        <span className="font-bold">
          {r.home_score} - {r.away_score}
        </span>
      ),
    },
    {
      key: "result",
      label: "النتيجة",
      render: (r) => {
        if (r.home_score === null) return <Badge color="slate">—</Badge>;
        if (r.home_score > r.away_score)
          return <Badge color="emerald">فوز</Badge>;
        if (r.home_score < r.away_score)
          return <Badge color="red">خسارة</Badge>;
        return <Badge color="amber">تعادل</Badge>;
      },
    },
    {
      key: "status",
      label: "الحالة",
      render: (r) => (
        <Badge color="slate">{getMatchStatusLabel(r.status)}</Badge>
      ),
    },
  ];

  return (
    <ReportTable
      title="تقرير المباريات"
      subtitle={`${data.length} مباراة`}
      columns={columns}
      data={data}
      exportFilename="matches-report"
    />
  );
}

// =========================================================
// Finance Report
// =========================================================
function FinanceReport({ data }) {
  const paid = data.filter((i) => i.status === "paid").length;
  const unpaid = data.filter((i) => i.status === "unpaid").length;
  const totalAmount = data.reduce((s, i) => s + Number(i.amount || 0), 0);
  const paidAmount = data
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  const columns = [
    {
      key: "player",
      label: "اللاعب",
      accessor: (r) => r.players?.full_name || "-",
    },
    {
      key: "team",
      label: "الفريق",
      accessor: (r) => r.players?.teams?.name || "-",
    },
    {
      key: "amount",
      label: "المبلغ",
      render: (r) => (
        <span className="font-bold">{formatCurrency(r.amount)}</span>
      ),
    },
    {
      key: "due_date",
      label: "الاستحقاق",
      render: (r) => formatDateShort(r.due_date),
    },
    {
      key: "paid_date",
      label: "السداد",
      render: (r) => (r.paid_date ? formatDateShort(r.paid_date) : "—"),
    },
    {
      key: "status",
      label: "الحالة",
      render: (r) => (
        <Badge
          color={
            r.status === "paid"
              ? "emerald"
              : r.status === "unpaid"
                ? "red"
                : "amber"
          }
        >
          {r.status === "paid"
            ? "مسدد"
            : r.status === "unpaid"
              ? "غير مسدد"
              : "قيد الانتظار"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={DollarSign}
          label="إجمالي"
          value={formatCurrency(totalAmount)}
          color="slate"
        />
        <StatCard
          icon={DollarSign}
          label="المدفوع"
          value={formatCurrency(paidAmount)}
          color="emerald"
        />
        <StatCard
          icon={DollarSign}
          label="المتبقي"
          value={formatCurrency(totalAmount - paidAmount)}
          color="red"
        />
        <StatCard
          icon={FileText}
          label="مسدد"
          value={`${paid} قسط`}
          color="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          label="متأخر"
          value={`${unpaid} قسط`}
          color="red"
        />
      </div>
      <ReportTable
        title="تقرير الأقساط"
        subtitle={`${data.length} قسط — نسبة السداد ${calcPercentage(paidAmount, totalAmount)}%`}
        columns={columns}
        data={data}
        exportFilename="finance-report"
      />
    </>
  );
}

// =========================================================
// Suspension Report
// =========================================================
function SuspensionReport({ data }) {
  const active = data.filter((s) => s.status === "active").length;
  const totalFines = data.reduce((s, i) => s + Number(i.fine_amount || 0), 0);
  const unpaidFines = data
    .filter((s) => s.fine_status === "unpaid")
    .reduce((s, i) => s + Number(i.fine_amount || 0), 0);

  const columns = [
    {
      key: "player",
      label: "اللاعب",
      accessor: (r) => r.players?.full_name || "-",
    },
    {
      key: "team",
      label: "الفريق",
      accessor: (r) => r.players?.teams?.name || "-",
    },
    {
      key: "type",
      label: "النوع",
      render: (r) => getSuspensionTypeLabel(r.type),
    },
    {
      key: "matches",
      label: "المباريات",
      render: (r) => `${r.matches_served} / ${r.matches_suspended}`,
    },
    {
      key: "start",
      label: "البداية",
      render: (r) => formatDateShort(r.start_date),
    },
    {
      key: "status",
      label: "الحالة",
      render: (r) => (
        <Badge
          color={
            r.status === "active"
              ? "red"
              : r.status === "completed"
                ? "emerald"
                : "slate"
          }
        >
          {r.status === "active"
            ? "نشط"
            : r.status === "completed"
              ? "مكتمل"
              : "ملغى"}
        </Badge>
      ),
    },
    {
      key: "fine",
      label: "الغرامة",
      render: (r) =>
        Number(r.fine_amount) > 0 ? (
          <Badge color={r.fine_status === "paid" ? "emerald" : "red"}>
            {formatCurrency(r.fine_amount)}
          </Badge>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={Ban}
          label="إيقافات نشطة"
          value={formatNumber(active)}
          color="red"
        />
        <StatCard
          icon={DollarSign}
          label="إجمالي الغرامات"
          value={formatCurrency(totalFines)}
          color="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="غرامات غير مسددة"
          value={formatCurrency(unpaidFines)}
          color="red"
        />
      </div>
      <ReportTable
        title="تقرير الإيقافات"
        subtitle={`${data.length} إيقاف`}
        columns={columns}
        data={data}
        exportFilename="suspensions-report"
      />
    </>
  );
}

// =========================================================
// Escalation Report
// =========================================================
function EscalationReport({ data }) {
  const columns = [
    {
      key: "player",
      label: "اللاعب",
      accessor: (r) => r.player?.full_name || "-",
    },
    { key: "from", label: "من", accessor: (r) => r.from_team?.name || "-" },
    { key: "to", label: "إلى", accessor: (r) => r.to_team?.name || "-" },
    {
      key: "type",
      label: "النوع",
      render: (r) => (
        <Badge color={r.escalation_type === "match" ? "blue" : "purple"}>
          {r.escalation_type === "match" ? "لمباراة" : "عام"}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      render: (r) => (
        <Badge
          color={
            r.status === "approved"
              ? "emerald"
              : r.status === "rejected"
                ? "red"
                : "amber"
          }
        >
          {getEscalationStatusLabel(r.status)}
        </Badge>
      ),
    },
    {
      key: "created",
      label: "التاريخ",
      render: (r) => formatDateShort(r.created_at),
    },
  ];

  return (
    <ReportTable
      title="تقرير التصعيدات"
      subtitle={`${data.length} طلب`}
      columns={columns}
      data={data}
      exportFilename="escalations-report"
    />
  );
}