"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SoberiorCopilot } from "@/components/copilot/soberior-copilot";
import {
  Building2,
  Globe,
  Activity,
  CreditCard,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Bot,
  Info,
  DollarSign,
  Play,
  ListChecks,
  Circle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MilestoneWithTasks } from "@/app/api/projects/[id]/route";

// ──────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  dueDate: string | null;
  completedAt: string | null;
}

export interface ProjectData {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationDomain: string | null;
  organizationCnpj: string | null;
  status: string;
  uptimeStatus: number;
  milestones: ProjectMilestone[];
  subscription: {
    planName: string | null;
    value: number | null;
    status: string | null;
  } | null;
  createdAt: string;
}

// ──────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ONBOARDING: { label: "Onboarding", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  ACTIVE: { label: "Ativo", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  CHURN: { label: "Churn", color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

const MILESTONE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Pendente", color: "text-zinc-500", icon: Clock },
  IN_PROGRESS: { label: "Em Andamento", color: "text-amber-400", icon: Loader2 },
  COMPLETED: { label: "Concluído", color: "text-emerald-400", icon: CheckCircle2 },
};

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

// ──────────────────────────────────────────
// Props
// ──────────────────────────────────────────

interface ProjectDetailModalProps {
  project: ProjectData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailModal({
  project,
  open,
  onOpenChange,
}: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [planName, setPlanName] = useState("");
  const [planValue, setPlanValue] = useState("");
  const [creatingSubscription, setCreatingSubscription] = useState(false);

  // Dados dinâmicos carregados da API
  const [milestones, setMilestones] = useState<MilestoneWithTasks[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [triggeringOnboarding, setTriggeringOnboarding] = useState(false);
  const [togglingTasks, setTogglingTasks] = useState<Set<string>>(new Set());

  // Carrega detalhes do projeto quando o modal abre
  const loadProjectDetail = useCallback(async (projectId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMilestones(json.data.milestones ?? []);
      }
    } catch (err) {
      console.error("[project-detail] Erro ao carregar detalhes:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (open && project?.id) {
      loadProjectDetail(project.id);
    }
  }, [open, project?.id, loadProjectDetail]);

  if (!project) return null;

  const currentProject = project;

  const stageConfig = STATUS_CONFIG[currentProject.status] ?? {
    label: currentProject.status,
    color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  };

  const hasSubscription = !!currentProject.subscription;

  async function handleCreateSubscription() {
    if (!planName || !planValue) {
      toast.error("Preencha o nome do plano e o valor");
      return;
    }

    const value = parseFloat(planValue.replace(",", "."));
    if (isNaN(value) || value <= 0) {
      toast.error("Valor inválido");
      return;
    }

    setCreatingSubscription(true);
    const toastId = toast.loading("Criando assinatura no Asaas...");

    try {
      const response = await fetch("/api/finance/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: currentProject.organizationId,
          planName,
          value,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Falha ao criar assinatura", { id: toastId });
        return;
      }

      toast.success("Assinatura criada com sucesso no Asaas!", { id: toastId });
      setPlanName("");
      setPlanValue("");
    } catch (error) {
      console.error("[finance] Erro ao criar subscrição:", error);
      toast.error("Erro de rede ao criar assinatura", { id: toastId });
    } finally {
      setCreatingSubscription(false);
    }
  }

  async function handleTriggerOnboarding() {
    setTriggeringOnboarding(true);
    const toastId = toast.loading("Disparando onboarding técnico...");

    try {
      const res = await fetch("/api/projects/trigger-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: currentProject.organizationId,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        toast.error(json.error || "Erro ao disparar onboarding", { id: toastId });
        return;
      }

      toast.success("Onboarding técnico iniciado com sucesso!", { id: toastId });
      // Recarrega os detalhes para mostrar os milestones criados
      loadProjectDetail(currentProject.id);
    } catch (err) {
      console.error("[project-detail] Erro no trigger onboarding:", err);
      toast.error("Erro de rede ao disparar onboarding", { id: toastId });
    } finally {
      setTriggeringOnboarding(false);
    }
  }

  async function handleToggleTask(taskId: string) {
    setTogglingTasks((prev) => new Set(prev).add(taskId));
    try {
      const res = await fetch(
        `/api/projects/${currentProject.id}/tasks/${taskId}`,
        { method: "PATCH" }
      );
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error || "Erro ao atualizar tarefa");
        return;
      }

      // Atualiza localmente o estado da task
      setMilestones((prev) =>
        prev.map((ms) => ({
          ...ms,
          tasks: ms.tasks.map((t) =>
            t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
          ),
        }))
      );

      toast.success(json.message);
    } catch (err) {
      console.error("[project-detail] Erro ao toggle task:", err);
      toast.error("Erro de rede ao atualizar tarefa");
    } finally {
      setTogglingTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }

