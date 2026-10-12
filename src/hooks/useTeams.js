import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { isAdmin, getAllowedTeamIds } from "../utils/permissions";
import { useSector } from "../context/SectorContext";

export function useTeams() {
  const { profile } = useAuth();
  const { selectedSectorId } = useSector();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeams = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("teams")
        .select("*, players(count)")
        .order("birth_year", { ascending: false });

      // ✅ فلترة حسب القطاع
      if (selectedSectorId) {
        query = query.eq("sector_id", selectedSectorId);
      }

      if (!isAdmin(profile)) {
        const allowed = getAllowedTeamIds(profile) || [];
        if (allowed.length === 0) {
          setTeams([]);
          setLoading(false);
          return;
        }
        query = query.in("id", allowed);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setTeams(data || []);
    } catch (err) {
      console.error("useTeams:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile, selectedSectorId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = async (payload) => {
    const { data, error: err } = await supabase
      .from("teams")
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    await fetchTeams();
    return data;
  };

  const updateTeam = async (id, payload) => {
    const { data, error: err } = await supabase
      .from("teams")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;
    await fetchTeams();
    return data;
  };

  const removeTeam = async (id) => {
    const { error: err } = await supabase.from("teams").delete().eq("id", id);
    if (err) throw err;
    await fetchTeams();
  };

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
    createTeam,
    updateTeam,
    removeTeam,
  };
}
