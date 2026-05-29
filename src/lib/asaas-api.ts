import { getAsaasApiKey } from "./config-manager";

// ──────────────────────────────────────────
// Tipos internos
// ──────────────────────────────────────────

interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  status: string;
}

interface AsaasApiError {
  errors: Array<{
    code: string;
    description: string;
  }>;
}

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

const ASAAS_API_BASE = process.env.ASAAS_API_URL ?? "https://api.asaas.com/v3";

async function getHeaders(): Promise<Record<string, string>> {
  const apiKey = await getAsaasApiKey();
  if (!apiKey) {
    throw new Error(
      "ASAAS_API_KEY não configurada. Configure-a nas configurações do sistema."
    );
  }

  return {
    "Content-Type": "application/json",
    access_token: apiKey,
  };
}

async function asaasFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getHeaders();
  const url = `${ASAAS_API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as AsaasApiError | null;
    const errorMessage = errorBody?.errors?.[0]?.description ?? `Erro HTTP ${response.status}`;
    throw new Error(`[Asaas API] ${errorMessage}`);
  }

  return response.json() as Promise<T>;
}

// ──────────────────────────────────────────
// Funções públicas
// ──────────────────────────────────────────

export interface CreateCustomerParams {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
}

/**
 * Cria um cliente no Asaas.
 * Retorna o ID do cliente criado.
 */
export async function createCustomer(
  params: CreateCustomerParams
): Promise<string> {
  const body = {
    name: params.name,
    cpfCnpj: params.cpfCnpj,
    email: params.email,
    phone: params.phone,
  };

  const result = await asaasFetch<AsaasCustomerResponse>("/customers", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return result.id;
}

export interface CreateSubscriptionParams {
  customerId: string;
  value: number;
  planName: string;
  dueDay?: number;
  billingType?: "BOLETO" | "PIX" | "CREDIT_CARD";
  description?: string;
  cycle?: "MONTHLY" | "YEARLY" | "WEEKLY";
}

/**
 * Cria uma assinatura no Asaas.
 * Retorna o ID da assinatura criada.
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<{
  id: string;
  status: string;
  nextDueDate: string;
}> {
  const body: Record<string, unknown> = {
    customer: params.customerId,
    value: params.value,
    nextDueDate: new Date(
      Date.now() +
        (params.dueDay
          ? Math.max(1, params.dueDay - new Date().getDate())
          : 1) *
          86400000
    ).toISOString()
      .split("T")[0],
    billingType: params.billingType ?? "PIX",
    cycle: params.cycle ?? "MONTHLY",
    description: params.description ?? params.planName,
  };

  const result = await asaasFetch<AsaasSubscriptionResponse>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    id: result.id,
    status: result.status,
    nextDueDate: result.nextDueDate,
  };
}

/**
 * Busca um cliente no Asaas pelo CPF/CNPJ.
 * Retorna o ID do cliente se encontrado, ou null.
 */
export async function findCustomerByCpfCnpj(
  cpfCnpj: string
): Promise<string | null> {
  const result = await asaasFetch<{ data: AsaasCustomerResponse[] }>(
    `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`
  );

  return result.data?.[0]?.id ?? null;
}
