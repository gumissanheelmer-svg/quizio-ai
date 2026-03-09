import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const ProvaAmanha = () => {
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  const generate = async () => {
    if (!subject || !topics) { toast.error("Preencha a disciplina e os temas"); return; }
    setIsLoading(true);
    setResult("");

    let content = "";
    try {
      await streamChat({
        messages: [{ role: "user", content: `MODO INTENSIVO - TENHO PROVA AMANHÃ!

Disciplina: ${subject}
Temas: ${topics}

Por favor:
1. Faça uma revisão rápida dos conceitos-chave
2. Destaque fórmulas e definições importantes
3. Dê dicas de memorização
4. Gere 5 exercícios práticos com respostas
5. Crie um mini-simulado final com 5 questões

Seja direto e objetivo. Foco total na preparação!` }],
        mode: "prova",
        onDelta: (chunk) => { content += chunk; setResult(content); },
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      toast.error(e.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-accent" /> Tenho Prova Amanhã!
        </h1>
        <p className="text-sm text-muted-foreground">Modo intensivo de preparação para provas</p>
      </motion.div>

      <Card className="bg-gradient-card border-border border-accent/20">
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Biologia" />
            </div>
            <div className="space-y-2">
              <Label>Temas da Prova</Label>
              <Input value={topics} onChange={e => setTopics(e.target.value)} placeholder="Ex: Célula, Mitose, Meiose" />
            </div>
          </div>
          <Button onClick={generate} disabled={isLoading} variant="accent" className="w-full">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Preparando revisão...</> : <><Zap className="w-4 h-4 mr-2" /> Iniciar Modo Intensivo</>}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="text-lg">📚 Revisão Intensiva</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none max-h-[60vh] overflow-auto">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProvaAmanha;
