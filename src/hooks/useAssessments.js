import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// ===== الاختبارات =====
export function useAssessments(options = {}) {
  const { status, search } = options;
  const { profile } = useAuth();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssessments = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let q = supabase
        .from("assessments")
        .select(`*, teams(id, name, category, sector_id)`)
        .order("created_at", { ascending: false });

      if (status) q = q.eq("status", status);
      if (search) q = q.ilike("name", `%${search}%`);

      const { data, error: err } = await q;
      if (err) throw err;
      setAssessments(data || []);
    } catch (err) {
      console.error("useAssessments:", err);
    } finally {
      setLoading(false);
    }
  }, [profile, status, search]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const getAssessmentById = useCallback(async (id) => {
    const { data, error: err } = await supabase
      .from("assessments")
      .select(`*, teams(id, name, category, sector_id)`)
      .eq("id", id)
      .single();
    if (err) throw err;
    return data;
  }, []);

  const createAssessment = async (payload) => {
    const { data, error: err } = await supabase
      .from("assessments")
      .insert({ ...payload, created_by: profile.id, status: "active" })
      .select()
      .single();
    if (err) throw err;
    await fetchAssessments();
    return data;
  };

  const updateAssessment = async (id, payload) => {
    const { data, error: err } = await supabase
      .from("assessments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;
    await fetchAssessments();
    return data;
  };

  const removeAssessment = async (id) => {
    const { error: err } = await supabase
      .from("assessments")
      .delete()
      .eq("id", id);
    if (err) throw err;
    await fetchAssessments();
  };

  return {
    assessments,
    loading,
    refetch: fetchAssessments,
    getAssessmentById,
    createAssessment,
    updateAssessment,
    removeAssessment,
  };
}

// ===== المشاركين (مع الجلسة النشطة) =====
export function useAssessmentParticipants(assessmentId, options = {}) {
  const { skip = false } = options;
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(!skip);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchParticipants = useCallback(async () => {
    if (skip || !assessmentId) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. اجلب الجلسات الرئيسية
      const { data: primaries, error: err } = await supabase
        .from("assessment_participants")
        .select(
          `*, added_player:players!assessment_participants_added_player_id_fkey(id, full_name)`,
        )
        .eq("assessment_id", assessmentId)
        .eq("is_primary", true)
        .order("created_at", { ascending: false });

      if (err) throw err;

      // 2. لكل جلسة رئيسية، اجلب الجلسات المرتبطة
      const enriched = await Promise.all(
        (primaries || []).map(async (p) => {
          const { data: children } = await supabase
            .from("assessment_participants")
            .select("*")
            .eq("previous_evaluation_id", p.id)
            .order("session_number", { ascending: true });

          const allSessions = [p, ...(children || [])];

          // ✅ الجلسة النشطة = آخر جلسة pending
          const pendingSession = allSessions.find(
            (s) => s.final_decision === "pending",
          );

          return {
            ...p,
            _allSessions: allSessions,
            _totalSessions: allSessions.length,
            _activeSession:
              pendingSession || allSessions[allSessions.length - 1],
          };
        }),
      );

      setParticipants(enriched);
    } catch (err) {
      console.error("useAssessmentParticipants:", err);
    } finally {
      setLoading(false);
    }
  }, [assessmentId, skip]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants, refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  const createParticipant = async (payload) => {
    const { data, error: err } = await supabase
      .from("assessment_participants")
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    await new Promise((r) => setTimeout(r, 300));
    setRefetchTrigger((prev) => prev + 1);
    return data;
  };

  const updateParticipant = async (id, payload) => {
    const { data, error: err } = await supabase
      .from("assessment_participants")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;
    await new Promise((r) => setTimeout(r, 300));
    setRefetchTrigger((prev) => prev + 1);
    return data;
  };

  const removeParticipant = async (id) => {
    const { error: err } = await supabase
      .from("assessment_participants")
      .delete()
      .eq("id", id);
    if (err) throw err;
    await new Promise((r) => setTimeout(r, 300));
    setRefetchTrigger((prev) => prev + 1);
  };

  return {
    participants,
    loading,
    refetch,
    createParticipant,
    updateParticipant,
    removeParticipant,
  };
}

// ===== كل الجلسات للاعب معين =====
export function useParticipantSessions(participantId) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      if (!participantId) {
        setSessions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let rootId = participantId;

        const { data: current } = await supabase
          .from("assessment_participants")
          .select("id, previous_evaluation_id, is_primary")
          .eq("id", participantId)
          .single();

        if (current && !current.is_primary) {
          let cid = participantId;
          for (let i = 0; i < 10; i++) {
            const { data } = await supabase
              .from("assessment_participants")
              .select("id, previous_evaluation_id, is_primary")
              .eq("id", cid)
              .single();
            if (!data || !data.previous_evaluation_id) break;
            cid = data.previous_evaluation_id;
            if (data.is_primary) {
              rootId = cid;
              break;
            }
          }
        }

        const { data: rootData } = await supabase
          .from("assessment_participants")
          .select("*")
          .eq("id", rootId)
          .single();

        const { data: children } = await supabase
          .from("assessment_participants")
          .select("*")
          .eq("previous_evaluation_id", rootId)
          .order("session_number", { ascending: true });

        const all = [rootData, ...(children || [])].filter(Boolean);
        setSessions(all);
      } catch (err) {
        console.error("useParticipantSessions:", err);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [participantId]);

  return { sessions, loading };
}

