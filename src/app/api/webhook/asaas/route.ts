import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getN8nKillswitchWebhookUrl,
} from "@/lib/config-manager";
import { ApiResponse, AsaasWebhookPayload } from "@/types/api";
import { InvoiceStatus, SubscriptionStatus } from "@/generated/prisma/enums";

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

/**
 * Dispara um webhook para o n8n informando sobre o status de pagamento.
 * Usado tanto para Kill Switch (inadimplência) quanto para reativação.
 */
async function notifyN8n(
  event: "KILL_SWITCH_TRIGGERED" | "SERVICE_REACTIVATED",
  organizationId: string,
  domain: string | null,
  payload: {
    invoiceId: string;
    subscriptionId: string;
    value: number;
    dueDate: string;
  }
): Promise<void> {
  const killswitchUrl = await getN8nKillswitchWebhookUrl();
  const webhookUrl =
    killswitchUrl ?? process.env.N8N_KILLSWITCH_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      "[asaas-webhook] N8N_KILLSWITCH_WEBHOOK_URL não configurada — skipping n8n notification"
    );
    return;
  }

  // Fire-and-forget: não bloqueia o retorno do webhook
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      organizationId,
      domain,
      ...payload,
      timestamp: new Date().toISOString(),
    }),
  }).catch((err) =>
    console.error("[asaas-webhook] Erro ao notificar n8n:", err)
  );
}

// ──────────────────────────────────────────
// POST /api/webhook/asaas
// ──────────────────────────────────────────

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

    const { event, payment } = body;

    // ──────────────────────────────────────────
    // 1. Localiza a Invoice pelo asaasId (payment.id)
    // ──────────────────────────────────────────
    const invoice = await prisma.invoice.findUnique({
      where: { asaasId: payment.id },
      include: {
        subscription: {
          include: { organization: true },
        },
        organization: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({
        success: true,
        message: `Nenhuma Invoice encontrada para asaasId "${payment.id}" — evento ignorado`,
      });
    }

    const organization = invoice.organization;
    const subscription = invoice.subscription;

    // ──────────────────────────────────────────
    // 2. Processa conforme o evento
    // ──────────────────────────────────────────

    if (event === "PAYMENT_RECEIVED") {
      // ─── Pagamento recebido ───
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.PAID },
      });

      // Reativa a subscription se estava PAST_DUE
      if (subscription && subscription.status === SubscriptionStatus.PAST_DUE) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.ACTIVE },
        });
      }

      // Reativa a organização se estava inativa
      if (!organization.isActive) {
        await prisma.organization.update({
          where: { id: organization.id },
          data: { isActive: true },
        });
      }

      // Notifica o n8n para reativar os serviços (Stape)
      await notifyN8n(
        "SERVICE_REACTIVATED",
        organization.id,
        organization.domain,
        {
          invoiceId: invoice.id,
          subscriptionId: subscription?.id ?? "N/A",
          value: invoice.value,
          dueDate: invoice.dueDate.toISOString(),
        }
      );

      console.info(
        `[asaas-webhook] PAYMENT_RECEIVED — Invoice=${invoice.id} marcada como PAIDA, organização=${organization.id} reativada`
      );

      return NextResponse.json({
        success: true,
        message: `Pagamento recebido — fatura ${invoice.id} atualizada para PAID`,
        data: {
          event,
          organizationId: organization.id,
          invoiceId: invoice.id,
          action: "REACTIVATED",
        },
      });
    }

    if (event === "PAYMENT_OVERDUE") {
      // ─── Pagamento vencido ───
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.OVERDUE },
      });

      // Atualiza a subscription para PAST_DUE
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.PAST_DUE },
        });
      }

      // Desativa a organização (Kill Switch)
      await prisma.organization.update({
        where: { id: organization.id },
        data: { isActive: false },
      });

      // Notifica o n8n para pausar os contentores (Stape)
      await notifyN8n(
        "KILL_SWITCH_TRIGGERED",
        organization.id,
        organization.domain,
        {
          invoiceId: invoice.id,
          subscriptionId: subscription?.id ?? "N/A",
          value: invoice.value,
          dueDate: invoice.dueDate.toISOString(),
        }
      );

      console.info(
        `[asaas-webhook] PAYMENT_OVERDUE — Invoice=${invoice.id} marcada como OVERDUE, Kill Switch acionado para organização=${organization.id}`
      );

      return NextResponse.json({
        success: true,
        message: `Kill Switch acionado para organização ${organization.id}`,
        data: {
          event,
          organizationId: organization.id,
          invoiceId: invoice.id,
          action: "KILL_SWITCH_TRIGGERED",
        },
      });
    }

    // Evento desconhecido — ignorar
    return NextResponse.json({
      success: true,
      message: `Evento ${event} ignorado — nenhuma ação necessária`,
    });
  } catch (error) {
    console.error("[asaas-webhook] Erro ao processar webhook:", error);
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
