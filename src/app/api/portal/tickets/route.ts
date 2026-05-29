import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

/**
 * GET /api/portal/tickets
 *
 * Lista os tickets da organização do cliente logado.
 * Retorna cada ticket com contagem de mensagens e última mensagem.
 */
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

    const tickets = await prisma.ticket.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, isFromStaff: true },
        },
      },
    });

    const data = tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      source: ticket.source,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messageCount: ticket._count.messages,
      lastMessage: ticket.messages[0] ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[portal/tickets] Erro ao listar tickets:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao carregar tickets",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/tickets
 *
 * Cria um novo ticket para a organização do cliente logado.
 * Body: { subject: string; description?: string }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    let body: { subject?: string; description?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "JSON inválido" },
        { status: 400 }
      );
    }

    if (!body.subject || body.subject.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "O campo subject é obrigatório" },
        { status: 400 }
      );
    }

    // Cria o ticket e a primeira mensagem em uma transação
    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          organizationId,
          userId,
          subject: body.subject!.trim(),
          description: body.description?.trim() ?? null,
          source: "PORTAL",
          status: "OPEN",
          priority: "MEDIUM",
        },
      });

      // Se houver descrição, cria a primeira mensagem automaticamente
      if (body.description?.trim()) {
        await tx.message.create({
          data: {
            ticketId: created.id,
            userId,
            content: body.description.trim(),
            source: "PORTAL",
            isFromStaff: false,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          createdAt: ticket.createdAt.toISOString(),
        },
        message: "Ticket criado com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[portal/tickets] Erro ao criar ticket:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar ticket",
      },
      { status: 500 }
    );
  }
}
