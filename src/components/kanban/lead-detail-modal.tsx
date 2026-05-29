"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lead, ProposalSummary, ContractSummary } from "@/types/lead";
import { STATUS_FUNIL_COLORS } from "@/config/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SoberiorCopilot } from "@/components/copilot/soberior-copilot";
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
  Bot,
  Info,
  FileSignature,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposal, setProposal] = useState<ProposalSummary | null>(null);
  const [contract, setContract] = useState<ContractSummary | null>(null);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // Early return se não há lead — após este ponto, "lead" é não-nulo
  // Busca dados de proposta/contrato quando o lead mudar
  useEffect(() => {
    if (!lead || !lead.id) return;

    async function fetchProposalData() {
      setLoadingProposal(true);
      try {
        const response = await fetch(
          `/api/leads/${currentLead.id}/proposal`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setProposal(result.data.proposal ?? null);
            setContract(result.data.contract ?? null);
          }
        }
      } catch (error) {
        console.error("[lead-detail] Erro ao buscar proposta:", error);
      } finally {
        setLoadingProposal(false);
      }
    }

    fetchProposalData();
  }, [lead?.id]);

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

  /** Gera uma proposta chamando a automação do n8n */
  async function handleGenerateProposal() {
    setGeneratingProposal(true);
    const toastId = toast.loading("Gerando proposta...");

    try {
      const response = await fetch("/api/automations/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: currentLead.id }),
      });

      const result: {
        success: boolean;
        data?: { proposalId: string; message: string };
        error?: string;
      } = await response.json();

      if (!result.success || !result.data) {
        toast.error(result.error || "Falha ao gerar proposta", { id: toastId });
        return;
      }

      toast.success(result.data.message || "Proposta enviada para fila de geração", {
        id: toastId,
      });

      // Recarrega os dados da proposta
      const reloadResponse = await fetch(`/api/leads/${currentLead.id}/proposal`);
      if (reloadResponse.ok) {
        const reloadResult = await reloadResponse.json();
        if (reloadResult.success && reloadResult.data) {
          setProposal(reloadResult.data.proposal ?? null);
          setContract(reloadResult.data.contract ?? null);
        }
      }
    } catch (error) {
      console.error("[generate-proposal] Erro de rede:", error);
      toast.error("Erro de rede ao gerar proposta", { id: toastId });
    } finally {
      setGeneratingProposal(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DialogHeader>
                <DialogTitle className="text-white text-lg flex items-center gap-2">
                  <span>{lead.organization.name}</span>
                  <span className="text-sm text-[#64748B] font-normal">
                    #{lead.id.slice(0, 8)}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList variant="line" className="w-full border-b border-zinc-800">
                  <TabsTrigger value="info" className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Informações
                  </TabsTrigger>
                  <TabsTrigger value="copilot" className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    Soberior Copilot
                  </TabsTrigger>
                </TabsList>

                {/* ─── Tab: Informações ─── */}
                <TabsContent value="info" className="mt-4">
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
                      <div className="p-3 rounded-lg bg-zinc-950 space-y-1">
                        <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Empresa</span>
                        </div>
                        <p className="text-sm text-white">{lead.organization.name}</p>
                      </div>

                      {lead.organization.domain && (
                        <div className="p-3 rounded-lg bg-zinc-950 space-y-1">
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
                        <div className="p-3 rounded-lg bg-zinc-950 space-y-1">
                          <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                            <FileText className="w-3.5 h-3.5" />
                            <span>CNPJ</span>
                          </div>
                          <p className="text-sm font-mono text-white">
                            {lead.organization.cnpj}
                          </p>
                        </div>
                      )}

                      <div className="p-3 rounded-lg bg-zinc-950 space-y-1">
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
                            <div className="p-3 rounded-lg bg-zinc-950 text-center">
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
                            <div className="p-3 rounded-lg bg-zinc-950 text-center">
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

                    {/* ─── Proposta Section ─── */}
                    {proposal && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Proposta
                        </h4>
                        <div className="p-3 rounded-lg bg-zinc-950 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white font-medium">
                              Status:{" "}
                              <span
                                className={cn(
                                  "font-mono text-xs px-2 py-0.5 rounded",
                                  proposal.status === "SENT" &&
                                    "text-[#F2C14E] bg-[#F2C14E]/10",
                                  proposal.status === "ACCEPTED" &&
                                    "text-[#22C55E] bg-[#22C55E]/10",
                                  proposal.status === "REJECTED" &&
                                    "text-[#EF4444] bg-[#EF4444]/10",
                                  proposal.status === "DRAFT" &&
                                    "text-[#64748B] bg-[#64748B]/10"
                                )}
                              >
                                {proposal.status === "DRAFT" && "Rascunho"}
                                {proposal.status === "SENT" && "Enviada"}
                                {proposal.status === "ACCEPTED" && "Aceita"}
                                {proposal.status === "REJECTED" && "Rejeitada"}
                              </span>
                            </span>
                          </div>

                          {proposal.value !== null && (
                            <p className="text-sm text-[#94A3B8]">
                              Valor:{" "}
                              <span className="text-white font-mono">
                                R$ {proposal.value.toLocaleString("pt-BR")}
                              </span>
                            </p>
                          )}

                          {proposal.status === "SENT" && proposal.pdfUrl && (
                            <div className="flex flex-col gap-2 pt-1">
                              <a
                                href={proposal.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Abrir Proposta (PDF)
                              </a>
                              <Button
                                className="w-full bg-[#F2C14E] hover:bg-[#F2C14E]/90 text-[#0B1320] font-medium"
                                onClick={async () => {
                                  // Redireciona para o portal de contrato
                                  if (contract) {
                                    window.open(
                                      `/contrato/${contract.id}`,
                                      "_blank"
                                    );
                                  } else {
                                    toast.error(
                                      "Nenhum contrato vinculado a esta proposta"
                                    );
                                  }
                                }}
                              >
                                <FileSignature className="w-4 h-4 mr-2" />
                                Aprovar Contrato
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
                      {/* Botão: Gerar Proposta */}
                      {!proposal && !loadingProposal && (
                        <Button
                          variant="outline"
                          className="w-full border-[#1F7A8C] text-[#1F7A8C] hover:bg-[#1F7A8C]/10"
                          onClick={handleGenerateProposal}
                          disabled={generatingProposal || enriching}
                        >
                          {generatingProposal ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <FileSignature className="w-4 h-4 mr-2" />
                              Gerar Proposta
                            </>
                          )}
                        </Button>
                      )}

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
                            disabled={approving || enriching || generatingProposal}
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
                </TabsContent>

                {/* ─── Tab: Soberior Copilot ─── */}
                <TabsContent value="copilot" className="mt-0 -mx-4 -mb-4">
                  <div className="h-[480px]">
                    <SoberiorCopilot
                      organizationId={currentLead.organizationId ?? ""}
                      contextType="LEAD"
                      organizationName={currentLead.organization.name}
                      variant="tab"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
