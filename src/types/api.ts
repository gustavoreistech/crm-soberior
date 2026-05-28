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
  leadId: string;
  telefone: string;
}

export interface Validate2FAPayload {
  leadId: string;
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
