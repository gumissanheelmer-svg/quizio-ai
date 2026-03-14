import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Clock, Coins, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  tokens: number;
  payment_method: string;
  transaction_code: string;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  type: string;
  plan_name: string | null;
  profile_name?: string;
}

const AdminVendas = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map((p: any) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.name]) ?? []);
      setPayments(
        data.map((p: any) => ({
          ...p,
          type: p.type || "tokens",
          plan_name: p.plan_name || null,
          profile_name: nameMap.get(p.user_id) || "—",
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (payment: Payment, status: "confirmed" | "rejected") => {
    setProcessing(payment.id);
    try {
      const update: Record<string, unknown> = { status };
      if (status === "confirmed") update.confirmed_by = user!.id;

      const { error } = await supabase
        .from("payments")
        .update(update)
        .eq("id", payment.id);

      if (error) throw error;

      // If confirming a plan payment, update the user's plan
      if (status === "confirmed" && payment.type === "plan" && payment.plan_name) {
        const durationDays = payment.amount >= 600 ? 90 : 30; // quarterly vs monthly
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        await supabase
          .from("profiles")
          .update({
            plan: payment.plan_name,
            plan_expires_at: expiresAt.toISOString(),
          })
          .eq("user_id", payment.user_id);
      }

      toast.success(
        status === "confirmed"
          ? payment.type === "plan"
            ? `Plano ${payment.plan_name?.toUpperCase()} ativado!`
            : "Pagamento confirmado! Tokens creditados."
          : "Pagamento rejeitado."
      );
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar");
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmado</Badge>;
      case "rejected": return <Badge variant="destructive">Rejeitado</Badge>;
      default: return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
    }
  };

  const typeBadge = (p: Payment) => {
    if (p.type === "plan") {
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          <Crown className="w-3 h-3 mr-1" /> Plano {p.plan_name?.toUpperCase()}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
        <Coins className="w-3 h-3 mr-1" /> {p.tokens} tokens
      </Badge>
    );
  };

  const renderPayments = (list: Payment[]) => {
    if (list.length === 0) {
      return (
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
            Nenhum pagamento encontrado
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-3">
        {list.map((p) => (
          <Card key={p.id} className="bg-gradient-card border-border">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-semibold">{p.profile_name}</span>
                  {statusBadge(p.status)}
                  {typeBadge(p)}
                  <Badge variant="outline" className="text-xs">{p.payment_method.toUpperCase()}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Código: <span className="font-mono text-foreground">{p.transaction_code}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {p.amount} MTS • {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {p.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="glow"
                    disabled={processing === p.id}
                    onClick={() => updateStatus(p, "confirmed")}
                  >
                    {processing === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Confirmar</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={processing === p.id}
                    onClick={() => updateStatus(p, "rejected")}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const tokenPayments = payments.filter((p) => p.type !== "plan");
  const planPayments = payments.filter((p) => p.type === "plan");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold">Gestão de Vendas</h1>
        <p className="text-sm text-muted-foreground">
          {pendingPayments.length > 0
            ? `${pendingPayments.length} pagamento(s) pendente(s)`
            : "Confirme ou rejeite pagamentos"}
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="todos">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todos">Todos ({payments.length})</TabsTrigger>
            <TabsTrigger value="tokens">Tokens ({tokenPayments.length})</TabsTrigger>
            <TabsTrigger value="planos">Planos ({planPayments.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="todos" className="mt-4">{renderPayments(payments)}</TabsContent>
          <TabsContent value="tokens" className="mt-4">{renderPayments(tokenPayments)}</TabsContent>
          <TabsContent value="planos" className="mt-4">{renderPayments(planPayments)}</TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminVendas;
