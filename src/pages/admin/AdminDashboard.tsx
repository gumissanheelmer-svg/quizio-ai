import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Coins, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

interface Metrics {
  totalRevenue: number;
  tokensSold: number;
  activeStudents: number;
  pendingPayments: number;
  mpesaRevenue: number;
  emolaRevenue: number;
}

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalRevenue: 0, tokensSold: 0, activeStudents: 0, pendingPayments: 0,
    mpesaRevenue: 0, emolaRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [paymentsRes, profilesRes] = await Promise.all([
        supabase.from("payments").select("*"),
        supabase.from("profiles").select("id, status"),
      ]);

      const payments = paymentsRes.data ?? [];
      const profiles = profilesRes.data ?? [];

      const confirmed = payments.filter(p => p.status === "confirmed");
      const mpesa = confirmed.filter(p => p.payment_method === "mpesa");
      const emola = confirmed.filter(p => p.payment_method === "emola");

      setMetrics({
        totalRevenue: confirmed.reduce((s, p) => s + Number(p.amount), 0),
        tokensSold: confirmed.reduce((s, p) => s + p.tokens, 0),
        activeStudents: profiles.filter(p => p.status === "active").length,
        pendingPayments: payments.filter(p => p.status === "pending").length,
        mpesaRevenue: mpesa.reduce((s, p) => s + Number(p.amount), 0),
        emolaRevenue: emola.reduce((s, p) => s + Number(p.amount), 0),
      });
      setLoading(false);
    };
    load();
  }, []);

  const stats = [
    { label: "Receita Total", value: `${metrics.totalRevenue} MTS`, icon: DollarSign, color: "text-green-400" },
    { label: "Tokens Vendidos", value: String(metrics.tokensSold), icon: Coins, color: "text-accent" },
    { label: "Estudantes Ativos", value: String(metrics.activeStudents), icon: Users, color: "text-primary" },
    { label: "Pagamentos Pendentes", value: String(metrics.pendingPayments), icon: TrendingUp, color: "text-yellow-400" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold">Painel Super Admin</h1>
        <p className="text-sm text-muted-foreground">Visão geral do sistema</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-5">
                <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
                <p className="text-2xl font-heading font-bold">{loading ? "..." : s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="text-lg">Receita por Método</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mpesa</span>
              <span className="font-heading font-bold">{metrics.mpesaRevenue} MTS</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{
                width: metrics.totalRevenue ? `${(metrics.mpesaRevenue / metrics.totalRevenue) * 100}%` : "0%"
              }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">eMola</span>
              <span className="font-heading font-bold">{metrics.emolaRevenue} MTS</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all" style={{
                width: metrics.totalRevenue ? `${(metrics.emolaRevenue / metrics.totalRevenue) * 100}%` : "0%"
              }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="text-lg">Resumo Rápido</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa conversão Mpesa</span>
              <span className="font-medium">{metrics.totalRevenue ? Math.round((metrics.mpesaRevenue / metrics.totalRevenue) * 100) : 0}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa conversão eMola</span>
              <span className="font-medium">{metrics.totalRevenue ? Math.round((metrics.emolaRevenue / metrics.totalRevenue) * 100) : 0}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pagamentos pendentes</span>
              <span className="font-medium text-yellow-400">{metrics.pendingPayments}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
