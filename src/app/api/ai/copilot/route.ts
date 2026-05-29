import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { copilotChat } from "@/lib/deepseek-api";
import { buildCopilotContext, buildSystemPrompt } from "@/lib/copilot-service";
import type { ApiResponse, CopilotRequest } from "@/types/api";

/**
 * POST /api/ai/copilot
 *
 * Recebe um organizationId + mensagem do admin, monta o contexto completo
 * do cliente no banco e envia como System Prompt para a DeepSeek API
 * em modo streaming (SSE).
 *
 * Body: { organizationId: string, message: string, contextType: "LEAD" | "PROJECT" }
 * Response: text/event-stream (SSE)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse | ReadableStream>> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body: CopilotRequest = await request.json();

    if (!body.organizationId || !body.message) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: organizationId, message",
        },
        { status: 400 }
      );
    }

    console.info(
      `[copilot] Iniciando chat para org=${body.organizationId}, contextType=${body.contextType}`
    );

    // 1. Monta o contexto completo do cliente
    const context = await buildCopilotContext(body.organizationId);

    // 2. Gera o System Prompt
    const systemPrompt = buildSystemPrompt(context);

    // 3. Chama DeepSeek em streaming
    const deepseekStream = await copilotChat({
      systemPrompt,
      message: body.message,
      signal: request.signal,
    });

    // 4. Retorna o stream diretamente (SSE)
    return new NextResponse(deepseekStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[copilot] Erro:", error);

    // Se for um abort (cliente cancelou), não é erro
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Requisição cancelada" },
        { status: 499 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao processar mensagem do Copilot",
      },
      { status: 500 }
    );
  }
}
