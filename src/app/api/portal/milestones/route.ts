import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";
import { MilestoneData } from "@/types/portal";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<MilestoneData[]>>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;

    // Busca o projeto ativo da organização
    const project = await prisma.project.findFirst({
      where: { organizationId },
      orderBy: { id: "desc" },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "Nenhum projeto encontrado",
      });
    }

    // Busca todos os milestones do projeto
    const milestones = await prisma.milestone.findMany({
      where: { projectId: project.id },
      orderBy: [
        { order: "asc" },
        { dueDate: { sort: "asc", nulls: "last" } },
      ],
    });

    const data: MilestoneData[] = milestones.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      status: m.status as MilestoneData["status"],
      order: m.order,
      dueDate: m.dueDate?.toISOString() ?? null,
      completedAt: m.completedAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[portal/milestones] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno",
      },
      { status: 500 }
    );
  }
}
