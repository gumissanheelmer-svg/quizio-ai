import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const SmartPlanner = () => {
  const [taskType, setTaskType] = useState("estudo");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  const generate = async () => {
    if (!subject || !topic || !deadline) { toast.error("Preencha todos os campos"); return; }
    setIsLoading(true);
    setResult("");

    let content = "";
    try {
      await streamChat({
        messages: [{ role: "user", content: `Crie um cronograma detalhado de ${taskType} com horários específicos para:
Disciplina: ${subject}
Tema: ${topic}
Prazo: ${deadline}

Inclua horários específicos (ex: 18:00-19:00), pausas, e dicas de produtividade.` }],
        mode: "planner",
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
        <h1 className="text-2xl font-heading font-bold">Smart Planner</h1>
        <p className="text-sm text-muted-foreground">Gere cronogramas automáticos de estudo</p>
      </motion.div>

      <Card className="bg-gradient-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Tarefa</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="estudo">Estudo</SelectItem>
                  <SelectItem value="trabalho">Trabalho Acadêmico</SelectItem>
                  <SelectItem value="prova">Preparação para Prova</SelectItem>
                  <SelectItem value="projeto">Projeto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Física" />
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: Leis de Newton" />
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>
          <Button onClick={generate} disabled={isLoading} variant="glow">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Planejando...</> : <><Calendar className="w-4 h-4 mr-2" /> Gerar Cronograma</>}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="text-lg">Seu Cronograma</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartPlanner;
