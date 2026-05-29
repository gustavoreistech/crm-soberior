import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

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

    // Busca projetos da organização para expor documentos
    const projects = await prisma.project.findMany({
      where: { organizationId },
      orderBy: { id: "desc" },
    });

    // Enquanto não existe modelo Document, retorna uma lista vazia
    // (futuramente pode ser populada por um evento n8n ou webhook)
    const documents = projects.flatMap((project) => {
      // Placeholder: quando o modelo Document for criado, buscar daqui
      return [];
    });

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("[portal/documents] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno",
      },
      { status: 500 }
    );
  }
}
