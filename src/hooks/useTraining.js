import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSector } from '../context/SectorContext';
import { isAdmin, getAllowedTeamIds } from '../utils/permissions';

export function useTraining(options = {}) {
  const { teamId, from, to } = options;
  const { profile } = useAuth();
  const { selectedSectorId } = useSector();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let q = supabase
        .from('training_sessions')
        .select(`
          *,
          teams(id, name, category),
          sectors(id, name, color),
          attendance:training_attendance(
            id, status, player_id
          )
        `)
        .order('session_date', { ascending: false });

      if (!isAdmin(profile)) {
        const allowed = getAllowedTeamIds(profile) || [];
        if (allowed.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }
        q = q.in('team_id', allowed);
      }

      if (teamId) q = q.eq('team_id', teamId);
      if (selectedSectorId) q = q.eq('sector_id', selectedSectorId);
      if (from) q = q.gte('session_date', from);
      if (to) q = q.lte('session_date', to);

      const { data, error } = await q;
      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('useTraining:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, teamId, selectedSectorId, from, to]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (payload) => {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert({ ...payload, created_by: profile.id })
      .select()
      .single();
    if (error) throw error;
    await fetchSessions();
    return data;
  };

  const updateSession = async (id, payload) => {
    const { data, error } = await supabase
      .from('training_sessions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await fetchSessions();
    return data;
  };

  const removeSession = async (id) => {
    const { error } = await supabase
      .from('training_sessions')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchSessions();
  };

  const saveAttendance = async (sessionId, attendanceList) => {
    // احذف القديم
    await supabase
      .from('training_attendance')
      .delete()
      .eq('session_id', sessionId);

    if (attendanceList.length === 0) return;

    // أضف الجديد
    const records = attendanceList.map((a) => ({
      session_id: sessionId,
      player_id: a.player_id,
      status: a.status,
      notes: a.notes || null,
    }));

    const { error } = await supabase
      .from('training_attendance')
      .insert(records);
    if (error) throw error;
    await fetchSessions();
  };

  const getAttendance = async (sessionId) => {
    const { data, error } = await supabase
      .from('training_attendance')
      .select('*')
      .eq('session_id', sessionId);
    if (error) throw error;
    return data || [];
  };

  return {
    sessions,
    loading,
    refetch: fetchSessions,
    createSession,
    updateSession,
    removeSession,
    saveAttendance,
    getAttendance,
  };
}

// ===== Hook لحضور لاعب معين =====
export function usePlayerAttendance(playerId) {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    injured: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('training_attendance')
          .select(`
            *,
            session:training_sessions(
              id, session_date, title, session_type, team_id
            )
          `)
          .eq('player_id', playerId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const list = data || [];
        setAttendance(list);

        const s = list.reduce(
          (acc, a) => {
            acc.total++;
            if (a.status === 'present') acc.present++;
            else if (a.status === 'absent') acc.absent++;
            else if (a.status === 'late') acc.late++;
            else if (a.status === 'excused') acc.excused++;
            else if (a.status === 'injured') acc.injured++;
            return acc;
          },
          { total: 0, present: 0, absent: 0, late: 0, excused: 0, injured: 0 }
        );

        s.percentage =
          s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;

        setStats(s);
      } catch (err) {
        console.error('usePlayerAttendance:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [playerId]);

  return { attendance, stats, loading };
}