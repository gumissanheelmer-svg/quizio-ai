import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export function useChatSessions(userId: string | undefined) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSessions = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      return;
    }

    // Fetch last message for each session
    const sessionsWithPreview: ChatSession[] = await Promise.all(
      (data || []).map(async (s) => {
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("message")
          .eq("chat_id", s.id)
          .order("created_at", { ascending: false })
          .limit(1);
        return {
          ...s,
          last_message: msgs?.[0]?.message?.slice(0, 80) || "",
        };
      })
    );

    setSessions(sessionsWithPreview);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(async (): Promise<string | null> => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: userId, title: "Nova Conversa" })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error creating session:", error);
      return null;
    }

    await fetchSessions();
    setActiveSessionId(data.id);
    return data.id;
  }, [userId, fetchSessions]);

  const updateTitle = useCallback(async (sessionId: string, title: string) => {
    await supabase
      .from("chat_sessions")
      .update({ title })
      .eq("id", sessionId);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
    );
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    await supabase.from("chat_sessions").delete().eq("id", sessionId);
    if (activeSessionId === sessionId) setActiveSessionId(null);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }, [activeSessionId]);

  const filteredSessions = searchQuery
    ? sessions.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessions;

  return {
    sessions: filteredSessions,
    allSessions: sessions,
    activeSessionId,
    setActiveSessionId,
    loading,
    searchQuery,
    setSearchQuery,
    createSession,
    updateTitle,
    deleteSession,
    refreshSessions: fetchSessions,
  };
}
