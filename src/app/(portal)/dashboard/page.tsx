"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  CreditCard,
  ShieldCheck,
  Activity,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PortalDashboardData } from "@/types/portal";
import { DashboardCharts } from "@/components/portal/dashboard-charts";
import { OnboardingTimeline } from "@/components/portal/onboarding-timeline";

/** Mapeamento de status do projeto para labels amigáveis */
const PROJECT_STATUS_LABEL: Record<string, string> = {
  ONBOARDING: "Em Onboarding",
  ACTIVE: "Ativo",
  CHURN: "Cancelado",
};

/** Ícone condicional por status do projeto */
const PROJECT_STATUS_ICON: Record<string, string> = {
  ONBOARDING: "text-amber-400",
  ACTIVE: "text-emerald-400",
  CHURN: "text-red-400",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<PortalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/portal/dashboard");
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("[portal-dashboard] Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const organizationId = session?.user?.organizationId;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Olá, {session?.user?.name || "Cliente"}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Bem-vindo ao portal do cliente SOBERIOR
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#F2C14E]" />
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* ============================================ */}
          {/* Cards de Resumo */}
          {/* ============================================ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
                <BarChart3 className="w-4 h-4" />
                <span>Status do Projeto</span>
              </div>
              <p
                className={cn(
                  "text-lg font-bold",
                  PROJECT_STATUS_ICON[data.projectStatus ?? ""] ?? "text-white"
                )}
              >
                {PROJECT_STATUS_LABEL[data.projectStatus ?? ""] ||
                  data.projectStatus ||
                  "—"}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
                <Activity className="w-4 h-4" />
                <span>Uptime</span>
              </div>
              <p className="text-lg font-bold text-emerald-400">
                {data.uptimeStatus !== null
                  ? `${data.uptimeStatus}%`
                  : "—"}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
                <CreditCard className="w-4 h-4" />
                <span>Plano</span>
              </div>
              <p className="text-lg font-bold text-white">
                {data.subscriptionPlan || "—"}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Status</span>
              </div>
              <p
                className={`text-lg font-bold ${
                  data.subscriptionStatus === "ACTIVE"
                    ? "text-emerald-400"
                    : data.subscriptionStatus === "OVERDUE"
                    ? "text-red-400"
                    : "text-[#F2C14E]"
                }`}
              >
                {data.subscriptionStatus === "ACTIVE"
                  ? "Ativo"
                  : data.subscriptionStatus === "OVERDUE"
                  ? "Inadimplente"
                  : data.subscriptionStatus || "—"}
              </p>
            </div>
          </div>

          {/* ============================================ */}
          {/* Gráficos Analytics (Recharts + ClickHouse) */}
          {/* ============================================ */}
          {organizationId && <DashboardCharts organizationId={organizationId} />}

          {/* ============================================ */}
          {/* Detalhes da Assinatura */}
          {/* ============================================ */}
          <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-medium text-[#F2C14E] mb-4">
              Detalhes da Assinatura
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-zinc-500">MRR</p>
                <p className="text-sm font-mono text-white mt-1">
                  {data.mrrValue !== null
                    ? `R$ ${data.mrrValue.toLocaleString("pt-BR")}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Vencimento</p>
                <p className="text-sm font-mono text-white mt-1">
                  {data.dueDate
                    ? new Date(data.dueDate).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Organização</p>
                <p className="text-sm font-mono text-white mt-1">
                  {data.organizationName}
                </p>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* Timeline de Onboarding Interativa */}
          {/* ============================================ */}
          <OnboardingTimeline />
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-zinc-500">
            Nenhum dado disponível no momento.
          </p>
        </div>
      )}
    </div>
  );
}
