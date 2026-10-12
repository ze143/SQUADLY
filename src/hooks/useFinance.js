import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSector } from '../context/SectorContext';
import { isAdmin, getAllowedTeamIds } from '../utils/permissions';

export function useFinance(options = {}) {
  const { playerId, status } = options;
  const { profile } = useAuth();
  const { selectedSectorId } = useSector();

  const [installments, setInstallments] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInstallments = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('installments')
        .select(`
          *,
          players!inner(id, full_name, national_id, team_id, teams!inner(id, name, sector_id))
        `)
        .order('due_date', { ascending: true });

      if (!isAdmin(profile)) {
        const allowed = getAllowedTeamIds(profile) || [];
        if (allowed.length === 0) {
          setInstallments([]);
          setLoading(false);
          return;
        }
        query = query.in('players.team_id', allowed);
      }

      // ✅ فلترة حسب القطاع
      if (selectedSectorId) {
        query = query.eq('players.teams.sector_id', selectedSectorId);
      }

      if (playerId) query = query.eq('player_id', playerId);
      if (status) query = query.eq('status', status);

      const { data, error: err } = await query;
      if (err) throw err;

      const list = data || [];
      setInstallments(list);

      const s = list.reduce(
        (acc, i) => {
          const amount = Number(i.amount) || 0;
          acc.total += amount;
          if (i.status === 'paid') acc.paid += amount;
          else if (i.status === 'unpaid') acc.unpaid += amount;
          else acc.pending += amount;
          return acc;
        },
        { total: 0, paid: 0, unpaid: 0, pending: 0 }
      );
      setSummary(s);
    } catch (err) {
      console.error('useFinance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile, playerId, status, selectedSectorId]);

  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  const createInstallment = async (payload) => {
    const { data, error: err } = await supabase
      .from('installments')
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    await fetchInstallments();
    return data;
  };

  const updateInstallment = async (id, payload) => {
    const { data, error: err } = await supabase
      .from('installments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (err) throw err;
    await fetchInstallments();
    return data;
  };

  const markAsPaid = async (id) => {
    const today = new Date().toISOString().split('T')[0];
    return updateInstallment(id, { status: 'paid', paid_date: today });
  };

  const removeInstallment = async (id) => {
    const { error: err } = await supabase.from('installments').delete().eq('id', id);
    if (err) throw err;
    await fetchInstallments();
  };

  return {
    installments,
    summary,
    loading,
    error,
    refetch: fetchInstallments,
    createInstallment,
    updateInstallment,
    markAsPaid,
    removeInstallment,
  };
}