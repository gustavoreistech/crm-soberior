"use client";

import {
  Building2,
  ShieldCheck,
  Ban,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import type { SRECommandCenterData } from "@/types/sre";

interface SREMetricsGridProps {
  data: SRECommandCenterData;
}

export function SREMetricsGrid({ data }: SREMetricsGridProps) {
  const metrics = [
    {
      label: "Total de Organizações",
      value: data.totalOrganizations,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Ativas",
      value: data.activeOrganizations,
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Bloqueadas (Kill Switch)",
      value: data.blockedOrganizations,
      icon: Ban,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      label: "MRR Total",
      value: `R$ ${data.totalMRR.toLocaleString("pt-BR")}`,
      icon: TrendingUp,
      color: "text-[#F2C14E]",
      bg: "bg-[#F2C14E]/10",
      border: "border-[#F2C14E]/20",
    },
    {
      label: "MRR em Risco",
      value: `R$ ${data.atRiskMRR.toLocaleString("pt-BR")}`,
      icon: AlertTriangle,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
    {
      label: "Alertas Ativos",
      value: data.alerts.length,
      icon: AlertTriangle,
      color: data.alerts.some((a) => a.severity === "CRITICAL")
        ? "text-red-400"
        : "text-[#F2C14E]",
      bg: data.alerts.some((a) => a.severity === "CRITICAL")
        ? "bg-red-500/10"
        : "bg-[#F2C14E]/10",
      border: data.alerts.some((a) => a.severity === "CRITICAL")
        ? "border-red-500/20"
        : "border-[#F2C14E]/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className={`p-3 rounded-lg ${metric.bg} ${metric.border} border`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className={`w-4 h-4 ${metric.color}`} />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                {metric.label}
              </span>
            </div>
            <p className={`text-lg font-bold font-mono ${metric.color}`}>
              {metric.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
