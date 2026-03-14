import { Plus, Upload, ImagePlus, Brain, Search, FileText, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";

export type ToolMode = {
  value: string;
  label: string;
  icon: React.ElementType;
  placeholder: string;
};

export const tools: ToolMode[] = [
  { value: "upload", label: "Carregar fotos e arquivos", icon: Upload, placeholder: "Descreva o arquivo enviado..." },
  { value: "criar-imagem", label: "Criar imagem", icon: ImagePlus, placeholder: "Descreva a imagem que deseja criar..." },
  { value: "trabalho", label: "Criar trabalho", icon: FileText, placeholder: "Digite o tema do trabalho..." },
  { value: "resumo", label: "Criar resumo", icon: BookOpen, placeholder: "Cole o texto aqui..." },
  { value: "prova-amanha", label: "Prova amanhã", icon: Brain, placeholder: "Qual matéria é a prova?" },
  { value: "professor", label: "Explicar como professor", icon: Search, placeholder: "O que deseja que eu explique?" },
];

interface ToolsMenuProps {
  onSelect: (tool: ToolMode) => void;
  onFileUpload: () => void;
}

export const ToolsMenu = ({ onSelect, onFileUpload }: ToolsMenuProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (tool: ToolMode) => {
    setOpen(false);
    if (tool.value === "upload") {
      onFileUpload();
    } else {
      onSelect(tool);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-lg border border-border hover:bg-secondary">
          <Plus className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-56 p-1.5" sideOffset={8}>
        <div className="space-y-0.5">
          {tools.map((tool) => (
            <button
              key={tool.value}
              onClick={() => handleSelect(tool)}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <tool.icon className="w-4 h-4 text-muted-foreground" />
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface ModeBadgeProps {
  tool: ToolMode;
  onRemove: () => void;
}

export const ModeBadge = ({ tool, onRemove }: ModeBadgeProps) => (
  <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 text-primary px-2.5 py-1 text-xs font-medium shrink-0">
    <tool.icon className="w-3 h-3" />
    {tool.label}
    <button onClick={onRemove} className="ml-0.5 hover:text-destructive transition-colors">
      <X className="w-3 h-3" />
    </button>
  </span>
);
