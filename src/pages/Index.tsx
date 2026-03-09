import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  Calendar,
  Users,
  ImageIcon,
  Zap,
  Check,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const features = [
  { icon: Brain, title: "AI Tutor", desc: "Assistente inteligente com múltiplos modos de estudo" },
  { icon: FileText, title: "Gerar Trabalhos", desc: "Word, Excel, PowerPoint e mais em segundos" },
  { icon: Calendar, title: "Smart Planner", desc: "Cronograma automático de estudo e tarefas" },
  { icon: Users, title: "Quízio Rooms", desc: "Trabalhos em grupo com divisão inteligente" },
  { icon: ImageIcon, title: "Análise de Imagem", desc: "Fotografe exercícios e receba explicações" },
  { icon: Zap, title: "Prova Amanhã", desc: "Modo intensivo de revisão e simulados" },
];

const plans = [
  {
    name: "FREE",
    price: "0",
    period: "",
    tokens: "50 tokens iniciais",
    features: ["IA limitada", "Acesso Word", "5 perguntas/dia"],
    highlight: false,
  },
  {
    name: "PRO",
    price: "250",
    period: "/mês",
    tokens: "150 tokens/mês",
    features: ["IA completa", "Word, Excel, PPT", "Quízio Rooms", "Trimestral: 600 MTS"],
    highlight: true,
  },
  {
    name: "ELITE",
    price: "450",
    period: "/mês",
    tokens: "300 tokens/mês",
    features: ["Simulados avançados", "Resumos avançados", "Trabalhos grandes", "Trimestral: 1000 MTS"],
    highlight: false,
  },
  {
    name: "VIP",
    price: "700",
    period: "/mês",
    tokens: "500 tokens/mês",
    features: ["Prioridade máxima IA", "Análise imagem avançada", "Todos os recursos", "Trimestral: 1800 MTS"],
    highlight: false,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground">Quízio AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button variant="glow" asChild>
              <Link to="/register">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Plataforma de IA para Estudantes</span>
            </div>
          </motion.div>
          <motion.h1
            className="text-5xl md:text-7xl font-heading font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Estude com{" "}
            <span className="text-gradient-hero">Inteligência</span>
            <br />
            Artificial
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Gere trabalhos acadêmicos, prepare provas, colabore em grupo.
            Tudo com a ajuda da IA mais avançada.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Button variant="glow" size="lg" className="text-base px-8" asChild>
              <Link to="/register">
                Começar Grátis <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8" asChild>
              <Link to="#features">
                <BookOpen className="w-5 h-5 mr-1" /> Ver Recursos
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Tudo que você precisa para <span className="text-primary">estudar melhor</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Ferramentas poderosas de IA feitas para o estudante moderno
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-gradient-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors group"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Planos para cada <span className="text-accent">necessidade</span>
            </h2>
            <p className="text-muted-foreground text-lg">Escolha o plano ideal e comece a estudar com IA</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`rounded-xl p-6 border relative ${
                  plan.highlight
                    ? "border-primary shadow-glow bg-gradient-card"
                    : "border-border bg-gradient-card"
                }`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-hero text-xs font-semibold text-primary-foreground">
                    Popular
                  </div>
                )}
                <h3 className="font-heading font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.tokens}</p>
                <div className="mb-6">
                  <span className="text-3xl font-heading font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm"> MTS{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "glow" : "outline"}
                  className="w-full"
                  asChild
                >
                  <Link to="/register">Escolher {plan.name}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            className="rounded-2xl bg-gradient-card border border-border p-12 text-center relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/40 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/30 rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Pronto para estudar com IA?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                Junte-se a milhares de estudantes que já usam o Quízio AI
              </p>
              <Button variant="glow" size="lg" className="text-base px-10" asChild>
                <Link to="/register">
                  Criar Conta Grátis <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-hero flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-sm font-semibold">Quízio AI</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Quízio AI. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
