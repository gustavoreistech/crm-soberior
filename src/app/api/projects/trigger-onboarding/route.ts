import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

interface TriggerOnboardingBody {
  organizationId: string;
}

interface N8nOnboardingPayload {
  action: "START_ONBOARDING";
  organizationId: string;
  organizationName: string;
  domain: string | null;
  email: string | null;
  telefone: string | null;
  stapeId: string | null;
  techContact: string | null;
  projectId: string;
  milestones: Array<{
    id: string;
    title: string;
    order: number;
  }>;
}

/**
 * Milestones padrão da esteira de onboarding técnico.
 * Cada etapa será executada pelo n8n e notificada de volta via webhook.
 */
const DEFAULT_ONBOARDING_MILESTONES = [
  { title: "Auditoria Técnica Inicial", order: 1 },
  { title: "Provisionamento Stape", order: 2 },
  { title: "Setup ClickHouse", order: 3 },
  { title: "Configuração GTM Server-Side", order: 4 },
  { title: "Dashboard Looker Studio", order: 5 },
  { title: "Go-Live & Homologação", order: 6 },
];

/**
 * POST /api/projects/trigger-onboarding
 *
 * Dispara a esteira de onboarding técnico automatizado.
 * 1. Cria/garante um Project no Prisma com status ONBOARDING
 * 2. Instancia os milestones padrão vinculados ao projeto
 * 3. Dispara webhook para o n8n com dados completos da organização
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

    // 1. Busca a Organização com dados completos
    const organization = await prisma.organization.findUnique({
      where: { id: body.organizationId },
      select: {
        id: true,
        name: true,
        domain: true,
        email: true,
        telefone: true,
        stapeId: true,
        techContact: true,
        users: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organização não encontrada" },
        { status: 404 }
      );
    }

    console.info(
      `[trigger-onboarding] Iniciando onboarding para org=${organization.id} (${organization.name})`
    );

    // 2. Cria o Project com milestones em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Upsert: se já existir projeto, usa ele; senão cria
      let project = await tx.project.findFirst({
        where: { organizationId: organization.id },
      });

      if (!project) {
        project = await tx.project.create({
          data: {
            organizationId: organization.id,
            status: "ONBOARDING",
            startDate: new Date(),
          },
        });
        console.info(
          `[trigger-onboarding] Project criado (id=${project.id}) para org=${organization.id}`
        );
      } else {
        console.info(
          `[trigger-onboarding] Project já existe (id=${project.id}) — recriando milestones`
        );
        // Se o projeto já existe, apaga milestones antigas para recriar
        await tx.milestone.deleteMany({
          where: { projectId: project.id },
        });
      }

      // Cria os milestones padrão de onboarding
      const milestones = await Promise.all(
        DEFAULT_ONBOARDING_MILESTONES.map((m) =>
          tx.milestone.create({
            data: {
              projectId: project!.id,
              title: m.title,
              order: m.order,
              status: "PENDING",
            },
          })
        )
      );

      console.info(
        `[trigger-onboarding] ${milestones.length} milestones criadas para project=${project!.id}`
      );

      return { project, milestones };
    });

    // 3. Dispara webhook para o n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.warn(
        "[trigger-onboarding] N8N_WEBHOOK_URL não configurada — projeto criado mas automação não disparada"
      );
      return NextResponse.json({
        success: true,
        data: {
          projectId: result.project.id,
          milestones: result.milestones.map((m) => ({
            id: m.id,
            title: m.title,
            order: m.order,
          })),
          warning:
            "Projeto criado sem automação n8n. Configure N8N_WEBHOOK_URL para ativar a esteira.",
        },
        message:
          "Onboarding registrado. Automação n8n não disponível.",
      });
    }

    const n8nPayload: N8nOnboardingPayload = {
      action: "START_ONBOARDING",
      organizationId: organization.id,
      organizationName: organization.name,
      domain: organization.domain,
      email: organization.email,
      telefone: organization.telefone,
      stapeId: organization.stapeId,
      techContact: organization.techContact,
      projectId: result.project.id,
      milestones: result.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
      })),
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
          data: {
            projectId: result.project.id,
            milestones: result.milestones.map((m) => ({
              id: m.id,
              title: m.title,
              order: m.order,
            })),
          },
        },
        { status: 502 }
      );
    }

    console.info(
      `[trigger-onboarding] Webhook n8n enviado com sucesso para org=${organization.id}`
    );

    // 4. Retorna sucesso
    return NextResponse.json({
      success: true,
      data: {
        projectId: result.project.id,
        organizationId: organization.id,
        organizationName: organization.name,
        milestones: result.milestones.map((m) => ({
          id: m.id,
          title: m.title,
          order: m.order,
          status: m.status,
        })),
      },
      message:
        "Onboarding técnico iniciado com sucesso. A automação n8n está processando os milestones.",
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
