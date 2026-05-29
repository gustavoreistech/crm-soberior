import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

// ──────────────────────────────────────────
// Data Structure returned
// ──────────────────────────────────────────

export interface ProjectListItem {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationDomain: string | null;
  organizationCnpj: string | null;
  status: string;
  uptimeStatus: number;
  milestoneCount: number;
  completedMilestones: number;
  subscription: {
    planName: string | null;
    value: number | null;
    status: string | null;
  } | null;
  createdAt: string;
}

export type ProjectsResponse = ApiResponse<ProjectListItem[]>;

// ──────────────────────────────────────────
// GET /api/projects
// ──────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json<ProjectsResponse>(
        { success: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const projects = await prisma.project.findMany({
      include: {
        organization: {
          select: {
            name: true,
            domain: true,
            cnpj: true,
            subscriptions: {
              select: {
                planName: true,
                value: true,
                status: true,
              },
              take: 1,
            },
          },
        },
        milestones: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const data: ProjectListItem[] = projects.map((p) => {
      const sub = p.organization.subscriptions[0];
      return {
        id: p.id,
        organizationId: p.organizationId,
        organizationName: p.organization.name,
        organizationDomain: p.organization.domain,
        organizationCnpj: p.organization.cnpj,
        status: p.status,
        uptimeStatus: p.uptimeStatus,
        milestoneCount: p.milestones.length,
        completedMilestones: p.milestones.filter((m) => m.status === "COMPLETED").length,
        subscription: sub
          ? {
              planName: sub.planName,
              value: sub.value,
              status: sub.status,
            }
          : null,
        createdAt: new Date().toISOString(),
      };
    });

    return NextResponse.json<ProjectsResponse>(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return NextResponse.json<ProjectsResponse>(
      { success: false, error: "Erro interno ao listar projetos." },
      { status: 500 }
    );
  }
}
