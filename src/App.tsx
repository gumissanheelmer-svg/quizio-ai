import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import ComingSoon from "./components/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="tutor" element={<ComingSoon title="AI Tutor" />} />
              <Route path="criar-trabalho" element={<ComingSoon title="Criar Trabalho" />} />
              <Route path="meus-trabalhos" element={<ComingSoon title="Meus Trabalhos" />} />
              <Route path="simulados" element={<ComingSoon title="Simulados" />} />
              <Route path="resumos" element={<ComingSoon title="Resumos" />} />
              <Route path="planner" element={<ComingSoon title="Smart Planner" />} />
              <Route path="rooms" element={<ComingSoon title="Quízio Rooms" />} />
              <Route path="prova-amanha" element={<ComingSoon title="Tenho Prova Amanhã" />} />
              <Route path="upload" element={<ComingSoon title="Upload de Arquivos" />} />
              <Route path="imagem" element={<ComingSoon title="Análise de Imagem" />} />
              <Route path="tokens" element={<ComingSoon title="Tokens" />} />
              <Route path="planos" element={<ComingSoon title="Planos" />} />
              <Route path="perfil" element={<ComingSoon title="Perfil" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
