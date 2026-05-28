import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { CreateLeadPayload, STATUS_MAP } from "@/types/lead";

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        organization: true,
      },
      orderBy: { id: "asc" },
    });

    const mapped = leads.map((lead) => ({
      id: lead.id,
      organizationId: lead.organizationId,
      status: STATUS_MAP[lead.status] ?? lead.status,
      score: lead.score,
      lostRevenue: lead.lostRevenue,
      organization: {
        id: lead.organization.id,
        name: lead.organization.name,
        cnpj: lead.organization.cnpj,
        domain: lead.organization.domain,
        stapeId: lead.organization.stapeId,
        isActive: lead.organization.isActive,
      },
    }));

    return NextResponse.json({ success: true, data: mapped });
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
    const body: CreateLeadPayload = await request.json();

    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: name",
        },
        { status: 400 }
      );
    }

    // Cria Organization e Lead atrelado em uma transação
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: body.name,
          cnpj: body.cnpj ?? null,
          domain: body.domain ?? null,
        },
      });

      const statusDb = body.status
        ? body.status
        : "PROSPECT";

      const lead = await tx.lead.create({
        data: {
          organizationId: organization.id,
          status: statusDb,
        },
        include: { organization: true },
      });

      return lead;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.id,
          organizationId: result.organizationId,
          status: STATUS_MAP[result.status] ?? result.status,
          score: result.score,
          lostRevenue: result.lostRevenue,
          organization: {
            id: result.organization.id,
            name: result.organization.name,
            cnpj: result.organization.cnpj,
            domain: result.organization.domain,
            stapeId: result.organization.stapeId,
            isActive: result.organization.isActive,
          },
        },
        message: "Lead criado com sucesso",
      },
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
