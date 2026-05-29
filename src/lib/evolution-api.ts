import { EVOLUTION_API_TIMEOUT } from "@/config/constants";

interface EvolutionSendMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/** Nome padrão da instância Evolution API */
const DEFAULT_INSTANCE = "soberior";

/**
 * Envia uma mensagem de texto via Evolution API para o WhatsApp do cliente.
 * Lê EVOLUTION_API_URL e EVOLUTION_API_KEY diretamente das variáveis de ambiente.
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string
): Promise<EvolutionSendMessageResponse> {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!apiUrl || !apiKey) {
    console.error("[evolution] EVOLUTION_API_URL ou EVOLUTION_API_KEY não configuradas");
    return { success: false, error: "Evolution API não configurada" };
  }

  try {
    // Remove caracteres não numéricos do telefone
    const cleanPhone = phone.replace(/\D/g, "");
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || DEFAULT_INSTANCE;

    const response = await fetch(
      `${apiUrl}/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify({
          number: cleanPhone,
          text,
        }),
        signal: AbortSignal.timeout(EVOLUTION_API_TIMEOUT),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return { success: true, message: "Mensagem enviada com sucesso", ...data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido ao enviar WhatsApp";
    console.error("[evolution] Erro Evolution API:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Testa a conexão com a Evolution API.
 */
export async function testEvolutionConnection(
  apiUrl: string,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${apiUrl}/instance/connectionState`, {
      method: "GET",
      headers: {
        "apiKey": apiKey,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, message: "Conexão OK" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Falha na conexão",
    };
  }
}
