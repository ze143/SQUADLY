import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ClipboardList,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  Flame,
  CheckCircle,
  Lock,
} from "lucide-react";
import {
  useAssessments,
  useAssessmentParticipants,
} from "../hooks/useAssessments";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isTeamAdmin } from "../utils/permissions";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import AssessmentForm from "../components/assessments/AssessmentForm";
import AssessmentStats from "../components/assessments/AssessmentStats";
import {
  getAssessmentStatusLabel,
  getAssessmentStatusColor,
} from "../utils/assessmentConstants";
import { formatDate } from "../utils/formatters";

export default function Assessments() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const teamAdmin = isTeamAdmin(profile);

  const [activeTab, setActiveTab] = useState("active");

  const {
    assessments,
    loading,
    createAssessment,
    updateAssessment,
    removeAssessment,
  } = useAssessments();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ تقسيم حسب الحالة
  const activeAssessments = useMemo(
    () =>
      assessments.filter((a) =>
        ["active", "in_progress", "pending_approval"].includes(a.status),
      ),
    [assessments],
  );

  const approvedAssessments = useMemo(
    () => assessments.filter((a) => a.status === "approved"),
    [assessments],
  );

  const lockedAssessments = useMemo(
    () => assessments.filter((a) => ["locked", "cancelled"].includes(a.status)),
    [assessments],
  );

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await updateAssessment(editing.id, data);
      } else {
        await createAssessment(data);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("حذف هذا الاختبار؟ سيتم حذف كل المشاركين.")) return;
    try {
      await removeAssessment(id);
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  const tabs = [
    {
      id: "active",
      label: "شغالة",
      icon: Flame,
      count: activeAssessments.length,
    },
    {
      id: "approved",
      label: "معتمدة",
      icon: CheckCircle,
      count: approvedAssessments.length,
    },
    {
      id: "locked",
      label: "مقفولة",
      icon: Lock,
      count: lockedAssessments.length,
    },
  ];

  const currentList =
    activeTab === "active"
      ? activeAssessments
      : activeTab === "approved"
        ? approvedAssessments
        : lockedAssessments;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="text-emerald-600" /> الاختبارات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {assessments.length} اختبار
          </p>
        </div>
        {admin && (
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus size={18} /> اختبار جديد
          </Button>
        )}
      </div>

      {/* Stats */}
      <AssessmentStats assessments={assessments} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={[
                "flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-medium transition",
                active
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              <Icon size={16} />
              {t.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : currentList.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title={
              activeTab === "active"
                ? "لا توجد اختبارات شغالة"
                : activeTab === "approved"
                  ? "لا توجد اختبارات معتمدة"
                  : "لا توجد اختبارات مقفولة"
            }
            description={
              activeTab === "active" && admin
                ? "ابدأ بإنشاء اختبار جديد."
                : undefined
            }
            action={
              activeTab === "active" && admin ? (
                <Button onClick={() => setShowForm(true)}>
                  <Plus size={18} /> اختبار جديد
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {currentList.map((a) => (
            <AssessmentCard
              key={a.id}
              assessment={a}
              admin={admin}
              onEdit={() => {
                setEditing(a);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(a.id)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && admin && (
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          title={editing ? "تعديل الاختبار" : "اختبار جديد"}
          size="lg"
        >
          <AssessmentForm
            assessment={editing}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}

// =========================================================
// Assessment Card
// =========================================================
function AssessmentCard({ assessment, admin, onEdit, onDelete }) {
  const { participants } = useAssessmentParticipants(assessment.id);
  const statusColor = getAssessmentStatusColor(assessment.status);

  return (
    <Card padding="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="p-3 rounded-xl shrink-0 text-2xl bg-emerald-100 dark:bg-emerald-900/40">
            📋
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {assessment.name}
              </h3>
              <Badge color={statusColor} size="sm">
                {getAssessmentStatusLabel(assessment.status)}
              </Badge>
              {assessment.birth_year && (
                <Badge color="purple" size="sm">
                  مواليد {assessment.birth_year}
                </Badge>
              )}
              {assessment.teams?.name && (
                <Badge color="blue" size="sm">
                  {assessment.teams.name}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(assessment.start_date)}
                {assessment.end_date && ` → ${formatDate(assessment.end_date)}`}
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} /> {participants.length} مشارك
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <Link
            to={`/assessments/${assessment.id}`}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
            title="فتح الاختبار"
          >
            <Eye size={16} />
          </Link>
          {admin && (
            <>
              <button
                onClick={onEdit}
                className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
