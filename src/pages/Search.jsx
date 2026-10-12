import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search as SearchIcon,
  X,
  Users,
  Shield,
  Calendar,
  DollarSign,
  Ban,
  Filter,
  ChevronDown,
} from "lucide-react";
import { useSearch } from "../hooks/useSearch";
import { useSector } from "../context/SectorContext";
import { useTeams } from "../hooks/useTeams";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import {
  POSITIONS,
  PLAYER_TYPES,
  PAYMENT_STATUS,
  getPositionLabel,
} from "../utils/constants";
import { formatCurrency, formatDate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../utils/permissions";

const TABS = [
  { id: "all", label: "الكل" },
  { id: "players", label: "اللاعبون", icon: Users },
  { id: "teams", label: "الفرق", icon: Shield },
  { id: "matches", label: "المباريات", icon: Calendar },
  { id: "installments", label: "الأقساط", icon: DollarSign },
  { id: "suspensions", label: "الإيقافات", icon: Ban },
];

export default function Search() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const { sectors, selectedSectorId } = useSector();
  const { teams } = useTeams();

  const [showFilters, setShowFilters] = useState(false);
  const [tab, setTab] = useState("all");

  const [filters, setFilters] = useState({
    query: "",
    sectorId: selectedSectorId || "",
    teamId: "",
    position: "",
    birthYear: "",
    playerType: "",
    status: "",
  });

  const { results, loading } = useSearch(filters);

  if (!admin) {
    return (
      <Card>
        <EmptyState
          icon={SearchIcon}
          title="صلاحيات غير كافية"
          description="هذه الصفحة مخصصة للمدير الإداري فقط."
        />
      </Card>
    );
  }

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      sectorId: selectedSectorId || "",
      teamId: "",
      position: "",
      birthYear: "",
      playerType: "",
      status: "",
    });
  };

  const hasFilters = Object.values(filters).some((v) => v);

  const counts = {
    all:
      results.players.length +
      results.teams.length +
      results.matches.length +
      results.installments.length +
      results.suspensions.length,
    players: results.players.length,
    teams: results.teams.length,
    matches: results.matches.length,
    installments: results.installments.length,
    suspensions: results.suspensions.length,
  };

    // حماية الأدمن (بعد كل الـ hooks)
  if (!admin) {
    return (
      <Card>
        <EmptyState
          icon={SearchIcon}
          title="صلاحيات غير كافية"
          description="هذه الصفحة مخصصة للمدير الإداري فقط."
        />
      </Card>
    );
  }
        
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <SearchIcon className="text-emerald-600" /> البحث المتقدم
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          ابحث في كل بيانات النظام
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative mb-4">
          <SearchIcon
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="اكتب اسم لاعب، فريق، رقم قومي..."
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 pr-12 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
          />
          {filters.query && (
            <button
              onClick={() => updateFilter("query", "")}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
          >
            <Filter size={16} />
            فلاتر متقدمة
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              ✕ مسح الفلاتر
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              label="القطاع"
              placeholder="كل القطاعات"
              options={sectors.map((s) => ({ value: s.id, label: s.name }))}
              value={filters.sectorId}
              onChange={(e) => updateFilter("sectorId", e.target.value)}
            />
            <Select
              label="الفريق"
              placeholder="كل الفرق"
              options={teams.map((t) => ({
                value: t.id,
                label: `${t.name} - ${t.category}`,
              }))}
              value={filters.teamId}
              onChange={(e) => updateFilter("teamId", e.target.value)}
            />
            <Select
              label="المركز"
              placeholder="كل المراكز"
              options={POSITIONS}
              value={filters.position}
              onChange={(e) => updateFilter("position", e.target.value)}
            />
            <Input
              type="number"
              label="سنة المواليد"
              placeholder="مثال: 2007"
              value={filters.birthYear}
              onChange={(e) => updateFilter("birthYear", e.target.value)}
            />
            <Select
              label="نوع اللاعب"
              placeholder="الكل"
              options={PLAYER_TYPES}
              value={filters.playerType}
              onChange={(e) => updateFilter("playerType", e.target.value)}
            />
            <Select
              label="حالة السداد"
              placeholder="الكل"
              options={PAYMENT_STATUS}
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
            />
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const count = counts[t.id] || 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap text-sm transition",
                active
                  ? "border-emerald-600 text-emerald-600 font-medium"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              ].join(" ")}
            >
              {Icon && <Icon size={16} />}
              {t.label}
              {count > 0 && (
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full px-2 py-0.5">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : counts.all === 0 ? (
        <Card>
          <EmptyState
            icon={SearchIcon}
            title="لا توجد نتائج"
            description={
              hasFilters
                ? "جرّب تغيير كلمة البحث أو الفلاتر"
                : "اكتب كلمة بحث للبدء"
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Players */}
          {(tab === "all" || tab === "players") &&
            results.players.length > 0 && (
              <Card>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Users size={18} className="text-emerald-600" />
                  اللاعبون ({results.players.length})
                </h3>
                <div className="space-y-2">
                  {results.players.map((p) => (
                    <Link
                      key={p.id}
                      to={`/players/${p.id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                          {p.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                            {p.full_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {p.team_name || "بدون فريق"} •{" "}
                            {p.sector_name || "-"} • مواليد {p.birth_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Badge color="blue" size="sm">
                          {getPositionLabel(p.position)}
                        </Badge>
                        {p.is_active === false && (
                          <Badge color="slate" size="sm">
                            غير نشط
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

          {/* Teams */}
          {(tab === "all" || tab === "teams") && results.teams.length > 0 && (
            <Card>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Shield size={18} className="text-blue-600" />
                الفرق ({results.teams.length})
              </h3>
              <div className="space-y-2">
                {results.teams.map((t) => (
                  <Link
                    key={t.id}
                    to={`/teams`}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                        <Shield size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t.category} • {t.sector_name || "-"}
                        </p>
                      </div>
                    </div>
                    <Badge color="slate" size="sm">
                      {t.players_count} لاعب
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Matches */}
          {(tab === "all" || tab === "matches") &&
            results.matches.length > 0 && (
              <Card>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-purple-600" />
                  المباريات ({results.matches.length})
                </h3>
                <div className="space-y-2">
                  {results.matches.map((m) => (
                    <Link
                      key={m.id}
                      to={`/matches/${m.id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                          {m.team_name} × {m.opponent}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(m.match_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                          {m.home_score} - {m.away_score}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

          {/* Installments */}
          {(tab === "all" || tab === "installments") &&
            results.installments.length > 0 && (
              <Card>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <DollarSign size={18} className="text-amber-600" />
                  الأقساط ({results.installments.length})
                </h3>
                <div className="space-y-2">
                  {results.installments.map((i) => (
                    <Link
                      key={i.id}
                      to={`/players/${i.player_id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                          {i.player_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {i.team_name} • استحقاق: {formatDate(i.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {formatCurrency(i.amount)}
                        </span>
                        <Badge
                          color={
                            i.status === "paid"
                              ? "emerald"
                              : i.status === "unpaid"
                                ? "red"
                                : "amber"
                          }
                          size="sm"
                        >
                          {i.status === "paid"
                            ? "مسدد"
                            : i.status === "unpaid"
                              ? "غير مسدد"
                              : "قيد الانتظار"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

          {/* Suspensions */}
          {(tab === "all" || tab === "suspensions") &&
            results.suspensions.length > 0 && (
              <Card>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Ban size={18} className="text-red-600" />
                  الإيقافات ({results.suspensions.length})
                </h3>
                <div className="space-y-2">
                  {results.suspensions.map((s) => (
                    <Link
                      key={s.id}
                      to={`/players/${s.player_id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                          {s.player_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {s.reason || "-"} • {s.team_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          color={
                            s.status === "active"
                              ? "red"
                              : s.status === "completed"
                                ? "emerald"
                                : "slate"
                          }
                          size="sm"
                        >
                          {s.status === "active"
                            ? "نشط"
                            : s.status === "completed"
                              ? "مكتمل"
                              : "ملغى"}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {s.matches_served} / {s.matches_suspended}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
        </div>
      )}
    </div>
  );
}
