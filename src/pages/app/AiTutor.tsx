import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { ToolsMenu, ModeBadge, tools, type ToolMode } from "@/components/ai-tutor/ToolsMenu";
import { ChatMessages, type Msg } from "@/components/ai-tutor/ChatMessages";

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
    if (!profile) return;
    try {
      const { data, error } = await supabase.rpc("get_chat_history" as any, {
        student: profile.id,
      });
      if (error) throw error;
      if (data && Array.isArray(data)) {
        const sorted = data.sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sorted.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.message })));
        if (sorted.length > 0 && sorted[sorted.length - 1].mode) {
          setMode(sorted[sorted.length - 1].mode);
        }
      }
    } catch (err: any) {
      console.error("Error loading history:", err);
    } finally {
      setHistoryLoaded(true);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) loadHistory();
    else setHistoryLoaded(true);
  }, [profile, loadHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading || !profile) return;

    if ((profile?.tokens ?? 0) < 10) {
      toast.error("Tokens insuficientes");
      return;
    }

    const activeMode = activeTool?.value || mode;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc("process_chat_message" as any, {
        student: profile.id,
        user_message: text,
        chat_mode: activeMode,
      });

      if (error) throw error;
      if (data?.status === "error") throw new Error(data.message || "Erro no processamento");

      await loadHistory();
      refreshProfile();
    } catch (e: any) {
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
    if (!file || !profile) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
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
    const path = `${profile.user_id}/${Date.now()}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      setInput(`[Arquivo: ${file.name}]\n${fileUrl}`);
      setActiveTool(tools.find((t) => t.value === "upload") || null);
      setMode("upload");
      toast.success("Arquivo carregado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar arquivo");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const placeholder = activeTool?.placeholder || "Digite sua pergunta...";

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">AI Tutor</h1>
          <p className="text-sm text-muted-foreground">Seu assistente de estudos inteligente</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-heading font-bold text-accent">{profile?.tokens ?? 0} tokens</p>
          <p className="text-xs text-muted-foreground">5 tokens/pergunta</p>
        </div>
      </motion.div>

      {/* Messages */}
      <ChatMessages ref={scrollRef} messages={messages} isLoading={isLoading} historyLoaded={historyLoaded} />

      {/* Input bar */}
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

      {/* Hidden file input */}
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
