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
import AiTutor from "./pages/app/AiTutor";
import CriarTrabalho from "./pages/app/CriarTrabalho";
import MeusTrabalhos from "./pages/app/MeusTrabalhos";
import Simulados from "./pages/app/Simulados";
import Resumos from "./pages/app/Resumos";
import SmartPlanner from "./pages/app/SmartPlanner";
import QuizioRooms from "./pages/app/QuizioRooms";
import ProvaAmanha from "./pages/app/ProvaAmanha";
import UploadArquivos from "./pages/app/UploadArquivos";
import AnaliseImagem from "./pages/app/AnaliseImagem";
import Tokens from "./pages/app/Tokens";
import Planos from "./pages/app/Planos";
import Perfil from "./pages/app/Perfil";
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
              <Route path="tutor" element={<AiTutor />} />
              <Route path="criar-trabalho" element={<CriarTrabalho />} />
              <Route path="meus-trabalhos" element={<MeusTrabalhos />} />
              <Route path="simulados" element={<Simulados />} />
              <Route path="resumos" element={<Resumos />} />
              <Route path="planner" element={<SmartPlanner />} />
              <Route path="rooms" element={<QuizioRooms />} />
              <Route path="prova-amanha" element={<ProvaAmanha />} />
              <Route path="upload" element={<UploadArquivos />} />
              <Route path="imagem" element={<AnaliseImagem />} />
              <Route path="tokens" element={<Tokens />} />
              <Route path="planos" element={<Planos />} />
              <Route path="perfil" element={<Perfil />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
