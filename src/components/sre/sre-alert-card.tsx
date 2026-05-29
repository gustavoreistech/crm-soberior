"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Globe,
  Ban,
  Building2,
  CreditCard,
  Calendar,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SREAlert } from "@/types/sre";

interface SREAlertCardProps {
  alert: SREAlert;
}

const severityConfig = {
  CRITICAL: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    glow: "shadow-red-500/10",
    icon: AlertTriangle,
  },
  WARNING: {
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/10",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    glow: "shadow-yellow-500/10",
    icon: AlertTriangle,
  },
  INFO: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    glow: "shadow-blue-500/10",
    icon: Globe,
  },
};

const typeLabels: Record<string, string> = {
  KILL_SWITCH_EMINENT: "Kill Switch Eminente",
  KILL_SWITCH_ACTIVE: "Kill Switch Ativo",
  SUBDOMAIN_DOWN: "Queda de Subdomínio",
};

const typeIcons: Record<string, React.ElementType> = {
  KILL_SWITCH_EMINENT: Ban,
  KILL_SWITCH_ACTIVE: Ban,
  SUBDOMAIN_DOWN: Globe,
};

export function SREAlertCard({ alert }: SREAlertCardProps) {
  const config = severityConfig[alert.severity];
  const TypeIcon = typeIcons[alert.type];
  const AlertIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "p-4 rounded-lg border bg-zinc-900/80 backdrop-blur-sm",
        config.border,
        `shadow-sm ${config.glow}`
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone de Severidade */}
        <div
          className={cn(
            "p-2 rounded-full shrink-0",
            config.bg
          )}
        >
          <AlertIcon className={`w-5 h-5 ${
            alert.severity === "CRITICAL"
              ? "text-red-400"
              : alert.severity === "WARNING"
              ? "text-yellow-400"
              : "text-blue-400"
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
              config.badge
            )}>
              <TypeIcon className="w-3 h-3" />
              {typeLabels[alert.type]}
            </span>
            <span className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
              alert.severity === "CRITICAL"
                ? "text-red-400"
                : alert.severity === "WARNING"
                ? "text-yellow-400"
                : "text-blue-400"
            )}>
              {alert.severity}
            </span>
          </div>

          {/* Mensagem */}
          <p className="text-sm text-zinc-300 leading-relaxed">
            {alert.message}
          </p>

          {/* Info Grid */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span className="truncate max-w-[160px]">
                {alert.organizationName}
              </span>
            </div>

            {alert.mrrValue !== null && (
              <div className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                <span>
                  R$ {alert.mrrValue.toLocaleString("pt-BR")}
                </span>
              </div>
            )}

            {alert.daysOverdue !== undefined && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{alert.daysOverdue} dias úteis</span>
              </div>
            )}

            {alert.uptimeStatus !== undefined && (
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span className={cn(
                  alert.uptimeStatus! < 80
                    ? "text-red-400"
                    : alert.uptimeStatus! < 90
                    ? "text-yellow-400"
                    : "text-emerald-400"
                )}>
                  {alert.uptimeStatus}% uptime
                </span>
              </div>
            )}

            {alert.planType && (
              <span className="text-[10px] text-zinc-600 font-mono">
                {alert.planType}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
