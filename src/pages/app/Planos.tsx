import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "FREE",
    monthly: 0,
    quarterly: 0,
    tokens: 50,
    features: ["IA limitada", "Apenas Word", "5 perguntas/dia", "50 tokens iniciais"],
    highlight: false,
  },
  {
    name: "PRO",
    monthly: 250,
    quarterly: 600,
    tokens: 150,
    features: ["IA completa", "Word, Excel, PowerPoint, Access", "150 tokens/mês", "Quízio Rooms"],
    highlight: true,
  },
  {
    name: "ELITE",
    monthly: 450,
    quarterly: 1000,
    tokens: 300,
    features: ["Simulados avançados", "Resumos avançados", "Trabalhos grandes", "300 tokens/mês"],
    highlight: false,
  },
  {
    name: "VIP",
    monthly: 700,
    quarterly: 1800,
    tokens: 500,
    features: ["Prioridade máxima da IA", "Análise de imagem avançada", "500 tokens/mês", "Suporte prioritário"],
    highlight: false,
  },
];

const Planos = () => {
  const { profile } = useAuth();

  const planExpiry = profile?.plan_expires_at
    ? new Date(profile.plan_expires_at)
    : null;
  const isExpired = planExpiry ? planExpiry < new Date() : false;
  const currentPlan = isExpired ? "FREE" : (profile?.plan ?? "free").toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-2xl font-heading font-bold">Planos</h1>
        <p className="text-sm text-muted-foreground">Escolha o melhor plano para seus estudos</p>
        {currentPlan !== "FREE" && planExpiry && !isExpired && (
          <p className="text-xs text-accent mt-1">
            Plano {currentPlan} ativo até {planExpiry.toLocaleDateString("pt-BR")}
          </p>
        )}
        {currentPlan !== "FREE" && !planExpiry && (
          <p className="text-xs text-accent mt-1">
            Plano {currentPlan} — Vitalício ✨
          </p>
        )}
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan, i) => {
          const isCurrent = currentPlan === plan.name;
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`bg-gradient-card relative overflow-hidden ${
                plan.highlight ? "border-primary shadow-glow" : "border-border"
              }`}>
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                    Popular
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {plan.name === "VIP" && <Crown className="w-4 h-4 text-accent" />}
                    {plan.name}
                  </CardTitle>
                  <div className="mt-2">
                    {plan.monthly > 0 ? (
                      <>
                        <p className="text-2xl font-heading font-bold">{plan.monthly} <span className="text-sm font-normal text-muted-foreground">MTS/mês</span></p>
                        <p className="text-xs text-muted-foreground">ou {plan.quarterly} MTS/trimestre</p>
                      </>
                    ) : (
                      <p className="text-2xl font-heading font-bold">Grátis</p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>Plano Atual</Button>
                  ) : (
                    <Button variant={plan.highlight ? "glow" : "outline"} className="w-full" asChild>
                      <Link to="/app/tokens">
                        {plan.monthly === 0 ? "Atual" : "Assinar"}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Tem um código promocional?{" "}
          <Link to="/app/tokens" className="text-primary hover:underline">
            Resgate aqui
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Planos;
