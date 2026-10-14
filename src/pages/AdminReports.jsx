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
  HeartPulse,
  Wallet,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
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
  getInjuryTypeLabel,
  getInjuryTypeIcon,
  getInjurySeverityLabel,
  getInjurySeverityColor,
  getBodyPartLabel,
  getInjuryCauseLabel,
  getInjuryStatusLabel,
  getInjuryStatusColor,
} from "../utils/constants";
import {
  getAssessmentStatusLabel,
  getAssessmentStatusColor,
  getAdminDecisionLabel,
  getAdminDecisionColor,
  getAdminDecisionIcon,
  getFinalDecisionLabel,
  getFinalDecisionColor,
  getFinalDecisionIcon,
  getPlayerTypeIcon,
  getPlayerTypeLabel,
} from "../utils/assessmentConstants";
import TeamPerformanceChart from "../components/charts/TeamPerformanceChart";
import GoalsTrendChart from "../components/charts/GoalsTrendChart";
import PositionsChart from "../components/charts/PositionsChart";

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
  {
    id: "injuries",
    title: "الإصابات",
    description: "سجل الإصابات والغيابات",
    icon: HeartPulse,
    color: "red",
  },
  {
    id: "assessments",
    title: "الاختبارات",
    description: "اختبارات وقرارات ومشاركين",
    icon: ClipboardList,
    color: "purple",
  },
  {
    id: "treasury",
    title: "الخزينة",
    description: "إيرادات ومصروفات ورصيد",
    icon: Wallet,
    color: "emerald",
  },
  {
    id: "contracts",
    title: "العقود",
    description: "عقود ودفعات والتزامات",
    icon: FileText,
    color: "blue",
  },
  {
    id: "charts",
    title: "رسوم بيانية",
    description: "مخططات تفاعلية",
    icon: BarChart3,
    color: "purple",
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
    events: [],
    injuries: [],
    treasury: [],
    contracts: [],
    assessments: [],
    assessment_participants: [],
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

  // ===== تحميل الفرق =====
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

  // ===== تحميل البيانات =====
  const loadData = async () => {
    setLoading(true);
    try {
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
          "id, full_name, position, birth_year, team_id, player_type, teams(name, category, sector_id)",
        );

      if (selectedSectorId) {
        playersQ = playersQ.eq("teams.sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        playersQ = playersQ.in("teams.sector_id", activeIds);
      }

      // ===== المباريات =====
      let matchesQ = supabase
        .from("matches")
        .select(
          `
          *,
          teams(name, category),
          competitions(name, season),
          penalty_shots(team_side, is_scored)
        `,
        )
        .order("match_date", { ascending: false });

      if (selectedSectorId) {
        matchesQ = matchesQ.eq("sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        matchesQ = matchesQ.in("sector_id", activeIds);
      }

      // ===== الأقساط =====
      let instQ = supabase
        .from("installments")
        .select("*, players(full_name, team_id, teams(name, sector_id))");

      if (selectedSectorId) {
        instQ = instQ.eq("players.teams.sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        instQ = instQ.in("players.teams.sector_id", activeIds);
      }

      // ===== الإيقافات =====
      let suspQ = supabase
        .from("suspensions")
        .select("*, players(full_name, team_id, teams(name, sector_id))");

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
        `,
        )
        .order("created_at", { ascending: false });

      // ===== الإصابات =====
      let injuriesQ = supabase
        .from("injuries")
        .select("*, players(full_name, team_id, teams(name, sector_id))")
        .order("injury_date", { ascending: false });

      if (selectedSectorId) {
        injuriesQ = injuriesQ.eq("players.teams.sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        injuriesQ = injuriesQ.in("players.teams.sector_id", activeIds);
      }

      // ===== الأحداث =====
      let eventsQ = supabase
        .from("match_events")
        .select(
          `
          id, event_type, player_id, minute,
          matches(id, opponent, match_date),
          players(id, full_name, team_id, teams(sector_id))
        `,
        )
        .in("event_type", ["goal", "assist"]);

      if (selectedSectorId) {
        eventsQ = eventsQ.eq("players.teams.sector_id", selectedSectorId);
      } else if (activeIds.length > 0) {
        eventsQ = eventsQ.in("players.teams.sector_id", activeIds);
      }

      // ===== الخزينة =====
      const treasuryQ = supabase
        .from("treasury_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      // ===== العقود =====
      const contractsQ = supabase
        .from("contracts")
        .select(
          `
          *,
          players(id, full_name)
        `,
        )
        .order("created_at", { ascending: false });

      // ✅ الاختبارات
      const assessmentsQ = supabase
        .from("assessments")
        .select(`*, teams(id, name, category, sector_id)`)
        .order("created_at", { ascending: false });

      // ✅ المشاركين في الاختبارات
      const participantsQ = supabase
        .from("assessment_participants")
        .select("*")
        .eq("is_primary", true);

      const [
        teamsRes,
        playersRes,
        matchesRes,
        instRes,
        suspRes,
        escRes,
        eventsRes,
        injuriesRes,
        treasuryRes,
        contractsRes,
        assessmentsRes,
        participantsRes,
      ] = await Promise.all([
        teamsQ,
        playersQ,
        matchesQ,
        instQ,
        suspQ,
        escQ,
        eventsQ,
        injuriesQ,
        treasuryQ,
        contractsQ,
        assessmentsQ,
        participantsQ,
      ]);

      // ===== فلترة التصعيدات =====
      let escalationsData = escRes.data || [];
      if (selectedSectorId) {
        escalationsData = escalationsData.filter(
          (e) =>
            e.from_team?.sector_id === selectedSectorId ||
            e.to_team?.sector_id === selectedSectorId,
        );
      } else if (activeIds.length > 0) {
        escalationsData = escalationsData.filter(
          (e) =>
            activeIds.includes(e.from_team?.sector_id) ||
            activeIds.includes(e.to_team?.sector_id),
        );
      }

      // ===== حساب أداء الفرق =====
      const teamsStats = (teamsRes.data || []).map((team) => {
        const teamMatches = (matchesRes.data || []).filter(
          (m) => m.team_id === team.id && m.home_score !== null,
        );

        let wins = 0;
        let draws = 0;
        let losses = 0;
        let penaltyWins = 0;
        let penaltyLosses = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;

        teamMatches.forEach((m) => {
          const homeScore = Number(m.home_score) || 0;
          const awayScore = Number(m.away_score) || 0;

          goalsFor += homeScore;
          goalsAgainst += awayScore;

          const homePens = (m.penalty_shots || []).filter(
            (p) => p.team_side === "home" && p.is_scored,
          ).length;
          const awayPens = (m.penalty_shots || []).filter(
            (p) => p.team_side === "away" && p.is_scored,
          ).length;

          const hasPenalties =
            (m.penalty_shots?.length || 0) > 0 ||
            m.has_penalties === true ||
            m.penalties_locked === true ||
            m.penalty_home_score > 0 ||
            m.penalty_away_score > 0;

          const penHome = homePens || m.penalty_home_score || 0;
          const penAway = awayPens || m.penalty_away_score || 0;

          const isDrawInRegularTime = homeScore === awayScore;

          if (hasPenalties && penHome !== penAway) {
            if (penHome > penAway) {
              wins++;
              penaltyWins++;
            } else {
              losses++;
              penaltyLosses++;
            }
          } else if (!isDrawInRegularTime) {
            if (homeScore > awayScore) wins++;
            else losses++;
          } else {
            draws++;
          }
        });

        return {
          id: team.id,
          name: team.name,
          category: team.category,
          birth_year: team.birth_year,
          played: teamMatches.length,
          wins,
          draws,
          losses,
          penaltyWins,
          penaltyLosses,
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
            team_name: p.teams?.name || "بدون فريق",
          };
        }),
      );

      setData({
        teams: teamsStats,
        players: playersStats,
        matches: matchesRes.data || [],
        finance: instRes.data || [],
        suspensions: suspRes.data || [],
        escalations: escalationsData,
        events: eventsRes.data || [],
        injuries: injuriesRes.data || [],
        treasury: treasuryRes.data || [],
        contracts: contractsRes.data || [],
        assessments: assessmentsRes.data || [],
        assessment_participants: participantsRes.data || [],
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
    setFilterTeam("");
  }, [selectedSectorId]);

  // ===== فلترة =====
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
    (s) => s.status === "active",
  ).length;
  const totalUnpaid = data.finance
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const pendingEscalations = data.escalations.filter(
    (e) => e.status === "pending",
  ).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="text-emerald-600 dark:text-emerald-400" />{" "}
            التقارير والتحليلات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ✕ مسح الفلاتر
            </button>
          </div>
        )}
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
      {activeReport === "injuries" && (
        <InjuryReport data={applyFilters(data.injuries, null, null)} />
      )}
      {activeReport === "assessments" && (
        <AssessmentsReport
          data={data.assessments}
          participants={data.assessment_participants}
        />
      )}
      {activeReport === "treasury" && (
        <TreasuryReport
          data={applyFilters(data.treasury, null, "transaction_date")}
        />
      )}
      {activeReport === "contracts" && (
        <ContractsReport data={data.contracts} />
      )}

      {activeReport === "charts" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamPerformanceChart data={data.teams} loading={loading} />
            <PositionsChart players={data.players} loading={loading} />
          </div>
          <GoalsTrendChart data={data.events} loading={loading} />
        </div>
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
        <div>
          <span className="text-emerald-600 font-medium">{r.wins}</span>
          {r.penaltyWins > 0 && (
            <span className="block text-[10px] text-slate-400 font-normal">
              ({r.penaltyWins} ترجيح)
            </span>
          )}
        </div>
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
        <div>
          <span className="text-red-600 font-medium">{r.losses}</span>
          {r.penaltyLosses > 0 && (
            <span className="block text-[10px] text-slate-400 font-normal">
              ({r.penaltyLosses} ترجيح)
            </span>
          )}
        </div>
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
    (a, b) => b.goals - a.goals || b.assists - a.assists,
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
      render: (r) => {
        const homePens = (r.penalty_shots || []).filter(
          (p) => p.team_side === "home" && p.is_scored,
        ).length;
        const awayPens = (r.penalty_shots || []).filter(
          (p) => p.team_side === "away" && p.is_scored,
        ).length;

        const hasPenalties =
          (r.penalty_shots?.length || 0) > 0 ||
          r.has_penalties === true ||
          r.penalties_locked === true;

        const penHome = homePens || r.penalty_home_score || 0;
        const penAway = awayPens || r.penalty_away_score || 0;

        return (
          <div>
            <span className="font-bold">
              {r.home_score} - {r.away_score}
            </span>
            {hasPenalties && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                🎯 ترجيح: {penHome}-{penAway}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "result",
      label: "النتيجة",
      render: (r) => {
        if (r.home_score === null) return <Badge color="slate">—</Badge>;

        const homePens = (r.penalty_shots || []).filter(
          (p) => p.team_side === "home" && p.is_scored,
        ).length;
        const awayPens = (r.penalty_shots || []).filter(
          (p) => p.team_side === "away" && p.is_scored,
        ).length;

        const hasPenalties =
          (r.penalty_shots?.length || 0) > 0 ||
          r.has_penalties === true ||
          r.penalties_locked === true;

        const penHome = homePens || r.penalty_home_score || 0;
        const penAway = awayPens || r.penalty_away_score || 0;

        if (hasPenalties && penHome !== penAway) {
          return penHome > penAway ? (
            <Badge color="emerald">فوز (ترجيح)</Badge>
          ) : (
            <Badge color="red">خسارة (ترجيح)</Badge>
          );
        }

        if (Number(r.home_score) > Number(r.away_score))
          return <Badge color="emerald">فوز</Badge>;
        if (Number(r.home_score) < Number(r.away_score))
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
      accessor: (r) => r.players?.teams?.name || "بدون فريق",
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
      accessor: (r) => r.players?.teams?.name || "بدون فريق",
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

// =========================================================
// Injury Report
// =========================================================
function InjuryReport({ data }) {
  const active = data.filter((i) => i.status === "active").length;
  const recovered = data.filter((i) => i.status === "recovered").length;
  const severe = data.filter((i) => i.severity === "severe").length;

  const totalDaysOut = data.reduce((sum, inj) => {
    const start = new Date(inj.injury_date);
    const end = inj.actual_return_date
      ? new Date(inj.actual_return_date)
      : new Date();
    const days = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    return sum + days;
  }, 0);

  const columns = [
    {
      key: "player",
      label: "اللاعب",
      accessor: (r) => r.players?.full_name || "-",
    },
    {
      key: "team",
      label: "الفريق",
      accessor: (r) => r.players?.teams?.name || "بدون فريق",
    },
    {
      key: "type",
      label: "النوع",
      render: (r) => (
        <span>
          {getInjuryTypeIcon(r.injury_type)} {getInjuryTypeLabel(r.injury_type)}
        </span>
      ),
    },
    {
      key: "body_part",
      label: "الجزء",
      render: (r) => (r.body_part ? getBodyPartLabel(r.body_part) : "—"),
    },
    {
      key: "severity",
      label: "الشدة",
      render: (r) => (
        <Badge color={getInjurySeverityColor(r.severity)}>
          {getInjurySeverityLabel(r.severity)}
        </Badge>
      ),
    },
    {
      key: "injury_date",
      label: "التاريخ",
      render: (r) => formatDateShort(r.injury_date),
    },
    {
      key: "return_date",
      label: "العودة",
      render: (r) => {
        if (r.actual_return_date) {
          return (
            <span className="text-emerald-600 dark:text-emerald-400">
              {formatDateShort(r.actual_return_date)}
            </span>
          );
        }
        if (r.expected_return_date) {
          return (
            <span className="text-amber-600 dark:text-amber-400">
              متوقع: {formatDateShort(r.expected_return_date)}
            </span>
          );
        }
        return <span className="text-slate-400">—</span>;
      },
    },
    {
      key: "cause",
      label: "السبب",
      render: (r) => (r.cause ? getInjuryCauseLabel(r.cause) : "—"),
    },
    {
      key: "status",
      label: "الحالة",
      render: (r) => (
        <Badge color={getInjuryStatusColor(r.status)}>
          {getInjuryStatusLabel(r.status)}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={HeartPulse}
          label="إجمالي الإصابات"
          value={formatNumber(data.length)}
          color="slate"
        />
        <StatCard
          icon={AlertTriangle}
          label="نشطة حالياً"
          value={formatNumber(active)}
          color="red"
        />
        <StatCard
          icon={Trophy}
          label="تعافى"
          value={formatNumber(recovered)}
          color="emerald"
        />
        <StatCard
          icon={Calendar}
          label="أيام الغياب"
          value={formatNumber(totalDaysOut)}
          color="amber"
        />
      </div>

      {severe > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 text-sm p-3 rounded-lg transition-colors">
          ⚠️ يوجد <strong>{severe}</strong> إصابة شديدة في السجل. راجعها مع
          الطبيب المختص.
        </div>
      )}

      <ReportTable
        title="تقرير الإصابات"
        subtitle={`${data.length} إصابة`}
        columns={columns}
        data={data}
        exportFilename="injuries-report"
      />
    </>
  );
}

// =========================================================
// Assessments Report (جديد)
// =========================================================
function AssessmentsReport({ data, participants }) {
  const total = data.length;
  const active = data.filter((a) =>
    ["active", "in_progress", "pending_approval"].includes(a.status),
  ).length;
  const approved = data.filter((a) => a.status === "approved").length;
  const locked = data.filter((a) => a.status === "locked").length;

  // ✅ إحصائيات القرارات
  const accepted = participants.filter(
    (p) => p.final_decision === "accepted",
  ).length;
  const rejected = participants.filter(
    (p) => p.final_decision === "rejected",
  ).length;
  const pending = participants.filter(
    (p) => p.final_decision === "pending",
  ).length;
  const secondChance = participants.filter(
    (p) => p.admin_decision === "needs_second_chance",
  ).length;
  const added = participants.filter((p) => p.is_added_to_players).length;

  // ✅ حساب فرق النسبة (للاستثماريين)
  const withBoth = participants.filter(
    (p) =>
      p.suggested_player_type === "investment" &&
      p.suggested_percentage &&
      p.final_percentage,
  );
  const avgDiff =
    withBoth.length > 0
      ? (
          withBoth.reduce(
            (s, p) =>
              s +
              (Number(p.final_percentage) - Number(p.suggested_percentage)),
            0,
          ) / withBoth.length
        ).toFixed(1)
      : 0;

  const columns = [
    { key: "name", label: "الاسم" },
    {
      key: "birth_year",
      label: "المواليد",
      render: (r) => r.birth_year || "—",
    },
    {
      key: "teams",
      label: "الفريق",
      render: (r) => r.teams?.name || "بدون فريق",
    },
    {
      key: "start_date",
      label: "البداية",
      render: (r) => formatDateShort(r.start_date),
    },
    {
      key: "end_date",
      label: "النهاية",
      render: (r) => (r.end_date ? formatDateShort(r.end_date) : "—"),
    },
    {
      key: "status",
      label: "الحالة",
      render: (r) => (
        <Badge color={getAssessmentStatusColor(r.status)} size="sm">
          {getAssessmentStatusLabel(r.status)}
        </Badge>
      ),
    },
  ];

  return (
    <>
      {/* إحصائيات الاختبارات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={ClipboardList}
          label="إجمالي الاختبارات"
          value={formatNumber(total)}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="نشطة"
          value={formatNumber(active)}
          color="amber"
        />
        <StatCard
          icon={CheckCircle}
          label="معتمدة"
          value={formatNumber(approved)}
          color="emerald"
        />
        <StatCard
          icon={Clock}
          label="مقفولة"
          value={formatNumber(locked)}
          color="slate"
        />
      </div>

      {/* إحصائيات القرارات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={Users}
          label="إجمالي المشاركين"
          value={formatNumber(participants.length)}
          color="slate"
        />
        <StatCard
          icon={CheckCircle}
          label="مقبول"
          value={formatNumber(accepted)}
          color="emerald"
        />
        <StatCard
          icon={XCircle}
          label="مرفوض"
          value={formatNumber(rejected)}
          color="red"
        />
        <StatCard
          icon={Clock}
          label="معلق"
          value={formatNumber(pending)}
          color="amber"
        />
        <StatCard
          icon={Users}
          label="أُضيفوا للاعبين"
          value={formatNumber(added)}
          color="blue"
        />
      </div>

      {/* فرصة تانية + فرق النسبة */}
      {(secondChance > 0 || withBoth.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {secondChance > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-sm p-3 rounded-lg">
              🔄 يوجد <strong>{secondChance}</strong> لاعب محتاج فرصة تانية
            </div>
          )}
          {withBoth.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-sm p-3 rounded-lg">
              📊 متوسط الفرق بين النسبة المقترحة والقرار النهائي:{" "}
              <strong>
                {avgDiff > 0 ? `+${avgDiff}` : avgDiff}%
              </strong>
              <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">
                ({withBoth.length} استثماري)
              </span>
            </div>
          )}
        </div>
      )}

      <ReportTable
        title="تقرير الاختبارات"
        subtitle={`${total} اختبار • ${participants.length} مشارك`}
        columns={columns}
        data={data}
        exportFilename="assessments-report"
      />
    </>
  );
}

// =========================================================
// Treasury Report
// =========================================================
function TreasuryReport({ data }) {
  const totalIncome = data
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpense = data
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const balance = totalIncome - totalExpense;
  const incomeCount = data.filter((t) => t.type === "income").length;
  const expenseCount = data.filter((t) => t.type === "expense").length;

  const columns = [
    {
      key: "transaction_date",
      label: "التاريخ",
      render: (r) => formatDateShort(r.transaction_date),
    },
    {
      key: "type",
      label: "النوع",
      render: (r) => (
        <Badge color={r.type === "income" ? "emerald" : "red"}>
          {r.type === "income" ? "💰 إيراد" : "💸 مصروف"}
        </Badge>
      ),
    },
    { key: "category", label: "التصنيف" },
    {
      key: "description",
      label: "الوصف",
      render: (r) => r.description || "—",
    },
    {
      key: "receipt_number",
      label: "رقم الإيصال",
      render: (r) => r.receipt_number || "—",
    },
    {
      key: "amount",
      label: "المبلغ",
      render: (r) => (
        <span
          className={`font-bold ${
            r.type === "income" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {r.type === "income" ? "+" : "-"}
          {formatCurrency(r.amount)}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={Wallet}
          label="الرصيد"
          value={formatCurrency(balance)}
          color={balance >= 0 ? "emerald" : "red"}
        />
        <StatCard
          icon={TrendingUp}
          label="إجمالي الإيرادات"
          value={formatCurrency(totalIncome)}
          color="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          label="إجمالي المصروفات"
          value={formatCurrency(totalExpense)}
          color="red"
        />
        <StatCard
          icon={FileText}
          label="عدد الإيرادات"
          value={formatNumber(incomeCount)}
          color="blue"
        />
        <StatCard
          icon={FileText}
          label="عدد المصروفات"
          value={formatNumber(expenseCount)}
          color="amber"
        />
      </div>

      <ReportTable
        title="تقرير الخزينة"
        subtitle={`${data.length} عملية`}
        columns={columns}
        data={data}
        exportFilename="treasury-report"
      />
    </>
  );
}

// =========================================================
// Contracts Report
// =========================================================
function ContractsReport({ data }) {
  const active = data.filter((c) => c.status === "active").length;
  const expired = data.filter((c) => c.status === "expired").length;
  const totalValue = data.reduce(
    (s, c) => s + Number(c.total_amount || 0),
    0,
  );

  const columns = [
    {
      key: "party_name",
      label: "الطرف",
    },
    {
      key: "contract_type",
      label: "النوع",
      render: (r) => {
        const typeMap = {
          player: "🏃 لاعب",
          coach: "👨‍🏫 مدرب",
          sponsor: "💼 رعاية",
          sale: "📤 بيع",
          loan: "🔄 إعارة",
          service: "🛠️ خدمات",
        };
        return typeMap[r.contract_type] || r.contract_type;
      },
    },
    {
      key: "start_date",
      label: "البداية",
      render: (r) => formatDateShort(r.start_date),
    },
    {
      key: "end_date",
      label: "النهاية",
      render: (r) => (r.end_date ? formatDateShort(r.end_date) : "—"),
    },
    {
      key: "total_amount",
      label: "القيمة",
      render: (r) => (
        <span className="font-bold">{formatCurrency(r.total_amount)}</span>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      render: (r) => (
        <Badge
          color={
            r.status === "active"
              ? "emerald"
              : r.status === "expiring"
                ? "amber"
                : r.status === "expired"
                  ? "slate"
                  : "red"
          }
        >
          {r.status === "active"
            ? "نشط"
            : r.status === "expiring"
              ? "ينتهي قريب"
              : r.status === "expired"
                ? "منتهي"
                : r.status === "cancelled"
                  ? "ملغي"
                  : "مجدد"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={FileText}
          label="إجمالي العقود"
          value={formatNumber(data.length)}
          color="blue"
        />
        <StatCard
          icon={Trophy}
          label="عقود نشطة"
          value={formatNumber(active)}
          color="emerald"
        />
        <StatCard
          icon={Calendar}
          label="عقود منتهية"
          value={formatNumber(expired)}
          color="slate"
        />
        <StatCard
          icon={DollarSign}
          label="القيمة الإجمالية"
          value={formatCurrency(totalValue)}
          color="amber"
        />
      </div>

      <ReportTable
        title="تقرير العقود"
        subtitle={`${data.length} عقد`}
        columns={columns}
        data={data}
        exportFilename="contracts-report"
      />
    </>
  );
}