import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getN8nWebhookSecret } from "@/lib/config-manager";
import { N8N_WEBHOOK_SECRET_HEADER } from "@/config/constants";
import type { ApiResponse } from "@/types/api";

interface MilestoneWebhookBody {
  milestoneId: string;
  status: "COMPLETED";
}

/**
 * POST /api/webhook/milestones
 *
 * Webhook inbound chamado pelo n8n sempre que finalizar uma etapa
 * técnica da infraestrutura (ex: Provisionamento Stape, Setup ClickHouse).
 *
 * 1. Atualiza o milestone para COMPLETED com a data atual
 * 2. Recalcula se o Project como um todo deve mudar de ONBOARDING para ACTIVE
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // Valida webhook secret (mesmo header usado pelo outro webhook n8n)
    const webhookSecret = await getN8nWebhookSecret();
    const requestSecret = request.headers.get(N8N_WEBHOOK_SECRET_HEADER);

    if (webhookSecret && requestSecret !== webhookSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: MilestoneWebhookBody = await request.json();

    if (!body.milestoneId || body.status !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Campos obrigatórios: milestoneId (string) e status (deve ser 'COMPLETED')",
        },
        { status: 400 }
      );
    }

    // 1. Busca o milestone com o projeto
    const milestone = await prisma.milestone.findUnique({
      where: { id: body.milestoneId },
      include: { project: true },
    });

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: "Milestone não encontrado" },
        { status: 404 }
      );
    }

    if (milestone.status === "COMPLETED") {
      console.info(
        `[webhook/milestones] Milestone ${milestone.id} já estava COMPLETED — ignorando`
      );
      return NextResponse.json({
        success: true,
        message: "Milestone já estava concluído anteriormente.",
      });
    }

    // 2. Atualiza o milestone para COMPLETED
    await prisma.milestone.update({
      where: { id: body.milestoneId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    console.info(
      `[webhook/milestones] Milestone ${milestone.id} ("${milestone.title}") marcado como COMPLETED`
    );

    // 3. Recalcula se o projeto deve transicionar para ACTIVE
    const projectId = milestone.projectId;
    const allMilestones = await prisma.milestone.findMany({
      where: { projectId },
      select: { status: true },
    });

    const total = allMilestones.length;
    const completed = allMilestones.filter(
      (m) => m.status === "COMPLETED"
    ).length;

    let projectTransitioned = false;

    // Se todos os milestones de onboarding foram concluídos e o projeto
    // ainda está em ONBOARDING, transiciona para ACTIVE
    if (
      total > 0 &&
      completed === total &&
      milestone.project.status === "ONBOARDING"
    ) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: "ACTIVE",
          endDate: new Date(), // endDate marca quando o onboarding foi concluído
        },
      });

      projectTransitioned = true;
      console.info(
        `[webhook/milestones] Projeto ${projectId} transicionou de ONBOARDING para ACTIVE (${completed}/${total} milestones concluídos)`
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        milestoneId: body.milestoneId,
        milestoneTitle: milestone.title,
        projectId,
        projectTransitioned,
        milestoneProgress: `${completed}/${total}`,
        projectStatus:
          completed === total ? "ACTIVE" : milestone.project.status,
      },
      message: projectTransitioned
        ? "Milestone concluído e onboarding finalizado! Projeto agora está ACTIVE."
        : "Milestone concluído com sucesso.",
    });
  } catch (error) {
    console.error("[webhook/milestones] Erro ao processar webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno ao processar webhook",
      },
      { status: 500 }
    );
  }
}
