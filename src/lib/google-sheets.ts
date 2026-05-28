import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "googleapis-common";

let doc: GoogleSpreadsheet | null = null;

/**
 * Obtém ou cria uma instância autenticada do Google Spreadsheet.
 * Usa as credenciais do .env.local para bootstrap.
 */
export async function getSheet(): Promise<GoogleSpreadsheet> {
  if (doc) return doc;

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !sheetId) {
    throw new Error(
      "Credenciais do Google Sheets não configuradas. Verifique GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY e GOOGLE_SHEET_ID no .env.local"
    );
  }

  const serviceAccountAuth = new JWT({
    email: clientEmail,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
  await doc.loadInfo();

  return doc;
}

/**
 * Obtém uma worksheet pelo nome, criando-a se não existir.
 */
export async function getWorksheet(sheetTitle: string) {
  const sheet = await getSheet();
  let worksheet = sheet.sheetsByTitle[sheetTitle];

  if (!worksheet) {
    worksheet = await sheet.addSheet({ title: sheetTitle });
  }

  return worksheet;
}

/**
 * Limpa a instância (útil para testes ou recarregar credenciais).
 */
export function resetSheetInstance() {
  doc = null;
}
