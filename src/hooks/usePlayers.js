import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { isAdmin, getAllowedTeamIds } from "../utils/permissions";
import { useSector } from "../context/SectorContext";

export function usePlayers(options = {}) {
  const { teamId, position, search } = options;
  const { profile } = useAuth();
  const { selectedSectorId } = useSector();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlayers = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("players")
        .select("*, teams(id, name, category, birth_year, sector_id)")
        .order("created_at", { ascending: false });

      // ✅ قيود الصلاحيات
      if (!isAdmin(profile)) {
        const allowed = getAllowedTeamIds(profile) || [];
        if (allowed.length === 0) {
          setPlayers([]);
          setLoading(false);
          return;
        }
        query = query.in("team_id", allowed);
      }

      if (teamId) query = query.eq("team_id", teamId);
      if (position) query = query.eq("position", position);
      if (search)
        query = query.or(
          `full_name.ilike.%${search}%,national_id.ilike.%${search}%`,
        );

      const { data, error: err } = await query;
      if (err) throw err;

      // ✅ فلتر القطاع في JS (أضمن من .or() مع relations)
      let list = data || [];
      if (selectedSectorId) {
        list = list.filter((p) => p.teams?.sector_id === selectedSectorId);
      }

      setPlayers(list);
    } catch (err) {
      console.error("usePlayers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile, teamId, position, search, selectedSectorId]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const createPlayer = async (payload) => {
    const { installments, ...playerData } = payload;

    const { data, error: err } = await supabase
      .from("players")
      .insert(playerData)
      .select()
      .single();
    if (err) throw err;

    if (installments && installments.length > 0) {
      const records = installments.map((inst) => ({
        player_id: data.id,
        amount: Number(inst.amount),
        due_date: inst.due_date,
        status: inst.status || "unpaid",
        notes: inst.notes || null,
        paid_date: inst.paid_date || null,
      }));

      const { error: instErr } = await supabase
        .from("installments")
        .insert(records);

      if (instErr) throw instErr;
    }

    await fetchPlayers();
    return data;
  };

  const updatePlayer = async (id, payload) => {
    const { installments, ...playerData } = payload;

    const { data, error: err } = await supabase
      .from("players")
      .update(playerData)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;

    if (installments !== undefined) {
      await supabase.from("installments").delete().eq("player_id", id);

      if (installments.length > 0) {
        const records = installments.map((inst) => ({
          player_id: id,
          amount: Number(inst.amount),
          due_date: inst.due_date,
          status: inst.status || "unpaid",
          notes: inst.notes || null,
          paid_date: inst.paid_date || null,
        }));

        const { error: instErr } = await supabase
          .from("installments")
          .insert(records);

        if (instErr) throw instErr;
      }
    }

    await fetchPlayers();
    return data;
  };

  const removePlayer = async (id) => {
    const { error: err } = await supabase.from("players").delete().eq("id", id);
    if (err) throw err;
    await fetchPlayers();
  };

  const getPlayerById = useCallback(async (id) => {
    const { data, error: err } = await supabase
      .from("players")
      .select("*, teams(id, name, category)")
      .eq("id", id)
      .single();
    if (err) throw err;
    return data;
  }, []);

  return {
    players,
    loading,
    error,
    refetch: fetchPlayers,
    createPlayer,
    updatePlayer,
    removePlayer,
    getPlayerById,
  };
}
