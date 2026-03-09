import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const Simulados = () => {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  const generate = async () => {
    if (!subject || !topic) { toast.error("Preencha a disciplina e o tema"); return; }
    setIsLoading(true);
    setResult("");

    let content = "";
    try {
      await streamChat({
        messages: [{ role: "user", content: `Gere um simulado de ${numQuestions} questões sobre "${topic}" na disciplina de ${subject}. Inclua questões de múltipla escolha (A-D) e 2 dissertativas. Forneça o gabarito no final.` }],
        mode: "simulado",
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
        <h1 className="text-2xl font-heading font-bold">Simulados</h1>
        <p className="text-sm text-muted-foreground">Gere provas e testes automáticos com IA</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Disciplina</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Matemática" />
        </div>
        <div className="space-y-2">
          <Label>Tema</Label>
          <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: Equações do 2º grau" />
        </div>
        <div className="space-y-2">
          <Label>Nº de Questões</Label>
          <Select value={numQuestions} onValueChange={setNumQuestions}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["5", "10", "15", "20"].map(n => <SelectItem key={n} value={n}>{n} questões</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={generate} disabled={isLoading} variant="glow">
        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando...</> : <><ClipboardList className="w-4 h-4 mr-2" /> Gerar Simulado (5t)</>}
      </Button>

      {result && (
        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="text-lg">Simulado Gerado</CardTitle></CardHeader>
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

export default Simulados;
