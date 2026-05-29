import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolution-api";
import { CODE_2FA_LENGTH, CODE_2FA_EXPIRY_SECONDS } from "@/config/constants";
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
    const body: Generate2FAPayload = await request.json();

    if (!body.phone || !body.organizationId) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: phone, organizationId" },
        { status: 400 }
      );
    }

    // Busca o primeiro usuário da organização
    const user = await prisma.user.findFirst({
      where: { organizationId: body.organizationId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Nenhum usuário encontrado para esta organização" },
        { status: 404 }
      );
    }

    // Gera código 2FA de 6 dígitos
    const codigo = generate2FACode();
    const expiresAt = new Date(Date.now() + CODE_2FA_EXPIRY_SECONDS * 1000);

    // Salva o código temporariamente no registro do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: codigo,
        twoFactorCodeExpiresAt: expiresAt,
      },
    });

    // Envia o código via WhatsApp
    const message = `Seu código de acesso Soberior é: ${codigo}. Não compartilhe.`;

    const whatsappResult = await sendWhatsAppMessage(body.phone, message);

    if (!whatsappResult.success) {
      console.error("Falha ao enviar WhatsApp:", whatsappResult.error);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Código gerado e enviado via WhatsApp",
        data: {
          expiresIn: CODE_2FA_EXPIRY_SECONDS,
          ...(whatsappResult.success ? {} : { whatsappWarning: whatsappResult.error }),
        },
      },
      { status: 200 }
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
