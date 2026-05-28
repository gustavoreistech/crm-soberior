import {
  getConfig,
  setConfig,
  setMultipleConfigs,
  getConfigStatus,
  isFullyConfigured,
} from "@/lib/sheets/config";
import {
  ConfigKey,
  ConfigUpdatePayload,
  ConfigStatusResponse,
  CONFIG_DESCRIPTIONS,
  REQUIRED_CONFIG_KEYS,
} from "@/types/config";

/**
 * Config Manager - Cache em memória para evitar leitura excessiva do Google Sheets.
 * O cache expira após o TTL definido.
 */

interface CacheEntry {
  value: string;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const configCache = new Map<string, CacheEntry>();

function isCacheValid(key: string): boolean {
  const entry = configCache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

function invalidateCache(): void {
  configCache.clear();
}

export async function getConfigValue(
  key: ConfigKey
): Promise<string | null> {
  if (isCacheValid(key)) {
    return configCache.get(key)?.value ?? null;
  }

  const value = await getConfig(key);
  if (value !== null) {
    configCache.set(key, { value, timestamp: Date.now() });
  }
  return value;
}

export async function getEvolutionCredentials(): Promise<{
  apiUrl: string;
  apiKey: string;
} | null> {
  const [apiUrl, apiKey] = await Promise.all([
    getConfigValue("EVOLUTION_API_URL"),
    getConfigValue("EVOLUTION_API_KEY"),
  ]);

  if (!apiUrl || !apiKey) return null;

  return { apiUrl, apiKey };
}

export async function getDeepSeekCredentials(): Promise<{
  apiKey: string;
  model: string;
} | null> {
  const [apiKey, model] = await Promise.all([
    getConfigValue("DEEPSEEK_API_KEY"),
    getConfigValue("DEEPSEEK_MODEL"),
  ]);

  if (!apiKey) return null;

  return { apiKey, model: model || "deepseek-chat" };
}

export async function getAsaasApiKey(): Promise<string | null> {
  return getConfigValue("ASAAS_API_KEY");
}

export async function getN8nWebhookSecret(): Promise<string | null> {
  return getConfigValue("N8N_WEBHOOK_SECRET");
}

export async function saveConfigs(
  payload: ConfigUpdatePayload
): Promise<void> {
  const updates: { chave: ConfigKey; valor: string; descricao?: string }[] = [];

  if (payload.deepseek) {
    updates.push({
      chave: "DEEPSEEK_API_KEY",
      valor: payload.deepseek.apiKey,
      descricao: CONFIG_DESCRIPTIONS.DEEPSEEK_API_KEY,
    });
    if (payload.deepseek.model) {
      updates.push({
        chave: "DEEPSEEK_MODEL",
        valor: payload.deepseek.model,
        descricao: CONFIG_DESCRIPTIONS.DEEPSEEK_MODEL,
      });
    }
  }

  if (payload.evolution) {
    updates.push(
      {
        chave: "EVOLUTION_API_URL",
        valor: payload.evolution.apiUrl,
        descricao: CONFIG_DESCRIPTIONS.EVOLUTION_API_URL,
      },
      {
        chave: "EVOLUTION_API_KEY",
        valor: payload.evolution.apiKey,
        descricao: CONFIG_DESCRIPTIONS.EVOLUTION_API_KEY,
      }
    );
  }

  if (payload.asaas) {
    updates.push({
      chave: "ASAAS_API_KEY",
      valor: payload.asaas.apiKey,
      descricao: CONFIG_DESCRIPTIONS.ASAAS_API_KEY,
    });
  }

  if (payload.n8n) {
    updates.push({
      chave: "N8N_WEBHOOK_SECRET",
      valor: payload.n8n.webhookSecret,
      descricao: CONFIG_DESCRIPTIONS.N8N_WEBHOOK_SECRET,
    });
  }

  if (updates.length > 0) {
    await setMultipleConfigs(updates);
    invalidateCache();
  }
}

export async function checkConfigStatus(): Promise<ConfigStatusResponse> {
  return getConfigStatus();
}

export async function isSystemConfigured(): Promise<boolean> {
  return isFullyConfigured();
}

export { invalidateCache as invalidateConfigCache };
