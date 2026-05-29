import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

/**
 * GET /api/leads/[id]/proposal
 *
 * Retorna a proposta e contrato vinculados a um Lead.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        proposal: {
          include: {
            contract: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    const proposal = lead.proposal
      ? {
          id: lead.proposal.id,
          value: lead.proposal.value,
          pdfUrl: lead.proposal.pdfUrl,
          status: lead.proposal.status,
        }
      : null;

    const contract = lead.proposal?.contract
      ? {
          id: lead.proposal.contract.id,
          proposalId: lead.proposal.contract.proposalId,
          signatureStatus: lead.proposal.contract.signatureStatus,
          signedAt: lead.proposal.contract.signedAt?.toISOString() ?? null,
        }
      : null;

    return NextResponse.json(
      {
        success: true,
        data: { proposal, contract },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[lead-proposal] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao buscar proposta do lead",
      },
      { status: 500 }
    );
  }
}
