import { useEffect, useState } from "react";
import {
  ArrowUpCircle, Plus, ArrowLeft, Check, Target, FileText,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useSector } from "../context/SectorContext";
import { isAdmin, getAllowedTeamIds } from "../utils/permissions";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import EscalationCard from "../components/escalation/EscalationCard";
import { ESCALATION_STATUS } from "../utils/constants";

export default function Escalations() {
  const { profile, loading: authLoading } = useAuth();
  const { selectedSectorId, selectedSector } = useSector();

  const [requests, setRequests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);

  const admin = isAdmin(profile);
  const myTeamIds = getAllowedTeamIds(profile) || [];

  const [step, setStep] = useState(1);
  const [escalationType, setEscalationType] = useState("match");
  const [sourceTeam, setSourceTeam] = useState(null);
  const [sourcePlayers, setSourcePlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [targetTeamId, setTargetTeamId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // ===== تحميل الطلبات (بدون matches عشان نتفادى مشكلة العلاقة) =====
  const loadRequests = async () => {
    if (authLoading) return;
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let q = supabase
        .from("escalation_requests")
        .select(`
          *,
          player:players(id, full_name, position, birth_year, team_id),
          from_team:teams!escalation_requests_from_team_id_fkey(id, name, category, sector_id),
          to_team:teams!escalation_requests_to_team_id_fkey(id, name, category, sector_id),
          requester:users!escalation_requests_requested_by_fkey(id, full_name)
        `)
        .order("created_at", { ascending: false });

      if (filterStatus) q = q.eq("status", filterStatus);

      const { data, error } = await q;
      if (error) throw error;

      let list = data || [];

      // فلترة حسب القطاع
      if (selectedSectorId) {
        list = list.filter(
          (r) =>
            r.from_team?.sector_id === selectedSectorId ||
            r.to_team?.sector_id === selectedSectorId
        );
      }

      // جلب المباريات المرتبطة (منفصل)
      const matchIds = list.map((r) => r.match_id).filter(Boolean);
      if (matchIds.length > 0) {
        const { data: matchesData } = await supabase
          .from("matches")
          .select("id, opponent, match_date, teams(name)")
          .in("id", matchIds);

        const matchesMap = {};
        (matchesData || []).forEach((m) => {
          matchesMap[m.id] = m;
        });

        list = list.map((r) => ({
          ...r,
          matches: r.match_id ? matchesMap[r.match_id] || null : null,
        }));
      }

      setRequests(list);
    } catch (err) {
      console.error("خطأ في تحميل الطلبات:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    let q = supabase
      .from("teams")
      .select("id, name, category, birth_year, sector_id")
      .order("birth_year", { ascending: false });

    if (selectedSectorId) q = q.eq("sector_id", selectedSectorId);

    const { data } = await q;
    setTeams(data || []);
  };

  const loadMyMatches = async () => {
    if (!profile || myTeamIds.length === 0) return;
    let q = supabase
      .from("matches")
      .select("id, opponent, match_date, team_id, teams(name), status")
      .in("team_id", myTeamIds)
      .neq("status", "closed")
      .order("match_date", { ascending: true });

    if (selectedSectorId) q = q.eq("sector_id", selectedSectorId);

    const { data } = await q;
    setMyMatches(data || []);
  };

  useEffect(() => {
    loadRequests();
    loadTeams();
    loadMyMatches();
  }, [profile, authLoading, filterStatus, selectedSectorId]);

  const loadSourcePlayers = async (teamId) => {
    const { data } = await supabase
      .from("players")
      .select("id, full_name, position, birth_year")
      .eq("team_id", teamId)
      .order("full_name");
    setSourcePlayers(data || []);
  };

  const resetForm = () => {
    setStep(1);
    setEscalationType("match");
    setSourceTeam(null);
    setSourcePlayers([]);
    setSelectedPlayer(null);
    setTargetTeamId("");
    setMatchId("");
    setReason("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!targetTeamId) return alert("يرجى اختيار الفرقة المستهدفة");
    if (!reason.trim()) return alert("يرجى كتابة سبب التصعيد");
    if (escalationType === "match" && !matchId)
      return alert("يرجى اختيار المباراة");

    setSaving(true);
    try {
      const sourceIsMine = myTeamIds.includes(sourceTeam.id);
      const targetIsMine = myTeamIds.includes(targetTeamId);
      const autoApprove = sourceIsMine && targetIsMine;

      const payload = {
        player_id: selectedPlayer.id,
        from_team_id: sourceTeam.id,
        to_team_id: targetTeamId,
        requested_by: profile.id,
        reason: reason.trim(),
        notes: notes.trim() || null,
        escalation_type: escalationType,
        match_id: escalationType === "match" ? matchId : null,
      };

      if (autoApprove) {
        payload.status = "approved";
        payload.reviewed_by = profile.id;
        payload.review_notes = "نقل تلقائي";
      } else {
        payload.status = "pending";
      }

      const { data: created, error } = await supabase
        .from("escalation_requests")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      if (autoApprove && escalationType === "match" && created) {
        await supabase.from("match_escalated_players").upsert({
          match_id: matchId,
          player_id: selectedPlayer.id,
          from_team_id: sourceTeam.id,
          escalation_request_id: created.id,
        });
      }

      alert(
        autoApprove
          ? "تم التنفيذ التلقائي ✅"
          : "تم إرسال الطلب، في انتظار الموافقات ✅"
      );

      resetForm();
      setShowNewRequest(false);
      loadRequests();
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm("هل تريد الموافقة على هذا الطلب؟")) return;
    setReviewing(true);
    try {
      const { data: req, error: fetchErr } = await supabase
        .from("escalation_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;

      const newStatus =
        req.escalation_type === "general" ? "pending_admin" : "approved";

      const { error: updateErr } = await supabase
        .from("escalation_requests")
        .update({ status: newStatus, reviewed_by: profile.id })
        .eq("id", id);
      if (updateErr) throw updateErr;

      if (
        newStatus === "approved" &&
        req.escalation_type === "match" &&
        req.match_id
      ) {
        await supabase.from("match_escalated_players").upsert({
          match_id: req.match_id,
          player_id: req.player_id,
          from_team_id: req.from_team_id,
          escalation_request_id: req.id,
        });
      }

      alert("تمت الموافقة ✅");
      await loadRequests();
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async (id) => {
    const notes = prompt("سبب الرفض (اختياري):");
    setReviewing(true);
    try {
      const { error } = await supabase
        .from("escalation_requests")
        .update({
          status: "rejected",
          reviewed_by: profile.id,
          review_notes: notes || "",
        })
        .eq("id", id);
      if (error) throw error;
      await loadRequests();
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setReviewing(false);
    }
  };

  const handleAdminApprove = async (id) => {
    if (!confirm("موافقة نهائية؟ سيتم نقل اللاعب لفرقته الجديدة.")) return;
    setReviewing(true);
    try {
      const { data: req, error: fetchErr } = await supabase
        .from("escalation_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;

      const { error: updateErr } = await supabase
        .from("escalation_requests")
        .update({
          status: "approved",
          admin_approved: true,
          admin_approved_by: profile.id,
          admin_approved_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updateErr) throw updateErr;

      const { error: moveErr } = await supabase
        .from("players")
        .update({ team_id: req.to_team_id })
        .eq("id", req.player_id);
      if (moveErr) throw moveErr;

      alert("تمت الموافقة ونقل اللاعب ✅");
      await loadRequests();
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setReviewing(false);
    }
  };

  const handleAdminReject = async (id) => {
    const notes = prompt("سبب الرفض من المدير الإداري:");
    setReviewing(true);
    try {
      const { error } = await supabase
        .from("escalation_requests")
        .update({
          status: "rejected",
          admin_approved: false,
          admin_approved_by: profile.id,
          review_notes: notes || "رفض من المدير الإداري",
        })
        .eq("id", id);
      if (error) throw error;
      await loadRequests();
    } catch (err) {
      alert("خطأ: " + err.message);
    } finally {
      setReviewing(false);
    }
  };

  const canReviewAsSource = (req) => {
    if (admin) return false;
    return myTeamIds.includes(req.from_team_id) && req.status === "pending";
  };

  const canReviewAsAdmin = (req) => admin && req.status === "pending_admin";

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedTarget = teams.find((t) => t.id === targetTeamId);
  const targetIsMine = selectedTarget && myTeamIds.includes(selectedTarget.id);
  const teamsExceptSource = teams.filter((t) => t.id !== sourceTeam?.id);
  const sourceIsMine = sourceTeam && myTeamIds.includes(sourceTeam.id);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            طلبات التصعيد
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            نقل اللاعبين بين الفرق (لمباراة أو بشكل دائم)
            {selectedSector && ` • ${selectedSector.name}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full md:w-56">
            <Select
              placeholder="كل الحالات"
              options={ESCALATION_STATUS}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
          </div>
          {!admin && (
            <Button onClick={() => setShowNewRequest(true)}>
              <Plus size={18} /> طلب تصعيد جديد
            </Button>
          )}
        </div>
      </div>

      {admin && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-300 text-sm p-3 rounded-lg transition-colors">
          👑 <strong>وضع الإشراف.</strong> تراجع الطلبات العامة (الدائمة)
          للاعتماد النهائي.
        </div>
      )}

      {requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={ArrowUpCircle}
            title="لا توجد طلبات"
            description={
              !admin ? "لم تُرسل أي طلبات تصعيد بعد." : "لا توجد طلبات."
            }
            action={
              !admin ? (
                <Button onClick={() => setShowNewRequest(true)}>
                  <Plus size={18} /> طلب تصعيد جديد
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map((req) => (
            <EscalationCard
              key={req.id}
              request={req}
              onApprove={handleApprove}
              onReject={handleReject}
              onAdminApprove={handleAdminApprove}
              onAdminReject={handleAdminReject}
              canReview={canReviewAsSource(req)}
              canAdminReview={canReviewAsAdmin(req)}
              reviewing={reviewing}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showNewRequest && (
        <Modal
          isOpen={showNewRequest}
          onClose={() => {
            setShowNewRequest(false);
            resetForm();
          }}
          title="طلب تصعيد جديد"
          size="lg"
        >
          {/* Progress */}
          <div className="flex items-center justify-between mb-6">
            {[
              { n: 1, label: "النوع" },
              { n: 2, label: "المصدر" },
              { n: 3, label: "اللاعب" },
              { n: 4, label: "التفاصيل" },
            ].map((s, idx) => (
              <div key={s.n} className="flex items-center flex-1">
                <div
                  className={[
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
                    step > s.n
                      ? "bg-emerald-600 text-white"
                      : step === s.n
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/40"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
                  ].join(" ")}
                >
                  {step > s.n ? <Check size={16} /> : s.n}
                </div>
                <span
                  className={`mr-2 text-xs whitespace-nowrap transition-colors ${
                    step >= s.n
                      ? "text-slate-800 dark:text-slate-100 font-medium"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {s.label}
                </span>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-colors ${
                      step > s.n
                        ? "bg-emerald-600"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                اختر نوع التصعيد:
              </p>
              <button
                type="button"
                onClick={() => {
                  setEscalationType("match");
                  setStep(2);
                }}
                className="w-full text-right p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                    <Target size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      تصعيد لمباراة (مؤقت)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      اللاعب يشارك في مباراة معينة فقط
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEscalationType("general");
                  setStep(2);
                }}
                className="w-full text-right p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                    <FileText size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      تصعيد عام (دائم)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      اللاعب ينتقل نهائياً لفرقك
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                اختر الفرقة المصدر:
              </p>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {teams.map((t) => {
                  const isMine = myTeamIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSourceTeam(t);
                        loadSourcePlayers(t.id);
                        setStep(3);
                      }}
                      className="w-full text-right p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t.category} • مواليد {t.birth_year}
                        </p>
                      </div>
                      {isMine && (
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full shrink-0">
                          فرقتي
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && sourceTeam && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg transition-colors">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    الفرقة المصدر
                  </p>
                  <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                    {sourceTeam.name}
                  </p>
                </div>
              </div>
              {sourcePlayers.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-6">
                  لا يوجد لاعبون
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {sourcePlayers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlayer(p);
                        setStep(4);
                      }}
                      className="w-full text-right p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition"
                    >
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {p.full_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.position} • مواليد {p.birth_year}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 4 && sourceTeam && selectedPlayer && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg transition-colors">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="text-sm">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    اللاعب
                  </p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {selectedPlayer.full_name} • {sourceTeam.name}
                  </p>
                </div>
              </div>

              <Select
                label="الفرقة المستهدفة"
                required
                placeholder="-- اختر الفرقة --"
                options={teamsExceptSource
                  .filter((t) => myTeamIds.includes(t.id))
                  .map((t) => ({
                    value: t.id,
                    label: `${t.name} - ${t.category}`,
                  }))}
                value={targetTeamId}
                onChange={(e) => setTargetTeamId(e.target.value)}
              />

              {escalationType === "match" && (
                <Select
                  label="المباراة المستهدفة"
                  required
                  placeholder={
                    myMatches.length === 0
                      ? "لا توجد مباريات متاحة"
                      : "-- اختر المباراة --"
                  }
                  options={myMatches.map((m) => ({
                    value: m.id,
                    label: `${m.teams?.name} × ${m.opponent}`,
                  }))}
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  disabled={myMatches.length === 0}
                />
              )}

              {sourceIsMine && targetIsMine && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-sm p-3 rounded-lg transition-colors">
                  ✅ <strong>تنفيذ تلقائي.</strong> الفرقة المصدر والمستهدفة من
                  فرقك.
                </div>
              )}

              {!sourceIsMine && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-sm p-3 rounded-lg transition-colors">
                  ⏳ <strong>يحتاج موافقة الإداري الأصلي</strong> المسؤول عن{" "}
                  <strong>{sourceTeam.name}</strong>.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  سبب التصعيد <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="اذكر الأسباب..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewRequest(false);
                    resetForm();
                  }}
                  disabled={saving}
                >
                  إلغاء
                </Button>
                <Button onClick={handleSubmit} loading={saving}>
                  إرسال الطلب
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}