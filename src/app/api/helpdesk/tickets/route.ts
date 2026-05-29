import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

/**
 * GET /api/helpdesk/tickets
 *
 * Lista todos os tickets (admin).
 * Suporta filtros via query params: status, source, organizationId
 * Suporta paginação: page (default 1), limit (default 20)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const organizationId = searchParams.get("organizationId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    // Monta os filtros
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (organizationId) where.organizationId = organizationId;

    // Busca tickets com contagem total
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          organization: {
            select: { id: true, name: true },
          },
          user: {
            select: { id: true, email: true },
          },
          assignedTo: {
            select: { id: true, email: true },
          },
          _count: {
            select: { messages: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, createdAt: true, isFromStaff: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    const data = tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      source: ticket.source,
      organization: ticket.organization,
      user: ticket.user,
      assignedTo: ticket.assignedTo,
      closedAt: ticket.closedAt?.toISOString() ?? null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messageCount: ticket._count.messages,
      lastMessage: ticket.messages[0] ?? null,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[helpdesk/tickets] Erro ao listar tickets:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao carregar tickets",
      },
      { status: 500 }
    );
  }
}
