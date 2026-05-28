import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "@/lib/code-store";
import { ApiResponse, Validate2FAPayload } from "@/types/api";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body: Validate2FAPayload = await request.json();

    if (!body.leadId || !body.codigo) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: leadId, codigo" },
        { status: 400 }
      );
    }

    const result = verifyCode(body.leadId, body.codigo);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
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
