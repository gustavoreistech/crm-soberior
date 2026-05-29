"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Radio,
  Server,
  Globe,
} from "lucide-react";
import { MilestoneData } from "@/types/portal";
import { cn } from "@/lib/utils";

/** Mapeia status para ícone e cor */
const statusConfig: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  COMPLETED: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    label: "Concluído",
  },
  IN_PROGRESS: {
    icon: Loader2,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    label: "Em Andamento",
  },
  PENDING: {
    icon: Clock,
    color: "text-zinc-500",
    bgColor: "bg-zinc-800/50 border-zinc-700/50",
    label: "Pendente",
  },
};

/** Verifica se o milestone é relacionado a GTM Server-Side ou Stape */
function getMilestoneTag(title: string): "gtm" | "stape" | null {
  const lower = title.toLowerCase();
  if (
    lower.includes("gtm") ||
    lower.includes("server-side") ||
    lower.includes("container") ||
    lower.includes("tag")
  ) {
    return "gtm";
  }
  if (lower.includes("stape")) {
    return "stape";
  }
  return null;
}

function MilestoneCard({
  milestone,
  index,
}: {
  milestone: MilestoneData;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[milestone.status] ?? statusConfig.PENDING;
  const Icon = config.icon;
  const tag = getMilestoneTag(milestone.title);

  const formattedDate = milestone.completedAt
    ? new Date(milestone.completedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : milestone.dueDate
    ? new Date(milestone.dueDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={cn(
        "relative flex gap-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer group",
        config.bgColor,
        expanded ? "ring-1 ring-zinc-700" : "hover:ring-1 hover:ring-zinc-700/50"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Indicador de tag (GTM / Stape) */}
      {tag && (
        <div className="absolute -top-2 -right-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
              tag === "gtm"
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            )}
          >
            {tag === "gtm" ? (
              <Server className="w-3 h-3" />
            ) : (
              <Globe className="w-3 h-3" />
            )}
            {tag === "gtm" ? "GTM" : "Stape"}
          </span>
        </div>
      )}

      {/* Conector da Timeline */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
            milestone.status === "COMPLETED"
              ? "bg-emerald-500/20"
              : milestone.status === "IN_PROGRESS"
              ? "bg-amber-500/20"
              : "bg-zinc-800"
          )}
        >
          {milestone.status === "IN_PROGRESS" ? (
            <Icon className={cn("w-5 h-5 animate-spin", config.color)} />
          ) : (
            <Icon className={cn("w-5 h-5", config.color)} />
          )}
        </div>
        {/* Linha vertical entre milestones */}
        <div className="w-px flex-1 min-h-[24px] bg-zinc-800 mt-2" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "text-sm font-medium transition-colors",
                milestone.status === "COMPLETED"
                  ? "text-zinc-200"
                  : "text-zinc-300"
              )}
            >
              {milestone.title}
            </h4>
            <span
              className={cn(
                "text-xs mt-1 inline-block",
                config.color
              )}
            >
              {config.label}
            </span>
          </div>

          {/* Botão expandir/recolher */}
          {milestone.description && (
            <button
              className="p-1 rounded text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-colors shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Descrição expansível */}
        <AnimatePresence>
          {expanded && milestone.description && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                {milestone.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data */}
        {formattedDate && (
          <p className="text-[11px] text-zinc-600 mt-2 font-mono">
            {milestone.completedAt ? "Concluído em" : "Previsão"}: {formattedDate}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function OnboardingTimeline() {
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMilestones() {
      try {
        const response = await fetch("/api/portal/milestones");
        const result = await response.json();
        if (result.success) {
          setMilestones(result.data ?? []);
        } else {
          setError(result.error ?? "Erro ao carregar milestones");
        }
      } catch (err) {
        setError("Erro de conexão ao carregar timeline");
        console.error("[onboarding-timeline] Erro:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMilestones();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">
          Timeline de Onboarding
        </h3>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-[#F2C14E]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">
          Timeline de Onboarding
        </h3>
        <p className="text-xs text-zinc-500">{error}</p>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">
          Timeline de Onboarding
        </h3>
        <div className="text-center py-10">
          <Radio className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">
            Nenhum milestone de onboarding encontrado.
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Os milestones aparecerão aqui após o início do onboarding.
          </p>
        </div>
      </div>
    );
  }

  // Progresso
  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === "COMPLETED").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-300">
          Timeline de Onboarding
        </h3>
        <span className="text-xs text-zinc-500 font-mono">
          {completed}/{total} · {progress}%
        </span>
      </div>

      {/* Barra de Progresso */}
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

      {/* Lista de Milestones */}
      <div className="space-y-1">
        {milestones.map((milestone, index) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
