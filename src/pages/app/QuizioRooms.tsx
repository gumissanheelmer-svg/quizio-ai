import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Lock, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const QuizioRooms = () => {
  const { profile } = useAuth();
  const isPro = profile?.plan && profile.plan !== "free";
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from('rooms')
        .select(`
          *,
          room_members ( * ),
          room_tasks ( * )
        `);
      if (data) setRooms(data);
    };
    if (isPro) fetchRooms();
  }, [isPro, profile]);

  if (!isPro) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-heading font-bold">Quízio Rooms</h1>
        </motion.div>
        <Card className="bg-gradient-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Lock className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="font-heading font-bold text-lg mb-2">Recurso PRO</h2>
            <p className="text-muted-foreground text-sm text-center mb-4">
              Quízio Rooms está disponível a partir do plano PRO.<br />
              Crie salas de grupo, divida tarefas e colabore!
            </p>
            <Button variant="glow" asChild>
              <Link to="/app/planos">Ver Planos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Quízio Rooms</h1>
          <p className="text-sm text-muted-foreground">Trabalhos em grupo com IA</p>
        </div>
        <Button variant="glow"><Plus className="w-4 h-4 mr-2" /> Criar Sala</Button>
      </motion.div>

      {rooms.length === 0 ? (
        <Card className="bg-gradient-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">Nenhuma sala criada ainda.</p>
            <p className="text-muted-foreground text-xs mt-1">Crie uma sala e convide seus colegas!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <Card key={room.id} className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  {room.name}
                  <span className="text-xs text-muted-foreground">{room.room_members?.length || 0} membros</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Membros</h3>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    {room.room_members?.map((m: any) => (
                      <span key={m.id} className="bg-primary/10 px-2 py-1 rounded">{m.user_id} ({m.role})</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Tarefas</h3>
                  <div className="space-y-2">
                    {room.room_tasks?.map((t: any) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        {t.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                        <span>{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizioRooms;
