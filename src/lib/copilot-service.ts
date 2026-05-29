import { prisma } from "@/lib/prisma";
import type { CopilotContext } from "@/types/api";

/**
 * Busca todo o contexto de uma organização no banco de dados
 * para alimentar o System Prompt do Soberior Copilot.
 */
export async function buildCopilotContext(
  organizationId: string
): Promise<CopilotContext> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      name: true,
      cnpj: true,
      domain: true,
      email: true,
      telefone: true,
      isActive: true,
    },
  });

  if (!organization) {
    throw new Error(`Organização não encontrada: ${organizationId}`);
  }

  const [project, subscription, invoices, tickets] = await Promise.all([
    prisma.project.findFirst({
      where: { organizationId },
      orderBy: { id: "desc" },
      include: {
        milestones: {
          select: {
            title: true,
            status: true,
            order: true,
            dueDate: true,
          },
          orderBy: { order: "asc" },
        },
      },
    }),
    prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { organizationId },
      orderBy: { dueDate: "desc" },
      take: 20,
    }),
    prisma.ticket.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  ).length;
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === "OVERDUE"
  ).length;
  const totalOverdueAmount = invoices
    .filter((inv) => inv.status === "OVERDUE")
    .reduce((acc, inv) => acc + inv.value, 0);

  return {
    organization: {
      name: organization.name,
      cnpj: organization.cnpj,
      domain: organization.domain,
      email: organization.email,
      telefone: organization.telefone,
      isActive: organization.isActive,
    },
    project: project
      ? {
          status: project.status,
          uptimeStatus: project.uptimeStatus,
          milestones: project.milestones.map((m) => ({
            title: m.title,
            status: m.status,
            order: m.order,
            dueDate: m.dueDate?.toISOString() ?? null,
          })),
        }
      : null,
    subscription: subscription
      ? {
          planType: subscription.planName,
          mrrValue: subscription.value,
          status: subscription.status,
          dueDate: null,
        }
      : null,
    invoices: invoices.map((inv) => ({
      amount: inv.value,
      status: inv.status,
      dueDate: inv.dueDate.toISOString(),
      paidAt: null,
    })),
    tickets: tickets.map((tkt) => ({
      subject: tkt.subject,
      status: tkt.status,
      priority: tkt.priority,
      createdAt: tkt.createdAt.toISOString(),
      messageCount: tkt._count.messages,
    })),
    analytics: {
      totalTickets,
      openTickets,
      overdueInvoices,
      totalOverdueAmount,
    },
  };
}

/**
 * Monta o System Prompt hierárquico para o Soberior Copilot
 * com todos os dados contextuais do cliente.
 */
export function buildSystemPrompt(context: CopilotContext): string {
  return `Você é o **Soberior Copilot**, um assistente de IA especializado em análise de clientes da SOBERIOR AI & Data Analytics.

## IDENTIDADE DO ASSISTENTE
- Você é um consultor sênior de operações e sucesso do cliente.
- Você tem acesso completo aos dados do cliente no sistema CRM da SOBERIOR.
- Seu tom é profissional, direto e analítico, mas amigável.
- Responda EM PORTUGUÊS (pt-BR) o tempo todo.
- Quando relevante, sugira ações concretas baseadas nos dados.

## DADOS DA ORGANIZAÇÃO
- Nome: ${context.organization.name}
- CNPJ: ${context.organization.cnpj ?? "N/A"}
- Domínio: ${context.organization.domain ?? "N/A"}
- Email: ${context.organization.email ?? "N/A"}
- Telefone: ${context.organization.telefone ?? "N/A"}
- Status Ativo: ${context.organization.isActive ? "✅ Ativo" : "❌ Bloqueado (Kill Switch) "}

${context.project ? `## DADOS DO PROJETO
- Estágio: ${context.project.status ?? "N/A"}
- Uptime: ${context.project.uptimeStatus !== null ? `${context.project.uptimeStatus}%` : "N/A"}
${context.project.milestones.length > 0 ? `- Marcos (Milestones):
${context.project.milestones.map((m) => `  • ${m.title} — Status: ${m.status}${m.dueDate ? ` (Vencimento: ${new Date(m.dueDate).toLocaleDateString("pt-BR")})` : ""}`).join("\n")}` : "- Nenhum milestone registrado."}
` : "## PROJETO\nNenhum projeto ativo encontrado para esta organização."}

${context.subscription ? `## DADOS DA ASSINATURA
- Plano: ${context.subscription.planType ?? "N/A"}
- MRR: ${context.subscription.mrrValue !== null ? `R$ ${context.subscription.mrrValue.toLocaleString("pt-BR")}` : "N/A"}
- Status: ${context.subscription.status === "ACTIVE" ? "✅ Ativo" : context.subscription.status === "OVERDUE" ? "❌ Inadimplente" : context.subscription.status ?? "N/A"}
- Próximo Vencimento: ${context.subscription.dueDate ? new Date(context.subscription.dueDate).toLocaleDateString("pt-BR") : "N/A"}
` : "## ASSINATURA\nNenhuma assinatura ativa encontrada."}

## FATURAS (últimas ${context.invoices.length})
| # | Valor | Status | Vencimento | Pagamento |
|---|-------|--------|------------|-----------|
${context.invoices.slice(0, 10).map((inv, i) => `| ${i + 1} | R$ ${inv.amount.toLocaleString("pt-BR")} | ${inv.status === "PAID" ? "Pago" : inv.status === "OVERDUE" ? "Vencido" : inv.status === "PENDING" ? "Pendente" : inv.status} | ${new Date(inv.dueDate).toLocaleDateString("pt-BR")} | ${inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("pt-BR") : "—"}|`).join("\n")}

## TICKETS DE SUPORTE (últimos ${context.tickets.length})
| # | Assunto | Status | Prioridade | Data |
|---|---------|--------|------------|------|
${context.tickets.slice(0, 10).map((tkt, i) => `| ${i + 1} | ${tkt.subject} | ${tkt.status} | ${tkt.priority} | ${new Date(tkt.createdAt).toLocaleDateString("pt-BR")} |`).join("\n")}

## ANALYTICS DERIVADOS
- Total de Tickets: ${context.analytics.totalTickets}
- Tickets Abertos/Em Andamento: ${context.analytics.openTickets}
- Faturas Vencidas: ${context.analytics.overdueInvoices}
- Total em Atraso: R$ ${context.analytics.totalOverdueAmount.toLocaleString("pt-BR")}

## DIRETRIZES DE RESPOSTA
1. Use sempre os dados acima para embasar suas respostas.
2. Se o admin perguntar sobre algo fora do contexto fornecido, diga que você não tem essa informação.
3. Se detectar riscos (fatura vencida, ticket urgente sem resposta, kill switch), alerte o admin proativamente.
4. Sugira ações baseadas em dados: "Com base no MRR de R$ X e Y tickets abertos, recomendo..."
5. Seja conciso — prefira respostas diretas com bullets quando apropriado.
6. NUNCA invente dados. Se não sabe, diga que não sabe.`;
}
