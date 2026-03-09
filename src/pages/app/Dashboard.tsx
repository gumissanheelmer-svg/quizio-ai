import { motion } from "framer-motion";
import { Brain, Coins, FileText, Zap, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const stats = [
  { label: "Tokens Disponíveis", value: "50", icon: Coins, color: "text-accent" },
  { label: "Trabalhos Criados", value: "0", icon: FileText, color: "text-primary" },
  { label: "Perguntas Hoje", value: "0 / 5", icon: Brain, color: "text-primary" },
  { label: "Plano Atual", value: "FREE", icon: TrendingUp, color: "text-accent" },
];

const quickActions = [
  { title: "AI Tutor", desc: "Faça uma pergunta", icon: Brain, to: "/app/tutor" },
  { title: "Criar Trabalho", desc: "Gere um documento", icon: FileText, to: "/app/criar-trabalho" },
  { title: "Prova Amanhã", desc: "Modo intensivo", icon: Zap, to: "/app/prova-amanha" },
  { title: "Smart Planner", desc: "Planeje seus estudos", icon: Clock, to: "/app/planner" },
];

const Dashboard = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">Olá, Estudante! 👋</h1>
        <p className="text-muted-foreground">O que vamos estudar hoje?</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="bg-gradient-card rounded-xl border border-border p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-heading font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading font-semibold text-lg mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
            >
              <Link
                to={a.to}
                className="block bg-gradient-card rounded-xl border border-border p-5 hover:border-primary/30 transition-colors group"
              >
                <a.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-heading font-semibold text-sm">{a.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      <motion.div
        className="rounded-xl bg-gradient-card border border-primary/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div>
          <h3 className="font-heading font-bold mb-1">Desbloqueie todo o poder da IA</h3>
          <p className="text-sm text-muted-foreground">Upgrade para PRO e acesse todos os recursos</p>
        </div>
        <Button variant="glow" asChild>
          <Link to="/app/planos">Ver Planos</Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default Dashboard;
