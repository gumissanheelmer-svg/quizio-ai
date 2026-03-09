import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const packages = [
  { tokens: 150, price: 50 },
  { tokens: 300, price: 100 },
  { tokens: 500, price: 200 },
  { tokens: 1000, price: 450 },
];

const Tokens = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState(packages[0]);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [transactionCode, setTransactionCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateCode = (code: string, method: string): boolean => {
    if (method === "mpesa") {
      return /^[A-Z0-9]{10,11}$/.test(code.trim());
    }
    // eMola: extract ID from message
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
      });

      if (error) {
        if (error.code === "23505") toast.error("Este código de transação já foi utilizado");
        else throw error;
        return;
      }

      toast.success("Pagamento enviado! Aguarde confirmação do administrador.");
      setTransactionCode("");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar pagamento");
    } finally {
      setIsSubmitting(false);
    }
  };

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

            <div className="space-y-2">
              <Label>
                {paymentMethod === "mpesa" ? "Código de Transação" : "Cole a mensagem eMola"}
              </Label>
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
    </div>
  );
};

export default Tokens;
