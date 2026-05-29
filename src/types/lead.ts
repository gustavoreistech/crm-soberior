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

/** Mapeamento entre status em inglês (banco) e português (exibição) */
export const STATUS_MAP: Record<string, StatusFunil> = {
  PROSPECT: "Prospecção",
  AUDIT_REQUESTED: "Audit Solicitado",
  PROPOSAL_SENT: "Proposta Enviada",
  CLOSED_WON: "Fechado/Ganho",
  ONBOARDING: "Onboarding",
  DELINQUENT: "Inadimplente",
};

export const STATUS_REVERSE_MAP: Record<StatusFunil, string> = {
  "Prospecção": "PROSPECT",
  "Audit Solicitado": "AUDIT_REQUESTED",
  "Proposta Enviada": "PROPOSAL_SENT",
  "Fechado/Ganho": "CLOSED_WON",
  "Onboarding": "ONBOARDING",
  "Inadimplente": "DELINQUENT",
};

/** Organização simplificada vinculada ao Lead (vinda da API) */
export interface OrganizationSummary {
  id: string;
  name: string;
  cnpj: string | null;
  domain: string | null;
  email: string | null;
  telefone: string | null;
  stapeId: string | null;
  isActive: boolean;
}

/** Resumo de uma Proposta vinculada ao Lead */
export interface ProposalSummary {
  id: string;
  value: number | null;
  pdfUrl: string | null;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
}

/** Resumo de um Contrato vinculado ao Lead */
export interface ContractSummary {
  id: string;
  proposalId: string;
  signatureStatus: "PENDING" | "SIGNED";
  signedAt: string | null;
}

/** Lead conforme retornado pela API (baseado nos tipos gerados pelo Prisma Client) */
export interface Lead {
  id: string;
  organizationId: string | null;
  status: StatusFunil;
  score: number | null;
  lostRevenue: number | null;
  converted: boolean;
  organization: OrganizationSummary;
  proposal?: ProposalSummary | null;
  contract?: ContractSummary | null;
}

/** Payload para criar um Lead via API */
export interface CreateLeadPayload {
  name: string;
  cnpj?: string | null;
  domain?: string | null;
  telefone?: string;
  email?: string;
  status?: string;
}
