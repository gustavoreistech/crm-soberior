import { DEEPSEEK_API_TIMEOUT } from "@/config/constants";
import { EnrichedLeadData } from "@/types/api";

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const SYSTEM_PROMPT = `Você é um analista de marketing digital especializado em identificar dores de clientes B2B.
Analise a URL fornecida e retorne APENAS um JSON válido (sem markdown, sem formatação) com a seguinte estrutura:
{
  "dor_do_cliente": "Descrição clara da principal dor do cliente identificada na URL",
  "solucao_sugerida": "Como um CRM/automação de marketing pode resolver essa dor",
  "nivel_urgencia": "baixo | medio | alto",
  "metricas_estimadas": {
    "potencial_mercado": "Estimativa de mercado endereçável",
    "concorrentes": ["Concorrente 1", "Concorrente 2"]
  }
}`;

/**
 * Envia uma URL para a DeepSeek API e retorna dados enriquecidos do lead.
 */
export async function enrichLeadWithDeepSeek(
  apiKey: string,
  model: string,
  url: string
): Promise<{ success: boolean; data?: EnrichedLeadData; error?: string }> {
  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: `Analise a seguinte URL de um potencial cliente e extraia as informações de dor e oportunidade: ${url}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(DEEPSEEK_API_TIMEOUT),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
    }

    const result: DeepSeekResponse = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Resposta vazia da DeepSeek API");
    }

    // Remove possíveis delimitadores markdown JSON
    const cleanedContent = content
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsedData: EnrichedLeadData = JSON.parse(cleanedContent);

    return { success: true, data: parsedData };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido na DeepSeek";
    console.error("Erro DeepSeek API:", errorMessage);
    return { success: false, error: errorMessage };
  }
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