// ===== الإضافة للاعبين =====
export function useAddToPlayers() {
  const { profile } = useAuth();

  const addParticipantToPlayers = async (participant, extraData = {}) => {
    // 1. تحقق من التكرار
    const { data: existing } = await supabase
      .from("players")
      .select("id, full_name, team_id, teams(name)")
      .eq("national_id", participant.national_id)
      .maybeSingle();

    if (existing) {
      throw new Error(
        `⚠️ الرقم القومي (${participant.national_id}) مسجل بالفعل للاعب: ${existing.full_name}${existing.teams?.name ? ` - ${existing.teams.name}` : ""}`,
      );
    }

    // ✅ افصل الأقساط عن البيانات
    const { installments, paid_amount, ...restExtraData } = extraData;

    const totalAmount = Number(restExtraData.total_amount) || 0;
    const paidAmount = Number(paid_amount) || 0;
    const paymentType = restExtraData.payment_type;
    const playerType = restExtraData.player_type || "free";

    // 2. أنشئ اللاعب
    const { data: player, error: playerErr } = await supabase
      .from("players")
      .insert({
        full_name: participant.full_name,
        national_id: participant.national_id,
        birth_date: participant.birth_date,
        birth_year: participant.birth_year,
        position: participant.position,
        previous_clubs: participant.previous_clubs,
        technical_level: participant.technical_level,
        player_type: playerType,
        payment_type: paymentType || null,
        total_amount: playerType === "investment" ? totalAmount : 0,
        paid_amount:
          playerType === "investment" && paymentType === "partial"
            ? paidAmount
            : playerType === "investment" && paymentType === "full"
              ? totalAmount
              : 0,
        payment_status:
          playerType === "investment"
            ? paymentType === "full"
              ? "paid"
              : "unpaid"
            : "pending",
        is_active: true,
        team_id: restExtraData.team_id || null,
      })
      .select()
      .single();

    if (playerErr) throw playerErr;

    // 3. ✅ احفظ الأقساط حسب نوع الدفع
    if (playerType === "investment") {
      const today = new Date().toISOString().split("T")[0];
      const allRecords = [];

      // ✅ الحالة 1: دفعة كاملة → قسط واحد مسدد
      if (paymentType === "full") {
        allRecords.push({
          player_id: player.id,
          amount: totalAmount,
          due_date: today,
          paid_date: today,
          status: "paid",
          notes: "دفعة كاملة",
        });
      }

      // ✅ الحالة 2: دفعة جزئية → قسط مسدد + أقساط للباقي
      if (paymentType === "partial") {
        // 2.1 قسط مسدد بالمبلغ المدفوع
        if (paidAmount > 0) {
          allRecords.push({
            player_id: player.id,
            amount: paidAmount,
            due_date: today,
            paid_date: today,
            status: "paid",
            notes: "دفعة مقدمة",
          });
        }

        // 2.2 أقساط للباقي
        if (installments && installments.length > 0) {
          const remainingRecords = installments.map((inst) => ({
            player_id: player.id,
            amount: Number(inst.amount),
            due_date: inst.due_date,
            status: inst.status || "unpaid",
            notes: inst.notes || null,
          }));
          allRecords.push(...remainingRecords);
        }
      }

      // ✅ الحالة 3: أقساط → كل الأقساط (بدون قسط مسدد)
      if (paymentType === "installments") {
        if (installments && installments.length > 0) {
          const records = installments.map((inst) => ({
            player_id: player.id,
            amount: Number(inst.amount),
            due_date: inst.due_date,
            status: inst.status || "unpaid",
            notes: inst.notes || null,
          }));
          allRecords.push(...records);
        }
      }

      // ✅ احفظ كل الأقساط
      if (allRecords.length > 0) {
        const { error: instErr } = await supabase
          .from("installments")
          .insert(allRecords);

        if (instErr) throw instErr;
      }
    }

    // 4. حدّث المشارك
    const { error: updateErr } = await supabase
      .from("assessment_participants")
      .update({
        is_added_to_players: true,
        added_player_id: player.id,
        added_by: profile.id,
        added_at: new Date().toISOString(),
      })
      .eq("id", participant.id);

    if (updateErr) throw updateErr;

    return player;
  };

  return { addParticipantToPlayers };
}
