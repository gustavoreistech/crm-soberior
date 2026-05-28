import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  StatusFunil,
  STATUS_FUNIL_OPTIONS,
  STATUS_REVERSE_MAP,
  STATUS_MAP,
} from "@/types/lead";
import { ApiResponse } from "@/types/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    const body: { status: string } = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { success: false, error: "Status é obrigatório" },
        { status: 400 }
      );
    }

    // Aceita tanto o valor em português (ex: "Prospecção") quanto em inglês (ex: "PROSPECT")
    const statusPtBr = body.status as StatusFunil;
    const statusDb = STATUS_FUNIL_OPTIONS.includes(statusPtBr)
      ? STATUS_REVERSE_MAP[statusPtBr]
      : body.status;

    if (!statusDb) {
      return NextResponse.json(
        {
          success: false,
          error: `Status inválido. Opções: ${STATUS_FUNIL_OPTIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status: statusDb },
      include: { organization: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedLead.id,
        organizationId: updatedLead.organizationId,
        status: STATUS_MAP[updatedLead.status] ?? updatedLead.status,
        score: updatedLead.score,
        lostRevenue: updatedLead.lostRevenue,
        organization: {
          id: updatedLead.organization.id,
          name: updatedLead.organization.name,
          cnpj: updatedLead.organization.cnpj,
          domain: updatedLead.organization.domain,
          stapeId: updatedLead.organization.stapeId,
          isActive: updatedLead.organization.isActive,
        },
      },
      message: "Status atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar status do lead:", error);

    // Se o lead não foi encontrado, Prisma lança P2025
    if (error instanceof Error && error.message.includes("P2025")) {
      return NextResponse.json(
        { success: false, error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao atualizar status",
      },
      { status: 500 }
    );
  }
}