  // Calcula progresso dos milestones
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(
    (m) => m.status === "COMPLETED"
  ).length;
  const progress =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  <span>{project.organizationName}</span>
                  <span className="text-sm text-[#64748B] font-normal">
                    #{project.id.slice(0, 8)}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList variant="line" className="w-full border-b border-zinc-800">
                  <TabsTrigger value="info" className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Informações
                  </TabsTrigger>
                  <TabsTrigger value="onboarding" className="flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5" />
                    Onboarding
                    {totalMilestones > 0 && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        {completedMilestones}/{totalMilestones}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="financeiro" className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Financeiro
                  </TabsTrigger>
                  <TabsTrigger value="copilot" className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    Soberior Copilot
                  </TabsTrigger>
                </TabsList>

                {/* ─── Tab: Informações ─── */}
                <TabsContent value="info" className="mt-4">
                  <div className="space-y-4">
                    {/* Status Badge + Trigger Onboarding */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                          stageConfig.color
                        )}
                      >
                        {stageConfig.label}
                      </span>

                      {currentProject.status === "ONBOARDING" && milestones.length === 0 && (
                        <button
                          onClick={handleTriggerOnboarding}
                          disabled={triggeringOnboarding}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2C14E] text-[#0B1320] text-xs font-medium hover:bg-[#F2C14E]/90 transition-colors disabled:opacity-50"
                        >
                          {triggeringOnboarding ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          {triggeringOnboarding
                            ? "Iniciando..."
                            : "Iniciar Onboarding Técnico"}
                        </button>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-zinc-950 space-y-1">
                        <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Empresa</span>
                        </div>
                        <p className="text-sm text-white">{project.organizationName}</p>
                      </div>

                      {project.organizationDomain && (
                        <div className="p-3 rounded-lg bg-zinc-950 space-y-1">
                          <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Domínio</span>
                          </div>
                          <p className="text-sm text-white truncate">
                            {project.organizationDomain}
                          </p>
                        </div>
                      )}

                      {project.organizationCnpj && (
                        <div className="p-3 rounded-lg bg-zinc-950 space-y-1">
                          <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>CNPJ</span>
                          </div>
                          <p className="text-sm font-mono text-white">
                            {project.organizationCnpj}
                          </p>
                        </div>
                      )}

                      <div className="p-3 rounded-lg bg-zinc-950 space-y-1">
                        <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                          <Activity className="w-3.5 h-3.5" />
                          <span>Uptime</span>
                        </div>
                        <p
                          className={cn(
                            "text-lg font-mono font-bold",
                            project.uptimeStatus >= 95
                              ? "text-emerald-400"
                              : project.uptimeStatus >= 80
                              ? "text-[#F2C14E]"
                              : "text-red-400"
                          )}
                        >
                          {project.uptimeStatus}%
                        </p>
                      </div>
                    </div>

                    {/* Subscription Info */}
                    {project.subscription && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Assinatura
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-zinc-950">
                            <p className="text-[10px] text-[#64748B]">Plano</p>
                            <p className="text-sm font-mono text-white mt-0.5">
                              {project.subscription.planName ?? "—"}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-zinc-950">
                            <p className="text-[10px] text-[#64748B]">MRR</p>
                            <p className="text-sm font-mono text-[#F2C14E] mt-0.5">
                              {project.subscription.value !== null
                                ? `R$ ${project.subscription.value.toLocaleString("pt-BR")}`
                                : "—"}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-zinc-950">
                            <p className="text-[10px] text-[#64748B]">Status</p>
                            <p
                              className={cn(
                                "text-sm font-mono mt-0.5",
                                project.subscription.status === "ACTIVE"
                                  ? "text-emerald-400"
                                  : project.subscription.status === "PAST_DUE" ||
                                    project.subscription.status === "OVERDUE"
                                  ? "text-red-400"
                                  : "text-zinc-400"
                              )}
                            >
                              {project.subscription.status === "ACTIVE"
                                ? "Ativo"
                                : project.subscription.status === "PAST_DUE"
                                ? "Inadimplente"
                                : project.subscription.status === "OVERDUE"
                                ? "Vencido"
                                : project.subscription.status ?? "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ─── Tab: Onboarding (Milestones + Tasks) ─── */}
                <TabsContent value="onboarding" className="mt-4">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-[#F2C14E]" />
                    </div>
                  ) : milestones.length > 0 ? (
                    <div className="space-y-4">
                      {/* Barra de Progresso */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500 font-mono">
                          {completedMilestones}/{totalMilestones} milestones · {progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-6 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            progress === 100
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-[#F2C14E] to-[#1F7A8C]"
                          )}
                        />
                      </div>

                      {/* Lista de Milestones com Tasks */}
                      <div className="space-y-3">
                        {milestones.map((ms, idx) => {
                          const msConfig =
                            MILESTONE_STATUS_CONFIG[ms.status] ?? {
                              label: ms.status,
                              color: "text-zinc-500",
                              icon: Clock,
                            };
                          const MsIcon = msConfig.icon;
                          const allTasksDone =
                            ms.tasks.length > 0 &&
                            ms.tasks.every((t) => t.isCompleted);

                          return (
                            <div
                              key={ms.id}
                              className={cn(
                                "rounded-lg border transition-all",
                                ms.status === "COMPLETED"
                                  ? "bg-emerald-500/5 border-emerald-500/20"
                                  : ms.status === "IN_PROGRESS"
                                  ? "bg-amber-500/5 border-amber-500/20"
                                  : "bg-zinc-950 border-zinc-800"
                              )}
                            >
                              {/* Header do Milestone */}
                              <div className="flex items-start gap-3 p-3">
                                <MsIcon
                                  className={cn(
                                    "w-5 h-5 mt-0.5 shrink-0",
                                    ms.status === "COMPLETED"
                                      ? "text-emerald-400"
                                      : ms.status === "IN_PROGRESS"
                                      ? "text-amber-400 animate-spin"
                                      : "text-zinc-500"
                                  )}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-medium text-zinc-200">
                                        {idx + 1}. {ms.title}
                                      </p>
                                      <span
                                        className={cn(
                                          "text-[10px] font-medium",
                                          msConfig.color
                                        )}
                                      >
                                        {msConfig.label}
                                      </span>
                                    </div>
                                    {ms.completedAt && (
                                      <span className="text-[10px] text-zinc-600 shrink-0">
                                        {formatDate(ms.completedAt)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Tasks do Milestone */}
                                  {ms.tasks.length > 0 && (
                                    <div className="mt-2 space-y-1 pl-1">
                                      {ms.tasks.map((task) => (
                                        <div
                                          key={task.id}
                                          className="flex items-center gap-2 py-1"
                                        >
                                          <button
                                            onClick={() =>
                                              handleToggleTask(task.id)
                                            }
                                            disabled={togglingTasks.has(task.id)}
                                            className={cn(
                                              "shrink-0 transition-colors",
                                              task.isCompleted
                                                ? "text-emerald-400 hover:text-emerald-300"
                                                : "text-zinc-600 hover:text-zinc-400"
                                            )}
                                          >
                                            {togglingTasks.has(task.id) ? (
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : task.isCompleted ? (
                                              <CheckCircle className="w-4 h-4" />
                                            ) : (
                                              <Circle className="w-4 h-4" />
                                            )}
                                          </button>
                                          <span
                                            className={cn(
                                              "text-xs",
                                              task.isCompleted
                                                ? "text-zinc-500 line-through"
                                                : "text-zinc-300"
                                            )}
                                          >
                                            {task.title}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Badge "All Tasks Done" */}
                                  {allTasksDone &&
                                    ms.status !== "COMPLETED" && (
                                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] text-emerald-400">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Todas as tarefas concluídas (aguardando n8n)
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ListChecks className="w-8 h-8 text-zinc-700 mb-2" />
                      <p className="text-sm text-zinc-500">
                        Nenhum milestone de onboarding encontrado.
                      </p>
                      {currentProject.status === "ONBOARDING" && (
                        <>
                          <p className="text-xs text-zinc-600 mt-1">
                            Clique em &ldquo;Iniciar Onboarding Técnico&rdquo; na
                            aba Informações para começar.
                          </p>
                          <button
                            onClick={handleTriggerOnboarding}
                            disabled={triggeringOnboarding}
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F2C14E] text-[#0B1320] text-sm font-medium hover:bg-[#F2C14E]/90 transition-colors disabled:opacity-50"
                          >
                            {triggeringOnboarding ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            Iniciar Onboarding
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ─── Tab: Financeiro ─── */}
                <TabsContent value="financeiro" className="mt-4">
                  <div className="space-y-4">
                    {hasSubscription && (
                      <div className="p-4 rounded-lg bg-zinc-950 space-y-3">
                        <h4 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Assinatura Atual
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-[#64748B]">Plano</p>
                            <p className="text-sm font-mono text-white mt-0.5">
                              {project.subscription!.planName ?? "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#64748B]">Valor</p>
                            <p className="text-sm font-mono text-[#F2C14E] mt-0.5">
                              {project.subscription!.value !== null
                                ? `R$ ${project.subscription!.value.toLocaleString("pt-BR")}`
                                : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              project.subscription!.status === "ACTIVE"
                                ? "text-emerald-400 bg-emerald-500/10"
                                : project.subscription!.status === "PAST_DUE"
                                ? "text-red-400 bg-red-500/10"
                                : "text-zinc-400 bg-zinc-500/10"
                            )}
                          >
                            {project.subscription!.status === "ACTIVE"
                              ? "Ativo"
                              : project.subscription!.status === "PAST_DUE"
                              ? "Inadimplente"
                              : project.subscription!.status ?? "—"}
                          </span>
                        </div>
                      </div>
                    )}

                    {!hasSubscription && (
                      <div className="p-4 rounded-lg bg-zinc-950 space-y-4">
                        <h4 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                          Criar Subscrição Asaas
                        </h4>

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="plan-name" className="text-[#94A3B8] text-xs">
                              Nome do Plano
                            </Label>
                            <Input
                              id="plan-name"
                              placeholder="Ex: Plano Premium"
                              value={planName}
                              onChange={(e) => setPlanName(e.target.value)}
                              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="plan-value" className="text-[#94A3B8] text-xs">
                              Valor (R$)
                            </Label>
                            <Input
                              id="plan-value"
                              type="text"
                              inputMode="decimal"
                              placeholder="199,90"
                              value={planValue}
                              onChange={(e) => setPlanValue(e.target.value)}
                              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono text-sm"
                            />
                          </div>

                          <button
                            onClick={handleCreateSubscription}
                            disabled={creatingSubscription || !planName || !planValue}
                            className="w-full py-2 px-4 rounded-lg bg-[#F2C14E] text-[#0B1320] font-medium text-sm hover:bg-[#F2C14E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {creatingSubscription ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Criando...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                Criar Subscrição Asaas
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ─── Tab: Soberior Copilot ─── */}
                <TabsContent value="copilot" className="mt-0 -mx-4 -mb-4">
                  <div className="h-[480px]">
                    <SoberiorCopilot
                      organizationId={project.organizationId}
                      contextType="PROJECT"
                      organizationName={project.organizationName}
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
