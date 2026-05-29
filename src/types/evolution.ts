/**
 * Tipos para o webhook da Evolution API (WhatsApp).
 *
 * A Evolution API envia POSTs para nossa rota `/api/webhook/evolution`
 * sempre que uma mensagem é recebida no WhatsApp.
 */

/** Payload enviado pela Evolution API no webhook */
export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data?: EvolutionMessageData;
}

/** Dados da mensagem recebida */
export interface EvolutionMessageData {
  key?: {
    remoteJid?: string; // "5511999999999@s.whatsapp.net"
    fromMe?: boolean;   // true se foi enviada pelo próprio sistema
    id?: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: {
      caption?: string;
      mimetype: string;
      url?: string;
    };
  };
  pushName?: string;
}

/** Número de telefone extraído e normalizado do remoteJid */
export interface NormalizedPhone {
  /** Número com DDI + DDD + número (apenas dígitos), ex: 5511999999999 */
  full: string;
}

/**
 * Extrai e normaliza o número de telefone do remoteJid.
 *
 * Formato esperado: "5511999999999@s.whatsapp.net"
 * Retorno: "5511999999999"
 */
export function extractPhoneFromJid(remoteJid?: string): string | null {
  if (!remoteJid) return null;
  const match = remoteJid.match(/(\d+)/);
  return match ? match[1] : null;
}
