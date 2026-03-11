import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Loader2, Search, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Student {
  id: string;
  user_id: string;
  name: string;
  plan: string;
  tokens: number;
  status: string;
  created_at: string;
}

const AdminEstudantes = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setStudents((data as Student[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (student: Student) => {
    const newStatus = student.status === "active" ? "inactive" : "active";
    setProcessing(student.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus } as any)
        .eq("id", student.id);
      if (error) throw error;
      toast.success(`Estudante ${newStatus === "active" ? "ativado" : "desativado"} com sucesso`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar status");
    } finally {
      setProcessing(null);
    }
  };

  const deleteStudent = async (student: Student) => {
    if (!confirm(`Tem certeza que deseja apagar "${student.name || "Sem nome"}"? Esta ação não pode ser desfeita.`)) return;
    setProcessing(student.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", student.id);
      if (error) throw error;
      toast.success("Estudante removido com sucesso");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover estudante");
    } finally {
      setProcessing(null);
    }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold">Gestão de Estudantes</h1>
        <p className="text-sm text-muted-foreground">{students.length} estudantes registrados</p>
      </motion.div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            Nenhum estudante encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.id} className="bg-gradient-card border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="font-heading font-bold text-primary">
                    {(s.name || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold truncate">{s.name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">
                    Registrado em {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-heading font-bold">{s.tokens}</p>
                    <p className="text-xs text-muted-foreground">tokens</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{s.plan.toUpperCase()}</Badge>
                  <Badge className={s.status === "active"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                  }>
                    {s.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={s.status === "active" ? "destructive" : "default"}
                    disabled={processing === s.id}
                    onClick={() => toggleStatus(s)}
                  >
                    {processing === s.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : s.status === "active" ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={processing === s.id}
                    onClick={() => deleteStudent(s)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEstudantes;
