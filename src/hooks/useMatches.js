import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { isAdmin, getAllowedTeamIds } from "../utils/permissions";
import { useSector } from "../context/SectorContext";

export function useMatches(options = {}) {
  const { teamId, status } = options;
  const { profile, loading: authLoading } = useAuth();
  const { selectedSectorId } = useSector();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = useCallback(async () => {
    if (authLoading) return;
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("matches")
        .select(
          `
          *,
          teams(id, name, category),
          competitions(id, name, season, type)
        `,
        )
        .order("match_date", { ascending: false });

      // ✅ فلترة حسب القطاع
      if (selectedSectorId) {
        query = query.eq("sector_id", selectedSectorId);
      }

      if (!isAdmin(profile)) {
        const allowed = getAllowedTeamIds(profile) || [];
        if (allowed.length === 0) {
          setMatches([]);
          setLoading(false);
          return;
        }
        query = query.in("team_id", allowed);
      }

      if (teamId) query = query.eq("team_id", teamId);
      if (status) query = query.eq("status", status);

      const { data, error: err } = await query;
      if (err) throw err;
      setMatches(data || []);
    } catch (err) {
      console.error("useMatches:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile, authLoading, teamId, status, selectedSectorId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const createMatch = async (payload) => {
    const { data, error: err } = await supabase
      .from("matches")
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    await fetchMatches();
    return data;
  };

  const updateMatch = async (id, payload) => {
    const { data, error: err } = await supabase
      .from("matches")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;

    // ✅ لو المباراة اتقفلت → افحص الإيقافات
    if (payload.status === "closed") {
      try {
        const { data: result } = await supabase.rpc(
          "check_and_lift_suspensions",
        );
        if (result?.lifted > 0) {
          console.log(`✅ تم رفع ${result.lifted} إيقاف تلقائياً`);
        }
      } catch (e) {
        console.error("خطأ في فحص الإيقافات:", e);
      }
    }

    await fetchMatches();
    return data;
  };

  const removeMatch = async (id) => {
    const { error: err } = await supabase.from("matches").delete().eq("id", id);
    if (err) throw err;
    await fetchMatches();
  };

  const getMatchDetails = useCallback(async (id) => {
    const [
      matchRes,
      lineupRes,
      eventsRes,
      refereesRes,
      escalatedRes,
      suspensionsRes,
      injuriesRes,
    ] = await Promise.all([
      supabase
        .from("matches")
        .select(
          "*, teams(id, name, category), competitions(id, name, season, type)",
        )
        .eq("id", id)
        .single(),
      supabase
        .from("match_lineups")
        .select("*, players(id, full_name, position)")
        .eq("match_id", id),
      supabase
        .from("match_events")
        .select(
          `
            *,
            players!match_events_player_id_fkey(id, full_name, position),
            assist:players!match_events_assist_player_id_fkey(id, full_name)
          `,
        )
        .eq("match_id", id)
        .order("minute", { ascending: true }),
      supabase.from("match_referees").select("*").eq("match_id", id),
      supabase
        .from("match_escalated_players")
        .select(
          `
            *,
            players(id, full_name, position, birth_year),
            from_team:teams!match_escalated_players_from_team_id_fkey(id, name, category)
          `,
        )
        .eq("match_id", id),
      supabase
        .from("suspensions")
        .select("player_id, matches_suspended, matches_served, reason, type")
        .eq("status", "active"),
      // ✅ إصابات: بنجيب كل الإصابات (حتى المتعافي منها) عشان نحسبها بتاريخ المباراة
      supabase
        .from("injuries")
        .select(
          "player_id, injury_type, severity, injury_date, expected_return_date, actual_return_date, status",
        ),
    ]);

    if (matchRes.error) throw matchRes.error;

    return {
      match: matchRes.data,
      lineup: lineupRes.data || [],
      events: eventsRes.data || [],
      referees: refereesRes.data || [],
      escalatedPlayers: escalatedRes.data || [],
      activeSuspensions: suspensionsRes.data || [],
      activeInjuries: injuriesRes.data || [],
    };
  }, []);

  const saveLineup = async (matchId, starters = [], substitutes = []) => {
    if (starters.length !== 11) throw new Error("يجب اختيار 11 لاعباً أساسياً");
    if (substitutes.length !== 9)
      throw new Error("يجب اختيار 9 لاعبين احتياطيين");

    const allIds = [...starters, ...substitutes];

    // ✅ تحقق من الإصابات النشطة
    const { data: injured, error: injErr } = await supabase
      .from("injuries")
      .select("player_id, players(full_name)")
      .eq("status", "active")
      .in("player_id", allIds);

    if (injErr) throw injErr;
    if (injured?.length > 0) {
      const names = injured
        .map((i) => i.players?.full_name)
        .filter(Boolean)
        .join("، ");
      throw new Error(
        `🏥 يوجد ${injured.length} لاعب مصاب في التشكيل: ${names}\nلازم تشيلهم الأول.`,
      );
    }

    // ✅ تحقق من الإيقافات النشطة
    const { data: suspended, error: susErr } = await supabase
      .from("suspensions")
      .select("player_id, players(full_name)")
      .eq("status", "active")
      .in("player_id", allIds);

    if (susErr) throw susErr;
    if (suspended?.length > 0) {
      const names = suspended
        .map((s) => s.players?.full_name)
        .filter(Boolean)
        .join("، ");
      throw new Error(
        `🚫 يوجد ${suspended.length} لاعب موقوف في التشكيل: ${names}\nلازم تشيلهم الأول.`,
      );
    }

    // ✅ حذف التشكيل القديم وإضافة الجديد
    await supabase.from("match_lineups").delete().eq("match_id", matchId);

    const records = [
      ...starters.map((pid) => ({
        match_id: matchId,
        player_id: pid,
        lineup_type: "starter",
      })),
      ...substitutes.map((pid) => ({
        match_id: matchId,
        player_id: pid,
        lineup_type: "substitute",
      })),
    ];

    const { error: err } = await supabase.from("match_lineups").insert(records);
    if (err) throw err;
  };

  const addEvent = async (payload) => {
    const { data, error: err } = await supabase
      .from("match_events")
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    return data;
  };

  const removeEvent = async (id) => {
    const { error: err } = await supabase
      .from("match_events")
      .delete()
      .eq("id", id);
    if (err) throw err;
  };

  const saveReferees = async (matchId, referees = []) => {
    await supabase.from("match_referees").delete().eq("match_id", matchId);
    if (referees.length === 0) return;
    const records = referees.map((r) => ({ ...r, match_id: matchId }));
    const { error: err } = await supabase
      .from("match_referees")
      .insert(records);
    if (err) throw err;
  };

  return {
    matches,
    loading,
    error,
    refetch: fetchMatches,
    createMatch,
    updateMatch,
    removeMatch,
    getMatchDetails,
    saveLineup,
    addEvent,
    removeEvent,
    saveReferees,
  };
}
