import { NextRequest, NextResponse } from "next/server";
import { verifyAndUpdateSignature } from "@/lib/sheets/signature-logs";
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

    // Obtém IP do cliente
    const ip =
      body.ip ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const result = await verifyAndUpdateSignature(body.leadId, body.codigo, ip);

    if (!result.success) {
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
