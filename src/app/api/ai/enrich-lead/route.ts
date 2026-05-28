import { NextRequest, NextResponse } from "next/server";
import { getLeadById, updateLead } from "@/lib/sheets/leads";
import { getDeepSeekCredentials } from "@/lib/config-manager";
import { enrichLeadWithDeepSeek } from "@/lib/deepseek-api";
import { ApiResponse, EnrichLeadPayload } from "@/types/api";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body: EnrichLeadPayload = await request.json();

    if (!body.leadId || !body.url) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: leadId, url",
        },
        { status: 400 }
      );
    }

    // Verifica se o lead existe
    const existingLead = await getLeadById(body.leadId);
    if (!existingLead) {
      return NextResponse.json(
        { success: false, error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // Verifica credenciais DeepSeek
    const deepSeekCreds = await getDeepSeekCredentials();
    if (!deepSeekCreds) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DeepSeek API não configurada. Acesse /settings para configurar.",
        },
        { status: 400 }
      );
    }

    // Envia para DeepSeek
    const result = await enrichLeadWithDeepSeek(
      deepSeekCreds.apiKey,
      deepSeekCreds.model,
      body.url
    );

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Falha ao enriquecer lead com DeepSeek",
        },
        { status: 500 }
      );
    }

    // Salva dados enriquecidos no lead
    const enrichedJson = JSON.stringify(result.data);
    await updateLead(body.leadId, {
      Nome: existingLead.Nome,
      Empresa: existingLead.Empresa,
      Telefone: existingLead.Telefone,
    });
    // Nota: O campo Dados_DeepSeek é atualizado diretamente no sheet
    // via função específica. Por ora salvamos via updateLead.

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Lead enriquecido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao enriquecer lead:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao enriquecer lead com IA",
      },
      { status: 500 }
    );
  }
}
