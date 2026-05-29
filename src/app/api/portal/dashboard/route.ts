import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;

    const [project, subscription] = await Promise.all([
      prisma.project.findFirst({
        where: { organizationId },
        orderBy: { id: "desc" },
      }),
      prisma.subscription.findFirst({
        where: { organizationId },
        orderBy: { dueDate: "desc" },
      }),
    ]);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        organizationName: organization?.name ?? "—",
        projectStage: project?.stage ?? null,
        uptimeStatus: project?.uptimeStatus ?? null,
        subscriptionPlan: subscription?.planType ?? null,
        subscriptionStatus: subscription?.status ?? null,
        mrrValue: subscription?.mrrValue ?? null,
        dueDate: subscription?.dueDate?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[portal/dashboard] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno",
      },
      { status: 500 }
    );
  }
}
