import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Coins, CreditCard, Loader2, Copy, ArrowLeft } from "lucide-react";
import SuccessModal from "@/components/SuccessModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const plans = [
  {
    name: "FREE",
    monthly: 0,
    quarterly: 0,
    features: ["5 perguntas/dia", "50 tokens iniciais", "IA limitada"],
    highlight: false,
  },
  {
    name: "PRO",
    monthly: 250,
    quarterly: 600,
    features: ["IA mais inteligente", "Mais tokens diários", "Respostas mais detalhadas", "Quízio Rooms"],
    highlight: true,
  },
  {
    name: "ELITE",
    monthly: 450,
    quarterly: 1000,
    features: ["Todas funções do PRO", "Criação de trabalhos avançados", "Geração de imagens", "300 tokens/mês"],
    highlight: false,
  },
  {
    name: "VIP",
    monthly: 700,
    quarterly: 1800,
    features: ["Acesso completo ao AI Tutor", "Tokens ilimitados", "Todas ferramentas desbloqueadas", "Suporte prioritário"],
    highlight: false,
  },
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="ml-2 text-muted-foreground hover:text-primary transition-colors">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

interface PaymentAccount {
  number: string;
  name: string;
}

const Planos = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly">("monthly");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [transactionCode, setTransactionCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: "", message: "" });
  const [paymentAccounts, setPaymentAccounts] = useState<Record<string, PaymentAccount>>({
    mpesa: { number: "", name: "" },
    emola: { number: "", name: "" },
  });

  const planExpiry = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
  const isExpired = planExpiry ? planExpiry < new Date() : false;
  const currentPlan = isExpired ? "FREE" : (profile?.plan ?? "free").toUpperCase();

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from("payment_settings").select("*").limit(1).single();
      if (data) {
        const d = data as any;
        setPaymentAccounts({
          mpesa: { number: d.mpesa_number || "", name: d.mpesa_name || "" },
          emola: { number: d.emola_number || "", name: d.emola_name || "" },
        });
      }
    };
    loadSettings();
  }, []);

  const validateCode = (code: string, method: string): boolean => {
    if (method === "mpesa") return /^[A-Z0-9]{10,11}$/.test(code.trim());
    const match = code.match(/[A-Z]{2}\d{6}\.\d{4}\.[A-Z]\d+/);
    return !!match;
  };

  const extractEmolaCode = (text: string): string => {
    const match = text.match(/[A-Z]{2}\d{6}\.\d{4}\.[A-Z]\d+/);
    return match ? match[0] : text.trim();
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !transactionCode.trim()) {
      toast.error("Insira o código de transação");
      return;
    }
    const code = paymentMethod === "emola" ? extractEmolaCode(transactionCode) : transactionCode.trim();
    if (!validateCode(code, paymentMethod)) {
      toast.error(
        paymentMethod === "mpesa"
          ? "Código Mpesa inválido (10-11 caracteres alfanuméricos maiúsculos)"
          : "Código eMola inválido. Cole a mensagem completa."
      );
      return;
    }
    setIsSubmitting(true);
    const price = billingCycle === "monthly" ? selectedPlan.monthly : selectedPlan.quarterly;
    try {
      const { error } = await supabase.from("payments").insert({
        user_id: user!.id,
        amount: price,
        tokens: 0,
        payment_method: paymentMethod,
        transaction_code: code,
        status: "pending",
        type: "plan",
        plan_name: selectedPlan.name.toLowerCase(),
      });
      if (error) {
        if (error.code === "23505") toast.error("Este código de transação já foi utilizado");
        else throw error;
        return;
      }
      setSuccessModal({
        open: true,
        title: "Solicitação de Plano Enviada ✔",
        message: "Seu pedido de ativação de plano foi enviado para análise.\n\nApós a confirmação do pagamento, seu plano será ativado automaticamente.",
      });
      setTransactionCode("");
      setSelectedPlan(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar pagamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAccount = paymentAccounts[paymentMethod as keyof typeof paymentAccounts];

  // Checkout view
  if (selectedPlan) {
    const price = billingCycle === "monthly" ? selectedPlan.monthly : selectedPlan.quarterly;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => setSelectedPlan(null)} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar aos planos
          </Button>
          <h1 className="text-2xl font-heading font-bold">Checkout — Plano {selectedPlan.name}</h1>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order summary */}
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {selectedPlan.name === "VIP" && <Crown className="w-5 h-5 text-accent" />}
                <span className="font-heading font-bold text-xl">{selectedPlan.name}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={billingCycle === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBillingCycle("monthly")}
                >
                  Mensal
                </Button>
                <Button
                  variant={billingCycle === "quarterly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBillingCycle("quarterly")}
                >
                  Trimestral
                </Button>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground">{billingCycle === "monthly" ? "Mensal" : "Trimestral"}</p>
                <p className="text-3xl font-heading font-bold text-primary">{price} MTS</p>
              </div>
              <ul className="space-y-2">
                {selectedPlan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Payment form */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">Mpesa</SelectItem>
                    <SelectItem value="emola">eMola</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeAccount.number && (
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Envie {price} MTS para:</p>
                  <div className="flex items-center">
                    <span className="font-mono font-bold text-accent">{activeAccount.number}</span>
                    <CopyButton text={activeAccount.number} />
                  </div>
                  <p className="text-sm text-muted-foreground">{activeAccount.name}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>{paymentMethod === "mpesa" ? "Código de Transação" : "Cole a mensagem eMola"}</Label>
                <Input
                  value={transactionCode}
                  onChange={(e) => setTransactionCode(e.target.value)}
                  placeholder={paymentMethod === "mpesa" ? "Ex: DAQ6IUVRN5W" : "Cole a mensagem completa..."}
                />
                <p className="text-xs text-muted-foreground">
                  {paymentMethod === "mpesa"
                    ? "10-11 caracteres alfanuméricos maiúsculos"
                    : "O código será extraído automaticamente"}
                </p>
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting} variant="glow" className="w-full">
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
                ) : (
                  "Enviar Pagamento"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Plans grid view
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
          <p className="text-xs text-accent mt-1">Plano {currentPlan} — Vitalício ✨</p>
        )}
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan, i) => {
          const isCurrent = currentPlan === plan.name;
          return (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card
                className={`bg-gradient-card relative overflow-hidden ${
                  plan.highlight ? "border-primary shadow-glow" : "border-border"
                }`}
              >
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
                        <p className="text-2xl font-heading font-bold">
                          {plan.monthly} <span className="text-sm font-normal text-muted-foreground">MTS/mês</span>
                        </p>
                        <p className="text-xs text-muted-foreground">ou {plan.quarterly} MTS/trimestre</p>
                      </>
                    ) : (
                      <p className="text-2xl font-heading font-bold">Grátis</p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano Atual
                    </Button>
                  ) : plan.monthly === 0 ? (
                    <Button variant="outline" className="w-full" disabled>
                      Grátis
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlight ? "glow" : "outline"}
                      className="w-full"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      Comprar Plano
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <SuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal({ ...successModal, open: false })}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
};

export default Planos;
