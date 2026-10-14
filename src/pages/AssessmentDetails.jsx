import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Lock,
  Unlock,
  UserPlus,
  Eye,
  Calendar,
} from "lucide-react";
import {
  useAssessments,
  useAssessmentParticipants,
} from "../hooks/useAssessments";
import { useAuth } from "../context/AuthContext";
import { isAdmin, isTeamAdmin } from "../utils/permissions";
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import ParticipantForm from "../components/assessments/ParticipantForm";
import EvaluationForm from "../components/assessments/EvaluationForm";
import DecisionForm from "../components/assessments/DecisionForm";
import AddToPlayersModal from "../components/assessments/AddToPlayersModal";
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
import { formatDate } from "../utils/formatters";

export default function AssessmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const teamAdmin = isTeamAdmin(profile);
  const canEvaluate = admin || teamAdmin;

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  const { getAssessmentById, updateAssessment } = useAssessments();

  const {
    participants,
    loading: participantsLoading,
    createParticipant,
    updateParticipant,
    removeParticipant,
    refetch: refetchParticipants,
  } = useAssessmentParticipants(id, { skip: !assessment });

  // Modals
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);

  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluatingParticipant, setEvaluatingParticipant] = useState(null);

  const [showDecision, setShowDecision] = useState(false);
  const [decidingParticipant, setDecidingParticipant] = useState(null);

  const [showAddToPlayers, setShowAddToPlayers] = useState(false);
  const [addToPlayersParticipant, setAddToPlayersParticipant] = useState(null);

  const [showSessions, setShowSessions] = useState(false);
  const [sessionsParticipant, setSessionsParticipant] = useState(null);

  const [sessionsKey, setSessionsKey] = useState(0);
  const [saving, setSaving] = useState(false);

  // ✅ حالات الاختبار
  const isLocked = assessment?.status === "locked";
  const isCancelled = assessment?.status === "cancelled";
  const isApproved = assessment?.status === "approved";

  // ✅ الإداري يقدر يعدّل في active, in_progress, pending_approval
  const canEdit = ["active", "in_progress", "pending_approval"].includes(
    assessment?.status,
  );

  // ✅ الأدمن يقدر يعدّل في كل الحالات ما عدا locked و cancelled
  const canAdminEdit = !isLocked && !isCancelled;

  const loadAssessment = async () => {
    setLoading(true);
    try {
      const data = await getAssessmentById(id);
      setAssessment(data);
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAssessment();
  }, [id]);

  // ===== المشاركين =====
  const handleParticipantSubmit = async (data) => {
    setSaving(true);
    try {
      if (editingParticipant) {
        await updateParticipant(editingParticipant.id, data);
      } else {
        await createParticipant({
          ...data,
          assessment_id: id,
          created_by: profile.id,
          is_primary: true,
          session_number: 1,
        });
      }
      setShowParticipantForm(false);
      setEditingParticipant(null);
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleParticipantDelete = async (pid) => {
    if (!confirm("حذف هذا المشارك؟ سيتم حذف كل الجلسات المرتبطة به.")) return;
    try {
      await supabase
        .from("assessment_participants")
        .delete()
        .eq("previous_evaluation_id", pid);

      await removeParticipant(pid);
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  // ===== التقييم (الإداري) =====
  const handleEvaluationSubmit = async (data) => {
    if (!canEdit) {
      alert("❌ لا يمكن التعديل — الاختبار مقفول أو ملغي");
      return;
    }
    setSaving(true);
    try {
      await updateParticipant(evaluatingParticipant.id, {
        ...data,
        evaluated_by: profile.id,
        evaluated_at: new Date().toISOString(),
      });
      setShowEvaluation(false);
      setEvaluatingParticipant(null);
      setSessionsKey((k) => k + 1);
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ===== القرار (الأدمن) =====
  const handleDecisionSubmit = async (data) => {
    console.log("🔍 Decision submit data:", data);

    setSaving(true);
    try {
      await updateParticipant(decidingParticipant.id, {
        ...data,
        decided_by: profile.id,
        decided_at: new Date().toISOString(),
      });

      if (data.final_decision === "needs_second_chance") {
        console.log(
          "🔥 Creating new session for:",
          decidingParticipant.full_name,
        );

        await createParticipant({
          assessment_id: id,
          full_name: decidingParticipant.full_name,
          national_id: decidingParticipant.national_id,
          birth_date: decidingParticipant.birth_date,
          birth_year: decidingParticipant.birth_year,
          position: decidingParticipant.position,
          previous_clubs: decidingParticipant.previous_clubs,
          technical_level: decidingParticipant.technical_level,
          session_number: (decidingParticipant.session_number || 1) + 1,
          previous_evaluation_id: decidingParticipant.is_primary
            ? decidingParticipant.id
            : decidingParticipant.previous_evaluation_id,
          is_primary: false,
          admin_decision: null,
          final_decision: "pending",
          created_by: profile.id,
        });
        alert("✅ تم إنشاء جلسة تانية للاعب");
      } else {
        alert("✅ تم حفظ القرار");
      }

      setShowDecision(false);
      setDecidingParticipant(null);
      await refetchParticipants();
      setSessionsKey((k) => k + 1);
    } catch (err) {
      console.error("❌ Error:", err);
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ===== الإضافة للاعبين =====
  const handleAddToPlayersSuccess = async () => {
    setShowAddToPlayers(false);
    setAddToPlayersParticipant(null);
    await refetchParticipants();
    alert("✅ تم إضافة اللاعب بنجاح");
  };

  // ===== تغيير حالة الاختبار =====
  const changeStatus = async (newStatus) => {
    const statusLabels = {
      active: "إعادة تنشيط",
      in_progress: "إعادة فتح للتعديل",
      pending_approval: "إرسال للاعتماد",
      approved: "اعتماد نهائي",
      locked: "قفل نهائي",
    };

    if (!confirm(`${statusLabels[newStatus] || "تغيير"} الاختبار؟`)) return;
    try {
      await updateAssessment(id, { status: newStatus });
      await loadAssessment();
      alert("✅ تم تحديث حالة الاختبار");
    } catch (err) {
      alert("خطأ: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="الاختبار غير موجود"
          action={
            <Button onClick={() => navigate("/assessments")}>
              رجوع للاختبارات
            </Button>
          }
        />
      </Card>
    );
  }

  const statusColor = getAssessmentStatusColor(assessment.status);

  const total = participants.length;
  const evaluated = participants.filter(
    (p) => p._activeSession?.admin_decision || p.admin_decision,
  ).length;
  const accepted = participants.filter(
    (p) =>
      (p._activeSession?.final_decision || p.final_decision) === "accepted",
  ).length;
  const rejected = participants.filter(
    (p) =>
      (p._activeSession?.final_decision || p.final_decision) === "rejected",
  ).length;
  const secondChance = participants.filter(
    (p) =>
      (p._activeSession?.admin_decision || p.admin_decision) ===
      "needs_second_chance",
  ).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm"
        >
          <ArrowRight size={18} /> رجوع
        </button>

        {admin && (
          <div className="flex gap-2 flex-wrap">
            {assessment.status === "active" && (
              <Button
                variant="warning"
                onClick={() => changeStatus("pending_approval")}
              >
                إرسال للاعتماد
              </Button>
            )}
            {assessment.status === "pending_approval" && (
              <Button
                variant="primary"
                onClick={() => changeStatus("approved")}
              >
                <CheckCircle size={16} /> اعتماد الاختبار
              </Button>
            )}
            {assessment.status === "approved" && (
              <>
                <Button
                  variant="warning"
                  onClick={() => changeStatus("in_progress")}
                >
                  <Unlock size={16} /> إعادة فتح للتعديل
                </Button>
                <Button variant="danger" onClick={() => changeStatus("locked")}>
                  <Lock size={16} /> قفل نهائي
                </Button>
              </>
            )}
            {assessment.status === "in_progress" && (
              <Button
                variant="primary"
                onClick={() => changeStatus("pending_approval")}
              >
                <CheckCircle size={16} /> إرسال للاعتماد
              </Button>
            )}
            {assessment.status === "locked" && (
              <Button
                variant="warning"
                onClick={() => changeStatus("in_progress")}
              >
                <Unlock size={16} /> إعادة فتح
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Header Card */}
      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 bg-emerald-100 dark:bg-emerald-900/40">
            📋
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {assessment.name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge color={statusColor}>
                {getAssessmentStatusLabel(assessment.status)}
              </Badge>
              {assessment.birth_year && (
                <Badge color="purple"> مواليد {assessment.birth_year}</Badge>
              )}
              {assessment.teams?.name && (
                <Badge color="blue">{assessment.teams.name}</Badge>
              )}
              {isLocked && (
                <Badge color="red">
                  <Lock size={12} /> مقفول
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500 dark:text-slate-400">
              <span>📅 {formatDate(assessment.start_date)}</span>
              {assessment.end_date && (
                <span>→ {formatDate(assessment.end_date)}</span>
              )}
              <span>👥 {participants.length} مشارك</span>
            </div>
          </div>
        </div>

        {assessment.description && (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            {assessment.description}
          </p>
        )}
      </Card>

      {/* تنبيه حالة */}
      {isLocked && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 text-sm p-4 rounded-lg flex items-start gap-3">
          <Lock size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">🔒 الاختبار مقفول نهائيًا</p>
            <p className="text-xs mt-1">
              لا يمكن تعديل أي تقييم أو قرار. الأدمن فقط يمكنه إعادة فتح
              الاختبار.
            </p>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-sm p-4 rounded-lg flex items-start gap-3">
          <Lock size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">🔐 الاختبار معتمد (مقفول للتعديل)</p>
            <p className="text-xs mt-1">
              الإداريون لا يمكنهم التعديل. الأدمن يمكنه إعادة فتحه للتعديل أو
              قفله نهائيًا.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card padding="p-3">
          <p className="text-xs text-slate-500">إجمالي المشاركين</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {total}
          </p>
        </Card>
        <Card padding="p-3">
          <p className="text-xs text-amber-600">تم تقييمهم</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{evaluated}</p>
        </Card>
        <Card padding="p-3">
          <p className="text-xs text-emerald-600">مقبول</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{accepted}</p>
        </Card>
        <Card padding="p-3">
          <p className="text-xs text-red-600">مرفوض</p>
          <p className="text-xl font-bold text-red-600 mt-1">{rejected}</p>
        </Card>
        <Card padding="p-3">
          <p className="text-xs text-blue-600">🔄 فرصة تانية</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{secondChance}</p>
        </Card>
      </div>

      {/* Participants List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserPlus size={18} className="text-emerald-600" />
            المشاركون ({participants.length})
          </h3>
          {admin && canAdminEdit && (
            <Button
              onClick={() => {
                setEditingParticipant(null);
                setShowParticipantForm(true);
              }}
              size="sm"
            >
              <Plus size={16} /> إضافة مشارك
            </Button>
          )}
        </div>

        {participantsLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : participants.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="لا يوجد مشاركون"
            description="أضف أول مشارك للاختبار."
            action={
              admin && canAdminEdit ? (
                <Button onClick={() => setShowParticipantForm(true)}>
                  <Plus size={16} /> إضافة مشارك
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs uppercase">
                <tr>
                  <th className="p-3 text-right font-bold">الاسم</th>
                  <th className="p-3 text-center font-bold">المركز</th>
                  <th className="p-3 text-center font-bold">🟡 رأي الإداري</th>
                  <th className="p-3 text-center font-bold">🟢 القرار</th>
                  <th className="p-3 text-center font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => {
                  const active = p._activeSession || p;
                  const totalSessions = p._totalSessions || 1;
                  const hasEval = !!active.admin_decision;
                  const hasFinal = active.final_decision !== "pending";

                  // ✅ الإداري بس (team_admin) اللي يشوف زر التقييم — مش الأدمن
                  const canEditThis =
                    !admin && teamAdmin && canEdit && !hasFinal;

                  // ✅ الأدمن بس اللي يشوف زر القرار (بعد تقييم الإداري)
                  const canDecideThis =
                    admin && canAdminEdit && hasEval && !hasFinal;

                  // ✅ الإضافة للاعبين
                  const canAddThis =
                    admin &&
                    canAdminEdit &&
                    active.final_decision === "accepted" &&
                    !p.is_added_to_players;

                  return (
                    <tr
                      key={p.id}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {p.full_name}
                          </span>
                          {p.is_added_to_players && (
                            <Badge color="blue" size="sm">
                              ✅ مضاف
                            </Badge>
                          )}
                          {totalSessions > 1 && (
                            <Badge color="amber" size="sm">
                              🔄 {totalSessions} جلسات
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-center text-slate-600 dark:text-slate-400 text-xs">
                        {p.position || "-"}
                      </td>

                      <td className="p-3 text-center text-xs">
                        {hasEval ? (
                          <div className="space-y-1">
                            <Badge
                              color={getAdminDecisionColor(
                                active.admin_decision,
                              )}
                              size="sm"
                            >
                              {getAdminDecisionIcon(active.admin_decision)}{" "}
                              {getAdminDecisionLabel(active.admin_decision)}
                            </Badge>
                            {/* ✅ النسبة بس لو استثماري */}
                            {active.suggested_player_type === "investment" &&
                              active.suggested_percentage && (
                                <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  {active.suggested_percentage}%
                                </p>
                              )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {hasFinal ? (
                          <Badge
                            color={getFinalDecisionColor(active.final_decision)}
                            size="sm"
                          >
                            {getFinalDecisionIcon(active.final_decision)}{" "}
                            {getFinalDecisionLabel(active.final_decision)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">
                            ⏳ معلق
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap justify-center">
                          {/* 🟡 زر التقييم للإداري بس */}
                          {canEditThis && (
                            <button
                              onClick={() => {
                                setSessionsParticipant(p);
                                setShowSessions(true);
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition shadow-sm"
                              title="التقييم"
                            >
                              🟡 تقييم
                            </button>
                          )}

                          {/* 🟢 زر القرار للأدمن (بعد ما الإداري يقيّم) */}
                          {canDecideThis && (
                            <button
                              onClick={() => {
                                setSessionsParticipant(p);
                                setShowSessions(true);
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition shadow-sm"
                              title="القرار"
                            >
                              🟢 قرار
                            </button>
                          )}

                          {/* ➕ زر الإضافة للاعبين للأدمن */}
                          {canAddThis && (
                            <button
                              onClick={() => {
                                setAddToPlayersParticipant(active);
                                setShowAddToPlayers(true);
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition shadow-sm"
                              title="إضافة للاعبين"
                            >
                              ➕ إضافة
                            </button>
                          )}

                          {/* 👁️ زر الجلسات */}
                          <button
                            onClick={() => {
                              setSessionsParticipant(p);
                              setShowSessions(true);
                            }}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            title="الجلسات"
                          >
                            <Eye size={14} />
                          </button>

                          {/* تعديل/حذف للأدمن */}
                          {admin && canAdminEdit && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingParticipant(p);
                                  setShowParticipantForm(true);
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                                title="تعديل"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleParticipantDelete(p.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                title="حذف"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
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

      {/* Participant Form Modal */}
      {showParticipantForm && admin && canAdminEdit && (
        <Modal
          isOpen={showParticipantForm}
          onClose={() => {
            setShowParticipantForm(false);
            setEditingParticipant(null);
          }}
          title={editingParticipant ? "تعديل المشارك" : "إضافة مشارك"}
          size="xl"
        >
          <ParticipantForm
            participant={editingParticipant}
            assessment={assessment}
            onSubmit={handleParticipantSubmit}
            onCancel={() => {
              setShowParticipantForm(false);
              setEditingParticipant(null);
            }}
            saving={saving}
          />
        </Modal>
      )}

      {/* Evaluation Modal */}
      {showEvaluation && evaluatingParticipant && canEdit && (
        <Modal
          isOpen={showEvaluation}
          onClose={() => {
            setShowEvaluation(false);
            setEvaluatingParticipant(null);
          }}
          title="تقييم المشارك"
          size="xl"
        >
          <EvaluationForm
            participant={evaluatingParticipant}
            onSubmit={handleEvaluationSubmit}
            onCancel={() => {
              setShowEvaluation(false);
              setEvaluatingParticipant(null);
            }}
            saving={saving}
          />
        </Modal>
      )}

      {/* Decision Modal */}
      {showDecision && decidingParticipant && (
        <Modal
          isOpen={showDecision}
          onClose={() => {
            setShowDecision(false);
            setDecidingParticipant(null);
          }}
          title="القرار النهائي"
          size="xl"
        >
          <DecisionForm
            participant={decidingParticipant}
            onSubmit={handleDecisionSubmit}
            onCancel={() => {
              setShowDecision(false);
              setDecidingParticipant(null);
            }}
            saving={saving}
          />
        </Modal>
      )}

      {/* Add to Players Modal */}
      {showAddToPlayers && addToPlayersParticipant && (
        <Modal
          isOpen={showAddToPlayers}
          onClose={() => {
            setShowAddToPlayers(false);
            setAddToPlayersParticipant(null);
          }}
          title="إضافة للاعبين"
          size="lg"
        >
          <AddToPlayersModal
            participant={addToPlayersParticipant}
            onSuccess={handleAddToPlayersSuccess}
            onCancel={() => {
              setShowAddToPlayers(false);
              setAddToPlayersParticipant(null);
            }}
          />
        </Modal>
      )}

      {/* Sessions Modal */}
      {showSessions && sessionsParticipant && (
        <Modal
          isOpen={showSessions}
          onClose={() => {
            setShowSessions(false);
            setSessionsParticipant(null);
          }}
          title={`📋 ${sessionsParticipant.full_name} - الجلسات`}
          size="xl"
        >
          <AssessmentSessionsView
            key={`sessions-${sessionsParticipant.id}-${sessionsKey}`}
            participant={sessionsParticipant}
            canEdit={canEdit}
            canAdminEdit={canAdminEdit}
            canEvaluate={canEvaluate}
            admin={admin}
            teamAdmin={teamAdmin}
            onEvaluate={(session) => {
              setEvaluatingParticipant(session);
              setShowEvaluation(true);
              setShowSessions(false);
            }}
            onDecide={(session) => {
              setDecidingParticipant(session);
              setShowDecision(true);
              setShowSessions(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

// =========================================================
// Assessment Sessions View (Tabs)
// =========================================================
function AssessmentSessionsView({
  participant,
  canEdit,
  canAdminEdit,
  canEvaluate,
  admin,
  teamAdmin,
  onEvaluate,
  onDecide,
}) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(participant.id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        let rootId = participant.id;

        if (!participant.is_primary) {
          let currentId = participant.id;
          for (let i = 0; i < 10; i++) {
            const { data } = await supabase
              .from("assessment_participants")
              .select("id, previous_evaluation_id, is_primary")
              .eq("id", currentId)
              .single();
            if (!data || !data.previous_evaluation_id) break;
            currentId = data.previous_evaluation_id;
            if (data.is_primary) {
              rootId = currentId;
              break;
            }
          }
        }

        const { data: rootData, error: rootErr } = await supabase
          .from("assessment_participants")
          .select("*")
          .eq("id", rootId)
          .single();

        if (rootErr) console.error("rootData error:", rootErr);

        const { data: children, error: childErr } = await supabase
          .from("assessment_participants")
          .select("*")
          .eq("previous_evaluation_id", rootId)
          .order("session_number", { ascending: true });

        if (childErr) console.error("children error:", childErr);

        const all = [rootData, ...(children || [])].filter(Boolean);

        setSessions(all);

        const pendingSession = all.find((s) => s.final_decision === "pending");
        setActiveSessionId(pendingSession?.id || participant.id);
      } catch (err) {
        console.error(err);
        setSessions([participant]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [participant]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Tabs */}
      {sessions.length > 1 && (
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={[
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition border-b-2",
                  isActive
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-700",
                ].join(" ")}
              >
                <Calendar size={14} />
                جلسة {s.session_number || 1}
                {s.admin_decision === "needs_second_chance" && (
                  <span className="text-amber-500">🔄</span>
                )}
                {s.final_decision === "accepted" && (
                  <span className="text-emerald-500">✅</span>
                )}
                {s.final_decision === "rejected" && (
                  <span className="text-red-500">❌</span>
                )}
                {s.final_decision === "pending" && !s.admin_decision && (
                  <span className="text-slate-400">⏳</span>
                )}
                {s.final_decision === "needs_second_chance" && (
                  <span className="text-blue-500">🔄</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* محتوى الجلسة */}
      {activeSession && (
        <SessionContent
          session={activeSession}
          canEdit={canEdit}
          canAdminEdit={canAdminEdit}
          canEvaluate={canEvaluate}
          admin={admin}
          teamAdmin={teamAdmin}
          onEvaluate={() => onEvaluate(activeSession)}
          onDecide={() => onDecide(activeSession)}
        />
      )}
    </div>
  );
}

// =========================================================
// Session Content
// =========================================================
function SessionContent({
  session,
  canEdit,
  canAdminEdit,
  canEvaluate,
  admin,
  teamAdmin,
  onEvaluate,
  onDecide,
}) {
  const hasEval = !!session.admin_decision;
  const hasFinal = session.final_decision !== "pending";

  // ✅ الإداري بس اللي يشوف زر التقييم
  // ✅ الإداري بس (مش الأدمن)
  const canEvaluateThis = !admin && teamAdmin && canEdit && !hasFinal;
  // ✅ الأدمن بس اللي يشوف زر القرار (بعد تقييم الإداري)
  const canDecideThis = admin && canAdminEdit && hasEval && !hasFinal;

  return (
    <div className="space-y-4">
      {/* معلومات أساسية */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <InfoRow label="الاسم" value={session.full_name} />
        <InfoRow label="المركز" value={session.position || "-"} />
        <InfoRow label="الرقم القومي" value={session.national_id} />
        <InfoRow label="المواليد" value={session.birth_year} />
        <InfoRow
          label="الحضور"
          value={
            session.attended
              ? `✅ ${session.attendance_date ? formatDate(session.attendance_date) : "حاضر"}`
              : "❌ لم يحضر"
          }
        />
        <InfoRow label="الجلسة" value={`رقم ${session.session_number || 1}`} />
      </div>

      {/* التقييمات */}
      {hasEval && (
        <Card padding="p-3">
          <h4 className="font-bold text-sm mb-2">📋 التقييمات الفنية</h4>
          <div className="space-y-2 text-xs">
            {session.physical_evaluation && (
              <EvalBlock
                label="🏃 بدني"
                value={session.physical_evaluation}
                color="blue"
              />
            )}
            {session.technical_evaluation && (
              <EvalBlock
                label="⚽ فني"
                value={session.technical_evaluation}
                color="emerald"
              />
            )}
            {session.tactical_evaluation && (
              <EvalBlock
                label="🎯 تكتيكي"
                value={session.tactical_evaluation}
                color="purple"
              />
            )}
            {session.mental_evaluation && (
              <EvalBlock
                label="🧠 نفسي"
                value={session.mental_evaluation}
                color="amber"
              />
            )}
            {session.general_notes && (
              <EvalBlock
                label="📝 ملاحظات"
                value={session.general_notes}
                color="slate"
              />
            )}
          </div>
        </Card>
      )}

      {/* رأي الإداري */}
      {hasEval && (
        <Card
          padding="p-3"
          className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-900/40"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🟡</span>
            <h4 className="font-bold text-sm text-amber-700 dark:text-amber-300">
              رأي الإداري
            </h4>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">القرار:</span>
              <Badge
                color={getAdminDecisionColor(session.admin_decision)}
                size="sm"
              >
                {getAdminDecisionIcon(session.admin_decision)}{" "}
                {getAdminDecisionLabel(session.admin_decision)}
              </Badge>
            </div>
            {session.suggested_player_type && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">النوع:</span>
                  <span className="font-medium">
                    {getPlayerTypeIcon(session.suggested_player_type)}{" "}
                    {getPlayerTypeLabel(session.suggested_player_type)}
                  </span>
                </div>
                {/* ✅ النسبة بس لو استثماري */}
                {session.suggested_player_type === "investment" &&
                  session.suggested_percentage && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">النسبة:</span>
                      <span className="font-bold text-emerald-600">
                        {session.suggested_percentage}%
                      </span>
                    </div>
                  )}
              </>
            )}
            {session.committee_opinion && (
              <div className="mt-2 pt-2 border-t border-amber-200">
                <p className="text-slate-600 mb-1">رأي اللجنة:</p>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {session.committee_opinion}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* القرار النهائي */}
      {hasFinal && (
        <Card
          padding="p-3"
          className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-900/40"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🟢</span>
            <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
              القرار النهائي
            </h4>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              color={getFinalDecisionColor(session.final_decision)}
              size="sm"
            >
              {getFinalDecisionIcon(session.final_decision)}{" "}
              {getFinalDecisionLabel(session.final_decision)}
            </Badge>
            {/* ✅ النسبة بس لو استثماري */}
            {session.final_player_type === "investment" &&
              session.final_percentage && (
                <span className="text-xs font-bold text-emerald-600">
                  {session.final_percentage}%
                </span>
              )}
            {session.final_player_type && (
              <span className="text-xs">
                {getPlayerTypeIcon(session.final_player_type)}{" "}
                {getPlayerTypeLabel(session.final_player_type)}
              </span>
            )}
          </div>
          {session.manager_opinion && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line">
              {session.manager_opinion}
            </p>
          )}
        </Card>
      )}

      {/* 🟡 زر التقييم للإداري */}
      {canEvaluateThis && (
        <Button onClick={onEvaluate} className="w-full">
          🟡 {hasEval ? "تعديل التقييم" : "تقييم الجلسة"}
        </Button>
      )}

      {/* 🟢 زر القرار للأدمن */}
      {canDecideThis && (
        <Button onClick={onDecide} className="w-full" variant="primary">
          🟢 القرار النهائي
        </Button>
      )}

      {/* لو الاختبار مقفول */}
      {!canEdit && canEvaluate && !hasFinal && (
        <div className="text-center text-xs text-slate-400 py-2">
          🔒 الاختبار مقفول — لا يمكن التعديل
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
      <span className="text-slate-500 dark:text-slate-400">{label}:</span>
      <span className="font-medium text-slate-800 dark:text-slate-100">
        {value || "-"}
      </span>
    </div>
  );
}

function EvalBlock({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300",
    amber:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300",
    slate:
      "bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-300",
  };

  return (
    <div className={`p-2 rounded ${colors[color]}`}>
      <p className="font-bold mb-0.5">{label}</p>
      <p className="whitespace-pre-line">{value}</p>
    </div>
  );
}
