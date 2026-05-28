import { NextRequest, NextResponse } from "next/server";
import { getLeadById, updateLeadStatus } from "@/lib/sheets/leads";
import { ApiResponse, AsaasWebhookPayload } from "@/types/api";
import { StatusFunil } from "@/types/lead";
import { getAsaasApiKey } from "@/lib/config-manager";

/**
 * Valida se o IP de origem é do Asaas.
 * Nota: O Asaas usa ranges de IP específicos que podem ser configurados.
 */
function isTrustedAsaasIp(ip: string | null): boolean {
  if (!ip) return false;
  // Implementar validação de IP do Asaas se necessário
  // Por enquanto, confia no header de API Key
  return true;
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

    // Valida API Key do Asaas se configurada
    const asaasApiKey = await getAsaasApiKey();
    const requestApiKey = request.headers.get("asaas-api-key");

    if (asaasApiKey && requestApiKey !== asaasApiKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let newStatus: StatusFunil | null = null;

    switch (body.event) {
      case "PAYMENT_RECEIVED":
        newStatus = "Onboarding";
        break;
      case "PAYMENT_OVERDUE":
        newStatus = "Inadimplente";
        break;
    }

    if (!newStatus) {
      return NextResponse.json({
        success: true,
        message: `Evento ${body.event} ignorado`,
      });
    }

    // Nota: Idealmente, o Asaas enviaria o leadId ou customer reference.
    // Como o Asaas usa o próprio ID, você precisa de um mapeamento.
    // Por enquanto, esse webhook serve como trigger para buscar o lead correto.
    // O customer do Asaas deve ter um field "externalReference" com o leadId.

    return NextResponse.json({
      success: true,
      message: `Webhook Asaas processado: ${body.event}`,
      data: {
        event: body.event,
        newStatus,
      },
    });
  } catch (error) {
    console.error("Erro no webhook Asaas:", error);
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
