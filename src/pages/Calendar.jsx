import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Clock,
  MapPin,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useSector } from "../context/SectorContext";
import { isAdmin, getAllowedTeamIds } from "../utils/permissions";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import { MatchStatusBadge } from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { MATCH_STATUS } from "../utils/constants";
import { formatDateTime } from "../utils/formatters";

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function Calendar() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { selectedSectorId, selectedSector } = useSector();

  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [filterTeam, setFilterTeam] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ===== تحميل المباريات =====
  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      setLoading(true);
      try {
        const allowed = isAdmin(profile) ? null : getAllowedTeamIds(profile) || [];

        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        let q = supabase
          .from("matches")
          .select(`
            id, opponent, match_date, venue, venue_type,
            home_score, away_score, status,
            has_penalties, penalty_home_score, penalty_away_score,
            teams(id, name, category, sector_id),
            competitions(id, name, season)
          `)
          .gte("match_date", startDate.toISOString())
          .lte("match_date", endDate.toISOString())
          .order("match_date", { ascending: true });

        if (allowed) q = q.in("team_id", allowed);
        if (selectedSectorId) q = q.eq("sector_id", selectedSectorId);

        const [matchesRes, teamsRes] = await Promise.all([
          q,
          supabase.from("teams").select("id, name, category").order("name"),
        ]);

        setMatches(matchesRes.data || []);
        setTeams(teamsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile, currentMonth, currentYear, selectedSectorId]);

  // ===== أيام الشهر =====
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayMatches = matches.filter((m) => {
        const mDate = new Date(m.match_date);
        return (
          mDate.getDate() === day &&
          mDate.getMonth() === currentMonth &&
          mDate.getFullYear() === currentYear
        );
      });
      days.push({ day, date, matches: dayMatches });
    }
    return days;
  }, [currentYear, currentMonth, matches]);

  // ===== التنقل بين الأشهر =====
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // ===== الفلترة =====
  const filteredDays = calendarDays.map((d) => {
    if (!d) return d;
    let dayMatches = d.matches;
    if (filterTeam) dayMatches = dayMatches.filter((m) => m.teams?.id === filterTeam);
    if (filterStatus) dayMatches = dayMatches.filter((m) => m.status === filterStatus);
    return { ...d, matches: dayMatches };
  });

  const isToday = (date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const totalMatchesThisMonth = filteredDays.reduce(
    (sum, d) => sum + (d ? d.matches.length : 0),
    0
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="text-emerald-600" /> تقويم المباريات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {totalMatchesThisMonth} مباراة هذا الشهر
            {selectedSector && ` • ${selectedSector.name}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🏠</span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">داخل</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base">✈️</span>
              <span className="text-xs font-medium text-red-700 dark:text-red-300">خارج</span>
            </div>
          </div>

          <Button variant="secondary" onClick={goToToday}>
            اليوم
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <CalendarIcon size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {totalMatchesThisMonth}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300">
              🏠
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">داخل</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {filteredDays.reduce(
                  (sum, d) =>
                    sum + (d ? d.matches.filter((m) => m.venue_type !== "away").length : 0),
                  0
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300">
              ✈️
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">خارج</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {filteredDays.reduce(
                  (sum, d) =>
                    sum + (d ? d.matches.filter((m) => m.venue_type === "away").length : 0),
                  0
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            placeholder="كل الفرق"
            options={teams.map((t) => ({
              value: t.id,
              label: `${t.name} - ${t.category}`,
            }))}
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          />
          <Select
            placeholder="كل الحالات"
            options={MATCH_STATUS}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
      </Card>

      {/* Calendar */}
      <Card padding="p-0">
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
            aria-label="الشهر السابق"
          >
            <ChevronRight size={20} />
          </button>

          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {MONTHS[currentMonth]} {currentYear}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
            aria-label="الشهر التالي"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {filteredDays.map((day, idx) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[100px] md:min-h-[120px] bg-slate-50 dark:bg-slate-800/20 border-b border-l border-slate-100 dark:border-slate-800"
                  />
                );
              }

              const todayMatch = isToday(day.date);

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] md:min-h-[120px] p-1.5 md:p-2 border-b border-l border-slate-100 dark:border-slate-800 transition ${
                    todayMatch
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "bg-white dark:bg-slate-900"
                  }`}
                >
                  <div
                    className={`text-xs md:text-sm font-bold mb-1 ${
                      todayMatch
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {day.day}
                  </div>

                  <div className="space-y-1">
                    {day.matches.slice(0, 3).map((m) => {
                      const isAway = m.venue_type === "away";
                      const hasPenalties = m.has_penalties;

                      return (
                        <button
                          key={m.id}
                          onClick={() => navigate(`/matches/${m.id}`)}
                          className={`w-full text-right rounded transition border-r-4 overflow-hidden ${
                            isAway
                              ? "bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border-r-red-500 dark:border-r-red-400"
                              : "bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-r-emerald-500 dark:border-r-emerald-400"
                          }`}
                          title={`${m.teams?.name} × ${m.opponent} (${
                            isAway ? "خارج الأرض" : "داخل الأرض"
                          })${
                            hasPenalties
                              ? ` • 🎯 ترجيح: ${m.penalty_home_score}-${m.penalty_away_score}`
                              : ""
                          }`}
                        >
                          <div className="px-1 md:px-1.5 py-0.5 md:py-1">
                            <p
                              className={`text-[10px] md:text-xs font-bold truncate ${
                                isAway
                                  ? "text-red-700 dark:text-red-300"
                                  : "text-emerald-700 dark:text-emerald-300"
                              }`}
                            >
                              {isAway ? "✈️ " : "🏠 "}
                              {m.teams?.name} × {m.opponent}
                            </p>
                            <p
                              className={`text-[9px] md:text-[10px] font-medium ${
                                isAway
                                  ? "text-red-500 dark:text-red-400"
                                  : "text-emerald-500 dark:text-emerald-400"
                              }`}
                            >
                              {new Date(m.match_date).toLocaleTimeString("ar-EG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {hasPenalties && (
                              <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                🎯 {m.penalty_home_score}-{m.penalty_away_score}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {day.matches.length > 3 && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                        +{day.matches.length - 3} أخرى
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Upcoming Matches List */}
      <Card>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-emerald-600" />
          أقرب المباريات
        </h3>
        {matches.filter((m) => m.status !== "closed").length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="لا توجد مباريات قادمة"
            description="لا توجد مباريات مجدولة هذا الشهر."
          />
        ) : (
          <div className="space-y-2">
            {matches
              .filter((m) => m.status !== "closed")
              .slice(0, 5)
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/matches/${m.id}`)}
                  className="w-full text-right flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                      {m.teams?.name} × {m.opponent}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatDateTime(m.match_date)}
                      </span>
                      {m.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {m.venue}
                        </span>
                      )}
                    </div>
                  </div>
                  <MatchStatusBadge status={m.status} />
                </button>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}