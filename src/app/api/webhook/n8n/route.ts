import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    // Cria Organization e Lead via Prisma em transação
    const lead = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: body.empresa,
        },
      });

      const created = await tx.lead.create({
        data: {
          organizationId: organization.id,
          status: "PROSPECT",
        },
        include: { organization: true },
      });

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        data: { leadId: lead.id },
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
