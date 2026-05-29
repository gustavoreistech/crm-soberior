import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

/**
 * GET /api/signature/contract/[id]
 *
 * Retorna os dados de um contrato com proposta e organização para exibição no portal.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        proposal: true,
        organization: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: "Contrato não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: contract.id,
          proposalId: contract.proposalId,
          signatureStatus: contract.signatureStatus,
          signedAt: contract.signedAt?.toISOString() ?? null,
          organization: {
            id: contract.organization.id,
            name: contract.organization.name,
            cnpj: contract.organization.cnpj,
            domain: contract.organization.domain,
            email: contract.organization.email,
            telefone: contract.organization.telefone,
          },
          proposal: contract.proposal
            ? {
                id: contract.proposal.id,
                value: contract.proposal.value,
                pdfUrl: contract.proposal.pdfUrl,
                status: contract.proposal.status,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[contract-detail] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao buscar contrato",
      },
      { status: 500 }
    );
  }
}
