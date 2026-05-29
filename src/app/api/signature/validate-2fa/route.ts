import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse, Validate2FAPayload } from "@/types/api";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body: Validate2FAPayload = await request.json();

    if (!body.organizationId || !body.codigo) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: organizationId, codigo" },
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

    // Verifica se há um código armazenado
    if (!user.twoFactorCode || !user.twoFactorCodeExpiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: "Nenhum código encontrado para esta organização. Solicite um novo código.",
        },
        { status: 401 }
      );
    }

    // Verifica se o código expirou
    if (new Date() > user.twoFactorCodeExpiresAt) {
      // Limpa o código expirado
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: null,
          twoFactorCodeExpiresAt: null,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Código expirado. Solicite um novo código.",
        },
        { status: 401 }
      );
    }

    // Verifica se o código coincide
    if (user.twoFactorCode !== body.codigo) {
      return NextResponse.json(
        {
          success: false,
          error: "Código inválido. Verifique o código informado.",
        },
        { status: 401 }
      );
    }

    // Código válido — limpa o campo no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: null,
        twoFactorCodeExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Código verificado com sucesso. Assinatura digital concluída.",
    });
  } catch (error) {
    console.error("Erro ao validar código 2FA:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao validar código de verificação",
      },
      { status: 500 }
    );
  }
}
