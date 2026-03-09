import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const QuizioRooms = () => {
  const { profile } = useAuth();
  const isPro = profile?.plan && profile.plan !== "free";

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

      <Card className="bg-gradient-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm">Nenhuma sala criada ainda.</p>
          <p className="text-muted-foreground text-xs mt-1">Crie uma sala e convide seus colegas!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizioRooms;
