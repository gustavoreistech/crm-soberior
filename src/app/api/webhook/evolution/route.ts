import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolution-api";
import {
  EvolutionWebhookPayload,
  extractPhoneFromJid,
} from "@/types/evolution";
import { ApiResponse } from "@/types/api";

/**
 * Chave de API esperada no header `x-api-key` das requisições
 * enviadas pela instância Evolution `waba.soberior.com`.
 */
const EXPECTED_API_KEY = "PlanetaCadeiraVento2026";

/**
 * Header HTTP que a Evolution API envia com a chave de autenticação.
 */
const API_KEY_HEADER = "x-api-key";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    // ──────────────────────────────────────────
    // 1. Validação da API Key
    // ──────────────────────────────────────────
    const apiKey = request.headers.get(API_KEY_HEADER);

    if (!apiKey || apiKey !== EXPECTED_API_KEY) {
      console.warn(
        "[webhook/evolution] API Key inválida ou ausente. IP:",
        request.headers.get("x-forwarded-for") ?? "desconhecido"
      );
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ──────────────────────────────────────────
    // 2. Leitura do payload
    // ──────────────────────────────────────────
    let body: EvolutionWebhookPayload;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Payload JSON inválido" },
        { status: 400 }
      );
    }

    // ──────────────────────────────────────────
    // 3. Validações básicas do payload
    // ──────────────────────────────────────────
    if (!body.data?.key?.remoteJid) {
      // Payload sem remoteJid não é uma mensagem de chat — ignorar silenciosamente
      return NextResponse.json({
        success: true,
        message: "Payload ignorado: sem remoteJid",
      });
    }

    // Ignorar mensagens enviadas pelo próprio sistema (fromMe=true)
    if (body.data.key.fromMe) {
      return NextResponse.json({
        success: true,
        message: "Mensagem própria ignorada (fromMe=true)",
      });
    }

    // ──────────────────────────────────────────
    // 4. Extrair telefone do remoteJid
    // ──────────────────────────────────────────
    const phone = extractPhoneFromJid(body.data.key.remoteJid);
    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Não foi possível extrair o telefone do remoteJid" },
        { status: 400 }
      );
    }

    // ──────────────────────────────────────────
    // 5. Extrair conteúdo da mensagem
    // ──────────────────────────────────────────
    const messageContent =
      body.data.message?.conversation ??
      body.data.message?.extendedTextMessage?.text ??
      null;

    if (!messageContent) {
      // Mensagem sem texto (ex: imagem, áudio) — ignorar por enquanto
      return NextResponse.json({
        success: true,
        message: "Mensagem não textual ignorada",
      });
    }

    // ──────────────────────────────────────────
    // 6. Buscar Organization pelo telefone
    // ──────────────────────────────────────────
    const organization = await prisma.organization.findFirst({
      where: {
        telefone: { contains: phone },
        isActive: true,
      },
    });

    if (!organization) {
      console.warn(
        `[webhook/evolution] Nenhuma organização encontrada para o telefone ${phone}`
      );
      return NextResponse.json({
        success: true,
        message: `Nenhuma organização ativa encontrada para o telefone ${phone}`,
      });
    }

    // ──────────────────────────────────────────
    // 7. Buscar ou criar Ticket aberto
    // ──────────────────────────────────────────
    // Tenta encontrar um ticket aberto (OPEN ou WAITING_CUSTOMER)
    let ticket = await prisma.ticket.findFirst({
      where: {
        organizationId: organization.id,
        source: "WHATSAPP",
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] },
      },
      orderBy: { createdAt: "desc" },
    });

    // Se não existir ticket aberto, criar um novo
    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          organizationId: organization.id,
          subject: `WhatsApp - ${body.data.pushName || phone}`,
          description: `Primeira mensagem recebida via WhatsApp de ${body.data.pushName || phone}`,
          source: "WHATSAPP",
          status: "OPEN",
          priority: "MEDIUM",
        },
      });

      console.log(
        `[webhook/evolution] Novo ticket criado: ${ticket.id} para org ${organization.id}`
      );
    }

    // ──────────────────────────────────────────
    // 8. Inserir a mensagem recebida
    // ──────────────────────────────────────────
    await prisma.message.create({
      data: {
        ticketId: ticket.id,
        content: messageContent,
        source: "WHATSAPP",
        isFromStaff: false,
      },
    });

    console.log(
      `[webhook/evolution] Mensagem registrada no ticket ${ticket.id}: "${messageContent.substring(0, 80)}"`
    );

    return NextResponse.json({
      success: true,
      message: "Mensagem processada com sucesso",
      data: {
        ticketId: ticket.id,
        organizationId: organization.id,
      },
    });
  } catch (error) {
    console.error("[webhook/evolution] Erro interno:", error);
    // Sempre retornar 200 para evitar que a Evolution API reenvie o webhook
    return NextResponse.json({
      success: false,
      error:
        error instanceof Error ? error.message : "Erro interno ao processar webhook",
    });
  }
}

/**
 * Responde método GET com 405 Method Not Allowed.
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}
