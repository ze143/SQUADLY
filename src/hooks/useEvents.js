import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSector } from '../context/SectorContext';
import { isAdmin, getAllowedTeamIds } from '../utils/permissions';

export function useEvents(options = {}) {
  const { teamId, eventType, from, to, status } = options;
  const { profile } = useAuth();
  const { selectedSectorId } = useSector();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let q = supabase
        .from('events')
        .select(`
          *,
          teams(id, name, category),
          sectors(id, name, color),
          attendance:event_attendance(id, status, player_id)
        `)
        .order('event_date', { ascending: false });

      if (!isAdmin(profile)) {
        const allowed = getAllowedTeamIds(profile) || [];
        if (allowed.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }
        q = q.in('team_id', allowed);
      }

      if (teamId) q = q.eq('team_id', teamId);
      if (eventType) q = q.eq('event_type', eventType);
      if (status) q = q.eq('status', status);
      if (selectedSectorId) q = q.eq('sector_id', selectedSectorId);
      if (from) q = q.gte('event_date', from);
      if (to) q = q.lte('event_date', to);

      const { data, error } = await q;
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('useEvents:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, teamId, eventType, status, selectedSectorId, from, to]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (payload) => {
    const { data, error } = await supabase
      .from('events')
      .insert({ ...payload, created_by: profile.id })
      .select()
      .single();
    if (error) throw error;
    await fetchEvents();
    return data;
  };

  const updateEvent = async (id, payload) => {
    const { data, error } = await supabase
      .from('events')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await fetchEvents();
    return data;
  };

  const removeEvent = async (id) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    await fetchEvents();
  };

  const saveAttendance = async (eventId, attendanceList) => {
    await supabase
      .from('event_attendance')
      .delete()
      .eq('event_id', eventId);

    if (attendanceList.length === 0) return;

    const records = attendanceList.map((a) => ({
      event_id: eventId,
      player_id: a.player_id,
      status: a.status,
      notes: a.notes || null,
    }));

    const { error } = await supabase
      .from('event_attendance')
      .insert(records);
    if (error) throw error;
    await fetchEvents();
  };

  return {
    events,
    loading,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    removeEvent,
    saveAttendance,
  };
}

// ===== حضور لاعب (تدريبات + اجتماعات) =====
export function usePlayerAttendance(playerId) {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    training: { total: 0, present: 0, absent: 0, late: 0, excused: 0, injured: 0, percentage: 0 },
    meeting: { total: 0, present: 0, absent: 0, late: 0, excused: 0, injured: 0, percentage: 0 },
    overall: { total: 0, present: 0, percentage: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('event_attendance')
          .select(`
            *,
            event:events(
              id, event_type, event_date, title, training_type, meeting_type
            )
          `)
          .eq('player_id', playerId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const list = (data || []).filter((a) => a.event);
        setAttendance(list);

        // تدريبات
        const trainings = list.filter((a) => a.event?.event_type === 'training');
        // اجتماعات
        const meetings = list.filter((a) => a.event?.event_type === 'meeting');

        const calcStats = (arr) => {
          const s = arr.reduce(
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
          return s;
        };

        const trainingStats = calcStats(trainings);
        const meetingStats = calcStats(meetings);

        const allStats = calcStats(list);

        setStats({
          total: list.length,
          training: trainingStats,
          meeting: meetingStats,
          overall: {
            total: allStats.total,
            present: allStats.present,
            percentage: allStats.percentage,
          },
        });
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