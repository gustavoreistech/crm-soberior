import { NextRequest, NextResponse } from "next/server";
import { checkConfigStatus, saveConfigs } from "@/lib/config-manager";
import { ConfigUpdatePayload } from "@/types/config";
import { ApiResponse } from "@/types/api";

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const status = await checkConfigStatus();

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Erro ao verificar configurações:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao verificar configurações",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const payload: ConfigUpdatePayload = await request.json();

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhuma configuração fornecida" },
        { status: 400 }
      );
    }

    await saveConfigs(payload);

    return NextResponse.json({
      success: true,
      message: "Configurações atualizadas com sucesso",
    });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao salvar configurações",
      },
      { status: 500 }
    );
  }
}
