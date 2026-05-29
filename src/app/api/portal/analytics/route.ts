import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { queryRows, queryOne } from "@/lib/clickhouse";
import { ApiResponse } from "@/types/api";
import { AnalyticsData } from "@/types/portal";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<AnalyticsData>>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;

    const [roasDaily, eventsDaily, roasMonthlyResult, totalEventsResult] =
      await Promise.all([
        // ROAS diário dos últimos 30 dias
        queryRows<{ date: string; roas: number }>(
          `
          SELECT toDate(event_time) as date, avg(roas) as roas
          FROM soberior_analytics.events
          WHERE organization_id = {orgId:String}
            AND event_time >= now() - INTERVAL 30 DAY
          GROUP BY date
          ORDER BY date ASC
          `,
          { orgId: organizationId }
        ),

        // Eventos processados por dia (últimos 30 dias)
        queryRows<{ date: string; events: number }>(
          `
          SELECT toDate(event_time) as date, count(*) as events
          FROM soberior_analytics.events
          WHERE organization_id = {orgId:String}
            AND event_time >= now() - INTERVAL 30 DAY
          GROUP BY date
          ORDER BY date ASC
          `,
          { orgId: organizationId }
        ),

        // ROAS médio do mês atual
        queryOne<{ roas: number }>(
          `
          SELECT avg(roas) as roas
          FROM soberior_analytics.events
          WHERE organization_id = {orgId:String}
            AND toMonth(event_time) = toMonth(now())
            AND toYear(event_time) = toYear(now())
          `,
          { orgId: organizationId }
        ),

        // Total de eventos do mês atual
        queryOne<{ total: number }>(
          `
          SELECT count(*) as total
          FROM soberior_analytics.events
          WHERE organization_id = {orgId:String}
            AND toMonth(event_time) = toMonth(now())
            AND toYear(event_time) = toYear(now())
          `,
          { orgId: organizationId }
        ),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        roasDaily: roasDaily ?? [],
        eventsDaily: eventsDaily ?? [],
        roasMonthly: roasMonthlyResult?.roas ?? 0,
        totalEvents: totalEventsResult?.total ?? 0,
      },
    });
  } catch (error) {
    console.error("[portal/analytics] Erro ao buscar dados do ClickHouse:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao buscar analytics",
      },
      { status: 500 }
    );
  }
}
