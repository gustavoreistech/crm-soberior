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

    const subscriptions = await prisma.subscription.findMany({
      where: { organizationId },
      orderBy: { dueDate: "desc" },
    });

    const invoices = subscriptions.map((sub) => ({
      id: sub.id,
      asaasId: sub.asaasId,
      planType: sub.planType,
      mrrValue: sub.mrrValue,
      status: sub.status,
      dueDate: sub.dueDate.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error("[portal/invoices] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno",
      },
      { status: 500 }
    );
  }
}
