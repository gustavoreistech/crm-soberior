import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getN8nWebhookSecret } from "@/lib/config-manager";
import { N8N_WEBHOOK_SECRET_HEADER } from "@/config/constants";
import { ApiResponse } from "@/types/api";

interface ProposalReadyPayload {
  proposalId: string;
  pdfUrl: string;
}

/**
 * POST /api/webhook/proposal-ready
 *
 * Inbound (n8n → CRM):
 * O n8n chama esta rota quando o PDF do Google Docs estiver pronto.
 * Atualiza o pdfUrl no Prisma e muda o status da proposal para "SENT".
 */
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

    const body: ProposalReadyPayload = await request.json();

    if (!body.proposalId || !body.pdfUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: proposalId, pdfUrl",
        },
        { status: 400 }
      );
    }

    // Busca a proposta existente
    const proposal = await prisma.proposal.findUnique({
      where: { id: body.proposalId },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposta não encontrada" },
        { status: 404 }
      );
    }

    // Atualiza pdfUrl e status
    const updatedProposal = await prisma.proposal.update({
      where: { id: body.proposalId },
      data: {
        pdfUrl: body.pdfUrl,
        status: "SENT",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          proposalId: updatedProposal.id,
          status: updatedProposal.status,
          pdfUrl: updatedProposal.pdfUrl,
        },
        message: "Proposta atualizada com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[proposal-ready] Erro:", error);
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
