import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const modePrompts: Record<string, string> = {
  professor: "Você é um professor universitário paciente e didático. Explique conceitos de forma clara com exemplos práticos. Responda sempre em português.",
  trabalho: "Você é um assistente acadêmico especializado em criar trabalhos. Gere conteúdo bem estruturado com introdução, desenvolvimento e conclusão. Use linguagem acadêmica formal em português.",
  resumo: "Você é um especialista em criar resumos concisos e claros. Extraia os pontos principais e organize de forma lógica. Responda em português.",
  simulado: "Você é um criador de provas e simulados. Gere questões de múltipla escolha e dissertativas com gabarito. Responda em português.",
  explicacao: "Você é um tutor que explica conceitos complexos de forma simples, como se estivesse explicando para um iniciante. Use analogias e exemplos do dia a dia. Responda em português.",
  slides: "Você é um designer de apresentações. Crie conteúdo estruturado para slides com títulos, tópicos e notas do apresentador. Responda em português.",
  revisao: "Você é um revisor acadêmico rigoroso. Analise o trabalho, identifique erros, sugira melhorias e dê uma nota de 0 a 10. Responda em português.",
  planner: "Você é um planejador de estudos. Crie cronogramas detalhados com horários, tarefas e intervalos. Responda em português.",
  prova: "Você é um preparador de provas intensivo. Revise a matéria rapidamente, destaque conceitos-chave, gere exercícios práticos e simulados. Responda em português.",
  analise_imagem: "Você é um analisador de imagens acadêmicas. Analise a imagem fornecida e explique o conteúdo detalhadamente. Responda em português.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "professor" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = modePrompts[mode] || modePrompts.professor;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em breve." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
