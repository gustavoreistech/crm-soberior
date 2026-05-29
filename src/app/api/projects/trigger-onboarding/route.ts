import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

interface TriggerOnboardingBody {
  organizationId: string;
}

interface N8nPayload {
  action: "GENERATE_DOCS";
  organizationName: string;
  domain: string | null;
  stapeId: string | null;
}

/**
 * POST /api/projects/trigger-onboarding
 *
 * Dispara a esteira de produção de documentos no n8n.
 * Recebe o `organizationId`, busca os dados completos da Organização
 * (incluindo Leads e Subscriptions) no Prisma, envia um webhook para
 * o n8n e cria um registro de Project com stage "ONBOARDING".
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body: TriggerOnboardingBody = await request.json();

    if (!body.organizationId) {
      return NextResponse.json(
        { success: false, error: "Campo obrigatório: organizationId" },
        { status: 400 }
      );
    }

    // 1. Busca a Organization com Leads e Subscriptions
    const organization = await prisma.organization.findUnique({
      where: { id: body.organizationId },
      include: {
        leads: true,
        subscriptions: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organização não encontrada" },
        { status: 404 }
      );
    }

    console.info(
      `[trigger-onboarding] Disparando onboarding para org=${organization.id} (${organization.name})`
    );

    // 2. Monta o payload e envia para o n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Variável de ambiente N8N_WEBHOOK_URL não configurada. Configure-a nas configurações do sistema.",
        },
        { status: 500 }
      );
    }

    const n8nPayload: N8nPayload = {
      action: "GENERATE_DOCS",
      organizationName: organization.name,
      domain: organization.domain,
      stapeId: organization.stapeId,
    };

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text().catch(() => "Erro desconhecido");
      console.error(
        `[trigger-onboarding] n8n respondeu com status ${n8nResponse.status}: ${errorText}`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Falha ao comunicar com n8n (HTTP ${n8nResponse.status})`,
        },
        { status: 502 }
      );
    }

    console.info(
      `[trigger-onboarding] Webhook n8n enviado com sucesso para org=${organization.id}`
    );

    // 3. Cria um Project com stage "ONBOARDING" se ainda não existir
    const existingProject = await prisma.project.findFirst({
      where: { organizationId: organization.id },
    });

    if (!existingProject) {
      await prisma.project.create({
        data: {
          organizationId: organization.id,
          stage: "ONBOARDING",
        },
      });

      console.info(
        `[trigger-onboarding] Project criado para org=${organization.id}`
      );
    } else {
      console.info(
        `[trigger-onboarding] Project já existe (id=${existingProject.id}) para org=${organization.id} — nenhuma ação necessária`
      );
    }

    // 4. Retorna sucesso
    return NextResponse.json({
      success: true,
      data: {
        organizationId: organization.id,
        organizationName: organization.name,
      },
      message: "Solicitação de onboarding enviada para a fila do n8n",
    });
  } catch (error) {
    console.error("[trigger-onboarding] Erro ao disparar onboarding:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao disparar onboarding",
      },
      { status: 500 }
    );
  }
}
