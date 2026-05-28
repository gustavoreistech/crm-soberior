import { v4 as uuidv4 } from "uuid";
import { getWorksheet } from "@/lib/google-sheets";
import {
  Lead,
  LeadInput,
  LeadRow,
  LEAD_HEADERS,
  StatusFunil,
} from "@/types/lead";
import { SHEET_NAMES } from "@/config/constants";

function rowToLead(row: LeadRow, rowIndex: number): Lead {
  return {
    ID: row.ID,
    Nome: row.Nome,
    Empresa: row.Empresa,
    Telefone: row.Telefone,
    Email: row.Email,
    Status_Funil: row.Status_Funil as StatusFunil,
    Investimento_Ads: Number(row.Investimento_Ads) || 0,
    Conversoes: Number(row.Conversoes) || 0,
    ROAS: Number(row.ROAS) || 0,
    Perda_Estimada: Number(row.Perda_Estimada) || 0,
    Valor_Perdido: Number(row.Valor_Perdido) || 0,
    Data_Criacao: row.Data_Criacao,
    Data_Atualizacao: row.Data_Atualizacao,
    Dados_DeepSeek: row.Dados_DeepSeek || null,
  };
}

export async function getAllLeads(): Promise<Lead[]> {
  const worksheet = await getWorksheet(SHEET_NAMES.LEADS);
  const rows = await worksheet.getRows<LeadRow>();

  return rows.map((row, index) => rowToLead(row.toObject() as LeadRow, index));
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const worksheet = await getWorksheet(SHEET_NAMES.LEADS);
  const rows = await worksheet.getRows<LeadRow>();

  const row = rows.find((r) => r.get("ID") === id);
  if (!row) return null;

  return rowToLead(row.toObject() as LeadRow, rows.indexOf(row));
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const worksheet = await getWorksheet(SHEET_NAMES.LEADS);
  const now = new Date().toISOString();
  const id = uuidv4();

  const newRow: LeadRow = {
    ID: id,
    Nome: input.Nome,
    Empresa: input.Empresa,
    Telefone: input.Telefone,
    Email: input.email || "",
    Status_Funil: "Prospecção",
    Investimento_Ads: String(input.Investimento_Ads || 0),
    Conversoes: String(input.Conversoes || 0),
    ROAS: String(input.ROAS || 0),
    Perda_Estimada: "0",
    Valor_Perdido: "0",
    Data_Criacao: now,
    Data_Atualizacao: now,
    Dados_DeepSeek: "",
  };

  await worksheet.addRow(newRow as unknown as Record<string, string | number | boolean>);

  return {
    ID: id,
    Nome: input.Nome,
    Empresa: input.Empresa,
    Telefone: input.Telefone,
    Email: input.email || "",
    Status_Funil: "Prospecção" as StatusFunil,
    Investimento_Ads: input.Investimento_Ads || 0,
    Conversoes: input.Conversoes || 0,
    ROAS: input.ROAS || 0,
    Perda_Estimada: 0,
    Valor_Perdido: 0,
    Data_Criacao: now,
    Data_Atualizacao: now,
    Dados_DeepSeek: null,
  };
}

export async function updateLeadStatus(
  id: string,
  newStatus: StatusFunil
): Promise<Lead | null> {
  const worksheet = await getWorksheet(SHEET_NAMES.LEADS);
  const rows = await worksheet.getRows<LeadRow>();

  const row = rows.find((r) => r.get("ID") === id);
  if (!row) return null;

  row.set("Status_Funil", newStatus);
  row.set("Data_Atualizacao", new Date().toISOString());
  await row.save();

  return rowToLead(row.toObject() as LeadRow, rows.indexOf(row));
}

export async function updateLead(
  id: string,
  updates: Partial<LeadInput>
): Promise<Lead | null> {
  const worksheet = await getWorksheet(SHEET_NAMES.LEADS);
  const rows = await worksheet.getRows<LeadRow>();

  const row = rows.find((r) => r.get("ID") === id);
  if (!row) return null;

  const now = new Date().toISOString();

  if (updates.Nome !== undefined) row.set("Nome", updates.Nome);
  if (updates.Empresa !== undefined) row.set("Empresa", updates.Empresa);
  if (updates.Telefone !== undefined) row.set("Telefone", updates.Telefone);
  if (updates.email !== undefined) row.set("Email", updates.email);
  if (updates.Investimento_Ads !== undefined)
    row.set("Investimento_Ads", String(updates.Investimento_Ads));
  if (updates.Conversoes !== undefined)
    row.set("Conversoes", String(updates.Conversoes));
  if (updates.ROAS !== undefined) row.set("ROAS", String(updates.ROAS));

  row.set("Data_Atualizacao", now);
  await row.save();

  return rowToLead(row.toObject() as LeadRow, rows.indexOf(row));
}

export async function ensureLeadsSheetExists(): Promise<void> {
  const worksheet = await getWorksheet(SHEET_NAMES.LEADS);

  // Se a sheet está vazia, adiciona o header
  if (worksheet.rowCount === 0) {
    await worksheet.setHeaderRow(LEAD_HEADERS);
  }
}
