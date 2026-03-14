import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export interface Student {
  id: string;
  name: string;
  plan: string;
  tokens: number;
  questions_today?: number;
  status?: string;
  plan_expires_at?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Student | null;
  isAdmin: boolean | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isAdmin: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Student | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, name, plan, tokens, questions_today, status, plan_expires_at")
        .eq("user_id", userId)
        .single(),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);

    if (profileRes.data) {
      setProfile({
        id: profileRes.data.user_id,
        name: profileRes.data.name,
        plan: profileRes.data.plan,
        tokens: profileRes.data.tokens,
        questions_today: profileRes.data.questions_today,
        status: profileRes.data.status,
        plan_expires_at: profileRes.data.plan_expires_at,
      });
    } else {
      setProfile(null);
    }

    setIsAdmin(!!roleRes.data);
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          setIsAdmin(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setIsAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isAdmin,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
