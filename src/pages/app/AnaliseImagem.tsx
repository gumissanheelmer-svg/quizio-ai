import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const AnaliseImagem = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const analyze = async () => {
    if (!preview) { toast.error("Selecione uma imagem"); return; }
    setIsLoading(true);
    setResult("");

    let content = "";
    try {
      await streamChat({
        messages: [{
          role: "user",
          content: `Analise esta imagem acadêmica. Explique detalhadamente o conteúdo que você vê. Se for um exercício, resolva-o. Se for uma página de livro, resuma. Se for um quadro de sala, transcreva e explique.

[Imagem enviada pelo estudante]`
        }],
        mode: "analise_imagem",
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
        <h1 className="text-2xl font-heading font-bold">Análise de Imagem</h1>
        <p className="text-sm text-muted-foreground">Envie fotos de exercícios, livros ou quadro</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-6">
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            
            {!preview ? (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-12 hover:border-primary/40 transition-colors flex flex-col items-center gap-3"
              >
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clique para enviar uma imagem</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP</p>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <img src={preview} alt="Preview" className="w-full rounded-lg max-h-64 object-contain" />
                  <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => { setPreview(null); setResult(""); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={analyze} disabled={isLoading} variant="glow" className="w-full">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analisando...</> : "Analisar Imagem"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="text-lg">Resultado</CardTitle></CardHeader>
          <CardContent>
            {result ? (
              <div className="prose prose-invert prose-sm max-w-none max-h-[60vh] overflow-auto">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">A análise aparecerá aqui</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnaliseImagem;
