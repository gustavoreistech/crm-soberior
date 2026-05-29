import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { createCustomer, createSubscription, findCustomerByCpfCnpj } from "@/lib/asaas-api";
import { ApiResponse } from "@/types/api";

// ──────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────

interface CreateSubscriptionBody {
  organizationId: string;
  planName: string;
  value: number;
  /** Dia de vencimento (1-31). Opcional. */
  dueDay?: number;
}

// ──────────────────────────────────────────
// POST /api/finance/subscriptions
// ──────────────────────────────────────────

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body: CreateSubscriptionBody = await request.json();

    if (!body.organizationId || !body.planName || !body.value) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: organizationId, planName, value",
        },
        { status: 400 }
      );
    }

    if (body.value <= 0) {
      return NextResponse.json(
        { success: false, error: "O valor deve ser maior que zero" },
        { status: 400 }
      );
    }

    // 1. Busca a organização
    const organization = await prisma.organization.findUnique({
      where: { id: body.organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organização não encontrada" },
        { status: 404 }
      );
    }

    // 2. Verifica se já existe subscription ativa
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        organizationId: body.organizationId,
        status: "ACTIVE",
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta organização já possui uma assinatura ativa",
        },
        { status: 409 }
      );
    }

    // 3. Cria ou reutiliza cliente no Asaas
    let asaasCustomerId: string | null = null;

    if (organization.cnpj) {
      asaasCustomerId = await findCustomerByCpfCnpj(organization.cnpj);
    }

    if (!asaasCustomerId) {
      asaasCustomerId = await createCustomer({
        name: organization.name,
        cpfCnpj: organization.cnpj ?? `${organization.id}@temp`,
        email: organization.email ?? undefined,
        phone: organization.telefone ?? undefined,
      });
    }

    // 4. Cria a assinatura no Asaas
    const asaasSubscription = await createSubscription({
      customerId: asaasCustomerId,
      value: body.value,
      planName: body.planName,
      dueDay: body.dueDay,
    });

    // 5. Persiste a Subscription no banco
    const subscription = await prisma.subscription.create({
      data: {
        organizationId: body.organizationId,
        asaasId: asaasSubscription.id,
        planName: body.planName,
        value: body.value,
        status: "ACTIVE",
      },
    });

    // 6. Cria a primeira Invoice (fatura atual)
    const dueDate = new Date(asaasSubscription.nextDueDate);
    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        organizationId: body.organizationId,
        asaasId: asaasSubscription.id,
        dueDate,
        value: body.value,
        status: "PENDING",
        invoiceUrl: `https://www.asaas.com/payment/${asaasSubscription.id}`,
      },
    });

    console.info(
      `[finance/subscriptions] Subscription criada: id=${subscription.id}, org=${body.organizationId}, asaasId=${asaasSubscription.id}`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: subscription.id,
          asaasId: subscription.asaasId,
          planName: subscription.planName,
          value: subscription.value,
          status: subscription.status,
        },
        message: "Assinatura criada com sucesso no Asaas",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[finance/subscriptions] Erro ao criar subscription:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao criar assinatura",
      },
      { status: 500 }
    );
  }
}
