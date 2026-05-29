"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SRECommandCenterData } from "@/types/sre";
import { SREMetricsGrid } from "./sre-metrics-grid";
import { SREAlertCard } from "./sre-alert-card";

export function SRECommandCenter() {
  const [data, setData] = useState<SRECommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sre/command-center");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error ?? "Erro ao carregar dados SRE");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro de conexão ao carregar SRE"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAlerts = data?.alerts.filter((a) => {
    if (filter === "ALL") return true;
    if (filter === "CRITICAL") return a.severity === "CRITICAL";
    if (filter === "KILL_SWITCH")
      return a.type === "KILL_SWITCH_EMINENT" || a.type === "KILL_SWITCH_ACTIVE";
    if (filter === "SUBDOMAIN") return a.type === "SUBDOMAIN_DOWN";
    return true;
  });

  const criticalCount = data?.alerts.filter(
    (a) => a.severity === "CRITICAL"
  ).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <Terminal className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">
              Centro de Comando SRE
            </h2>
            <p className="text-[10px] text-zinc-500">
              Observabilidade • Kill Switch • SLA
            </p>
          </div>
          {criticalCount > 0 && (
            <div className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-medium text-red-400">
                {criticalCount} crítico(s)
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filtros */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
            {[
              { key: "ALL", label: "Todos" },
              { key: "CRITICAL", label: "Críticos" },
              { key: "KILL_SWITCH", label: "Kill Switch" },
              { key: "SUBDOMAIN", label: "Subdomínio" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors",
                  filter === f.key
                    ? "bg-zinc-800 text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            aria-label="Atualizar"
          >
            <RefreshCw
              className={cn("w-4 h-4", loading && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#F2C14E]" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Metrics Grid */}
      {data && <SREMetricsGrid data={data} />}

      {/* Alerts */}
      {data && (
        <div className="space-y-2">
          {filteredAlerts && filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <SREAlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="w-8 h-8 text-emerald-500/50 mb-2" />
              <p className="text-sm text-zinc-500">
                Nenhum alerta encontrado com este filtro.
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Todas as organizações estão operando normalmente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      {data && (
        <div className="text-[10px] text-zinc-600 font-mono text-right">
          Última atualização:{" "}
          {new Date(data.lastUpdated).toLocaleString("pt-BR")}
        </div>
      )}
    </div>
  );
}
