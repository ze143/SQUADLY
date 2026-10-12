import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useSectors() {
  const { profile } = useAuth();
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSectors = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('sectors')
        .select('*')
        .order('created_at');
      if (err) throw err;
      setSectors(data || []);
    } catch (err) {
      console.error('useSectors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  const createSector = async (payload) => {
    const { data, error: err } = await supabase
      .from('sectors')
      .insert(payload)
      .select()
      .single();
    if (err) throw err;
    await fetchSectors();
    return data;
  };

  const updateSector = async (id, payload) => {
    const { data, error: err } = await supabase
      .from('sectors')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (err) throw err;
    await fetchSectors();
    return data;
  };

  // ✅ تفعيل/تعطيل القطاع
  const toggleActive = async (id, isActive) => {
    const { data, error: err } = await supabase
      .from('sectors')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    if (err) throw err;
    await fetchSectors();
    return data;
  };

  const removeSector = async (id) => {
    const { count } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('sector_id', id);

    if (count > 0) {
      throw new Error(`لا يمكن حذف القطاع — هناك ${count} فريق مرتبط به.`);
    }

    const { error: err } = await supabase
      .from('sectors')
      .delete()
      .eq('id', id);
    if (err) throw err;
    await fetchSectors();
  };

  return {
    sectors,
    loading,
    error,
    refetch: fetchSectors,
    createSector,
    updateSector,
    toggleActive,
    removeSector,
  };
}