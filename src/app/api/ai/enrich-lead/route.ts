import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeLead } from "@/lib/deepseek-api";
import type { LeadAnalysis } from "@/lib/deepseek-api";
import type { ApiResponse } from "@/types/api";

interface EnrichLeadBody {
  leadId: string;
}

/**
 * Gera um HTML simulado baseado nos dados da organização para alimentar a IA.
 * Em produção, o n8n fará o scraping real do site do lead.
 */
function simulateScrapedHtml(name: string, domain: string | null): string {
  const siteUrl = domain ?? `${name.toLowerCase().replace(/\s+/g, "")}.com.br`;
  return `<!DOCTYPE html>
<html>
<head><title>${name}</title></head>
<body>
  <header><h1>${name}</h1></header>
  <section class="hero">
    <p>Transformamos resultados com soluções digitais inovadoras.</p>
  </section>
  <section class="servicos">
    <h2>Nossos Serviços</h2>
    <ul>
      <li>Consultoria em Marketing Digital</li>
      <li>Gestão de Tráfego Pago</li>
      <li>Automação de Processos</li>
    </ul>
  </section>
  <section class="contato">
    <p>Site: ${siteUrl}</p>
  </section>
  <footer>
    <p>© ${new Date().getFullYear()} ${name}. Todos os direitos reservados.</p>
  </footer>
</body>
</html>`;
}

/**
 * POST /api/ai/enrich-lead
 *
 * Recebe um leadId, busca o Lead e Organization no Prisma,
 * simula o scraping do site da empresa com base no domínio,
 * chama a IA (DeepSeek) para extrair score e lostRevenue,
 * e persiste os dados atualizados no banco.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body: EnrichLeadBody = await request.json();

    if (!body.leadId) {
      return NextResponse.json(
        { success: false, error: "Campo obrigatório: leadId" },
        { status: 400 }
      );
    }

    // 1. Busca o Lead e a Organization vinculada
    const lead = await prisma.lead.findUnique({
      where: { id: body.leadId },
      include: { organization: true },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // 2. Simula o scraping — gera HTML básico baseado no domínio da Organization
    const simulatedHtml = simulateScrapedHtml(
      lead.organization.name,
      lead.organization.domain
    );

    console.info(
      `[enrich-lead] Simulando scraping para lead=${lead.id}, org=${lead.organization.name}`
    );

    // 3. Chama a IA para analisar o conteúdo
    const analysis: LeadAnalysis | null = await analyzeLead(simulatedHtml);

    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Falha ao analisar lead com DeepSeek. Verifique se a chave de API está configurada.",
        },
        { status: 500 }
      );
    }

    // 4. Persiste score e lostRevenue no banco
    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        score: analysis.score,
        lostRevenue: analysis.lostRevenue,
      },
      include: { organization: true },
    });

    console.info(
      `[enrich-lead] Lead atualizado: score=${analysis.score}, lostRevenue=${analysis.lostRevenue}`
    );

    // 5. Retorna os dados atualizados
    return NextResponse.json({
      success: true,
      data: {
        id: updatedLead.id,
        organizationId: updatedLead.organizationId,
        status: updatedLead.status,
        score: updatedLead.score,
        lostRevenue: updatedLead.lostRevenue,
        organization: {
          id: updatedLead.organization.id,
          name: updatedLead.organization.name,
          domain: updatedLead.organization.domain,
        },
      },
      message: "Lead enriquecido com sucesso",
    });
  } catch (error) {
    console.error("[enrich-lead] Erro ao enriquecer lead:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao enriquecer lead com IA",
      },
      { status: 500 }
    );
  }
}
