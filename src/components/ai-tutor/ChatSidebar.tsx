import { Plus, Search, MessageSquare, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChatSession } from "@/hooks/useChatSessions";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

export const ChatSidebar = ({
  sessions,
  activeSessionId,
  searchQuery,
  onSearchChange,
  onSelect,
  onNewChat,
  onDelete,
  onClose,
}: ChatSidebarProps) => {
  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="p-3 flex items-center gap-2">
        <Button
          onClick={onNewChat}
          className="flex-1 gap-2 text-sm"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Novo Chat
        </Button>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 lg:hidden" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar chats..."
            className="pl-8 h-8 text-xs bg-sidebar-accent border-sidebar-border"
          />
        </div>
      </div>

      {/* Chat list */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-0.5">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {searchQuery ? "Nenhum chat encontrado" : "Nenhuma conversa ainda"}
            </p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelect(session.id)}
                className={cn(
                  "group w-full flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                  activeSessionId === session.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {session.last_message || "Conversa vazia"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {format(new Date(session.created_at), "dd MMM", { locale: pt })}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 transition-all shrink-0"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
