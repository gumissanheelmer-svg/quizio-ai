import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const AdminConfiguracoes = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [mpesaName, setMpesaName] = useState("");
  const [emolaNumber, setEmolaNumber] = useState("");
  const [emolaName, setEmolaName] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("payment_settings")
        .select("*")
        .limit(1)
        .single();
      if (data) {
        setSettingsId((data as any).id);
        setMpesaNumber((data as any).mpesa_number || "");
        setMpesaName((data as any).mpesa_name || "");
        setEmolaNumber((data as any).emola_number || "");
        setEmolaName((data as any).emola_name || "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settingsId) {
        const { error } = await supabase
          .from("payment_settings")
          .update({
            mpesa_number: mpesaNumber,
            mpesa_name: mpesaName,
            emola_number: emolaNumber,
            emola_name: emolaName,
          } as any)
          .eq("id", settingsId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_settings")
          .insert({
            mpesa_number: mpesaNumber,
            mpesa_name: mpesaName,
            emola_number: emolaNumber,
            emola_name: emolaName,
          } as any);
        if (error) throw error;
      }
      toast.success("Configurações salvas com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold">Configurações de Pagamento</h1>
        <p className="text-sm text-muted-foreground">Gerencie os números de pagamento exibidos no checkout</p>
      </motion.div>

      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" /> Contas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-sm text-primary">Mpesa</h3>
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label>Número Mpesa</Label>
                <Input value={mpesaNumber} onChange={(e) => setMpesaNumber(e.target.value)} placeholder="855430949" />
              </div>
              <div className="space-y-1">
                <Label>Nome do Titular</Label>
                <Input value={mpesaName} onChange={(e) => setMpesaName(e.target.value)} placeholder="Nome completo" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-sm text-primary">eMola</h3>
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label>Número eMola</Label>
                <Input value={emolaNumber} onChange={(e) => setEmolaNumber(e.target.value)} placeholder="873702423" />
              </div>
              <div className="space-y-1">
                <Label>Nome do Titular</Label>
                <Input value={emolaName} onChange={(e) => setEmolaName(e.target.value)} placeholder="Nome completo" />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} variant="glow" className="w-full">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar Configurações</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminConfiguracoes;
