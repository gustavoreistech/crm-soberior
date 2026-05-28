export type SignatureStatus = "pending" | "verified" | "expired";

export interface SignatureLog {
  ID_Lead: string;
  IP: string;
  Timestamp: string;
  Telefone: string;
  Codigo_2FA: string;
  Status: SignatureStatus;
}

export const SIGNATURE_HEADERS: (keyof SignatureLog)[] = [
  "ID_Lead",
  "IP",
  "Timestamp",
  "Telefone",
  "Codigo_2FA",
  "Status",
];
