import { EVOLUTION_API_TIMEOUT } from "@/config/constants";

interface EvolutionSendMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Envia uma mensagem de texto via Evolution API para o WhatsApp do cliente.
 */
export async function sendWhatsAppMessage(
  apiUrl: string,
  apiKey: string,
  telefone: string,
  message: string
): Promise<EvolutionSendMessageResponse> {
  try {
    // Remove caracteres não numéricos do telefone
    const cleanPhone = telefone.replace(/\D/g, "");

    const response = await fetch(
      `${apiUrl}/message/sendText/${cleanPhone}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apiKey": apiKey,
        },
        body: JSON.stringify({
          text: message,
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
    console.error("Erro Evolution API:", errorMessage);
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
