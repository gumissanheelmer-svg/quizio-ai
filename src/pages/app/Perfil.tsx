import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Perfil = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("O nome não pode ser vazio"); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: name.trim() })
        .eq("user_id", user!.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Perfil atualizado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold">Perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus dados</p>
      </motion.div>

      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Input value={(profile?.plan ?? "free").toUpperCase()} disabled />
            </div>
            <div className="space-y-2">
              <Label>Tokens</Label>
              <Input value={String(profile?.tokens ?? 0)} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input value={profile?.status === "active" ? "Ativo" : "Inativo"} disabled />
          </div>
          <Button onClick={handleSave} disabled={isSaving} variant="glow">
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Perfil;
