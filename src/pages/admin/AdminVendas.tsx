import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
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
      // Fetch profile names
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.name]) ?? []);
      setPayments(data.map(p => ({ ...p, profile_name: nameMap.get(p.user_id) || "—" })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (paymentId: string, status: "confirmed" | "rejected") => {
    setProcessing(paymentId);
    try {
      const update: Record<string, unknown> = { status };
      if (status === "confirmed") update.confirmed_by = user!.id;

      const { error } = await supabase
        .from("payments")
        .update(update)
        .eq("id", paymentId);

      if (error) throw error;
      toast.success(status === "confirmed" ? "Pagamento confirmado! Tokens creditados automaticamente." : "Pagamento rejeitado.");
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold">Gestão de Vendas</h1>
        <p className="text-sm text-muted-foreground">Confirme ou rejeite pagamentos</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : payments.length === 0 ? (
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
            Nenhum pagamento registrado
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map(p => (
            <Card key={p.id} className="bg-gradient-card border-border">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-semibold">{p.profile_name}</span>
                    {statusBadge(p.status)}
                    <Badge variant="outline" className="text-xs">{p.payment_method.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Código: <span className="font-mono text-foreground">{p.transaction_code}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {p.amount} MTS → {p.tokens} tokens • {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {p.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="glow"
                      disabled={processing === p.id}
                      onClick={() => updateStatus(p.id, "confirmed")}
                    >
                      {processing === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Confirmar</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={processing === p.id}
                      onClick={() => updateStatus(p.id, "rejected")}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVendas;
