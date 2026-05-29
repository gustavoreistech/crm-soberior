export interface SREAlert {
  id: string;
  organizationId: string;
  organizationName: string;
  domain: string | null;
  cnpj: string | null;
  type: "KILL_SWITCH_EMINENT" | "SUBDOMAIN_DOWN" | "KILL_SWITCH_ACTIVE";
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  daysOverdue?: number;
  uptimeStatus?: number;
  mrrValue: number | null;
  dueDate: string | null;
  isActive: boolean;
  planType: string | null;
}

export interface SRECommandCenterData {
  totalOrganizations: number;
  activeOrganizations: number;
  blockedOrganizations: number;
  totalMRR: number;
  atRiskMRR: number;
  alerts: SREAlert[];
  lastUpdated: string;
}
