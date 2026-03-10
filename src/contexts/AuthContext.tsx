import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

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
  profile: Student | null; // keep profile variable to not break other components, but object is student
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    // "buscar registro da tabela students."
    const { data } = await supabase
      .from("students" as any)
      .select("id, name, plan, tokens, questions_today, status, plan_expires_at")
      .eq("id", userId) // assuming the student ID matches the auth user ID based on "quando estudante fizer login"
      .single();
    if (data) {
        setProfile(data as Student);
    } else {
        // Fallback or error handling if student is not found
        const { data: profileData } = await supabase.from("profiles").select("id:user_id, name, plan, tokens").eq("user_id", userId).single();
        if (profileData) {
            setProfile(profileData as Student);
        } else {
            setProfile(null);
        }
    }
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
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
