import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

/**
 * GET /api/helpdesk/tickets/[id]
 *
 * Retorna os detalhes de um ticket com todas as mensagens.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id: ticketId } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        organization: {
          select: { id: true, name: true, telefone: true },
        },
        user: {
          select: { id: true, email: true },
        },
        assignedTo: {
          select: { id: true, email: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            content: true,
            source: true,
            isFromStaff: true,
            createdAt: true,
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error("[helpdesk/tickets] Erro ao buscar ticket:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao buscar ticket",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/helpdesk/tickets/[id]
 *
 * Atualiza status, prioridade ou responsável do ticket.
 * Body: { status?: string; priority?: string; assignedToId?: string | null }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id: ticketId } = await params;

    let body: {
      status?: string;
      priority?: string;
      assignedToId?: string | null;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "JSON inválido" },
        { status: 400 }
      );
    }

    // Valida se pelo menos um campo foi enviado
    if (!body.status && !body.priority && body.assignedToId === undefined) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Envie ao menos um campo para atualizar: status, priority, assignedToId",
        },
        { status: 400 }
      );
    }

    // Se for fechar o ticket, registrar closedAt
    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.priority) updateData.priority = body.priority;
    if (body.assignedToId !== undefined) {
      updateData.assignedToId = body.assignedToId;
    }
    if (body.status === "CLOSED" || body.status === "RESOLVED") {
      updateData.closedAt = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        updatedAt: ticket.updatedAt.toISOString(),
      },
      message: "Ticket atualizado",
    });
  } catch (error) {
    console.error("[helpdesk/tickets] Erro ao atualizar ticket:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao atualizar ticket",
      },
      { status: 500 }
    );
  }
}
