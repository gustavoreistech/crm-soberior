/** Dados de um milestone do projeto (vindo do Prisma) */
export interface MilestoneData {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  order: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

/** Dados analíticos vindos do ClickHouse */
export interface AnalyticsData {
  roasDaily: Array<{ date: string; roas: number }>;
  eventsDaily: Array<{ date: string; events: number }>;
  roasMonthly: number;
  totalEvents: number;
}

/** Dados consolidados do dashboard do portal */
export interface PortalDashboardData {
  organizationName: string;
  projectStatus: string | null;
  uptimeStatus: number | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  mrrValue: number | null;
  dueDate: string | null;
}
