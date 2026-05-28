import { CODE_2FA_EXPIRY_SECONDS } from "@/config/constants";

interface CodeEntry {
  code: string;
  telefone: string;
  expiresAt: number;
}

/**
 * Armazenamento em memória para códigos 2FA.
 * Temporário até que uma tabela no banco seja criada para signature logs.
 */
const store = new Map<string, CodeEntry>();

export function storeCode(leadId: string, code: string, telefone: string): void {
  const expiresAt = Date.now() + CODE_2FA_EXPIRY_SECONDS * 1000;
  store.set(leadId, { code, telefone, expiresAt });
}

export function verifyCode(leadId: string, code: string): {
  valid: boolean;
  message: string;
} {
  const entry = store.get(leadId);

  if (!entry) {
    return {
      valid: false,
      message: "Nenhum código encontrado para este lead. Solicite um novo código.",
    };
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(leadId);
    return {
      valid: false,
      message: "Código expirado. Solicite um novo código.",
    };
  }

  if (entry.code !== code) {
    return {
      valid: false,
      message: "Código inválido. Verifique o código informado.",
    };
  }

  // Código válido — remove do store
  store.delete(leadId);

  return {
    valid: true,
    message: "Código verificado com sucesso. Assinatura digital concluída.",
  };
}
