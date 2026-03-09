import { motion } from "framer-motion";
import { FileText, Download, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MeusTrabalhos = () => {
  // Placeholder – will be connected to DB once documents are saved
  const trabalhos: { id: string; title: string; type: string; date: string }[] = [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold">Meus Trabalhos</h1>
        <p className="text-sm text-muted-foreground">Trabalhos gerados pela IA</p>
      </motion.div>

      {trabalhos.length === 0 ? (
        <Card className="bg-gradient-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">Nenhum trabalho gerado ainda.</p>
            <p className="text-muted-foreground text-xs mt-1">Vá em "Criar Trabalho" para começar!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {trabalhos.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-gradient-card border-border">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{t.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {t.date} · {t.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" /> Baixar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeusTrabalhos;
