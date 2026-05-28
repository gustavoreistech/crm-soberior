import { StatusFunil } from "@/types/lead";

export const APP_NAME = "Soberior OS";
export const APP_TAGLINE = "CRM B2B Autônomo";

export const SHEET_NAMES = {
  LEADS: "Leads",
  LOGS_ASSINATURA: "Logs_Assinatura",
  CONFIGURACOES: "Configuracoes",
} as const;

export const STATUS_FUNIL_COLORS: Record<StatusFunil, string> = {
  "Prospecção": "#1E3A5F",
  "Audit Solicitado": "#1F7A8C",
  "Proposta Enviada": "#F2C14E",
  "Fechado/Ganho": "#22C55E",
  "Onboarding": "#3B82F6",
  "Inadimplente": "#EF4444",
};

export const STATUS_FUNIL_LABELS: Record<StatusFunil, string> = {
  "Prospecção": "Prospecção",
  "Audit Solicitado": "Audit Solicitado",
  "Proposta Enviada": "Proposta Enviada",
  "Fechado/Ganho": "Fechado/Ganho",
  "Onboarding": "Onboarding",
  "Inadimplente": "Inadimplente",
};

export const CANVAS_ORDER: StatusFunil[] = [
  "Prospecção",
  "Audit Solicitado",
  "Proposta Enviada",
  "Fechado/Ganho",
  "Onboarding",
  "Inadimplente",
];

export const API_ROUTES = {
  WEBHOOK_N8N: "/api/webhook/n8n",
  WEBHOOK_ASAAS: "/api/webhook/asaas",
  SIGNATURE_GENERATE_2FA: "/api/signature/generate-2fa",
  SIGNATURE_VALIDATE_2FA: "/api/signature/validate-2fa",
  AI_ENRICH_LEAD: "/api/ai/enrich-lead",
  CONFIG: "/api/config",
} as const;

export const ROUTES = {
  DASHBOARD: "/",
  LEADS_NEW: "/leads/new",
  SETTINGS: "/settings",
} as const;

export const EVOLUTION_API_TIMEOUT = 10000; // 10s
export const DEEPSEEK_API_TIMEOUT = 30000; // 30s
export const CODE_2FA_LENGTH = 6;
export const CODE_2FA_EXPIRY_SECONDS = 300; // 5 minutos
export const N8N_WEBHOOK_SECRET_HEADER = "x-webhook-secret";
