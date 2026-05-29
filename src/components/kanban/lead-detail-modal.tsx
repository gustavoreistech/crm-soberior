"use client";

import { useState } from "react";
import { Lead } from "@/types/lead";
import { STATUS_FUNIL_COLORS } from "@/config/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Globe,
  Target,
  TrendingUp,
  BadgeCheck,
  FileText,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  /** Callback disparado quando o lead é atualizado (ex: enrich, mudança de status) */
  onLeadUpdate?: (updatedLead: Lead) => void;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailModal({
  lead,
  open,
  onLeadUpdate,
  onOpenChange,
}: LeadDetailModalProps) {
  const [enriching, setEnriching] = useState(false);
  const [approving, setApproving] = useState(false);

  // Early return se não há lead — após este ponto, "lead" é não-nulo
  if (!lead) return null;

  // Referência local estável para uso dentro de closures assíncronas
  const currentLead: Lead = lead;

  const statusColor = STATUS_FUNIL_COLORS[currentLead.status] || "#1E3A5F";

  /** Analisa o lead com DeepSeek e atualiza score/lostRevenue */
  async function handleEnrichLead() {
    setEnriching(true);
    const toastId = toast.loading("Analisando lead com DeepSeek...");

    try {
      const response = await fetch("/api/ai/enrich-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: currentLead.id }),
      });

      const result: {
        success: boolean;
        data?: { score: number; lostRevenue: number };
        error?: string;
      } = await response.json();

      if (!result.success || !result.data) {
        toast.error(result.error || "Falha ao analisar lead", { id: toastId });
        return;
      }

      toast.success("Lead analisado com sucesso!", { id: toastId });

      // Notifica o board (pai) sobre a atualização de score/lostRevenue
      onLeadUpdate?.({
        ...currentLead,
        score: result.data.score,
        lostRevenue: result.data.lostRevenue,
      });
    } catch (error) {
      console.error("[enrich-lead] Erro de rede:", error);
      toast.error("Erro de rede ao analisar lead", { id: toastId });
    } finally {
      setEnriching(false);
    }
  }

  /** Aprova o lead (WON) e dispara a esteira de onboarding no n8n */
  async function handleApproveAndOnboarding() {
    setApproving(true);
    const toastId = toast.loading(
      "Aprovando lead e iniciando onboarding..."
    );

    try {
      // 1. Atualiza o status para "Fechado/Ganho" (CLOSED_WON)
      const statusResponse = await fetch(
        `/api/leads/${currentLead.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Fechado/Ganho" }),
        }
      );

      const statusResult: {
        success: boolean;
        data?: { status: string };
        error?: string;
      } = await statusResponse.json();

      if (!statusResult.success || !statusResult.data) {
        toast.error(
          statusResult.error || "Falha ao atualizar status do lead",
          { id: toastId }
        );
        return;
      }

      // 2. Dispara o onboarding no n8n
      const onboardingResponse = await fetch(
        "/api/projects/trigger-onboarding",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: currentLead.organizationId,
          }),
        }
      );

      const onboardingResult: {
        success: boolean;
        error?: string;
      } = await onboardingResponse.json();

      if (!onboardingResult.success) {
        toast.error(
          onboardingResult.error || "Falha ao iniciar onboarding",
          { id: toastId }
        );
        return;
      }

      toast.success(
        "Lead aprovado e onboarding iniciado com sucesso!",
        { id: toastId }
      );

      // Notifica o board sobre a mudança de status
      onLeadUpdate?.({
        ...currentLead,
        status: statusResult.data.status as Lead["status"],
      });
    } catch (error) {
      console.error("[approve] Erro de rede:", error);
      toast.error("Erro de rede ao aprovar lead", { id: toastId });
    } finally {
      setApproving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#143D59] border-[#1E293B] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <span>{lead.organization.name}</span>
            <span className="text-sm text-[#64748B] font-normal">
              #{lead.id.slice(0, 8)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-sm font-medium">{lead.status}</span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
              <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresa</span>
              </div>
              <p className="text-sm text-white">{lead.organization.name}</p>
            </div>

            {lead.organization.domain && (
              <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
                <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Domínio</span>
                </div>
                <p className="text-sm text-white truncate">
                  {lead.organization.domain}
                </p>
              </div>
            )}

            {lead.organization.cnpj && (
              <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
                <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  <span>CNPJ</span>
                </div>
                <p className="text-sm font-mono text-white">
                  {lead.organization.cnpj}
                </p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
              <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Ativo</span>
              </div>
              <p className="text-sm font-mono text-white">
                {lead.organization.isActive ? "Sim" : "Não"}
              </p>
            </div>
          </div>

          {/* Metrics */}
          {(lead.score !== null || lead.lostRevenue !== null) && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                Métricas
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {lead.score !== null && (
                  <div className="p-3 rounded-lg bg-[#0B1320] text-center">
                    <div className="flex justify-center mb-1">
                      <Target className="w-4 h-4 text-[#F2C14E]" />
                    </div>
                    <p className="text-lg font-mono text-[#F2C14E] font-bold">
                      {lead.score}
                    </p>
                    <p className="text-[10px] text-[#64748B]">Score</p>
                  </div>
                )}

                {lead.lostRevenue !== null && (
                  <div className="p-3 rounded-lg bg-[#0B1320] text-center">
                    <div className="flex justify-center mb-1">
                      <TrendingUp className="w-4 h-4 text-[#EF4444]" />
                    </div>
                    <p className="text-lg font-mono text-[#EF4444] font-bold">
                      R$ {lead.lostRevenue.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      Receita Perdida
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#1E293B]">
            {lead.score === null && (
              <Button
                variant="outline"
                className="w-full border-[#F2C14E] text-[#F2C14E] hover:bg-[#F2C14E]/10"
                onClick={handleEnrichLead}
                disabled={enriching}
              >
                {enriching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analisar com IA (DeepSeek)
                  </>
                )}
              </Button>
            )}

            {lead.status !== "Fechado/Ganho" &&
              lead.status !== "Onboarding" && (
                <Button
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white"
                  onClick={handleApproveAndOnboarding}
                  disabled={approving || enriching}
                >
                  {approving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Aprovando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprovar e Iniciar Onboarding
                    </>
                  )}
                </Button>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
