import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Trophy,
  AlertCircle,
  Target,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useSector } from "../context/SectorContext";
import { isAdmin, getAllowedTeamIds } from "../utils/permissions";
import Card, { CardHeader } from "../components/ui/Card";
import Badge, {
  PaymentStatusBadge,
  MatchStatusBadge,
} from "../components/ui/Badge";
import Select from "../components/ui/Select";
import { formatCurrency, formatDate } from "../utils/formatters";
import { getPositionLabel } from "../utils/constants";

export default function Reports() {
  const { profile } = useAuth();
  const { selectedSectorId, selectedSector } = useSector();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("performance");
  const [filterTeam, setFilterTeam] = useState("");

  const [teamStats, setTeamStats] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [financialReport, setFinancialReport] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      setLoading(true);
      try {
        const allowed = isAdmin(profile)
          ? null
          : getAllowedTeamIds(profile) || [];

        // ====== الفرق ======
        let teamsQ = supabase.from("teams").select("*").order("name");
        if (allowed) teamsQ = teamsQ.in("id", allowed);
        if (selectedSectorId) teamsQ = teamsQ.eq("sector_id", selectedSectorId);

        const { data: teamsData } = await teamsQ;
        setTeams(teamsData || []);

        // ====== إحصائيات الفرق (مع دعم ركلات الترجيح) ======
        let matchesQ = supabase
          .from("matches")
          .select(
            `
            id,
            team_id,
            home_score,
            away_score,
            status,
            sector_id,
            penalty_home_score,
            penalty_away_score,
            has_penalties,
            penalties_locked,
            teams(name, category),
            penalty_shots(team_side, is_scored)
          `,
          );
        if (allowed) matchesQ = matchesQ.in("team_id", allowed);
        if (selectedSectorId)
          matchesQ = matchesQ.eq("sector_id", selectedSectorId);
        if (filterTeam) matchesQ = matchesQ.eq("team_id", filterTeam);

        const { data: matches } = await matchesQ;

        const statsMap = {};
        (matches || []).forEach((m) => {
          if (!statsMap[m.team_id]) {
            statsMap[m.team_id] = {
              team_id: m.team_id,
              name: m.teams?.name || "-",
              category: m.teams?.category || "-",
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              penaltyWins: 0,
              penaltyLosses: 0,
            };
          }

          // تجاهل المباريات غير المنتهية
          const isFinished =
            m.status === "closed" ||
            (m.home_score != null && m.away_score != null);
          if (!isFinished) return;

          const s = statsMap[m.team_id];
          s.played++;
          s.goalsFor += Number(m.home_score) || 0;
          s.goalsAgainst += Number(m.away_score) || 0;

          // ===== كشف ركلات الترجيح =====
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
            (m.penalty_home_score > 0 || m.penalty_away_score > 0);

          const penHome = homePens || m.penalty_home_score || 0;
          const penAway = awayPens || m.penalty_away_score || 0;

          const isDrawInRegularTime =
            Number(m.home_score) === Number(m.away_score);

          // ===== تحديد الفائز والخاسر =====
          if (hasPenalties && penHome !== penAway) {
            // المباراة اتحسمت بالترجيح
            if (penHome > penAway) {
              s.wins++;
              s.penaltyWins++;
            } else {
              s.losses++;
              s.penaltyLosses++;
            }
          } else if (!isDrawInRegularTime) {
            // فوز/خسارة عادية في الوقت الأصلي
            if (Number(m.home_score) > Number(m.away_score)) s.wins++;
            else s.losses++;
          } else {
            // تعادل حقيقي (لا ترجيح، أو ترجيح متعادل)
            s.draws++;
          }
        });

        setTeamStats(
          Object.values(statsMap).map((s) => ({
            ...s,
            diff: (s.goalsFor || 0) - (s.goalsAgainst || 0),
            points: (s.wins || 0) * 3 + (s.draws || 0) * 1,
          })),
        );

        // ====== الهدافون ======
        let eventsQ = supabase
          .from("match_events")
          .select(
            `
            player_id,
            event_type,
            players!inner(id, full_name, position, team_id, teams!inner(name, sector_id))
          `,
          )
          .eq("event_type", "goal");

        if (allowed) eventsQ = eventsQ.in("players.team_id", allowed);
        if (selectedSectorId)
          eventsQ = eventsQ.eq("players.teams.sector_id", selectedSectorId);
        if (filterTeam) eventsQ = eventsQ.eq("players.team_id", filterTeam);

        const { data: events } = await eventsQ;

        const scorersMap = {};
        (events || []).forEach((e) => {
          const id = e.player_id;
          if (!scorersMap[id]) {
            scorersMap[id] = {
              player_id: id,
              full_name: e.players?.full_name || "-",
              position: e.players?.position,
              team_name: e.players?.teams?.name || "-",
              goals: 0,
            };
          }
          scorersMap[id].goals++;
        });
        setTopScorers(
          Object.values(scorersMap)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10),
        );

        // ====== التقرير المالي ======
        let instQ = supabase
          .from("installments")
          .select(
            "amount, status, player_id, players!inner(team_id, teams!inner(name, sector_id))",
          );
        if (allowed) instQ = instQ.in("players.team_id", allowed);
        if (selectedSectorId)
          instQ = instQ.eq("players.teams.sector_id", selectedSectorId);
        if (filterTeam) instQ = instQ.eq("players.team_id", filterTeam);

        const { data: inst } = await instQ;

        const finMap = {};
        (inst || []).forEach((i) => {
          const teamId = i.players?.team_id;
          const teamName = i.players?.teams?.name || "بدون فريق";
          if (!finMap[teamId]) {
            finMap[teamId] = {
              team_id: teamId,
              name: teamName,
              total: 0,
              paid: 0,
              unpaid: 0,
              pending: 0,
            };
          }
          const amount = Number(i.amount) || 0;
          finMap[teamId].total += amount;
          if (i.status === "paid") finMap[teamId].paid += amount;
          else if (i.status === "unpaid") finMap[teamId].unpaid += amount;
          else finMap[teamId].pending += amount;
        });
        setFinancialReport(Object.values(finMap));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
    setFilterTeam("");
  }, [profile, filterTeam, selectedSectorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const TABS = [
    { id: "performance", label: "أداء الفرق", icon: TrendingUp },
    { id: "scorers", label: "الهدافون", icon: Trophy },
    { id: "financial", label: "التقرير المالي", icon: DollarSign },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            التقارير والإحصائيات
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            تقارير شاملة عن الأداء والمالية
            {selectedSector && ` • ${selectedSector.name}`}
          </p>
        </div>
        <div className="w-full md:w-64">
          <Select
            placeholder="كل الفرق"
            options={teams.map((t) => ({
              value: t.id,
              label: `${t.name} - ${t.category}`,
            }))}
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          />
        </div>
      </div>

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

      {tab === "performance" && (
        <Card>
          <CardHeader
            title="أداء الفرق"
            subtitle={`${teamStats.length} فريق`}
          />
          {teamStats.length === 0 ? (
            <p className="text-center text-slate-500 py-8">لا توجد بيانات</p>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-sm">
                  <tr>
                    <th className="p-3 text-right">الفريق</th>
                    <th className="p-3 text-center">لعب</th>
                    <th className="p-3 text-center">فاز</th>
                    <th className="p-3 text-center">تعادل</th>
                    <th className="p-3 text-center">خسر</th>
                    <th className="p-3 text-center">له</th>
                    <th className="p-3 text-center">عليه</th>
                    <th className="p-3 text-center">الفارق</th>
                    <th className="p-3 text-center">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {teamStats.map((s) => (
                    <tr
                      key={s.team_id}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3">
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {s.category}
                        </p>
                      </td>
                      <td className="p-3 text-center text-slate-700 dark:text-slate-200">
                        {s.played}
                      </td>
                      <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-medium">
                        {s.wins}
                        {s.penaltyWins > 0 && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            ({s.penaltyWins} ترجيح)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center text-amber-600 dark:text-amber-400 font-medium">
                        {s.draws}
                      </td>
                      <td className="p-3 text-center text-red-600 dark:text-red-400 font-medium">
                        {s.losses}
                        {s.penaltyLosses > 0 && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            ({s.penaltyLosses} ترجيح)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center text-slate-700 dark:text-slate-200">
                        {s.goalsFor}
                      </td>
                      <td className="p-3 text-center text-slate-700 dark:text-slate-200">
                        {s.goalsAgainst}
                      </td>
                      <td
                        className={`p-3 text-center font-bold ${
                          s.diff > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : s.diff < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {s.diff > 0 ? "+" : ""}
                        {s.diff}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold">
                          {s.points || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "scorers" && (
        <Card>
          <CardHeader title="أفضل 10 هدافين" />
          {topScorers.length === 0 ? (
            <p className="text-center text-slate-500 py-8">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {topScorers.map((p, idx) => (
                <div
                  key={p.player_id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      idx === 0
                        ? "bg-amber-400 text-white"
                        : idx === 1
                          ? "bg-slate-400 text-white"
                          : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {p.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.team_name} • {getPositionLabel(p.position)}
                    </p>
                  </div>
                  <Badge color="emerald" size="lg">
                    {p.goals} هدف
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "financial" && (
        <Card>
          <CardHeader title="التقرير المالي حسب الفريق" />
          {financialReport.length === 0 ? (
            <p className="text-center text-slate-500 py-8">لا توجد بيانات</p>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-600 text-sm">
                  <tr>
                    <th className="p-3">الفريق</th>
                    <th className="p-3">الإجمالي</th>
                    <th className="p-3">المدفوع</th>
                    <th className="p-3">غير المسدد</th>
                    <th className="p-3">قيد الانتظار</th>
                    <th className="p-3">نسبة السداد</th>
                  </tr>
                </thead>
                <tbody>
                  {financialReport.map((r) => {
                    const pct =
                      r.total > 0 ? Math.round((r.paid / r.total) * 100) : 0;
                    return (
                      <tr key={r.team_id} className="border-t border-slate-100">
                        <td className="p-3 font-medium text-slate-800">
                          {r.name}
                        </td>
                        <td className="p-3">{formatCurrency(r.total)}</td>
                        <td className="p-3 text-emerald-600">
                          {formatCurrency(r.paid)}
                        </td>
                        <td className="p-3 text-red-600">
                          {formatCurrency(r.unpaid)}
                        </td>
                        <td className="p-3 text-amber-600">
                          {formatCurrency(r.pending)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}