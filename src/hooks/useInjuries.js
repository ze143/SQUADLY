import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useSector } from "../context/SectorContext";
import { isAdmin, getAllowedTeamIds } from "../utils/permissions";

export function useInjuries(options = {}) {
  const { teamId, status, playerId } = options;
  const { profile } = useAuth();
  const { selectedSectorId } = useSector();

  const [injuries, setInjuries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInjuries = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let q = supabase
        .from("injuries")
        .select(
          `
          *,
          players!inner(id, full_name, position, birth_year, team_id, teams!inner(id, name, category, sector_id))
        `,
        )
        .order("injury_date", { ascending: false });

      if (!isAdmin(profile)) {
        const allowed = getAllowedTeamIds(profile) || [];
        if (allowed.length === 0) {
          setInjuries([]);
          setLoading(false);
          return;
        }
        q = q.in("team_id", allowed);
      }

      if (teamId) q = q.eq("team_id", teamId);
      if (status) q = q.eq("status", status);
      if (playerId) q = q.eq("player_id", playerId);
      if (selectedSectorId) q = q.eq("sector_id", selectedSectorId);

      const { data, error } = await q;
      if (error) throw error;
      setInjuries(data || []);
    } catch (err) {
      console.error("useInjuries:", err);
    } finally {
      setLoading(false);
    }
  }, [profile, teamId, status, playerId, selectedSectorId]);

  useEffect(() => {
    fetchInjuries();
  }, [fetchInjuries]);

  const createInjury = async (payload) => {
    const { data, error } = await supabase
      .from("injuries")
      .insert({ ...payload, created_by: profile.id })
      .select()
      .single();
    if (error) throw error;
    await fetchInjuries();
    return data;
  };

  const updateInjury = async (id, payload) => {
    const { data, error } = await supabase
      .from("injuries")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    await fetchInjuries();
    return data;
  };

  const removeInjury = async (id) => {
    const { error } = await supabase.from("injuries").delete().eq("id", id);
    if (error) throw error;
    await fetchInjuries();
  };

  const markRecovered = async (id) => {
    // 1) حدّث الإصابة
    const { data: injury, error } = await supabase
      .from("injuries")
      .update({
        status: "recovered",
        actual_return_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", id)
      .select("player_id")
      .single();

    if (error) throw error;

    // 2) استنى لحظة عشان الـ trigger يشتغل
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 3) تأكد مفيش إصابات نشطة تانية للاعب
    const { data: otherInjuries } = await supabase
      .from("injuries")
      .select("id")
      .eq("player_id", injury.player_id)
      .eq("status", "active");

    // 4) لو مفيش، فعّل اللاعب (safety net)
    if (!otherInjuries || otherInjuries.length === 0) {
      const { error: playerErr } = await supabase
        .from("players")
        .update({ is_active: true })
        .eq("id", injury.player_id);

      if (playerErr) {
        console.error("فشل تفعيل اللاعب:", playerErr);
      }
    }

    // 5) حدّث القائمة
    await fetchInjuries();
  };

  return {
    injuries,
    loading,
    refetch: fetchInjuries,
    createInjury,
    updateInjury,
    removeInjury,
    markRecovered,
  };
}

// ===== إصابات لاعب معين =====
export function usePlayerInjuries(playerId) {
  const [injuries, setInjuries] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    recovered: 0,
    totalDaysOut: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("injuries")
          .select("*")
          .eq("player_id", playerId)
          .order("injury_date", { ascending: false });

        if (error) throw error;

        const list = data || [];
        setInjuries(list);

        // حساب الأيام
        let totalDays = 0;
        list.forEach((inj) => {
          const start = new Date(inj.injury_date);
          const end = inj.actual_return_date
            ? new Date(inj.actual_return_date)
            : new Date();
          const days = Math.max(
            0,
            Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
          );
          totalDays += days;
        });

        setStats({
          total: list.length,
          active: list.filter((i) => i.status === "active").length,
          recovered: list.filter((i) => i.status === "recovered").length,
          totalDaysOut: totalDays,
        });
      } catch (err) {
        console.error("usePlayerInjuries:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [playerId]);

  return { injuries, stats, loading };
}
