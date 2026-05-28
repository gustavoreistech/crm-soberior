import { NextRequest, NextResponse } from "next/server";
import { updateLeadStatus } from "@/lib/sheets/leads";
import { StatusFunil, STATUS_FUNIL_OPTIONS } from "@/types/lead";
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

    if (!STATUS_FUNIL_OPTIONS.includes(body.status as StatusFunil)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status inválido. Opções: ${STATUS_FUNIL_OPTIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updatedLead = await updateLeadStatus(id, body.status as StatusFunil);

    if (!updatedLead) {
      return NextResponse.json(
        { success: false, error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedLead,
      message: "Status atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar status do lead:", error);
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
