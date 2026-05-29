"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  CreditCard,
  ShieldCheck,
  Activity,
  Loader2,
} from "lucide-react";

interface PortalDashboardData {
  organizationName: string;
  projectStage: string | null;
  uptimeStatus: number | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  mrrValue: number | null;
  dueDate: string | null;
}

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

  return (
    <div className="min-h-screen bg-[#0B1320] p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Olá, {session?.user?.name || "Cliente"}
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Bem-vindo ao portal do cliente SOBERIOR
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#F2C14E]" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[#143D59] border border-[#1E293B]">
              <div className="flex items-center gap-2 text-[#64748B] text-xs mb-2">
                <BarChart3 className="w-4 h-4" />
                <span>Estágio do Projeto</span>
              </div>
              <p className="text-lg font-bold text-white">
                {data.projectStage || "—"}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#143D59] border border-[#1E293B]">
              <div className="flex items-center gap-2 text-[#64748B] text-xs mb-2">
                <Activity className="w-4 h-4" />
                <span>Uptime</span>
              </div>
              <p className="text-lg font-bold text-[#10B981]">
                {data.uptimeStatus !== null
                  ? `${data.uptimeStatus}%`
                  : "—"}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#143D59] border border-[#1E293B]">
              <div className="flex items-center gap-2 text-[#64748B] text-xs mb-2">
                <CreditCard className="w-4 h-4" />
                <span>Plano</span>
              </div>
              <p className="text-lg font-bold text-white">
                {data.subscriptionPlan || "—"}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#143D59] border border-[#1E293B]">
              <div className="flex items-center gap-2 text-[#64748B] text-xs mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Status</span>
              </div>
              <p
                className={`text-lg font-bold ${
                  data.subscriptionStatus === "ACTIVE"
                    ? "text-[#10B981]"
                    : data.subscriptionStatus === "OVERDUE"
                    ? "text-[#EF4444]"
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

          {/* Detalhes da Assinatura */}
          <div className="p-6 rounded-lg bg-[#143D59] border border-[#1E293B]">
            <h3 className="text-sm font-medium text-[#F2C14E] mb-4">
              Detalhes da Assinatura
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#64748B]">MRR</p>
                <p className="text-sm font-mono text-white mt-1">
                  {data.mrrValue !== null
                    ? `R$ ${data.mrrValue.toLocaleString("pt-BR")}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748B]">Vencimento</p>
                <p className="text-sm font-mono text-white mt-1">
                  {data.dueDate
                    ? new Date(data.dueDate).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748B]">Organização</p>
                <p className="text-sm font-mono text-white mt-1">
                  {data.organizationName}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-[#64748B]">
            Nenhum dado disponível no momento.
          </p>
        </div>
      )}
    </div>
  );
}
