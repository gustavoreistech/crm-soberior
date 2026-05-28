export type StatusFunil =
  | "Prospecção"
  | "Audit Solicitado"
  | "Proposta Enviada"
  | "Fechado/Ganho"
  | "Onboarding"
  | "Inadimplente";

export const STATUS_FUNIL_OPTIONS: StatusFunil[] = [
  "Prospecção",
  "Audit Solicitado",
  "Proposta Enviada",
  "Fechado/Ganho",
  "Onboarding",
  "Inadimplente",
];

export interface Lead {
  ID: string;
  Nome: string;
  Empresa: string;
  Telefone: string;
  Email: string;
  Status_Funil: StatusFunil;
  Investimento_Ads: number;
  Conversoes: number;
  ROAS: number;
  Perda_Estimada: number;
  Valor_Perdido: number;
  Data_Criacao: string;
  Data_Atualizacao: string;
  Dados_DeepSeek: string | null;
}

export type LeadInput = {
  Nome: string;
  Empresa: string;
  Telefone: string;
  email?: string;
  Status_Funil?: StatusFunil;
  Investimento_Ads?: number;
  Conversoes?: number;
  ROAS?: number;
};

export interface LeadRow {
  ID: string;
  Nome: string;
  Empresa: string;
  Telefone: string;
  Email: string;
  Status_Funil: StatusFunil;
  Investimento_Ads: string;
  Conversoes: string;
  ROAS: string;
  Perda_Estimada: string;
  Valor_Perdido: string;
  Data_Criacao: string;
  Data_Atualizacao: string;
  Dados_DeepSeek: string;
}

export const LEAD_HEADERS: (keyof LeadRow)[] = [
  "ID",
  "Nome",
  "Empresa",
  "Telefone",
  "Email",
  "Status_Funil",
  "Investimento_Ads",
  "Conversoes",
  "ROAS",
  "Perda_Estimada",
  "Valor_Perdido",
  "Data_Criacao",
  "Data_Atualizacao",
  "Dados_DeepSeek",
];
