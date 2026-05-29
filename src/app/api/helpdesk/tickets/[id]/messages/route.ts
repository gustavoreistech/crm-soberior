import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/evolution-api";
import { ApiResponse } from "@/types/api";

/**
 * POST /api/helpdesk/tickets/[id]/messages
 *
 * Admin responde a um ticket.
 * - Cria a mensagem com isFromStaff=true
 * - Se o ticket source = WHATSAPP, envia também via Evolution API
 * - Atualiza status para WAITING_CUSTOMER
 * - Em caso de falha na Evolution API, a mensagem é salva mesmo assim
 *
 * Body: { content: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id: ticketId } = await params;

    let body: { content?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "JSON inválido" },
        { status: 400 }
      );
    }

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "O campo content é obrigatório" },
        { status: 400 }
      );
    }

    const content = body.content.trim();

    // ──────────────────────────────────────────
    // Busca o ticket com dados da organização
    // ──────────────────────────────────────────
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        organization: {
          select: { id: true, telefone: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket não encontrado" },
        { status: 404 }
      );
    }

    // ──────────────────────────────────────────
    // Cria a mensagem e atualiza o ticket
    // ──────────────────────────────────────────
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          ticketId,
          userId: session.user!.id,
          content,
          source: ticket.source, // mantém a origem original do ticket
          isFromStaff: true,
        },
      });

      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: "WAITING_CUSTOMER",
          updatedAt: new Date(),
        },
      });

      return msg;
    });

    // ──────────────────────────────────────────
    // Se for WhatsApp, envia via Evolution API
    // ──────────────────────────────────────────
    let whatsappError: string | null = null;

    if (
      ticket.source === "WHATSAPP" &&
      ticket.organization.telefone
    ) {
      try {
        const result = await sendWhatsAppMessage(
          ticket.organization.telefone,
          content
        );

        if (!result.success) {
          whatsappError = result.error ?? "Erro desconhecido ao enviar WhatsApp";
          console.error(
            "[helpdesk/messages] Falha ao enviar WhatsApp:",
            whatsappError
          );
        }
      } catch (err) {
        whatsappError =
          err instanceof Error
            ? err.message
            : "Erro ao comunicar com Evolution API";
        console.error(
          "[helpdesk/messages] Exceção ao enviar WhatsApp:",
          whatsappError
        );
      }
    }

    // Mensagem foi salva independente do resultado do WhatsApp
    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          source: ticket.source,
          isFromStaff: true,
          whatsappError, // null se OK, string se falhou
        },
        message: whatsappError
          ? "Mensagem salva, mas falha ao enviar WhatsApp"
          : "Mensagem enviada com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[helpdesk/messages] Erro ao responder ticket:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao enviar resposta",
      },
      { status: 500 }
    );
  }
}
