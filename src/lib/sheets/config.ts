import { getWorksheet } from "@/lib/google-sheets";
import {
  ConfigRow,
  CONFIG_HEADERS,
  REQUIRED_CONFIG_KEYS,
  ConfigKey,
} from "@/types/config";
import { SHEET_NAMES } from "@/config/constants";

function rowToConfig(row: Record<string, string>): ConfigRow {
  return {
    Chave: row.Chave,
    Valor: row.Valor,
    Descricao: row.Descricao,
    Atualizado_Em: row.Atualizado_Em,
  };
}

export async function getAllConfigs(): Promise<ConfigRow[]> {
  const worksheet = await getWorksheet(SHEET_NAMES.CONFIGURACOES);
  const rows = await worksheet.getRows();

  return rows.map((row) => rowToConfig(row.toObject() as Record<string, string>));
}

export async function getConfig(chave: ConfigKey): Promise<string | null> {
  const worksheet = await getWorksheet(SHEET_NAMES.CONFIGURACOES);
  const rows = await worksheet.getRows();

  const row = rows.find((r) => r.get("Chave") === chave);
  if (!row) return null;

  return row.get("Valor");
}

export async function setConfig(
  chave: string,
  valor: string,
  descricao?: string
): Promise<void> {
  const worksheet = await getWorksheet(SHEET_NAMES.CONFIGURACOES);
  const rows = await worksheet.getRows();
  const now = new Date().toISOString();

  const existingRow = rows.find((r) => r.get("Chave") === chave);

  if (existingRow) {
    existingRow.set("Valor", valor);
    existingRow.set("Atualizado_Em", now);
    if (descricao) existingRow.set("Descricao", descricao);
    await existingRow.save();
  } else {
    await worksheet.addRow({
      Chave: chave,
      Valor: valor,
      Descricao: descricao || "",
      Atualizado_Em: now,
    });
  }
}

export async function setMultipleConfigs(
  configs: { chave: ConfigKey; valor: string; descricao?: string }[]
): Promise<void> {
  for (const config of configs) {
    await setConfig(config.chave, config.valor, config.descricao);
  }
}

export async function isFullyConfigured(): Promise<boolean> {
  try {
    const configs = await getAllConfigs();
    const configuredKeys = configs.map((c) => c.Chave);

    return REQUIRED_CONFIG_KEYS.every((key) => configuredKeys.includes(key));
  } catch {
    return false;
  }
}

export async function getConfigStatus() {
  const configs = await getAllConfigs();
  const configMap = new Map(configs.map((c) => [c.Chave, c.Valor]));

  const maskValue = (val: string | null): string | null => {
    if (!val) return null;
    if (val.length <= 4) return "****";
    return val.slice(0, 3) + "****" + val.slice(-4);
  };

  const hasKey = (key: ConfigKey): string | null => {
    const val = configMap.get(key);
    return val || null;
  };

  return {
    configured: REQUIRED_CONFIG_KEYS.every((key) => configMap.has(key)),
    services: {
      deepseek: {
        configured: !!hasKey("DEEPSEEK_API_KEY"),
        key_preview: maskValue(hasKey("DEEPSEEK_API_KEY")),
      },
      evolution: {
        configured: !!hasKey("EVOLUTION_API_URL") && !!hasKey("EVOLUTION_API_KEY"),
        url_preview: hasKey("EVOLUTION_API_URL"),
        key_preview: maskValue(hasKey("EVOLUTION_API_KEY")),
      },
      asaas: {
        configured: !!hasKey("ASAAS_API_KEY"),
        key_preview: maskValue(hasKey("ASAAS_API_KEY")),
      },
      n8n: {
        configured: !!hasKey("N8N_WEBHOOK_SECRET"),
        key_preview: maskValue(hasKey("N8N_WEBHOOK_SECRET")),
      },
    },
  };
}

export async function ensureConfigsSheetExists(): Promise<void> {
  const worksheet = await getWorksheet(SHEET_NAMES.CONFIGURACOES);

  if (worksheet.rowCount === 0) {
    await worksheet.setHeaderRow(CONFIG_HEADERS);
  }
}
