import {
  ConfigKey,
  ConfigUpdatePayload,
  ConfigStatusResponse,
  CONFIG_DESCRIPTIONS,
  REQUIRED_CONFIG_KEYS,
} from "@/types/config";

/**
 * Config Manager - Lê configurações de environment variables.
 * Futuramente pode ser migrado para uma tabela no banco via Prisma.
 */

function getEnvValue(key: ConfigKey): string | null {
  // Mapeia as chaves de configuração para variáveis de ambiente
  const envMap: Record<ConfigKey, string> = {
    DEEPSEEK_API_KEY: "DEEPSEEK_API_KEY",
    DEEPSEEK_MODEL: "DEEPSEEK_MODEL",
    EVOLUTION_API_URL: "EVOLUTION_API_URL",
    EVOLUTION_API_KEY: "EVOLUTION_API_KEY",
    ASAAS_API_KEY: "ASAAS_API_KEY",
    N8N_WEBHOOK_SECRET: "N8N_WEBHOOK_SECRET",
  };

  return process.env[envMap[key]] ?? null;
}

export async function getConfigValue(
  key: ConfigKey
): Promise<string | null> {
  return getEnvValue(key);
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
  // Nota: Como não há um modelo Config no Prisma ainda,
  // as configurações são persistidas via .env.
  // Futuramente, implementar persistência em banco.
  console.log(
    "[config-manager] Configurações salvas via UI:",
    Object.keys(payload)
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
