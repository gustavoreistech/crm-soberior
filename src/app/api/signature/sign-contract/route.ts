import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

interface SignContractPayload {
  contractId: string;
  codigo: string;
}

/**
 * POST /api/signature/sign-contract
 *
 * Recebe o contractId e o código 2FA, valida o código,
 * assina o contrato, atualiza o Lead para "WON" (CLOSED_WON)
 * e cria um Project em status "ONBOARDING".
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body: SignContractPayload = await request.json();

    if (!body.contractId || !body.codigo) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: contractId, codigo" },
        { status: 400 }
      );
    }

    // 1. Busca o contrato com a organização e a proposta vinculada
    const contract = await prisma.contract.findUnique({
      where: { id: body.contractId },
      include: {
        organization: true,
        proposal: {
          include: {
            lead: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: "Contrato não encontrado" },
        { status: 404 }
      );
    }

    if (contract.signatureStatus === "SIGNED") {
      return NextResponse.json(
        { success: false, error: "Contrato já foi assinado" },
        { status: 400 }
      );
    }

    // 2. Valida o código 2FA no usuário da organização
    const user = await prisma.user.findFirst({
      where: { organizationId: contract.organizationId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Nenhum usuário encontrado para esta organização" },
        { status: 404 }
      );
    }

    if (!user.twoFactorCode || !user.twoFactorCodeExpiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: "Nenhum código 2FA encontrado. Solicite um novo código.",
        },
        { status: 401 }
      );
    }

    if (new Date() > user.twoFactorCodeExpiresAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorCode: null, twoFactorCodeExpiresAt: null },
      });

      return NextResponse.json(
        { success: false, error: "Código 2FA expirado. Solicite um novo código." },
        { status: 401 }
      );
    }

    if (user.twoFactorCode !== body.codigo) {
      return NextResponse.json(
        { success: false, error: "Código 2FA inválido. Verifique o código informado." },
        { status: 401 }
      );
    }

    // 3. Código válido — executa a assinatura em transação
    const result = await prisma.$transaction(async (tx) => {
      // 3a. Limpa o código 2FA do usuário
      await tx.user.update({
        where: { id: user.id },
        data: { twoFactorCode: null, twoFactorCodeExpiresAt: null },
      });

      // 3b. Assina o contrato
      const signedContract = await tx.contract.update({
        where: { id: contract.id },
        data: {
          signatureStatus: "SIGNED",
          signedAt: new Date(),
        },
      });

      // 3c. Se houver uma proposta vinculada, atualiza o status para ACCEPTED
      if (contract.proposal) {
        await tx.proposal.update({
          where: { id: contract.proposal.id },
          data: { status: "ACCEPTED" },
        });
      }

      // 3d. Se houver um lead vinculado à proposta, atualiza para CLOSED_WON
      const lead = contract.proposal?.lead;
      if (lead) {
        await tx.lead.update({
          where: { id: lead.id },
          data: { status: "CLOSED_WON", converted: true },
        });
      }

      // 3e. Cria o Project em status ONBOARDING se não existir
      const existingProject = await tx.project.findFirst({
        where: { organizationId: contract.organizationId },
      });

      if (!existingProject) {
        await tx.project.create({
          data: {
            organizationId: contract.organizationId,
            status: "ONBOARDING",
            startDate: new Date(),
          },
        });
      }

      return signedContract;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          contractId: result.id,
          signatureStatus: result.signatureStatus,
          signedAt: result.signedAt?.toISOString() ?? null,
        },
        message: "Contrato assinado com sucesso!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[sign-contract] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao assinar contrato",
      },
      { status: 500 }
    );
  }
}
