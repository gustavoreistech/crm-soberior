"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import {
  CreditCard,
  Download,
  Loader2,
  Receipt,
  AlertCircle,
} from "lucide-react";

interface Invoice {
  id: string;
  asaasId: string;
  planType: string;
  mrrValue: number;
  status: string;
  dueDate: string;
}

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: "Ativo",
      PENDING: "Pendente",
      OVERDUE: "Vencido",
      CANCELED: "Cancelado",
      PAID: "Pago",
    };
    return map[status] || status;
  }

  function getStatusColor(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: "text-[#10B981]",
      PENDING: "text-[#F2C14E]",
      OVERDUE: "text-[#EF4444]",
      CANCELED: "text-[#64748B]",
      PAID: "text-[#10B981]",
    };
    return map[status] || "text-[#94A3B8]";
  }

  return (
    <div className="min-h-screen bg-[#0B1320] p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[#F2C14E]" />
          Faturas
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Histórico de cobranças e assinaturas
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#F2C14E]" />
        </div>
      ) : invoices.length > 0 ? (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-[#143D59] border border-[#1E293B]"
            >
              <div className="p-2 rounded-lg bg-[#0B1320]">
                <Receipt className="w-5 h-5 text-[#1F7A8C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {inv.planType}
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Vencimento:{" "}
                  {new Date(inv.dueDate).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-white">
                  R$ {inv.mrrValue.toLocaleString("pt-BR")}
                </p>
                <p
                  className={`text-xs font-medium mt-0.5 ${getStatusColor(
                    inv.status
                  )}`}
                >
                  {getStatusLabel(inv.status)}
                </p>
              </div>
              {inv.status === "OVERDUE" && (
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                </div>
              )}
              <button className="p-2 rounded-lg hover:bg-[#0B1320] transition-colors">
                <Download className="w-4 h-4 text-[#94A3B8]" />
              </button>
            </div>
          ))}
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
