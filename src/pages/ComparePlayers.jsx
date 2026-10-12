import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Target,
  Trophy,
  AlertTriangle,
  Calendar,
  Ban,
  X,
  ArrowLeftRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useSector } from "../context/SectorContext";
import { isAdmin } from "../utils/permissions";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { getPositionLabel } from "../utils/constants";
import { formatNumber } from "../utils/reportUtils";
import PlayerRadarChart from "../components/charts/PlayerRadarChart";

// ===== مكون بطاقة اللاعب =====
function PlayerPicker({ players, onSelect, placeholder, excludeId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = players.filter((p) => {
    if (p.id === excludeId) return false;
    if (!query) return true;
    return p.full_name?.includes(query) || p.national_id?.includes(query);
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 hover:border-emerald-400 transition"
      >
        <span className="truncate">{placeholder}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl z-50 max-h-80 overflow-hidden">
            {/* البحث */}
            <div className="p-2 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="ابحث..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pr-8 pl-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  autoFocus
                />
              </div>
            </div>

            {/* القائمة */}
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-6 text-sm">
                  لا توجد نتائج
                </p>
              ) : (
                filtered.slice(0, 30).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelect(p);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="w-full text-right px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">
                      {p.full_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {p.teams?.name} • {getPositionLabel(p.position)} • مواليد{" "}
                      {p.birth_year}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ===== صف مقارنة =====
function CompareRow({
  label,
  value1,
  value2,
  icon: Icon,
  color = "emerald",
  higher = "better",
}) {
  const v1 = Number(value1) || 0;
  const v2 = Number(value2) || 0;

  const getWinner = () => {
    if (v1 === v2) return "tie";
    if (higher === "better") return v1 > v2 ? 1 : 2;
    return v1 < v2 ? 1 : 2;
  };

  const winner = getWinner();

  const colors = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="grid grid-cols-3 gap-2 items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      {/* Player 1 */}
      <div
        className={`text-center ${winner === 1 ? colors[color] + " font-bold" : "text-slate-700 dark:text-slate-300"}`}
      >
        <p className="text-lg">{formatNumber(v1)}</p>
        {winner === 1 && (
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
            🏆 الأفضل
          </span>
        )}
      </div>

      {/* Label */}
      <div className="text-center flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        {Icon && <Icon size={14} />}
        <span>{label}</span>
      </div>

      {/* Player 2 */}
      <div
        className={`text-center ${winner === 2 ? colors[color] + " font-bold" : "text-slate-700 dark:text-slate-300"}`}
      >
        <p className="text-lg">{formatNumber(v2)}</p>
        {winner === 2 && (
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
            🏆 الأفضل
          </span>
        )}
      </div>
    </div>
  );
}

export default function ComparePlayers() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const { selectedSectorId, selectedSector } = useSector();

  const [players, setPlayers] = useState([]);
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);
  const [stats1, setStats1] = useState(null);
  const [stats2, setStats2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  // ===== تحميل اللاعبين =====
  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      setLoading(true);
      try {
        let q = supabase
          .from("players")
          .select(
            "id, full_name, national_id, position, birth_year, teams(id, name, category, sector_id)",
          )
          .order("full_name");

        if (selectedSectorId) {
          q = q.eq("teams.sector_id", selectedSectorId);
        }

        const { data } = await q;
        setPlayers(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile, selectedSectorId]);

  // ===== حساب إحصائيات لاعب =====
  const fetchStats = async (playerId) => {
    const [goalsRes, assistsRes, yellowsRes, redsRes, ratingsRes, lineupsRes] =
      await Promise.all([
        supabase
          .from("match_events")
          .select("id", { count: "exact", head: true })
          .eq("player_id", playerId)
          .eq("event_type", "goal"),
        supabase
          .from("match_events")
          .select("id", { count: "exact", head: true })
          .eq("player_id", playerId)
          .eq("event_type", "assist"),
        supabase
          .from("match_events")
          .select("id", { count: "exact", head: true })
          .eq("player_id", playerId)
          .eq("event_type", "yellow_card"),
        supabase
          .from("match_events")
          .select("id", { count: "exact", head: true })
          .eq("player_id", playerId)
          .eq("event_type", "red_card"),
        supabase
          .from("match_ratings")
          .select("rating")
          .eq("player_id", playerId),
        supabase
          .from("match_lineups")
          .select("match_id", { count: "exact" })
          .eq("player_id", playerId)
          .eq("lineup_type", "starter"),
      ]);

    const ratings = ratingsRes.data || [];
    const avgRating = ratings.length
      ? (
          ratings.reduce((s, r) => s + Number(r.rating), 0) / ratings.length
        ).toFixed(1)
      : 0;

    return {
      goals: goalsRes.count || 0,
      assists: assistsRes.count || 0,
      yellows: yellowsRes.count || 0,
      reds: redsRes.count || 0,
      matches: lineupsRes.count || 0,
      avgRating,
    };
  };

  // ===== عند اختيار لاعب =====
  useEffect(() => {
    const loadStats = async () => {
      if (!player1 && !player2) {
        setStats1(null);
        setStats2(null);
        return;
      }

      setLoadingStats(true);
      try {
        const [s1, s2] = await Promise.all([
          player1 ? fetchStats(player1.id) : null,
          player2 ? fetchStats(player2.id) : null,
        ]);
        setStats1(s1);
        setStats2(s2);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, [player1, player2]);

  const swapPlayers = () => {
    const temp = player1;
    setPlayer1(player2);
    setPlayer2(temp);
  };

  const clearAll = () => {
    setPlayer1(null);
    setPlayer2(null);
    setStats1(null);
    setStats2(null);
  };

  // ✅ حماية الأدمن
  if (!admin) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="صلاحيات غير كافية"
          description="هذه الصفحة مخصصة للمدير الإداري فقط."
        />
      </Card>
    );
  }

  const canCompare = player1 && player2 && stats1 && stats2;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ArrowLeftRight className="text-emerald-600" /> مقارنة لاعبين
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            قارن بين إحصائيات لاعبين في 6 معايير
            {selectedSector && ` • ${selectedSector.name}`}
          </p>
        </div>
        {(player1 || player2) && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={swapPlayers}>
              <ArrowLeftRight size={16} /> عكس
            </Button>
            <Button variant="danger" onClick={clearAll}>
              <X size={16} /> مسح
            </Button>
          </div>
        )}
      </div>

      {/* Player Pickers */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              اللاعب الأول
            </label>
            <PlayerPicker
              players={players}
              onSelect={setPlayer1}
              placeholder={player1?.full_name || "-- اختر لاعب --"}
              excludeId={player2?.id}
            />
            {player1 && (
              <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {player1.teams?.name} • {getPositionLabel(player1.position)} •
                  مواليد {player1.birth_year}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              اللاعب الثاني
            </label>
            <PlayerPicker
              players={players}
              onSelect={setPlayer2}
              placeholder={player2?.full_name || "-- اختر لاعب --"}
              excludeId={player1?.id}
            />
            {player2 && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {player2.teams?.name} • {getPositionLabel(player2.position)} •
                  مواليد {player2.birth_year}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Comparison */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : !canCompare ? (
        <Card>
          <EmptyState
            icon={ArrowLeftRight}
            title="اختر لاعبين للمقارنة"
            description="اختر لاعبين من الأعلى لعرض المقارنة الكاملة"
          />
        </Card>
      ) : loadingStats ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* Player Names Header */}
          <Card>
            <div className="grid grid-cols-3 gap-2">
              <Link
                to={`/players/${player1.id}`}
                className="text-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-3 transition"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl font-bold mb-2">
                  {player1.full_name?.charAt(0)}
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {player1.full_name}
                </p>
                <Badge color="blue" size="sm">
                  {getPositionLabel(player1.position)}
                </Badge>
              </Link>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <ArrowLeftRight
                    size={24}
                    className="text-slate-400 mx-auto"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    VS
                  </p>
                </div>
              </div>

              <Link
                to={`/players/${player2.id}`}
                className="text-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-3 transition"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xl font-bold mb-2">
                  {player2.full_name?.charAt(0)}
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {player2.full_name}
                </p>
                <Badge color="blue" size="sm">
                  {getPositionLabel(player2.position)}
                </Badge>
              </Link>
            </div>
          </Card>

          {/* Stats Comparison */}
          <Card>
            <CardHeader title="مقارنة الإحصائيات" />

            <CompareRow
              label="الأهداف"
              value1={stats1.goals}
              value2={stats2.goals}
              icon={Target}
              color="emerald"
              higher="better"
            />

            <CompareRow
              label="صناعة الأهداف"
              value1={stats1.assists}
              value2={stats2.assists}
              icon={Trophy}
              color="blue"
              higher="better"
            />

            <CompareRow
              label="المشاركات (أساسي)"
              value1={stats1.matches}
              value2={stats2.matches}
              icon={Calendar}
              color="purple"
              higher="better"
            />

            <CompareRow
              label="متوسط التقييم"
              value1={stats1.avgRating}
              value2={stats2.avgRating}
              icon={TrendingUp}
              color="emerald"
              higher="better"
            />

            <CompareRow
              label="الإنذارات"
              value1={stats1.yellows}
              value2={stats2.yellows}
              icon={AlertTriangle}
              color="amber"
              higher="worse"
            />

            <CompareRow
              label="الطرد"
              value1={stats1.reds}
              value2={stats2.reds}
              icon={Ban}
              color="red"
              higher="worse"
            />
          </Card>

          {/* Radar Chart */}
          <PlayerRadarChart
            players={[player1, player2]}
            stats={[stats1, stats2]}
          />

          {/* Summary */}
          <Card>
            <CardHeader title="ملخص المقارنة" />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {player1.full_name} يفوز في
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {
                    [
                      stats1.goals > stats2.goals,
                      stats1.assists > stats2.assists,
                      stats1.matches > stats2.matches,
                      Number(stats1.avgRating) > Number(stats2.avgRating),
                      stats1.yellows < stats2.yellows,
                      stats1.reds < stats2.reds,
                    ].filter(Boolean).length
                  }
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  من 6 معايير
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {player2.full_name} يفوز في
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {
                    [
                      stats2.goals > stats1.goals,
                      stats2.assists > stats1.assists,
                      stats2.matches > stats1.matches,
                      Number(stats2.avgRating) > Number(stats1.avgRating),
                      stats2.yellows < stats1.yellows,
                      stats2.reds < stats1.reds,
                    ].filter(Boolean).length
                  }
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  من 6 معايير
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
