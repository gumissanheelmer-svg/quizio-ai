import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { ToolsMenu, ModeBadge, tools, type ToolMode } from "@/components/ai-tutor/ToolsMenu";
import { ChatMessages, type Msg } from "@/components/ai-tutor/ChatMessages";

const TOKENS_PER_QUESTION = 5;
const defaultMode = "professor";

const AiTutor = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(defaultMode);
  const [activeTool, setActiveTool] = useState<ToolMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, message, mode, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.message })));
        const lastMode = data[data.length - 1].mode;
        if (lastMode) setMode(lastMode);
      }
    } catch (err: any) {
      console.error("Error loading history:", err);
    } finally {
      setHistoryLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadHistory();
    else setHistoryLoaded(true);
  }, [user, loadHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading || !user || !profile) return;

    if ((profile.tokens ?? 0) < TOKENS_PER_QUESTION) {
      toast.error("Você ficou sem tokens. Compre mais tokens ou atualize seu plano para continuar usando o AI Tutor.", {
        duration: 5000,
        action: { label: "Comprar tokens", onClick: () => window.location.href = "/app/tokens" },
      });
      return;
    }

    const activeMode = activeTool?.value || mode;
    const userMsg: Msg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];

    setInput("");
    setMessages(updatedMessages);
    setIsLoading(true);

    // Add a placeholder for the assistant response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      await streamChat({
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        mode: activeMode,
        learningLevel: profile?.learning_level || "intermediate",
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
        },
      });
    } catch (e: any) {
      // Remove the empty assistant placeholder on error
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
    if (isLoading || !user || !profile) return;

    if ((profile.tokens ?? 0) < TOKENS_PER_QUESTION) {
      toast.error("Você ficou sem tokens.", {
        duration: 5000,
        action: { label: "Comprar tokens", onClick: () => window.location.href = "/app/tokens" },
      });
      return;
    }

    // Keep messages up to the edited one, replace its content, remove everything after
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

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">AI Tutor</h1>
          <p className="text-sm text-muted-foreground">Seu assistente de estudos inteligente</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-heading font-bold text-accent">{profile?.tokens ?? 0} tokens</p>
          <p className="text-xs text-muted-foreground">{TOKENS_PER_QUESTION} tokens/pergunta</p>
        </div>
      </motion.div>

      <ChatMessages ref={scrollRef} messages={messages} isLoading={isLoading} historyLoaded={historyLoaded} onEditMessage={handleEditMessage} />

      <div className="border border-border rounded-xl bg-gradient-card p-3">
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
