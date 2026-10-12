import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useSearch(filters = {}) {
  const { profile } = useAuth();
  const [results, setResults] = useState({
    players: [],
    teams: [],
    matches: [],
    installments: [],
    suspensions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.rpc('search_all', {
        p_query: filters.query || null,
        p_sector_id: filters.sectorId || null,
        p_team_id: filters.teamId || null,
        p_position: filters.position || null,
        p_birth_year: filters.birthYear ? Number(filters.birthYear) : null,
        p_player_type: filters.playerType || null,
        p_status: filters.status || null,
      });

      if (err) throw err;
      setResults(
        data || {
          players: [],
          teams: [],
          matches: [],
          installments: [],
          suspensions: [],
        }
      );
    } catch (err) {
      console.error('useSearch:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    profile,
    filters.query,
    filters.sectorId,
    filters.teamId,
    filters.position,
    filters.birthYear,
    filters.playerType,
    filters.status,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search();
    }, 300); // debounce
    return () => clearTimeout(timer);
  }, [search]);

  return { results, loading, error, refetch: search };
}