import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";
import type { SRECommandCenterData, SREAlert } from "@/types/sre";

/**
 * Calcula a diferença em dias úteis entre duas datas.
 * Considera apenas dias de semana (segunda a sexta) como úteis.
 */
function businessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);

  while (current < end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * GET /api/sre/command-center
 *
 * Retorna dados consolidados para o Centro de Comando SRE:
 * - Total de organizações ativas/bloqueadas
 * - MRR total e em risco
 * - Alertas de "Kill Switch Eminente" e "Queda de Subdomínio"
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const today = new Date();

    // Busca todas as organizações com projetos, subscriptions e invoices
    const organizations = await prisma.organization.findMany({
      include: {
        projects: {
          orderBy: { id: "desc" },
          take: 1,
        },
        subscriptions: {
          orderBy: { dueDate: "desc" },
          take: 1,
        },
        invoices: {
          where: {
            OR: [{ status: "OVERDUE" }, { status: "PENDING" }],
          },
          orderBy: { dueDate: "desc" },
        },
      },
    });

    const alerts: SREAlert[] = [];
    let totalMRR = 0;
    let atRiskMRR = 0;
    let activeOrganizations = 0;
    let blockedOrganizations = 0;

    for (const org of organizations) {
      const project = org.projects[0] ?? null;
      const subscription = org.subscriptions[0] ?? null;
      const mrrValue = subscription?.mrrValue ?? 0;
      totalMRR += mrrValue;

      if (org.isActive) {
        activeOrganizations++;
      } else {
        blockedOrganizations++;
      }

      // ── Alerta: Kill Switch Ativo ──
      if (!org.isActive) {
        alerts.push({
          id: `ks-active-${org.id}`,
          organizationId: org.id,
          organizationName: org.name,
          domain: org.domain,
          cnpj: org.cnpj,
          type: "KILL_SWITCH_ACTIVE",
          severity: "CRITICAL",
          message: `Kill Switch já acionado — organização bloqueada. Reativação necessária.`,
          mrrValue,
          dueDate: subscription?.dueDate?.toISOString() ?? null,
          isActive: false,
          planType: subscription?.planType ?? null,
        });
        atRiskMRR += mrrValue;
        continue;
      }

      // ── Alerta: Kill Switch Eminente (Invoice OVERDUE >= 3 dias úteis) ──
      const overdueInvoices = org.invoices.filter(
        (inv) => inv.status === "OVERDUE"
      );

      for (const invoice of overdueInvoices) {
        const daysOverdue = businessDaysBetween(invoice.dueDate, today);

        if (daysOverdue >= 5) {
          alerts.push({
            id: `ks-eminent-${invoice.id}`,
            organizationId: org.id,
            organizationName: org.name,
            domain: org.domain,
            cnpj: org.cnpj,
            type: "KILL_SWITCH_EMINENT",
            severity: "CRITICAL",
            message: `Fatura vencida há ${daysOverdue} dias úteis — Kill Switch será acionado imediatamente!`,
            daysOverdue,
            mrrValue,
            dueDate: invoice.dueDate.toISOString(),
            isActive: true,
            planType: subscription?.planType ?? null,
          });
          atRiskMRR += mrrValue;
        } else if (daysOverdue >= 3) {
          alerts.push({
            id: `ks-warning-${invoice.id}`,
            organizationId: org.id,
            organizationName: org.name,
            domain: org.domain,
            cnpj: org.cnpj,
            type: "KILL_SWITCH_EMINENT",
            severity: "WARNING",
            message: `Fatura vencida há ${daysOverdue} dias úteis. Limiar de 5 dias para Kill Switch se aproxima.`,
            daysOverdue,
            mrrValue,
            dueDate: invoice.dueDate.toISOString(),
            isActive: true,
            planType: subscription?.planType ?? null,
          });
          atRiskMRR += mrrValue;
        }
      }

      // ── Alerta: Queda de Subdomínio (uptime < 95%) ──
      if (project && project.uptimeStatus !== null && project.uptimeStatus < 95) {
        const severity =
          project.uptimeStatus < 80
            ? "CRITICAL"
            : project.uptimeStatus < 90
            ? "WARNING"
            : "INFO";

        alerts.push({
          id: `subdomain-down-${project.id}`,
          organizationId: org.id,
          organizationName: org.name,
          domain: org.domain,
          cnpj: org.cnpj,
          type: "SUBDOMAIN_DOWN",
          severity,
          message: `Uptime do subdomínio em ${project.uptimeStatus}% — abaixo do SLA de 95%.`,
          uptimeStatus: project.uptimeStatus,
          mrrValue,
          dueDate: null,
          isActive: org.isActive,
          planType: subscription?.planType ?? null,
        });
      }
    }

    // Ordena alertas: CRITICAL primeiro, depois WARNING, depois INFO
    const severityOrder: Record<string, number> = {
      CRITICAL: 0,
      WARNING: 1,
      INFO: 2,
    };
    alerts.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    const data: SRECommandCenterData = {
      totalOrganizations: organizations.length,
      activeOrganizations,
      blockedOrganizations,
      totalMRR,
      atRiskMRR,
      alerts,
      lastUpdated: today.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[sre] Erro ao carregar Command Center:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao carregar Command Center",
      },
      { status: 500 }
    );
  }
}
