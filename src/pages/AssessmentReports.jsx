import { useMemo } from "react";
import {
  BarChart3,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  useAssessments,
  useAssessmentParticipants,
} from "../hooks/useAssessments";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../utils/permissions";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import StatCard from "../components/reports/StatCard";
import {
  getAssessmentStatusLabel,
  getAdminDecisionLabel,
  getAdminDecisionColor,
  getAdminDecisionIcon,
  getPlayerTypeLabel,
  getPlayerTypeIcon,
} from "../utils/assessmentConstants";
import { formatNumber } from "../utils/reportUtils";

export default function AssessmentReports() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);

  const { assessments, loading } = useAssessments();

  // حساب الإحصائيات العامة
  const globalStats = useMemo(() => {
    return {
      total: assessments.length,
      active: assessments.filter((a) =>
        ["active", "in_progress"].includes(a.status),
      ).length,
      approved: assessments.filter((a) => a.status === "approved").length,
      locked: assessments.filter((a) => a.status === "locked").length,
    };
  }, [assessments]);

  if (!admin) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="غير مصرح"
          description="هذه الصفحة متاحة للأدمن فقط."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="text-emerald-600" /> تقارير الاختبارات
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {assessments.length} اختبار
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : assessments.length === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="لا توجد بيانات"
            description="أضف اختبارات عشان تشوف التقارير."
          />
        </Card>
      ) : (
        <>
          {/* إحصائيات عامة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={BarChart3}
              label="إجمالي الاختبارات"
              value={formatNumber(globalStats.total)}
              color="blue"
            />
            <StatCard
              icon={TrendingUp}
              label="شغالة"
              value={formatNumber(globalStats.active)}
              color="amber"
            />
            <StatCard
              icon={CheckCircle}
              label="معتمدة"
              value={formatNumber(globalStats.approved)}
              color="emerald"
            />
            <StatCard
              icon={Clock}
              label="مقفولة"
              value={formatNumber(globalStats.locked)}
              color="slate"
            />
          </div>

          {/* قائمة الاختبارات مع إحصائياتها */}
          <Card>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              تقرير تفصيلي لكل اختبار
            </h2>
            <div className="space-y-4">
              {assessments.map((a) => (
                <AssessmentReportCard key={a.id} assessment={a} />
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// =========================================================
// Assessment Report Card
// =========================================================
function AssessmentReportCard({ assessment }) {
  const { participants } = useAssessmentParticipants(assessment.id);

  const stats = useMemo(() => {
    const total = participants.length;

    // ✅ لكل مشارك، نستخدم بيانات الجلسة النشطة
    const getActive = (p) => p._activeSession || p;

    const evaluated = participants.filter((p) => {
      const active = getActive(p);
      return !!active.admin_decision;
    }).length;

    const accepted = participants.filter((p) => {
      const active = getActive(p);
      return active.final_decision === "accepted";
    }).length;

    const rejected = participants.filter((p) => {
      const active = getActive(p);
      return active.final_decision === "rejected";
    }).length;

    const secondChance = participants.filter((p) => {
      const active = getActive(p);
      return active.admin_decision === "needs_second_chance";
    }).length;

    const added = participants.filter((p) => p.is_added_to_players).length;

    // ✅ فري vs استثماري
    const free = participants.filter((p) => {
      const active = getActive(p);
      return active.final_player_type === "free";
    }).length;

    const investment = participants.filter((p) => {
      const active = getActive(p);
      return active.final_player_type === "investment";
    }).length;

    // ✅ عدد المشاركين اللي عندهم أكتر من جلسة
    const multiSession = participants.filter(
      (p) => (p._totalSessions || 1) > 1,
    ).length;

    return {
      total,
      evaluated,
      accepted,
      rejected,
      secondChance,
      added,
      free,
      investment,
      multiSession,
    };
  }, [participants]);

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">
            {assessment.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مواليد {assessment.birth_year}
            {assessment.teams?.name && ` • ${assessment.teams.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ عدد اللي عنده جلسات متعددة */}
          {stats.multiSession > 0 && (
            <Badge color="amber" size="sm">
              🔄 {stats.multiSession} عنده جلسات
            </Badge>
          )}
          <Badge
            color={
              assessment.status === "approved" || assessment.status === "locked"
                ? "emerald"
                : assessment.status === "active" ||
                    assessment.status === "in_progress"
                  ? "blue"
                  : "slate"
            }
            size="sm"
          >
            {getAssessmentStatusLabel(assessment.status)}
          </Badge>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
        <StatBox label="إجمالي" value={stats.total} color="slate" />
        <StatBox label="تم تقييمهم" value={stats.evaluated} color="amber" />
        <StatBox label="مقبول" value={stats.accepted} color="emerald" />
        <StatBox label="مرفوض" value={stats.rejected} color="red" />
        <StatBox label="فرصة تانية" value={stats.secondChance} color="blue" />
        <StatBox label="أُضيفوا" value={stats.added} color="indigo" />
      </div>

      {/* Player type breakdown */}
      {(stats.free > 0 || stats.investment > 0) && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex gap-3 text-xs flex-wrap">
          {stats.free > 0 && (
            <span className="text-slate-600 dark:text-slate-400">
              🆓 فري: <strong>{stats.free}</strong>
            </span>
          )}
          {stats.investment > 0 && (
            <span className="text-indigo-600 dark:text-indigo-400">
              💰 استثماري: <strong>{stats.investment}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  const colors = {
    slate: "text-slate-700 dark:text-slate-300",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    blue: "text-blue-600 dark:text-blue-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  };

  return (
    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
      <p className={`text-lg font-bold ${colors[color]}`}>{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
