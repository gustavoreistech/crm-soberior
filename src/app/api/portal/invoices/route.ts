import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

// ──────────────────────────────────────────
// Tipos de resposta
// ──────────────────────────────────────────

export interface PortalInvoice {
  id: string;
  asaasId: string;
  subscriptionId: string | null;
  planName: string | null;
  value: number;
  status: string;
  dueDate: string;
  invoiceUrl: string;
}

export type PortalInvoicesResponse = ApiResponse<PortalInvoice[]>;

// ──────────────────────────────────────────
// GET /api/portal/invoices
// ──────────────────────────────────────────

export async function GET(
  _req: NextRequest
): Promise<NextResponse<PortalInvoicesResponse>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;

    // Busca as faturas associadas à organização do utilizador
    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      include: {
        subscription: {
          select: {
            planName: true,
          },
        },
      },
      orderBy: { dueDate: "desc" },
    });

    const data: PortalInvoice[] = invoices.map((inv) => ({
      id: inv.id,
      asaasId: inv.asaasId,
      subscriptionId: inv.subscriptionId,
      planName: inv.subscription?.planName ?? "Assinatura",
      value: inv.value,
      status: inv.status,
      dueDate: inv.dueDate.toISOString(),
      invoiceUrl: inv.invoiceUrl,
    }));

    return NextResponse.json({
      success: true,
      data,
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
