import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, FileSpreadsheet, Presentation, Database, Loader2, Copy, Download, Lock, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const docTypes = [
  { value: "word", label: "Word", icon: FileText, tokens: 20 },
  { value: "excel", label: "Excel", icon: FileSpreadsheet, tokens: 25 },
  { value: "powerpoint", label: "PowerPoint", icon: Presentation, tokens: 30 },
  { value: "access", label: "Access", icon: Database, tokens: 25 },
];

const CriarTrabalho = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [docType, setDocType] = useState("word");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  const isFree = !profile || profile.plan === "free";
  const isLockedType = isFree && docType !== "word";

  const selectedType = docTypes.find(d => d.value === docType);

  const handleGenerate = async () => {
    if (!title.trim()) { toast.error("Preencha o título do trabalho"); return; }
    if (!subject.trim()) { toast.error("Preencha a disciplina"); return; }

    const tokensNeeded = selectedType?.tokens ?? 20;
    if (profile && profile.tokens < tokensNeeded) {
      toast.error("Você não tem tokens suficientes.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Sessão expirada. Faça login novamente."); return; }

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
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode: "trabalho",
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => null);
        throw new Error(errorData?.error || "Não foi possível gerar o trabalho. Tente novamente.");
      }

      if (!resp.body) throw new Error("Não foi possível gerar o trabalho. Tente novamente.");

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

      // Save work to database
      if (content) {
        await supabase.from("works").insert({
          user_id: session.user.id,
          title,
          type: docType,
          content,
          tokens_used: tokensNeeded,
        });
      }

      await refreshProfile();
      toast.success("Trabalho gerado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Não foi possível gerar o trabalho. Tente novamente.");
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
                {docTypes.map(d => {
                  const locked = isFree && d.value !== "word";
                  return (
                    <button
                      key={d.value}
                      onClick={() => setDocType(d.value)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors relative ${
                        docType === d.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30"
                      } ${locked ? "opacity-70" : ""}`}
                    >
                      <d.icon className="w-4 h-4" />
                      <span>{d.label}</span>
                      {locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                      <span className="ml-auto text-xs text-muted-foreground">{d.tokens}t</span>
                    </button>
                  );
                })}
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
            {isLockedType ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Para gerar documentos em <span className="font-semibold text-foreground">{selectedType?.label}</span>, atualize o seu plano para o <span className="font-semibold text-primary">PRO</span>.
                </p>
                <Button onClick={() => navigate("/app/planos")} className="w-full" variant="glow">
                  Atualizar Plano
                </Button>
              </div>
            ) : (
              <Button onClick={handleGenerate} disabled={isLoading} className="w-full" variant="glow">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando...</> : `Gerar (${selectedType?.tokens}t)`}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Resultado</CardTitle>
            {result && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    toast.success("Copiado!");
                  }}
                >
                  <Copy className="w-4 h-4 mr-1" /> Copiar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${title || "trabalho"}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Download iniciado!");
                  }}
                >
                  <Download className="w-4 h-4 mr-1" /> Baixar
                </Button>
              </div>
            )}
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
