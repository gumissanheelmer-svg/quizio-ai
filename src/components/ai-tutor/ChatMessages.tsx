import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { forwardRef } from "react";

export type Msg = { role: "user" | "assistant"; content: string };

interface ChatMessagesProps {
  messages: Msg[];
  isLoading: boolean;
  historyLoaded: boolean;
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ messages, isLoading, historyLoaded }, ref) => (
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
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
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
  )
);

ChatMessages.displayName = "ChatMessages";
