import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

/**
 * PATCH /api/projects/[id]/tasks/[taskId]
 *
 * Alterna o status de uma task (isCompleted).
 * Usado pelo admin para override manual de tasks quando
 * a automação do n8n precisar de intervenção humana.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Não autorizado." },
        { status: 401 }
      );
    }

    const { id: projectId, taskId } = await params;

    // Verifica se a task pertence ao projeto
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      include: {
        milestone: {
          select: { id: true, projectId: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Task não encontrada neste projeto." },
        { status: 404 }
      );
    }

    // Alterna isCompleted
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { isCompleted: !task.isCompleted },
    });

    console.info(
      `[tasks] Task ${taskId} ("${task.title}") agora isCompleted=${updated.isCompleted} (admin override)`
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        isCompleted: updated.isCompleted,
      },
      message: updated.isCompleted
        ? "Tarefa marcada como concluída."
        : "Tarefa reaberta.",
    });
  } catch (error) {
    console.error("[tasks] Erro ao atualizar task:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao atualizar task.",
      },
      { status: 500 }
    );
  }
}
