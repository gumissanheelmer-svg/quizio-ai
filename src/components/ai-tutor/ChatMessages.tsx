import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Pencil, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { forwardRef, useState } from "react";
import { toast } from "sonner";

export type Msg = { role: "user" | "assistant"; content: string; edited?: boolean };

interface ChatMessagesProps {
  messages: Msg[];
  isLoading: boolean;
  historyLoaded: boolean;
  onEditMessage?: (index: number, newContent: string) => void;
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ messages, isLoading, historyLoaded, onEditMessage }, ref) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleStartEdit = (index: number, content: string) => {
      setEditingIndex(index);
      setEditText(content);
    };

    const handleConfirmEdit = () => {
      if (editingIndex !== null && editText.trim() && onEditMessage) {
        onEditMessage(editingIndex, editText.trim());
      }
      setEditingIndex(null);
      setEditText("");
    };

    const handleCancelEdit = () => {
      setEditingIndex(null);
      setEditText("");
    };

    const handleCopy = async (content: string, index: number) => {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success("Copiado!");
      setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleConfirmEdit();
      }
      if (e.key === "Escape") handleCancelEdit();
    };

    return (
      <div ref={ref} className="flex-1 overflow-auto space-y-4 pr-2 mb-4">
        {!historyLoaded ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Toque no <span className="mx-1 font-bold text-primary">+</span> para escolher uma ferramenta ou digite sua pergunta!
          </div>
        ) : null}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="relative max-w-[80%]">
              {editingIndex === i ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="w-full min-w-[200px] rounded-xl px-4 py-3 text-sm bg-primary text-primary-foreground border-2 border-accent resize-none focus:outline-none"
                    rows={Math.min(editText.split("\n").length + 1, 6)}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="text-xs px-3 py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmEdit}
                      className="text-xs px-3 py-1 rounded-md bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`rounded-xl px-4 py-3 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-gradient-card border border-border"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>

                  {m.edited && (
                    <span className="text-[10px] text-muted-foreground mt-0.5 block text-right">editado</span>
                  )}

                  {/* Hover actions */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                      m.role === "user" ? "-left-16" : "-right-16"
                    }`}
                  >
                    {m.role === "user" && onEditMessage && !isLoading && (
                      <button
                        onClick={() => handleStartEdit(i, m.content)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(m.content, i)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title="Copiar"
                    >
                      {copiedIndex === i ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </>
              )}
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
    );
  }
);

ChatMessages.displayName = "ChatMessages";
