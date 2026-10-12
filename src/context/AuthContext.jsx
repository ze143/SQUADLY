import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authId) => {
    try {
      // 1) جلب المستخدم
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, auth_id, full_name, email, phone, role, is_active")
        .eq("auth_id", authId)
        .maybeSingle();

      if (userError) {
        console.error("خطأ في جلب المستخدم:", userError);
        setProfile(null);
        return null;
      }

      if (!userData) {
        console.warn("لا يوجد سجل users لهذا الحساب");
        setProfile(null);
        return null;
      }

      // 2) جلب الفرق المسؤولة (فقط للإداري)
      let userTeams = [];
      if (userData.role === "team_admin") {
        const { data: ut } = await supabase
          .from("user_teams")
          .select("team_id, teams(id, name, category, birth_year)")
          .eq("user_id", userData.id);

        if (ut) userTeams = ut;
      }

      const fullProfile = {
        ...userData,
        user_teams: userTeams,
      };

      setProfile(fullProfile);
      return fullProfile;
    } catch (err) {
      console.error("fetchProfile exception:", err);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // جلسة حالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // متابعة تغيرات الحالة
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) return fetchProfile(user.id);
  };

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    refreshProfile,
    isAdmin: profile?.role === "admin",
    isTeamAdmin: profile?.role === "team_admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth يجب أن يُستخدم داخل AuthProvider");
  }
  return context;
}
