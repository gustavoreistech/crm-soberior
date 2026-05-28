import { NextRequest, NextResponse } from "next/server";
import { getAllLeads, createLead, ensureLeadsSheetExists } from "@/lib/sheets/leads";
import { LeadInput } from "@/types/lead";
import { ApiResponse } from "@/types/api";

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    await ensureLeadsSheetExists();
    const leads = await getAllLeads();

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error("Erro ao listar leads:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao listar leads",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    await ensureLeadsSheetExists();
    const body: LeadInput = await request.json();

    if (!body.Nome || !body.Empresa || !body.Telefone) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: Nome, Empresa, Telefone",
        },
        { status: 400 }
      );
    }

    const lead = await createLead(body);

    return NextResponse.json(
      { success: true, data: lead, message: "Lead criado com sucesso" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar lead:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao criar lead",
      },
      { status: 500 }
    );
  }
}
