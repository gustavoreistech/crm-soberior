export interface ConfigRow {
  Chave: string;
  Valor: string;
  Descricao: string;
  Atualizado_Em: string;
}

export const CONFIG_HEADERS: (keyof ConfigRow)[] = [
  "Chave",
  "Valor",
  "Descricao",
  "Atualizado_Em",
];

export type ConfigKey =
  | "DEEPSEEK_API_KEY"
  | "DEEPSEEK_MODEL"
  | "EVOLUTION_API_URL"
  | "EVOLUTION_API_KEY"
  | "ASAAS_API_KEY"
  | "N8N_WEBHOOK_SECRET"
  | "N8N_PROPOSAL_WEBHOOK_URL"
  | "N8N_KILLSWITCH_WEBHOOK_URL";

export const REQUIRED_CONFIG_KEYS: ConfigKey[] = [
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_MODEL",
  "EVOLUTION_API_URL",
  "EVOLUTION_API_KEY",
  "ASAAS_API_KEY",
  "N8N_WEBHOOK_SECRET",
  "N8N_PROPOSAL_WEBHOOK_URL",
];

export const CONFIG_DESCRIPTIONS: Record<ConfigKey, string> = {
  DEEPSEEK_API_KEY: "Chave da API DeepSeek",
  DEEPSEEK_MODEL: "Modelo DeepSeek (ex: deepseek-chat)",
  EVOLUTION_API_URL: "URL da instância Evolution API",
  EVOLUTION_API_KEY: "API Key da Evolution API",
  ASAAS_API_KEY: "API Key do Asaas",
  N8N_WEBHOOK_SECRET: "Secret para validar webhooks do n8n",
  N8N_PROPOSAL_WEBHOOK_URL: "URL do webhook do n8n para geração de propostas",
  N8N_KILLSWITCH_WEBHOOK_URL: "URL do webhook do n8n para Kill Switch (inadimplência)",
};

export interface ServiceConfigStatus {
  configured: boolean;
  key_preview: string | null;
  url_preview?: string | null;
}

export interface ConfigStatusResponse {
  configured: boolean;
  services: {
    deepseek: ServiceConfigStatus;
    evolution: ServiceConfigStatus;
    asaas: ServiceConfigStatus;
    n8n: ServiceConfigStatus;
  };
}

export interface ConfigUpdatePayload {
  deepseek?: {
    apiKey: string;
    model?: string;
  };
  evolution?: {
    apiUrl: string;
    apiKey: string;
  };
  asaas?: {
    apiKey: string;
  };
  n8n?: {
    webhookSecret: string;
    proposalWebhookUrl?: string;
    killswitchWebhookUrl?: string;
  };
}
