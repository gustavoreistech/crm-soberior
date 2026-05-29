import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

export interface MilestoneWithTasks {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  order: number;
  dueDate: string | null;
  completedAt: string | null;
  tasks: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
  }>;
}

export interface ProjectDetailData {
  id: string;
  organizationId: string;
  organizationName: string;
  status: string;
  uptimeStatus: number;
  startDate: string | null;
  endDate: string | null;
  milestones: MilestoneWithTasks[];
}

export type ProjectDetailResponse = ApiResponse<ProjectDetailData>;

/**
 * GET /api/projects/[id]
 *
 * Retorna detalhes completos de um projeto, incluindo milestones e tasks,
 * para alimentar o modal de detalhes do projeto.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json<ProjectDetailResponse>(
        { success: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        organization: {
          select: { name: true },
        },
        milestones: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                isCompleted: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json<ProjectDetailResponse>(
        { success: false, error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    const data: ProjectDetailData = {
      id: project.id,
      organizationId: project.organizationId,
      organizationName: project.organization.name,
      status: project.status,
      uptimeStatus: project.uptimeStatus,
      startDate: project.startDate?.toISOString() ?? null,
      endDate: project.endDate?.toISOString() ?? null,
      milestones: project.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        status: m.status as MilestoneWithTasks["status"],
        order: m.order,
        dueDate: m.dueDate?.toISOString() ?? null,
        completedAt: m.completedAt?.toISOString() ?? null,
        tasks: m.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          isCompleted: t.isCompleted,
        })),
      })),
    };

    return NextResponse.json<ProjectDetailResponse>(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PROJECTS_DETAIL_GET]", error);
    return NextResponse.json<ProjectDetailResponse>(
      { success: false, error: "Erro interno ao buscar projeto." },
      { status: 500 }
    );
  }
}
