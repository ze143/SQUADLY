import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSector } from '../context/SectorContext';
import { isAdmin, getAllowedTeamIds } from '../utils/permissions';

export function useEscalations(options = {}) {
  const { status } = options;
  const { profile } = useAuth();
  const { selectedSectorId } = useSector();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('escalation_requests')
        .select(`
          *,
          player:players(id, full_name, position, birth_year, team_id),
          from_team:teams!escalation_requests_from_team_id_fkey(id, name, category, sector_id),
          to_team:teams!escalation_requests_to_team_id_fkey(id, name, category, sector_id),
          requester:users!escalation_requests_requested_by_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);

      const { data, error: err } = await query;
      if (err) throw err;

      let list = data || [];

      // ✅ فلترة حسب القطاع (from_team أو to_team)
      if (selectedSectorId) {
        list = list.filter(
          (r) =>
            r.from_team?.sector_id === selectedSectorId ||
            r.to_team?.sector_id === selectedSectorId
        );
      }

      // قيود الصلاحيات (Team Admin)
      if (!isAdmin(profile)) {
        const allowed = getAllowedTeamIds(profile) || [];
        if (allowed.length === 0) {
          setRequests([]);
          setLoading(false);
          return;
        }
        list = list.filter(
          (r) =>
            allowed.includes(r.from_team_id) ||
            allowed.includes(r.to_team_id)
        );
      }

      setRequests(list);
    } catch (err) {
      console.error('useEscalations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile, status, selectedSectorId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (payload) => {
    const { data, error: err } = await supabase
      .from('escalation_requests')
      .insert({ ...payload, requested_by: profile.id })
      .select()
      .single();
    if (err) throw err;
    await fetchRequests();
    return data;
  };

  const approveRequest = async (id, notes = '') => {
    const { error: err } = await supabase
      .from('escalation_requests')
      .update({
        status: 'approved',
        reviewed_by: profile.id,
        review_notes: notes,
      })
      .eq('id', id);
    if (err) throw err;
    await fetchRequests();
  };

  const rejectRequest = async (id, notes = '') => {
    const { error: err } = await supabase
      .from('escalation_requests')
      .update({
        status: 'rejected',
        reviewed_by: profile.id,
        review_notes: notes,
      })
      .eq('id', id);
    if (err) throw err;
    await fetchRequests();
  };

  const removeRequest = async (id) => {
    const { error: err } = await supabase
      .from('escalation_requests')
      .delete()
      .eq('id', id);
    if (err) throw err;
    await fetchRequests();
  };

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    createRequest,
    approveRequest,
    rejectRequest,
    removeRequest,
  };
}