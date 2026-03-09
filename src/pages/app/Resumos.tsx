import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const Resumos = () => {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");

  const generate = async () => {
    if (!text.trim()) { toast.error("Cole o texto para resumir"); return; }
    setIsLoading(true);
    setResult("");

    let content = "";
    try {
      await streamChat({
        messages: [{ role: "user", content: `Resuma o seguinte texto de forma clara e organizada, destacando os pontos principais:\n\n${text}` }],
        mode: "resumo",
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
        <h1 className="text-2xl font-heading font-bold">Resumos</h1>
        <p className="text-sm text-muted-foreground">Cole um texto e gere um resumo inteligente</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Cole aqui o texto que deseja resumir..." rows={16} />
          <Button onClick={generate} disabled={isLoading} variant="glow" className="w-full">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Resumindo...</> : <><BookOpen className="w-4 h-4 mr-2" /> Gerar Resumo (5t)</>}
          </Button>
        </div>

        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="text-lg">Resumo</CardTitle></CardHeader>
          <CardContent>
            {result ? (
              <div className="prose prose-invert prose-sm max-w-none max-h-[60vh] overflow-auto">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">O resumo aparecerá aqui</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Resumos;
