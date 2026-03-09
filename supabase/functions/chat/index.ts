import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const TOKENS_PER_QUESTION = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { messages, mode = "professor" } = await req.json();

    // Check tokens
    const { data: profile } = await supabase
      .from("profiles")
      .select("tokens")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.tokens < TOKENS_PER_QUESTION) {
      return new Response(JSON.stringify({ error: "Tokens insuficientes. Você precisa de pelo menos 5 tokens." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save user message
    const lastUserMsg = messages[messages.length - 1];
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      message: lastUserMsg.content,
      mode,
      tokens_used: 0,
    });

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
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // We need to collect the full response to save it, while still streaming to client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process stream in background
    (async () => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Forward raw chunk to client
          await writer.write(value);

          // Extract content for saving
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch { /* skip */ }
          }
        }

        // Save assistant message and debit tokens
        await supabase.from("chat_messages").insert({
          user_id: user.id,
          role: "assistant",
          message: fullContent,
          mode,
          tokens_used: TOKENS_PER_QUESTION,
        });

        // Debit tokens using the secure function
        await supabase.rpc("debit_tokens", {
          p_user_id: user.id,
          p_amount: TOKENS_PER_QUESTION,
          p_description: `AI Tutor - modo ${mode}`,
        });
      } catch (e) {
        console.error("Stream processing error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
