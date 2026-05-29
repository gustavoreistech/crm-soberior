import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

/**
 * Valida se o ticket pertence à organização do usuário logado.
 */
async function validateTicketAccess(
  ticketId: string,
  organizationId: string
): Promise<{ ticket?: any; error?: NextResponse<ApiResponse> }> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, organizationId: true, status: true },
  });

  if (!ticket) {
    return {
      error: NextResponse.json(
        { success: false, error: "Ticket não encontrado" },
        { status: 404 }
      ),
    };
  }

  if (ticket.organizationId !== organizationId) {
    return {
      error: NextResponse.json(
        { success: false, error: "Acesso negado a este ticket" },
        { status: 403 }
      ),
    };
  }

  return { ticket };
}

/**
 * GET /api/portal/tickets/[id]/messages
 *
 * Retorna todas as mensagens de um ticket, ordenadas por data de criação.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id: ticketId } = await params;
    const { error } = await validateTicketAccess(
      ticketId,
      session.user.organizationId
    );

    if (error) return error;

    const messages = await prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        source: true,
        isFromStaff: true,
        createdAt: true,
        user: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("[portal/tickets/messages] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao carregar mensagens",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/tickets/[id]/messages
 *
 * Envia uma nova mensagem do cliente no ticket.
 * Body: { content: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id: ticketId } = await params;
    const { error } = await validateTicketAccess(
      ticketId,
      session.user.organizationId
    );

    if (error) return error;

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

    // Cria a mensagem e atualiza o status do ticket para WAITING_CUSTOMER
    // (cliente respondeu, aguardando staff)
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          ticketId,
          userId: session.user!.id,
          content: body.content!.trim(),
          source: "PORTAL",
          isFromStaff: false,
        },
      });

      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: "WAITING_CUSTOMER" },
      });

      return msg;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        },
        message: "Mensagem enviada",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[portal/tickets/messages] Erro ao enviar mensagem:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao enviar mensagem",
      },
      { status: 500 }
    );
  }
}
