import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, FileSpreadsheet, Presentation, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const docTypes = [
  { value: "word", label: "Word", icon: FileText, tokens: 20 },
  { value: "excel", label: "Excel", icon: FileSpreadsheet, tokens: 25 },
  { value: "powerpoint", label: "PowerPoint", icon: Presentation, tokens: 30 },
  { value: "access", label: "Access", icon: Database, tokens: 25 },
];

const CriarTrabalho = () => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [docType, setDocType] = useState("word");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  const selectedType = docTypes.find(d => d.value === docType);

  const handleGenerate = async () => {
    if (!title || !subject) { toast.error("Preencha o título e a disciplina"); return; }
    setIsLoading(true);
    setResult("");

    try {
      const prompt = `Crie um trabalho acadêmico completo do tipo ${docType.toUpperCase()} com o seguinte:
Título: ${title}
Disciplina: ${subject}
${description ? `Instruções adicionais: ${description}` : ""}

Gere o conteúdo completo com: capa, índice, introdução, desenvolvimento, conclusão e referências bibliográficas.`;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "trabalho",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Erro ao gerar trabalho");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) { content += delta; setResult(content); }
          } catch {}
        }
      }

      toast.success("Trabalho gerado com sucesso!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold">Criar Trabalho</h1>
        <p className="text-sm text-muted-foreground">Gere trabalhos acadêmicos completos com IA</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Detalhes do Trabalho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <div className="grid grid-cols-2 gap-2">
                {docTypes.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDocType(d.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                      docType === d.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <d.icon className="w-4 h-4" />
                    <span>{d.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{d.tokens}t</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Economia Sustentável" />
            </div>
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Geografia" />
            </div>
            <div className="space-y-2">
              <Label>Instruções (opcional)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes adicionais..." rows={3} />
            </div>
            <Button onClick={handleGenerate} disabled={isLoading} className="w-full" variant="glow">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando...</> : `Gerar (${selectedType?.tokens}t)`}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="prose prose-invert prose-sm max-w-none max-h-[60vh] overflow-auto">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">
                O trabalho gerado aparecerá aqui
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CriarTrabalho;
