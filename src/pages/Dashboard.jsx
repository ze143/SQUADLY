import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, DollarSign, ArrowUpCircle, Shield, TrendingUp, Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSector } from '../context/SectorContext';
import { isAdmin, getAllowedTeamIds } from '../utils/permissions';
import Card, { CardHeader } from '../components/ui/Card';
import Badge, { MatchStatusBadge } from '../components/ui/Badge';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export default function Dashboard() {
  const { profile } = useAuth();
  const { selectedSectorId, selectedSector } = useSector();

  const [stats, setStats] = useState({
    players: 0,
    teams: 0,
    matches: 0,
    upcoming: 0,
    unpaidAmount: 0,
    pendingEscalations: 0,
  });
  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      setLoading(true);
      try {
        const allowed = isAdmin(profile) ? null : getAllowedTeamIds(profile) || [];
        const today = new Date().toISOString();

        // ====== عدد اللاعبين ======
        let playersQ = supabase
          .from('players')
          .select('id, teams!inner(sector_id)', { count: 'exact', head: true });
        if (allowed) playersQ = playersQ.in('team_id', allowed);
        if (selectedSectorId) playersQ = playersQ.eq('teams.sector_id', selectedSectorId);

        // ====== عدد الفرق ======
        let teamsQ = supabase
          .from('teams')
          .select('id', { count: 'exact', head: true });
        if (allowed) teamsQ = teamsQ.in('id', allowed);
        if (selectedSectorId) teamsQ = teamsQ.eq('sector_id', selectedSectorId);

        // ====== عدد المباريات ======
        let matchesQ = supabase
          .from('matches')
          .select('id', { count: 'exact', head: true });
        if (allowed) matchesQ = matchesQ.in('team_id', allowed);
        if (selectedSectorId) matchesQ = matchesQ.eq('sector_id', selectedSectorId);

        // ====== المباريات القادمة ======
        let upcomingQ = supabase
          .from('matches')
          .select('id, opponent, match_date, venue, status, teams(name)')
          .gte('match_date', today)
          .order('match_date', { ascending: true })
          .limit(5);
        if (allowed) upcomingQ = upcomingQ.in('team_id', allowed);
        if (selectedSectorId) upcomingQ = upcomingQ.eq('sector_id', selectedSectorId);

        // ====== آخر المباريات ======
        let recentQ = supabase
          .from('matches')
          .select('id, opponent, match_date, home_score, away_score, status, teams(name)')
          .lt('match_date', today)
          .order('match_date', { ascending: false })
          .limit(5);
        if (allowed) recentQ = recentQ.in('team_id', allowed);
        if (selectedSectorId) recentQ = recentQ.eq('sector_id', selectedSectorId);

        // ====== الأقساط غير المدفوعة ======
        let instQ = supabase
          .from('installments')
          .select('amount, players!inner(team_id, teams!inner(sector_id))')
          .neq('status', 'paid');
        if (allowed) instQ = instQ.in('players.team_id', allowed);
        if (selectedSectorId) instQ = instQ.eq('players.teams.sector_id', selectedSectorId);

        // ====== التصعيدات المعلقة ======
        let escQ = supabase
          .from('escalation_requests')
          .select(`
            id,
            from_team:teams!escalation_requests_from_team_id_fkey(sector_id),
            to_team:teams!escalation_requests_to_team_id_fkey(sector_id)
          `)
          .eq('status', 'pending');
        // الفلترة للتصعيدات نصعبها في SQL — هنعملها بعد الجلب

        const [
          playersRes, teamsRes, matchesRes, upcomingRes,
          recentRes, instRes, escRes,
        ] = await Promise.all([
          playersQ, teamsQ, matchesQ, upcomingQ, recentQ, instQ, escQ,
        ]);

        // فلترة التصعيدات حسب القطاع
        let escalationsData = escRes.data || [];
        if (selectedSectorId) {
          escalationsData = escalationsData.filter(
            (e) =>
              e.from_team?.sector_id === selectedSectorId ||
              e.to_team?.sector_id === selectedSectorId
          );
        }

        const unpaidTotal = (instRes.data || []).reduce(
          (s, i) => s + Number(i.amount || 0),
          0
        );

        setStats({
          players: playersRes.count || 0,
          teams: teamsRes.count || 0,
          matches: matchesRes.count || 0,
          upcoming: upcomingRes.data?.length || 0,
          unpaidAmount: unpaidTotal,
          pendingEscalations: escalationsData.length,
        });

        setUpcomingMatches(upcomingRes.data || []);
        setRecentMatches(recentRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profile, selectedSectorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, color = 'emerald', link }) => {
    const colors = {
      emerald: 'bg-emerald-100 text-emerald-600',
      blue: 'bg-blue-100 text-blue-600',
      amber: 'bg-amber-100 text-amber-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600',
    };

    const content = (
      <Card hover padding="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-500 truncate">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl shrink-0 ${colors[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </Card>
    );

    return link ? <Link to={link}>{content}</Link> : content;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Welcome */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            أهلاً، {profile?.full_name?.split(' ')[0] || 'مستخدم'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            نظرة سريعة على آخر مستجدات القطاع
          </p>
        </div>
        {selectedSector && (
          <Badge color="emerald" size="lg">
            القطاع: {selectedSector.name}
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="اللاعبون" value={stats.players} color="emerald" link="/players" />
        <StatCard icon={Shield} label="الفرق" value={stats.teams} color="blue" link="/teams" />
        <StatCard icon={Calendar} label="المباريات" value={stats.matches} color="purple" link="/matches" />
        <StatCard
          icon={DollarSign}
          label="مستحقات غير مسددة"
          value={formatCurrency(stats.unpaidAmount)}
          color="red"
          link="/finance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Clock}
          label="مباريات قادمة"
          value={stats.upcoming}
          color="amber"
          link="/matches"
        />
        <StatCard
          icon={ArrowUpCircle}
          label="طلبات تصعيد معلقة"
          value={stats.pendingEscalations}
          color="amber"
          link="/escalations"
        />
        <StatCard
          icon={TrendingUp}
          label="الحالة العامة"
          value="ممتازة"
          color="emerald"
        />
      </div>

      {/* Matches Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming */}
        <Card>
          <CardHeader
            title="المباريات القادمة"
            action={
              <Link to="/matches" className="text-sm text-emerald-600 hover:underline">
                عرض الكل
              </Link>
            }
          />
          {upcomingMatches.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">
              لا توجد مباريات قادمة
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingMatches.map((m) => (
                <Link
                  key={m.id}
                  to={`/matches/${m.id}`}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {m.teams?.name} × {m.opponent}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateTime(m.match_date)}
                    </p>
                  </div>
                  <MatchStatusBadge status={m.status} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent */}
        <Card>
          <CardHeader
            title="آخر النتائج"
            action={
              <Link to="/matches" className="text-sm text-emerald-600 hover:underline">
                عرض الكل
              </Link>
            }
          />
          {recentMatches.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">
              لا توجد نتائج مسجلة
            </p>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <Link
                  key={m.id}
                  to={`/matches/${m.id}`}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {m.teams?.name} × {m.opponent}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateTime(m.match_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                    <span className="font-bold text-emerald-700 text-sm">
                      {m.home_score}
                    </span>
                    <span className="text-slate-400 text-xs">-</span>
                    <span className="font-bold text-slate-700 text-sm">
                      {m.away_score}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}