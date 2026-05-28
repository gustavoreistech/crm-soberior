import { NextRequest, NextResponse } from "next/server";
import { createLead, ensureLeadsSheetExists } from "@/lib/sheets/leads";
import { getN8nWebhookSecret } from "@/lib/config-manager";
import { N8N_WEBHOOK_SECRET_HEADER } from "@/config/constants";
import { ApiResponse, N8nWebhookPayload } from "@/types/api";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // Valida webhook secret
    const webhookSecret = await getN8nWebhookSecret();
    const requestSecret = request.headers.get(N8N_WEBHOOK_SECRET_HEADER);

    if (webhookSecret && requestSecret !== webhookSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await ensureLeadsSheetExists();
    const body: N8nWebhookPayload = await request.json();

    if (!body.nome || !body.empresa || !body.telefone) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: nome, empresa, telefone",
        },
        { status: 400 }
      );
    }

    const lead = await createLead({
      Nome: body.nome,
      Empresa: body.empresa,
      Telefone: body.telefone,
      email: body.email,
      Investimento_Ads: body.investimento_ads ?? 0,
      Conversoes: body.conversoes ?? 0,
      ROAS: body.roas ?? 0,
    });

    return NextResponse.json(
      {
        success: true,
        data: { leadId: lead.ID },
        message: "Lead criado via webhook n8n",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no webhook n8n:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao processar webhook",
      },
      { status: 500 }
    );
  }
}
