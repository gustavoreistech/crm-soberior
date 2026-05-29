"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AnalyticsData } from "@/types/portal";
import { TrendingUp, Activity, Loader2 } from "lucide-react";

interface DashboardChartsProps {
  organizationId: string;
}

/** Tooltip customizado para os gráficos */
function ChartTooltip({
  active,
  payload,
  label,
  format,
  suffix,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  format?: (v: number) => string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-sm font-bold font-mono text-[#F2C14E]">
        {format ? format(payload[0].value) : payload[0].value}
        {suffix && <span className="text-zinc-400 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

export function DashboardCharts({ organizationId }: DashboardChartsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/portal/analytics");
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error ?? "Erro ao carregar analytics");
        }
      } catch (err) {
        setError("Erro de conexão ao buscar analytics");
        console.error("[dashboard-charts] Erro:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#F2C14E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const formatRoas = (value: number) => `R$ ${value.toFixed(2)}`;
  const formatNumber = (value: number) =>
    value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  const roasData = data.roasDaily?.length > 0 ? data.roasDaily : [];
  const eventsData = data.eventsDaily?.length > 0 ? data.eventsDaily : [];

  // Se não há dados do ClickHouse, mostrar estado vazio
  if (roasData.length === 0 && eventsData.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
        <Activity className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">
          Dados analíticos indisponíveis no momento.
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          Os dados serão exibidos assim que o ClickHouse receber eventos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-3">
            <TrendingUp className="w-4 h-4 text-[#F2C14E]" />
            <span>ROAS Médio (Mês)</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#F2C14E]">
            {formatRoas(data.roasMonthly)}
          </p>
        </div>

        <div className="p-5 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-3">
            <Activity className="w-4 h-4 text-[#1F7A8C]" />
            <span>Total de Eventos (Mês)</span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#1F7A8C]">
            {formatNumber(data.totalEvents)}
          </p>
        </div>
      </div>

      {/* Gráfico de ROAS (Área) */}
      {roasData.length > 0 && (
        <div className="p-5 rounded-lg bg-zinc-900 border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">
            ROAS — Últimos 30 Dias
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roasData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="roasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2C14E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F2C14E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#27272a" }}
                  tickFormatter={(val: string) => {
                    const d = new Date(val);
                    return d.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    });
                  }}
                />
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#27272a" }}
                  tickFormatter={(val: number) => `R$${val.toFixed(1)}`}
                />
                <Tooltip
                  content={
                    <ChartTooltip format={formatRoas} />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="roas"
                  stroke="#F2C14E"
                  strokeWidth={2}
                  fill="url(#roasGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gráfico de Eventos (Barra) */}
      {eventsData.length > 0 && (
        <div className="p-5 rounded-lg bg-zinc-900 border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">
            Eventos Processados — Últimos 30 Dias
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventsData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#27272a" }}
                  tickFormatter={(val: string) => {
                    const d = new Date(val);
                    return d.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    });
                  }}
                />
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#27272a" }}
                  tickFormatter={(val: number) => formatNumber(val)}
                />
                <Tooltip
                  content={<ChartTooltip suffix="eventos" />}
                />
                <Bar
                  dataKey="events"
                  fill="#1F7A8C"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
