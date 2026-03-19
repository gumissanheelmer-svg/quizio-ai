import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { ToolsMenu, ModeBadge, tools, type ToolMode } from "@/components/ai-tutor/ToolsMenu";
import { ChatMessages, type Msg } from "@/components/ai-tutor/ChatMessages";
import { ChatSidebar } from "@/components/ai-tutor/ChatSidebar";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";

const TOKENS_PER_QUESTION = 5;
const defaultMode = "professor";

const WELCOME_MSG: Msg = {
  role: "assistant",
  content: "Olá! 👋\nEm que posso ajudar você hoje?",
};

const AiTutor = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(defaultMode);
  const [activeTool, setActiveTool] = useState<ToolMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    searchQuery,
    setSearchQuery,
    createSession,
    updateTitle,
    deleteSession,
    refreshSessions,
  } = useChatSessions(user?.id);

  // Load messages for active session
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    setHistoryLoaded(false);
    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, message, mode, created_at")
      .eq("chat_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      setHistoryLoaded(true);
      return;
    }

    if (data && data.length > 0) {
      setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.message })));
      const lastMode = data[data.length - 1].mode;
      if (lastMode) setMode(lastMode);
    } else {
      setMessages([WELCOME_MSG]);
    }
    setHistoryLoaded(true);
  }, []);

  // When active session changes, load its messages
  useEffect(() => {
    if (activeSessionId) {
      loadSessionMessages(activeSessionId);
    } else {
      setMessages([]);
      setHistoryLoaded(true);
    }
  }, [activeSessionId, loadSessionMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleNewChat = async () => {
    const id = await createSession();
    if (id) {
      setMessages([WELCOME_MSG]);
      setHistoryLoaded(true);
      setMode(defaultMode);
      setActiveTool(null);
      if (isMobile) setSidebarOpen(false);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    if (isMobile) setSidebarOpen(false);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    if (activeSessionId === id) {
      setMessages([]);
    }
  };

  const ensureSession = async (): Promise<string | null> => {
    if (activeSessionId) return activeSessionId;
    const id = await createSession();
    if (id) {
      setMessages([WELCOME_MSG]);
      setHistoryLoaded(true);
    }
    return id;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading || !user || !profile) return;

    if ((profile.tokens ?? 0) < TOKENS_PER_QUESTION) {
      toast.error("Você ficou sem tokens. Compre mais tokens ou atualize seu plano.", {
        duration: 5000,
        action: { label: "Comprar tokens", onClick: () => window.location.href = "/app/tokens" },
      });
      return;
    }

    const chatId = await ensureSession();
    if (!chatId) return;

    const activeMode = activeTool?.value || mode;
    const userMsg: Msg = { role: "user", content: text };
    // Filter out the welcome message from API call
    const conversationMsgs = messages.filter(
      (m) => !(m.role === "assistant" && m.content === WELCOME_MSG.content && messages.indexOf(m) === 0)
    );
    const updatedMessages = [...conversationMsgs, userMsg];

    setInput("");
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      await streamChat({
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        mode: activeMode,
        learningLevel: profile?.learning_level || "intermediate",
        chatId,
        onDelta: (delta) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + delta };
            }
            return updated;
          });
        },
        onDone: () => {
          refreshProfile();
          refreshSessions();
        },
      });
    } catch (e: any) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.role === "assistant" && !last.content) return prev.slice(0, -1);
        return prev;
      });
      toast.error(e.message || "Erro ao conectar com a IA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleToolSelect = (tool: ToolMode) => {
    setActiveTool(tool);
    setMode(tool.value);
  };

  const handleRemoveTool = () => {
    setActiveTool(null);
    setMode(defaultMode);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande (máx. 10MB)");
      return;
    }

    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      toast.error("Formato não suportado. Use PDF, imagem ou Word.");
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);
      setInput(`[Arquivo: ${file.name}]\n${urlData.publicUrl}`);
      setActiveTool(tools.find((t) => t.value === "upload") || null);
      setMode("upload");
      toast.success("Arquivo carregado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar arquivo");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditMessage = async (index: number, newContent: string) => {
    if (isLoading || !user || !profile || !activeSessionId) return;

    if ((profile.tokens ?? 0) < TOKENS_PER_QUESTION) {
      toast.error("Você ficou sem tokens.", {
        duration: 5000,
        action: { label: "Comprar tokens", onClick: () => window.location.href = "/app/tokens" },
      });
      return;
    }

    const updatedMessages = messages.slice(0, index);
    const editedMsg: Msg = { role: "user", content: newContent, edited: true };
    updatedMessages.push(editedMsg);

    setMessages([...updatedMessages, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      await streamChat({
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        mode: activeTool?.value || mode,
        learningLevel: profile?.learning_level || "intermediate",
        chatId: activeSessionId,
        onDelta: (delta) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + delta };
            }
            return updated;
          });
        },
        onDone: () => {
          refreshProfile();
          refreshSessions();
        },
      });
    } catch (e: any) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.role === "assistant" && !last.content) return prev.slice(0, -1);
        return prev;
      });
      toast.error(e.message || "Erro ao conectar com a IA");
    } finally {
      setIsLoading(false);
    }
  };

  const placeholder = activeTool?.placeholder || "Digite sua pergunta...";

  const sidebarContent = (
    <ChatSidebar
      sessions={sessions}
      activeSessionId={activeSessionId}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelect={handleSelectSession}
      onNewChat={handleNewChat}
      onDelete={handleDeleteSession}
      onClose={() => setSidebarOpen(false)}
    />
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] max-w-6xl mx-auto">
      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="w-64 shrink-0 border-r border-border">
          {sidebarContent}
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen} direction="left">
          <DrawerContent className="!h-full !w-[280px] !max-w-[80vw] !rounded-none !border-r border-border !inset-auto !fixed !left-0 !top-0 !bottom-0">
            <DrawerTitle className="sr-only">Conversas</DrawerTitle>
            {sidebarContent}
          </DrawerContent>
        </Drawer>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(true)}>
                <PanelLeftOpen className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-heading font-bold">AI Tutor</h1>
              <p className="text-sm text-muted-foreground">Seu assistente de estudos inteligente</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-heading font-bold text-accent">{profile?.tokens ?? 0} tokens</p>
            <p className="text-xs text-muted-foreground">{TOKENS_PER_QUESTION} tokens/pergunta</p>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col px-4 min-h-0">
          {!activeSessionId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground text-sm">Crie um novo chat para começar</p>
                <Button onClick={handleNewChat} className="gap-2">
                  <Send className="w-4 h-4" />
                  Novo Chat
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ChatMessages
                ref={scrollRef}
                messages={messages}
                isLoading={isLoading}
                historyLoaded={historyLoaded}
                onEditMessage={handleEditMessage}
              />

              <div className="border border-border rounded-xl bg-gradient-card p-3 mb-2">
                <div className="flex items-end gap-2">
                  <ToolsMenu onSelect={handleToolSelect} onFileUpload={handleFileUpload} />
                  {activeTool && <ModeBadge tool={activeTool} onRemove={handleRemoveTool} />}
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="min-h-[40px] max-h-32 resize-none text-sm flex-1"
                    rows={1}
                  />
                  <Button onClick={send} disabled={isLoading || !input.trim()} size="icon" className="shrink-0 h-9 w-9">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
        onChange={onFileSelected}
      />
    </div>
  );
};

export default AiTutor;
