import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

const UploadArquivos = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const analyze = async () => {
    if (!file) { toast.error("Selecione um arquivo"); return; }
    setIsLoading(true);
    setResult("");

    // Read file as text (basic – real implementation would use document parsing)
    const text = await file.text().catch(() => "");
    const preview = text.slice(0, 3000) || `[Arquivo: ${file.name}]`;

    let content = "";
    try {
      await streamChat({
        messages: [{ role: "user", content: `Analise este documento acadêmico (${file.name}):\n\n${preview}\n\nExplique o que o professor está pedindo, crie uma estrutura de resposta e dê sugestões de como completar o trabalho.` }],
        mode: "professor",
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
        <h1 className="text-2xl font-heading font-bold">Upload de Arquivos</h1>
        <p className="text-sm text-muted-foreground">Envie documentos e a IA analisa o conteúdo</p>
      </motion.div>

      <Card className="bg-gradient-card border-border">
        <CardContent className="p-6">
          <input ref={inputRef} type="file" accept={ACCEPTED} onChange={handleFile} className="hidden" />
          
          {!file ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-12 hover:border-primary/40 transition-colors flex flex-col items-center gap-3"
            >
              <Upload className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Clique para selecionar um arquivo</p>
              <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint</p>
            </button>
          ) : (
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setFile(null); setResult(""); }}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="glow" onClick={analyze} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analisar"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="text-lg">Análise do Documento</CardTitle></CardHeader>
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

export default UploadArquivos;
