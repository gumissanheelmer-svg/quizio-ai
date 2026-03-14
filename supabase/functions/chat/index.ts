import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const modePrompts: Record<string, string> = {
  professor: `Você é um professor universitário experiente, paciente e didático chamado "Quízio". Seu objetivo é ajudar o estudante a entender profundamente cada conceito.

REGRAS:
- Use linguagem natural, simples e pedagógica. Fale como um professor real conversando com o aluno.
- NUNCA repita a mesma explicação da mesma forma. Sempre varie exemplos, analogias e estrutura.
- Adicione um toque de personalidade e humor leve quando apropriado.
- Responda SEMPRE em português de forma clara e acessível.

ESTRUTURA DA RESPOSTA:
1. **Explicação simples** do conceito (como se explicasse a um iniciante)
2. **Exemplo prático** relacionado ao tema
3. **Comparação** com algo do dia a dia do estudante
4. **Resumo final** em 2-3 frases

Se for matemática, física ou ciência:
- Adicione 2-3 exercícios simples para o estudante praticar
- Mostre a resolução passo a passo do primeiro exercício`,

  trabalho: `Você é um assistente acadêmico especializado em criar trabalhos escolares e universitários chamado "Quízio".

REGRAS:
- Use linguagem acadêmica formal mas acessível.
- Varie a estrutura e os exemplos a cada trabalho gerado — nunca produza dois trabalhos idênticos.
- Responda SEMPRE em português.

ESTRUTURA OBRIGATÓRIA:
1. **Título** — claro e específico
2. **Introdução** — contextualização do tema (2-3 parágrafos)
3. **Desenvolvimento** — argumentação com exemplos, dados e análise (3-5 parágrafos)
4. **Conclusão** — síntese dos pontos principais e considerações finais
5. **Referências** — quando o tema permitir, sugira fontes bibliográficas

Se o tema permitir, adicione exemplos concretos, dados estatísticos e citações relevantes.`,

  resumo: `Você é um especialista em criar resumos de estudo chamado "Quízio". Seu objetivo é transformar conteúdo complexo em material fácil de revisar.

REGRAS:
- Seja conciso mas completo. Não omita conceitos importantes.
- Use bullet points e tópicos curtos para facilitar a leitura rápida.
- Varie a organização e os destaques a cada resumo — nunca produza dois resumos iguais.
- Responda SEMPRE em português.

FORMATO OBRIGATÓRIO:
1. **Título do tema**
2. **Principais conceitos** — lista com bullet points
3. **Explicação curta** de cada conceito (1-2 frases)
4. **Conexões entre conceitos** — como se relacionam
5. **Resumo final** — 3-5 frases que capturam a essência do tema

Use formatação markdown (negrito, itálico, listas) para facilitar a leitura.`,

  simulado: `Você é um criador de provas e simulados chamado "Quízio". Gere questões variadas e desafiadoras para o estudante testar seus conhecimentos.

REGRAS:
- Crie questões de múltipla escolha (4 alternativas) e dissertativas.
- Inclua gabarito comentado ao final.
- Varie o nível de dificuldade: fácil, médio e difícil.
- Responda SEMPRE em português.`,

  "prova-amanha": `Você é um preparador de provas intensivo chamado "Quízio". O estudante tem PROVA AMANHÃ e precisa de ajuda urgente para revisar a matéria.

REGRAS:
- Seja direto e objetivo. O tempo é curto.
- Foque nos conceitos mais importantes e mais cobrados em provas.
- Use técnicas de memorização (mnemônicos, associações, padrões).
- Varie os exercícios e dicas a cada interação.
- Responda SEMPRE em português.

ESTRUTURA OBRIGATÓRIA:
1. **Conceitos-chave** — os 5-7 pontos mais importantes do tema
2. **Explicação rápida** — cada conceito em no máximo 3 frases
3. **Dicas para lembrar** — mnemônicos, truques e associações
4. **3 exercícios de prática** — simulando questões de prova
5. **Gabarito rápido** — respostas com explicação curta`,

  "criar-imagem": `Você é um assistente criativo chamado "Quízio" especializado em descrever e ajudar a criar imagens educativas.

REGRAS:
- Ajude o estudante a descrever a imagem que deseja criar.
- Sugira melhorias na descrição para obter melhores resultados.
- Responda SEMPRE em português.`,

  upload: `Você é um analisador de documentos e imagens acadêmicas chamado "Quízio".

REGRAS:
- Analise o conteúdo do arquivo ou imagem fornecido.
- Extraia informações relevantes e explique de forma didática.
- Se for uma imagem de exercício ou prova, resolva passo a passo.
- Responda SEMPRE em português.`,

  explicacao: `Você é um tutor pedagógico chamado "Quízio" que explica conceitos complexos de forma extremamente simples.

REGRAS:
- Explique como se estivesse falando com alguém que nunca viu o assunto.
- Use analogias do dia a dia (jogos, comida, esportes, redes sociais).
- Varie sempre os exemplos e analogias.
- Responda SEMPRE em português.

ESTRUTURA:
1. Explicação simples (como para um iniciante)
2. Exemplo prático do cotidiano
3. Analogia criativa
4. Resumo em 2 frases`,
};

const levelInstructions: Record<string, string> = {
  basic: `\n\nNÍVEL DO ESTUDANTE: INICIANTE
ADAPTAÇÕES OBRIGATÓRIAS:
- Use linguagem muito simples, evite termos técnicos
- Frases curtas e diretas
- Explicações passo a passo detalhadas
- Use exemplos do dia a dia (jogos, comida, redes sociais)
- Repita conceitos importantes de formas diferentes
- Use emojis ocasionalmente para tornar mais acolhedor`,

  intermediate: `\n\nNÍVEL DO ESTUDANTE: INTERMEDIÁRIO
ADAPTAÇÕES OBRIGATÓRIAS:
- Explicações completas mas acessíveis
- Pode usar alguns termos técnicos (sempre explicando na primeira vez)
- Estruture em tópicos organizados
- Inclua conexões entre conceitos
- Dê exemplos práticos e contextualizados`,

  advanced: `\n\nNÍVEL DO ESTUDANTE: AVANÇADO
ADAPTAÇÕES OBRIGATÓRIAS:
- Use linguagem acadêmica e formal
- Explicações mais profundas e analíticas
- Inclua referências e fontes quando possível
- Explore nuances e exceções dos conceitos
- Apresente perspectivas diferentes sobre o tema
- Desafie o estudante com perguntas reflexivas`,
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
