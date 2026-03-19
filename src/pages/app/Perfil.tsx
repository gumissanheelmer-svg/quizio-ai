import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save, Loader2, BookOpen, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const SUBJECT_OPTIONS = [
  "Matemática", "Física", "Química", "Biologia", "Português",
  "História", "Geografia", "Inglês", "Filosofia", "Sociologia",
  "Informática", "Contabilidade", "Direito", "Economia",
];

const Perfil = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [difficultyInput, setDifficultyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setFavoriteSubjects((profile as any).favorite_subjects || []);
      setDifficulties((profile as any).difficulties || []);
    }
  }, [profile]);

  const toggleSubject = (subject: string) => {
    setFavoriteSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const addDifficulty = () => {
    const text = difficultyInput.trim();
    if (!text || difficulties.includes(text)) return;
    setDifficulties((prev) => [...prev, text]);
    setDifficultyInput("");
  };

  const removeDifficulty = (d: string) => {
    setDifficulties((prev) => prev.filter((x) => x !== d));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("O nome não pode ser vazio"); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          favorite_subjects: favoriteSubjects,
          difficulties,
        })
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
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Perfil de Aprendizagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Disciplinas favoritas</Label>
            <p className="text-xs text-muted-foreground">A IA usará exemplos dessas áreas para facilitar seu aprendizado.</p>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.map((s) => (
                <Badge
                  key={s}
                  variant={favoriteSubjects.includes(s) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleSubject(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Dificuldades
            </Label>
            <p className="text-xs text-muted-foreground">A IA terá paciência extra nesses temas e usará abordagens alternativas.</p>
            <div className="flex gap-2">
              <Input
                value={difficultyInput}
                onChange={(e) => setDifficultyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDifficulty())}
                placeholder="Ex: Equações de 2º grau"
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addDifficulty}>Adicionar</Button>
            </div>
            {difficulties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {difficulties.map((d) => (
                  <Badge key={d} variant="secondary" className="gap-1">
                    {d}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeDifficulty(d)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} variant="glow" className="w-full">
        {isSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
      </Button>
    </div>
  );
};

export default Perfil;
