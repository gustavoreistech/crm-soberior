import { getWorksheet } from "@/lib/google-sheets";
import {
  SignatureLog,
  SignatureStatus,
  SIGNATURE_HEADERS,
} from "@/types/signature";
import { SHEET_NAMES } from "@/config/constants";

function rowToSignatureLog(row: Record<string, string>): SignatureLog {
  return {
    ID_Lead: row.ID_Lead,
    IP: row.IP,
    Timestamp: row.Timestamp,
    Telefone: row.Telefone,
    Codigo_2FA: row.Codigo_2FA,
    Status: row.Status as SignatureStatus,
  };
}

export async function createSignatureLog(
  leadId: string,
  telefone: string,
  codigo: string
): Promise<void> {
  const worksheet = await getWorksheet(SHEET_NAMES.LOGS_ASSINATURA);
  const now = new Date().toISOString();

  await worksheet.addRow({
    ID_Lead: leadId,
    IP: "",
    Timestamp: now,
    Telefone: telefone,
    Codigo_2FA: codigo,
    Status: "pending",
  });
}

export async function getSignatureLog(
  leadId: string,
  codigo: string
): Promise<SignatureLog | null> {
  const worksheet = await getWorksheet(SHEET_NAMES.LOGS_ASSINATURA);
  const rows = await worksheet.getRows();

  // Busca o registro mais recente com esse leadId e código
  const matchingRows = rows
    .map((row) => row.toObject() as Record<string, string>)
    .filter(
      (r) => r.ID_Lead === leadId && r.Codigo_2FA === codigo
    )
    .sort(
      (a, b) =>
        new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
    );

  if (matchingRows.length === 0) return null;

  return rowToSignatureLog(matchingRows[0]);
}

export async function verifyAndUpdateSignature(
  leadId: string,
  codigo: string,
  ip: string
): Promise<{ success: boolean; message: string }> {
  const worksheet = await getWorksheet(SHEET_NAMES.LOGS_ASSINATURA);
  const rows = await worksheet.getRows();

  const log = rows
    .map((row, index) => ({ row, data: row.toObject() as Record<string, string>, index }))
    .filter((r) => r.data.ID_Lead === leadId && r.data.Codigo_2FA === codigo)
    .sort(
      (a, b) =>
        new Date(b.data.Timestamp).getTime() -
        new Date(a.data.Timestamp).getTime()
    )[0];

  if (!log) {
    return { success: false, message: "Código inválido" };
  }

  if (log.data.Status === "verified") {
    return { success: false, message: "Código já utilizado" };
  }

  if (log.data.Status === "expired") {
    return { success: false, message: "Código expirado" };
  }

  // Verifica expiração (5 minutos)
  const createdAt = new Date(log.data.Timestamp).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (now - createdAt > fiveMinutes) {
    log.row.set("Status", "expired");
    await log.row.save();
    return { success: false, message: "Código expirado" };
  }

  // Atualiza para verified
  log.row.set("Status", "verified");
  log.row.set("IP", ip);
  await log.row.save();

  return { success: true, message: "Assinatura registrada com sucesso" };
}

export async function ensureSignatureLogsSheetExists(): Promise<void> {
  const worksheet = await getWorksheet(SHEET_NAMES.LOGS_ASSINATURA);

  if (worksheet.rowCount === 0) {
    await worksheet.setHeaderRow(SIGNATURE_HEADERS);
  }
}
