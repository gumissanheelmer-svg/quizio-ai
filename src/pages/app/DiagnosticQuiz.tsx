import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Brain, BookOpen, Lightbulb, FileText, Search } from "lucide-react";

interface Question {
  id: number;
  category: string;
  icon: React.ReactNode;
  question: string;
  options: { value: string; label: string; level: "basic" | "intermediate" | "advanced" }[];
}

const questions: Question[] = [
  {
    id: 1,
    category: "Interpretação",
    icon: <BookOpen className="w-5 h-5" />,
    question: "Quando você lê um texto escolar, como costuma entender o conteúdo?",
    options: [
      { value: "a", label: "Preciso ler várias vezes e ainda tenho dificuldade", level: "basic" },
      { value: "b", label: "Entendo a ideia geral, mas perco alguns detalhes", level: "intermediate" },
      { value: "c", label: "Consigo entender e conectar com outros conhecimentos facilmente", level: "advanced" },
    ],
  },
  {
    id: 2,
    category: "Escrita",
    icon: <FileText className="w-5 h-5" />,
    question: "Como você se sente ao escrever um parágrafo sobre um tema que estudou?",
    options: [
      { value: "a", label: "Tenho dificuldade em organizar as ideias no papel", level: "basic" },
      { value: "b", label: "Consigo escrever, mas preciso revisar bastante", level: "intermediate" },
      { value: "c", label: "Escrevo com clareza e estrutura lógica sem muita dificuldade", level: "advanced" },
    ],
  },
  {
    id: 3,
    category: "Lógica",
    icon: <Brain className="w-5 h-5" />,
    question: "Quando encontra um problema de lógica ou matemática, qual é sua abordagem?",
    options: [
      { value: "a", label: "Fico perdido e preciso de ajuda para começar", level: "basic" },
      { value: "b", label: "Consigo resolver com algum esforço, seguindo passos conhecidos", level: "intermediate" },
      { value: "c", label: "Analiso o problema e encontro soluções criativas rapidamente", level: "advanced" },
    ],
  },
  {
    id: 4,
    category: "Resumo",
    icon: <Lightbulb className="w-5 h-5" />,
    question: "Se precisar resumir um capítulo inteiro em 5 frases, como seria?",
    options: [
      { value: "a", label: "Teria dificuldade em separar o que é importante do que não é", level: "basic" },
      { value: "b", label: "Consigo identificar os pontos principais, mas o resumo fica longo", level: "intermediate" },
      { value: "c", label: "Seleciono os conceitos-chave e sintetizo com facilidade", level: "advanced" },
    ],
  },
  {
    id: 5,
    category: "Análise",
    icon: <Search className="w-5 h-5" />,
    question: "Quando um professor apresenta um conceito novo, como você reage?",
    options: [
      { value: "a", label: "Preciso de muitos exemplos e repetições para entender", level: "basic" },
      { value: "b", label: "Entendo com um ou dois exemplos e alguma prática", level: "intermediate" },
      { value: "c", label: "Entendo rapidamente e já penso em como aplicar", level: "advanced" },
    ],
  },
];

const DiagnosticQuiz = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedValue, setSelectedValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const q = questions[currentQuestion];

  const handleNext = () => {
    if (!selectedValue) return;
    const newAnswers = { ...answers, [currentQuestion]: selectedValue };
    setAnswers(newAnswers);
    setSelectedValue("");

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: Record<number, string>) => {
    if (!user) return;
    setIsSubmitting(true);

    // Calculate level
    const levels = { basic: 0, intermediate: 0, advanced: 0 };
    Object.entries(finalAnswers).forEach(([idx, value]) => {
      const question = questions[parseInt(idx)];
      const option = question.options.find((o) => o.value === value);
      if (option) levels[option.level]++;
    });

    let level: "basic" | "intermediate" | "advanced" = "basic";
    if (levels.advanced >= 3) level = "advanced";
    else if (levels.intermediate >= 3 || (levels.intermediate >= 2 && levels.advanced >= 1)) level = "intermediate";

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ learning_level: level })
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success(`Nível identificado: ${level === "basic" ? "Iniciante" : level === "intermediate" ? "Intermediário" : "Avançado"}`);
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar resultado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Quiz de Diagnóstico
          </h1>
          <p className="text-muted-foreground mt-2">
            Responda 5 perguntas rápidas para personalizar sua experiência de aprendizagem
          </p>
        </motion.div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Pergunta {currentQuestion + 1} de {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">{q.icon}</div>
                <span className="text-sm font-medium text-muted-foreground">{q.category}</span>
              </div>

              <h2 className="text-lg font-semibold text-foreground mb-6">{q.question}</h2>

              <RadioGroup value={selectedValue} onValueChange={setSelectedValue} className="space-y-3">
                {q.options.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`q${q.id}-${option.value}`}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedValue === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={`q${q.id}-${option.value}`} className="mt-0.5" />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </Label>
                ))}
              </RadioGroup>

              <div className="flex justify-end mt-6">
                <Button onClick={handleNext} disabled={!selectedValue || isSubmitting} className="min-w-[140px]">
                  {isSubmitting
                    ? "Salvando..."
                    : currentQuestion < questions.length - 1
                    ? "Próxima"
                    : "Finalizar"}
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DiagnosticQuiz;
