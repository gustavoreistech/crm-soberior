export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface N8nWebhookPayload {
  nome: string;
  empresa: string;
  telefone: string;
  email?: string;
  investimento_ads?: number;
  conversoes?: number;
  roas?: number;
}

export interface AsaasWebhookPayload {
  event: "PAYMENT_RECEIVED" | "PAYMENT_OVERDUE";
  payment: {
    id: string;
    value: number;
    customer: string;
    dueDate: string;
    externalReference?: string;
    metadata?: Record<string, string>;
  };
  subscription?: {
    id: string;
  };
}

export interface Generate2FAPayload {
  phone: string;
  organizationId: string;
}

export interface Validate2FAPayload {
  organizationId: string;
  codigo: string;
  ip?: string;
}

export interface EnrichLeadPayload {
  leadId: string;
  url: string;
}

export interface EnrichedLeadData {
  dor_do_cliente: string;
  solucao_sugerida: string;
  nivel_urgencia: "baixo" | "medio" | "alto";
  metricas_estimadas?: {
    potencial_mercado?: string;
    concorrentes?: string[];
  };
}

// ──────────────────────────────────────────
// Soberior Copilot Types
// ──────────────────────────────────────────

export type CopilotContextType = "LEAD" | "PROJECT";

export interface CopilotRequest {
  organizationId: string;
  message: string;
  contextType: CopilotContextType;
}

export interface CopilotMilestone {
  title: string;
  status: string;
  order: number;
  dueDate: string | null;
}

export interface CopilotInvoice {
  amount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
}

export interface CopilotTicket {
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  messageCount: number;
}

export interface CopilotContext {
  organization: {
    name: string;
    cnpj: string | null;
    domain: string | null;
    email: string | null;
    telefone: string | null;
    isActive: boolean;
  };
  project: {
    status: string | null;
    uptimeStatus: number | null;
    milestones: CopilotMilestone[];
  } | null;
  subscription: {
    planType: string | null;
    mrrValue: number | null;
    status: string | null;
    dueDate: string | null;
  } | null;
  invoices: CopilotInvoice[];
  tickets: CopilotTicket[];
  analytics: {
    totalTickets: number;
    openTickets: number;
    overdueInvoices: number;
    totalOverdueAmount: number;
  };
}
