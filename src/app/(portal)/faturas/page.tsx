"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import {
  CreditCard,
  Loader2,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────

interface PortalInvoice {
  id: string;
  asaasId: string;
  subscriptionId: string | null;
  planName: string | null;
  value: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  dueDate: string;
  invoiceUrl: string;
}

// ──────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  PAID: {
    label: "Paga",
    color: "text-[#10B981]",
    bgColor: "bg-[#10B981]/10 border-[#10B981]/20",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "Pendente",
    color: "text-[#F2C14E]",
    bgColor: "bg-[#F2C14E]/10 border-[#F2C14E]/20",
    icon: Clock,
  },
  OVERDUE: {
    label: "Atrasada",
    color: "text-[#EF4444]",
    bgColor: "bg-[#EF4444]/10 border-[#EF4444]/20",
    icon: AlertCircle,
  },
};

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ──────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const response = await fetch("/api/portal/invoices");
        const result = await response.json();
        if (result.success) {
          setInvoices(result.data);
        }
      } catch (error) {
        console.error("[portal-faturas] Erro ao carregar faturas:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  // Calcula totais para o sumário
  const totalPending = invoices
    .filter((inv) => inv.status === "PENDING" || inv.status === "OVERDUE")
    .reduce((acc, inv) => acc + inv.value, 0);

  const overdueCount = invoices.filter((inv) => inv.status === "OVERDUE").length;

  return (
    <div className="min-h-screen bg-[#0B1320] p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[#F2C14E]" />
          Faturas
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Histórico de cobranças e assinaturas
        </p>
      </div>

      {/* Summary Cards */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-[#143D59] border border-[#1E293B]">
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider">
              Total de Faturas
            </p>
            <p className="text-lg font-mono font-bold text-white mt-1">
              {invoices.length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#143D59] border border-[#1E293B]">
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider">
              Em Aberto
            </p>
            <p className="text-lg font-mono font-bold text-[#F2C14E] mt-1">
              {formatCurrency(totalPending)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#143D59] border border-[#1E293B] col-span-2 sm:col-span-1">
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider">
              Atrasadas
            </p>
            <p className="text-lg font-mono font-bold text-[#EF4444] mt-1">
              {overdueCount} {overdueCount === 1 ? "fatura" : "faturas"}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#F2C14E]" />
        </div>
      ) : invoices.length > 0 ? (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const statusCfg = STATUS_CONFIG[inv.status] ?? {
              label: inv.status,
              color: "text-[#94A3B8]",
              bgColor: "bg-[#1E293B] border-[#1E293B]",
              icon: Receipt,
            };
            const StatusIcon = statusCfg.icon;
            const isPayable = inv.status === "PENDING" || inv.status === "OVERDUE";

            return (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-lg bg-[#143D59] border border-[#1E293B] hover:border-[#1F7A8C]/50 transition-colors"
              >
                {/* Icon */}
                <div className="p-2 rounded-lg bg-[#0B1320] shrink-0">
                  <StatusIcon className={cn("w-5 h-5", statusCfg.color)} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {inv.planName ?? "Assinatura"}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Vencimento:{" "}
                    {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {/* Value & Status */}
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm font-mono font-bold text-white">
                      {formatCurrency(inv.value)}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                        statusCfg.bgColor,
                        statusCfg.color
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Pay Button */}
                  {isPayable && (
                    <a
                      href={inv.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        inv.status === "OVERDUE"
                          ? "bg-[#EF4444] hover:bg-[#DC2626] text-white"
                          : "bg-[#F2C14E] hover:bg-[#F2C14E]/90 text-[#0B1320]"
                      )}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {inv.status === "OVERDUE" ? "Regularizar" : "Pagar Fatura"}
                      </span>
                      <span className="sm:hidden">Pagar</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Receipt className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[#64748B]">
            Nenhuma fatura encontrada.
          </p>
          <p className="text-xs text-[#475569] mt-1">
            As faturas aparecerão aqui após a ativação da assinatura.
          </p>
        </div>
      )}
    </div>
  );
}
