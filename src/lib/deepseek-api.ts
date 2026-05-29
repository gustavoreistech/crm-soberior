import OpenAI from "openai";

export interface LeadAnalysis {
  score: number;
  lostRevenue: number;
}

/**
 * Testa a conexão com a DeepSeek API.
 */
export async function testDeepSeekConnection(
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/models",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return { success: true, message: "Conexão OK" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Falha na conexão",
    };
  }
}

/**
 * Analisa o HTML de um lead usando DeepSeek via SDK OpenAI.
 * Retorna score (0-100) e lostRevenue estimado, ou null em caso de erro.
 */
export async function analyzeLead(
  htmlContent: string
): Promise<LeadAnalysis | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("[deepseek] DEEPSEEK_API_KEY não configurada");
    return null;
  }

  try {
    const client = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey,
    });

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `Você é um analista de leads B2B. Analise o HTML da página do cliente e retorne APENAS um JSON válido (sem markdown) com:
{
  "score": number (0-100 indicando probabilidade de fechar negócio),
  "lostRevenue": number (receita mensal estimada que o cliente pode estar perdendo sem a solução, em R$)
}`,
        },
        {
          role: "user",
          content: `Analise o seguinte conteúdo HTML do site do lead e extraia score e lostRevenue:\n\n${htmlContent}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[deepseek] Resposta vazia da API");
      return null;
    }

    const cleaned = content
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed: LeadAnalysis = JSON.parse(cleaned);
    return {
      score: Math.min(100, Math.max(0, parsed.score)),
      lostRevenue: parsed.lostRevenue ?? 0,
    };
  } catch (error) {
    console.error(
      "[deepseek] Erro ao analisar lead:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
