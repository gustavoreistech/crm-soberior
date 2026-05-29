import {
  ConfigKey,
  ConfigUpdatePayload,
  ConfigStatusResponse,
  CONFIG_DESCRIPTIONS,
  REQUIRED_CONFIG_KEYS,
} from "@/types/config";
import { prisma } from "./prisma";

/**
 * Config Manager - Gerencia configurações via Prisma (tabela SystemConfig).
 * As configurações são persistidas no banco PostgreSQL e também
 * sincronizadas com process.env em runtime.
 */

/** Cache em memória para evitar leituras repetidas do banco */
const configCache = new Map<ConfigKey, string | null>();

/**
 * Sincroniza uma configuração do cache para process.env.
 */
function syncEnv(key: ConfigKey, value: string | null): void {
  const envMap: Record<ConfigKey, string> = {
    DEEPSEEK_API_KEY: "DEEPSEEK_API_KEY",
    DEEPSEEK_MODEL: "DEEPSEEK_MODEL",
    EVOLUTION_API_URL: "EVOLUTION_API_URL",
    EVOLUTION_API_KEY: "EVOLUTION_API_KEY",
    ASAAS_API_KEY: "ASAAS_API_KEY",
    N8N_WEBHOOK_SECRET: "N8N_WEBHOOK_SECRET",
  };

  const envKey = envMap[key];
  if (envKey && value !== null) {
    process.env[envKey] = value;
  }
}

export async function getConfigValue(
  key: ConfigKey
): Promise<string | null> {
  // 1. Tenta cache em memória primeiro
  if (configCache.has(key)) {
    return configCache.get(key) ?? null;
  }

  // 2. Tenta process.env (fallback para variáveis de ambiente)
  const envMap: Record<ConfigKey, string> = {
    DEEPSEEK_API_KEY: "DEEPSEEK_API_KEY",
    DEEPSEEK_MODEL: "DEEPSEEK_MODEL",
    EVOLUTION_API_URL: "EVOLUTION_API_URL",
    EVOLUTION_API_KEY: "EVOLUTION_API_KEY",
    ASAAS_API_KEY: "ASAAS_API_KEY",
    N8N_WEBHOOK_SECRET: "N8N_WEBHOOK_SECRET",
  };

  const envValue = process.env[envMap[key]] ?? null;
  if (envValue) {
    configCache.set(key, envValue);
    return envValue;
  }

  // 3. Busca no banco via Prisma
  try {
    const row = await prisma.systemConfig.findUnique({
      where: { key },
    });

    const value = row?.value ?? null;
    configCache.set(key, value);
    if (value) syncEnv(key, value);
    return value;
  } catch {
    // Se a tabela ainda não existir, retorna null
    return null;
  }
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
  const entries: { key: ConfigKey; value: string }[] = [];

  if (payload.deepseek) {
    entries.push(
      { key: "DEEPSEEK_API_KEY", value: payload.deepseek.apiKey },
      { key: "DEEPSEEK_MODEL", value: payload.deepseek.model || "deepseek-chat" }
    );
  }

  if (payload.evolution) {
    entries.push(
      { key: "EVOLUTION_API_URL", value: payload.evolution.apiUrl },
      { key: "EVOLUTION_API_KEY", value: payload.evolution.apiKey }
    );
  }

  if (payload.asaas) {
    entries.push({ key: "ASAAS_API_KEY", value: payload.asaas.apiKey });
  }

  if (payload.n8n) {
    entries.push({ key: "N8N_WEBHOOK_SECRET", value: payload.n8n.webhookSecret });
  }

  // Persiste no banco via upsert
  for (const { key, value } of entries) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Atualiza cache e process.env
    configCache.set(key, value);
    syncEnv(key, value);
  }

  console.log(
    "[config-manager] Configurações salvas com sucesso:",
    entries.map((e) => e.key)
  );
}

export async function checkConfigStatus(): Promise<ConfigStatusResponse> {
  const keys = REQUIRED_CONFIG_KEYS;
  const results = await Promise.all(
    keys.map(async (key) => ({
      key,
      value: await getConfigValue(key),
    }))
  );

  const deepseekVal = results.find((r) => r.key === "DEEPSEEK_API_KEY")?.value;
  const deepseekModel = results.find((r) => r.key === "DEEPSEEK_MODEL")?.value;
  const evolutionUrl = results.find((r) => r.key === "EVOLUTION_API_URL")?.value;
  const evolutionKey = results.find((r) => r.key === "EVOLUTION_API_KEY")?.value;
  const asaasVal = results.find((r) => r.key === "ASAAS_API_KEY")?.value;
  const n8nVal = results.find((r) => r.key === "N8N_WEBHOOK_SECRET")?.value;

  return {
    configured: keys.every((k) => results.find((r) => r.key === k)?.value),
    services: {
      deepseek: {
        configured: !!deepseekVal,
        key_preview: deepseekVal ? `${deepseekVal.slice(0, 8)}...` : null,
        url_preview: deepseekModel || null,
      },
      evolution: {
        configured: !!(evolutionUrl && evolutionKey),
        key_preview: evolutionKey ? `${evolutionKey.slice(0, 8)}...` : null,
        url_preview: evolutionUrl || null,
      },
      asaas: {
        configured: !!asaasVal,
        key_preview: asaasVal ? `${asaasVal.slice(0, 8)}...` : null,
      },
      n8n: {
        configured: !!n8nVal,
        key_preview: n8nVal ? `${n8nVal.slice(0, 8)}...` : null,
      },
    },
  };
}

export async function isSystemConfigured(): Promise<boolean> {
  const status = await checkConfigStatus();
  return status.configured;
}

export function invalidateConfigCache(): void {
  // Sem cache em memória desde que usamos env vars.
}
