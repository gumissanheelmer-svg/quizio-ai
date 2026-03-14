import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, CreditCard, Loader2, Gift, Copy, Check } from "lucide-react";
import SuccessModal from "@/components/SuccessModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const packages = [
  { tokens: 150, price: 50 },
  { tokens: 300, price: 100 },
  { tokens: 500, price: 200 },
  { tokens: 1000, price: 450 },
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

const Tokens = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState(packages[0]);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [transactionCode, setTransactionCode] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [successModal, setSuccessModal] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: "", message: "" });
  const [paymentAccounts, setPaymentAccounts] = useState<Record<string, PaymentAccount>>({
    mpesa: { number: "", name: "" },
    emola: { number: "", name: "" },
  });

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from("payment_settings")
        .select("*")
        .limit(1)
        .single();
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
    if (!transactionCode.trim()) { toast.error("Insira o código de transação"); return; }
    const code = paymentMethod === "emola" ? extractEmolaCode(transactionCode) : transactionCode.trim();
    if (!validateCode(code, paymentMethod)) {
      toast.error(paymentMethod === "mpesa"
        ? "Código Mpesa inválido (10-11 caracteres alfanuméricos maiúsculos)"
        : "Código eMola inválido. Cole a mensagem completa.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("payments").insert({
        user_id: user!.id,
        amount: selectedPkg.price,
        tokens: selectedPkg.tokens,
        payment_method: paymentMethod,
        transaction_code: code,
        status: "pending",
      });
      if (error) {
        if (error.code === "23505") toast.error("Este código de transação já foi utilizado");
        else throw error;
        return;
      }
      setSuccessModal({
        open: true,
        title: "Pagamento Enviado ✔",
        message: "Seu pagamento foi enviado para verificação.\n\nAssim que o administrador confirmar a transação, os tokens serão adicionados à sua conta automaticamente.",
      });
      setTransactionCode("");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar pagamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedeem = async () => {
    if (!promoCode.trim()) { toast.error("Insira o código promocional"); return; }
    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.rpc("redeem_promo_code", {
        p_code: promoCode.trim().toUpperCase(),
        p_user_id: user!.id,
      });
      if (error) throw error;
      const plan = String(data).toUpperCase();
      if (plan === "VIP") {
        setSuccessModal({
          open: true,
          title: "Plano VIP Desbloqueado 🎉",
          message: "Parabéns! Você desbloqueou o Plano VIP Vitalício.\n\nAgora você tem acesso completo a todas as ferramentas do Quízio AI para estudar, criar trabalhos, gerar resumos e usar o AI Tutor sem limitações.",
        });
      } else {
        setSuccessModal({
          open: true,
          title: `Plano ${plan} Ativado 🎉`,
          message: `Seu plano ${plan} foi ativado com sucesso! Aproveite todos os benefícios.`,
        });
      }
      setPromoCode("");
      refreshProfile();
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("inválido")) toast.error("Código promocional inválido");
      else if (msg.includes("esgotado")) toast.error("Código promocional esgotado");
      else if (msg.includes("já utilizou")) toast.error("Você já utilizou este código");
      else toast.error("Erro ao resgatar código");
    } finally {
      setIsRedeeming(false);
    }
  };

  const activeAccount = paymentAccounts[paymentMethod as keyof typeof paymentAccounts];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold">Tokens</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu saldo e compre tokens</p>
      </motion.div>

      <Card className="bg-gradient-card border-primary/20">
        <CardContent className="p-6 flex items-center gap-4">
          <Coins className="w-10 h-10 text-accent" />
          <div>
            <p className="text-3xl font-heading font-bold">{profile?.tokens ?? 0}</p>
            <p className="text-sm text-muted-foreground">Tokens disponíveis</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="comprar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comprar" className="flex items-center gap-2">
            <Coins className="w-4 h-4" /> Comprar Tokens
          </TabsTrigger>
          <TabsTrigger value="promo" className="flex items-center gap-2">
            <Gift className="w-4 h-4" /> Código Promocional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comprar" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-heading font-semibold mb-3">Pacotes de Tokens</h2>
              <div className="space-y-2">
                {packages.map(pkg => (
                  <button
                    key={pkg.tokens}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      selectedPkg.tokens === pkg.tokens
                        ? "border-primary bg-primary/10"
                        : "border-border bg-gradient-card hover:border-primary/30"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-accent" />
                      <span className="font-medium">{pkg.tokens} tokens</span>
                    </span>
                    <span className="font-heading font-bold">{pkg.price} MTS</span>
                  </button>
                ))}
              </div>
            </div>

            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm font-medium">{selectedPkg.tokens} tokens</p>
                  <p className="text-2xl font-heading font-bold text-primary">{selectedPkg.price} MTS</p>
                </div>

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
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Envie para:</p>
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
                    onChange={e => setTransactionCode(e.target.value)}
                    placeholder={paymentMethod === "mpesa" ? "Ex: DAQ6IUVRN5W" : "Cole a mensagem completa..."}
                  />
                  <p className="text-xs text-muted-foreground">
                    {paymentMethod === "mpesa"
                      ? "10-11 caracteres alfanuméricos maiúsculos"
                      : "O código será extraído automaticamente"}
                  </p>
                </div>

                <Button onClick={handleSubmit} disabled={isSubmitting} variant="glow" className="w-full">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</> : "Confirmar Pagamento"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="promo" className="mt-6">
          <Card className="bg-gradient-card border-border max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-accent" /> Resgatar Código Promocional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Insira seu código promocional para ativar um plano premium.
              </p>
              <div className="space-y-2">
                <Label>Código Promocional</Label>
                <Input
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Ex: CODIGO123"
                  className="uppercase tracking-widest text-center font-mono text-lg"
                />
              </div>
              <Button onClick={handleRedeem} disabled={isRedeeming} variant="glow" className="w-full">
                {isRedeeming ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Ativando...</> : "Ativar Código"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tokens;
