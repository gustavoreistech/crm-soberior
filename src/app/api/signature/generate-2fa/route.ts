import { NextRequest, NextResponse } from "next/server";
import { createSignatureLog, ensureSignatureLogsSheetExists } from "@/lib/sheets/signature-logs";
import { getEvolutionCredentials } from "@/lib/config-manager";
import { sendWhatsAppMessage } from "@/lib/evolution-api";
import { CODE_2FA_LENGTH } from "@/config/constants";
import { ApiResponse, Generate2FAPayload } from "@/types/api";

function generate2FACode(): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < CODE_2FA_LENGTH; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    await ensureSignatureLogsSheetExists();
    const body: Generate2FAPayload = await request.json();

    if (!body.leadId || !body.telefone) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: leadId, telefone" },
        { status: 400 }
      );
    }

    // Verifica se Evolution API está configurada
    const evolutionCreds = await getEvolutionCredentials();
    if (!evolutionCreds) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Evolution API não configurada. Acesse /settings para configurar.",
        },
        { status: 400 }
      );
    }

    // Gera código 2FA
    const codigo = generate2FACode();

    // Salva no Google Sheets
    await createSignatureLog(body.leadId, body.telefone, codigo);

    // Envia via WhatsApp
    const message = `🔐 *Soberior OS - Código de Verificação*\n\nSeu código para assinatura digital é:\n\n*${codigo}*\n\nEste código expira em 5 minutos.\n\nSe você não solicitou este código, ignore esta mensagem.`;

    const whatsappResult = await sendWhatsAppMessage(
      evolutionCreds.apiUrl,
      evolutionCreds.apiKey,
      body.telefone,
      message
    );

    if (!whatsappResult.success) {
      console.error("Falha ao enviar WhatsApp:", whatsappResult.error);
      // Ainda retorna sucesso pois o código foi gerado, mesmo que o WhatsApp falhe
    }

    return NextResponse.json(
      {
        success: true,
        message: "Código gerado e enviado via WhatsApp",
        data: {
          expiresIn: 300, // 5 minutos em segundos
          ...(whatsappResult.success ? {} : { whatsappWarning: whatsappResult.error }),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao gerar código 2FA:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao gerar código de verificação",
      },
      { status: 500 }
    );
  }
}
