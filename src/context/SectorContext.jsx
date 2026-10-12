import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { isAdmin } from '../utils/permissions';

const SectorContext = createContext(null);

const STORAGE_KEY = 'selected_sector_id';
const ALL_SECTORS_KEY = 'all';

export function SectorProvider({ children }) {
  const { profile } = useAuth();
  const [allSectors, setAllSectors] = useState([]); // كل القطاعات (بما فيها المعطّلة)
  const [selectedSectorId, setSelectedSectorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const admin = isAdmin(profile);

  // ✅ القطاعات النشطة بس
  const activeSectors = allSectors.filter((s) => s.is_active);

  // ===== تحميل القطاعات =====
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase
        .from('sectors')
        .select('*')
        .order('created_at');
      setAllSectors(data || []);
      setLoading(false);
    };
    if (profile) load();
  }, [profile]);

  // ===== تحديد القطاع الافتراضي =====
  useEffect(() => {
    if (!profile || activeSectors.length === 0 || initialized) return;

    if (admin) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === ALL_SECTORS_KEY) {
        setSelectedSectorId(null);
        setInitialized(true);
        return;
      }
      // نتأكد إن القطاع المحفوظ لسه نشط
      if (saved && activeSectors.find((s) => s.id === saved)) {
        setSelectedSectorId(saved);
        setInitialized(true);
        return;
      }
      // افتراضي: جميع القطاعات
      setSelectedSectorId(null);
      setInitialized(true);
      return;
    }

    // للإداري: القطاع بتاعه
    if (profile.primary_sector_id) {
      const exists = activeSectors.find(
        (s) => s.id === profile.primary_sector_id
      );
      if (exists) {
        setSelectedSectorId(profile.primary_sector_id);
        setInitialized(true);
        return;
      }
    }

    setSelectedSectorId(activeSectors[0].id);
    setInitialized(true);
  }, [profile, activeSectors, admin, initialized]);

  // ✅ لو القطاع المختار اتعطّل → نرجع لـ "جميع القطاعات" (للأدمن)
  useEffect(() => {
    if (!admin || !initialized) return;
    if (selectedSectorId === null) return;

    const current = allSectors.find((s) => s.id === selectedSectorId);
    if (current && !current.is_active) {
      // القطاع المختار بقى معطّل → رجّع لـ "جميع القطاعات"
      setSelectedSectorId(null);
    }
  }, [allSectors, selectedSectorId, admin, initialized]);

  // ===== حفظ الاختيار =====
  useEffect(() => {
    if (!initialized) return;
    if (selectedSectorId) {
      localStorage.setItem(STORAGE_KEY, selectedSectorId);
    } else {
      localStorage.setItem(STORAGE_KEY, ALL_SECTORS_KEY);
    }
  }, [selectedSectorId, initialized]);

  // ===== قطاعات الإداري =====
  const [mySectors, setMySectors] = useState([]);

  useEffect(() => {
    const loadMySectors = async () => {
      if (!profile || admin) {
        setMySectors([]);
        return;
      }

      const { supabase } = await import('../lib/supabase');
      const { data: userTeams } = await supabase
        .from('user_teams')
        .select('team_id, teams!inner(sector_id)')
        .eq('user_id', profile.id);

      if (!userTeams) {
        setMySectors([]);
        return;
      }

      const sectorIds = [
        ...new Set(
          userTeams
            .map((ut) => ut.teams?.sector_id)
            .filter((id) => id !== null && id !== undefined)
        ),
      ];

      setMySectors(sectorIds);
    };

    loadMySectors();
  }, [profile, admin]);

  const selectedSector = allSectors.find((s) => s.id === selectedSectorId);
  const isAllSectors = selectedSectorId === null;

  // ✅ Admin دايماً، Team Admin لو عنده أكتر من قطاع
  const canSwitchSector = admin || mySectors.length > 1;

  // ✅ القطاعات المتاحة للسويتش (نشطة بس)
  const availableSectors = admin
    ? activeSectors
    : activeSectors.filter((s) => mySectors.includes(s.id));

  const value = {
    sectors: availableSectors, // النشطة المتاحة
    allSectors, // كل القطاعات (للأدمن في /settings/sectors)
    activeSectors, // النشطة بس
    selectedSectorId,
    selectedSector,
    setSelectedSectorId,
    canSwitchSector,
    isAllSectors,
    isAdmin: admin,
    loading,
  };

  return (
    <SectorContext.Provider value={value}>{children}</SectorContext.Provider>
  );
}

export function useSector() {
  const context = useContext(SectorContext);
  if (!context) {
    throw new Error('useSector يجب أن يُستخدم داخل SectorProvider');
  }
  return context;
}   