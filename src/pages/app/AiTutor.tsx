import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Brain, FileText, BookOpen, ClipboardList, Lightbulb, Presentation, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { streamChat } from "@/lib/streamChat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const modes = [
  { value: "professor", label: "Professor", icon: Brain },
  { value: "trabalho", label: "Trabalho", icon: FileText },
  { value: "resumo", label: "Resumo", icon: BookOpen },
  { value: "simulado", label: "Simulado", icon: ClipboardList },
  { value: "explicacao", label: "Explicação Simples", icon: Lightbulb },
  { value: "slides", label: "Criar Slides", icon: Presentation },
  { value: "revisao", label: "Revisão de Trabalho", icon: CheckCircle },
];

const AiTutor = () => {
  const { profile, refreshProfile } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("professor");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("role, message, mode")
        .order("created_at", { ascending: true })
        .limit(100);

      if (data && data.length > 0) {
        setMessages(data.map(m => ({ role: m.role as "user" | "assistant", content: m.message })));
        if (data[data.length - 1].mode) {
          setMode(data[data.length - 1].mode);
        }
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if ((profile?.tokens ?? 0) < 10) {
      toast.error("Tokens insuficientes! Você precisa de pelo menos 10 tokens.");
      return;
    }

    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        mode,
        onDelta: upsertAssistant,
        onDone: () => {
          setIsLoading(false);
          refreshProfile(); // Refresh token count
        },
      });
    } catch (e: any) {
      toast.error(e.message || "Erro ao conectar com a IA");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto">
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

      <div ref={scrollRef} className="flex-1 overflow-auto space-y-4 pr-2 mb-4">
        {!historyLoaded ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Escolha um modo e faça sua pergunta!
          </div>
        ) : null}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-gradient-card border border-border"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : m.content}
            </div>
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-gradient-card border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border border-border rounded-xl bg-gradient-card p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modes.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  <span className="flex items-center gap-2">
                    <m.icon className="w-3.5 h-3.5" /> {m.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            className="min-h-[44px] max-h-32 resize-none text-sm"
            rows={1}
          />
          <Button onClick={send} disabled={isLoading || !input.trim()} size="icon" className="shrink-0 self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
