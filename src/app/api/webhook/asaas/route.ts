import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse, AsaasWebhookPayload } from "@/types/api";

/**
 * Calcula a diferença em dias úteis entre duas datas.
 * Considera apenas dias de semana (segunda a sexta) como úteis.
 */
function businessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);

  while (current < end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body: AsaasWebhookPayload = await request.json();

    if (!body.event || !body.payment) {
      return NextResponse.json(
        { success: false, error: "Payload inválido do Asaas" },
        { status: 400 }
      );
    }

    // ──────────────────────────────────────────────
    // Kill Switch: processa apenas PAYMENT_OVERDUE
    // ──────────────────────────────────────────────
    if (body.event !== "PAYMENT_OVERDUE") {
      return NextResponse.json({
        success: true,
        message: `Evento ${body.event} ignorado pelo Kill Switch`,
      });
    }

    // Busca a Subscription pelo asaasId
    // O asaasId pode vir no payload como:
    //   - payment.customer (ID do cliente no Asaas)
    //   - payment.metadata (chave definida na integração)
    //   - subscription.id (ID da assinatura no Asaas)
    const asaasId =
      body.payment.customer ??
      body.payment.metadata?.asaasSubscriptionId ??
      body.subscription?.id;

    if (!asaasId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "asaasId não encontrado no payload — nenhum dos campos " +
            "(payment.customer, payment.metadata.asaasSubscriptionId, subscription.id) está presente",
        },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { asaasId },
      include: { organization: true },
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        message: `Nenhuma Subscription encontrada para asaasId "${asaasId}"`,
      });
    }

    // ──────────────────────────────────────────────
    // Verifica se já passaram mais de 5 dias úteis
    // desde a data de vencimento
    // ──────────────────────────────────────────────
    const today = new Date();
    const dueDate = new Date(body.payment.dueDate);
    const businessDaysOverdue = businessDaysBetween(dueDate, today);

    if (businessDaysOverdue <= 5) {
      return NextResponse.json({
        success: true,
        message: `Apenas ${businessDaysOverdue} dias úteis de atraso. Limiar de 5 não atingido.`,
        data: { businessDaysOverdue, threshold: 5 },
      });
    }

    // ──────────────────────────────────────────────
    // KILL SWITCH — aciona o bloqueio
    // ──────────────────────────────────────────────

    // 1. Desativa a Organization
    await prisma.organization.update({
      where: { id: subscription.organizationId },
      data: { isActive: false },
    });

    // 2. Atualiza a Subscription para OVERDUE
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "OVERDUE" },
    });

    // 3. Dispara POST para o webhook do n8n com o stapeId
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_KILLSWITCH;
    const stapeId = subscription.organization.stapeId;

    if (n8nWebhookUrl && stapeId) {
      // Fire-and-forget: não bloqueia o retorno do webhook
      fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stapeId,
          organizationId: subscription.organizationId,
          event: "KILL_SWITCH_TRIGGERED",
          reason: `Pagamento vencido há ${businessDaysOverdue} dias úteis`,
          subscriptionId: subscription.id,
        }),
      }).catch((err) =>
        console.error("Erro ao notificar n8n Kill Switch:", err)
      );
    }

    return NextResponse.json({
      success: true,
      message: `Kill Switch acionado para organização ${subscription.organizationId}`,
      data: {
        event: body.event,
        organizationId: subscription.organizationId,
        businessDaysOverdue,
        stapeId,
      },
    });
  } catch (error) {
    console.error("Erro no webhook Asaas (Kill Switch):", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao processar webhook",
      },
      { status: 500 }
    );
  }
}
