import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getN8nProposalWebhookUrl } from "@/lib/config-manager";
import { ApiResponse } from "@/types/api";

interface GenerateProposalPayload {
  leadId: string;
}

/**
 * POST /api/automations/generate-proposal
 *
 * Outbound (CRM → n8n):
 * 1. Recebe o leadId
 * 2. Busca os dados do Lead com a Organization
 * 3. Converte o Lead para convertido (se não for)
 * 4. Cria um registro em Proposal
 * 5. Faz fetch POST para o webhook do n8n com os dados da empresa
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body: GenerateProposalPayload = await request.json();

    if (!body.leadId) {
      return NextResponse.json(
        { success: false, error: "Campo obrigatório: leadId" },
        { status: 400 }
      );
    }

    // 1. Busca o Lead com a Organization
    const lead = await prisma.lead.findUnique({
      where: { id: body.leadId },
      include: { organization: true },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    if (!lead.organization) {
      return NextResponse.json(
        { success: false, error: "Lead não possui organização vinculada" },
        { status: 400 }
      );
    }

    // 2. Marca o Lead como convertido
    await prisma.lead.update({
      where: { id: lead.id },
      data: { converted: true },
    });

    const organization = lead.organization;

    // 3. Cria um registro em Proposal
    const proposal = await prisma.proposal.create({
      data: {
        organizationId: organization.id,
        leadId: lead.id,
        status: "DRAFT",
      },
    });

    // 4. Busca a URL do webhook do n8n
    const n8nWebhookUrl = await getN8nProposalWebhookUrl();

    if (!n8nWebhookUrl) {
      // Se não tiver webhook configurado, apenas retorna sucesso com a proposta criada
      return NextResponse.json(
        {
          success: true,
          data: {
            proposalId: proposal.id,
            message: "Proposta criada. Webhook n8n não configurado.",
          },
        },
        { status: 201 }
      );
    }

    // 5. Envia os dados para o n8n
    const n8nPayload = {
      proposalId: proposal.id,
      leadId: lead.id,
      organizationId: organization.id,
      companyName: organization.name,
      cnpj: organization.cnpj,
      domain: organization.domain,
      email: organization.email,
      telefone: organization.telefone,
      techContact: organization.techContact,
      financeContact: organization.financeContact,
    };

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("[generate-proposal] Erro ao chamar n8n:", errorText);
      // A proposta já foi criada, então não falhamos a requisição
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          proposalId: proposal.id,
          organizationId: organization.id,
          message: "Proposta enviada para fila de geração",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[generate-proposal] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao gerar proposta",
      },
      { status: 500 }
    );
  }
}
