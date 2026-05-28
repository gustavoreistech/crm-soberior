"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { DeepSeekSettings } from "@/components/settings/deepseek-settings";
import { EvolutionSettings } from "@/components/settings/evolution-settings";
import { AsaasSettings } from "@/components/settings/asaas-settings";
import { N8nSettings } from "@/components/settings/n8n-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Database } from "lucide-react";

interface ConfigStatus {
  configured: boolean;
  services: {
    deepseek: { configured: boolean; key_preview: string | null };
    evolution: {
      configured: boolean;
      url_preview: string | null;
      key_preview: string | null;
    };
    asaas: { configured: boolean; key_preview: string | null };
    n8n: { configured: boolean; key_preview: string | null };
  };
}

export default function SettingsPage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleStatus, setGoogleStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      const response = await fetch("/api/config");
      const data = await response.json();

      if (data.success) {
        setConfigStatus(data.data);
      }
    } catch (error) {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, []);

  const checkGoogleSheet = useCallback(async () => {
    try {
      const response = await fetch("/api/config");
      if (response.ok) {
        setGoogleStatus({ ok: true, message: "Google Sheets conectado" });
      } else {
        setGoogleStatus({
          ok: false,
          message: "Falha na conexão com Google Sheets",
        });
      }
    } catch {
      setGoogleStatus({
        ok: false,
        message: "Erro ao conectar com Google Sheets",
      });
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    checkGoogleSheet();
  }, [fetchConfigs, checkGoogleSheet]);

  const handleSave = async (
    service: string,
    data: Record<string, string>
  ) => {
    try {
      const response = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [service]: data }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${service} configurado com sucesso!`);
        fetchConfigs();
      } else {
        toast.error(result.error || "Erro ao salvar");
      }
    } catch {
      toast.error("Erro de rede ao salvar configuração");
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1320]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Configurações"
          description="Gerencie as integrações do sistema"
        />

        <main className="flex-1 overflow-y-auto p-8">
          {/* Google Sheets Status */}
          <div className="mb-8">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-[#143D59] border border-[#1E293B]">
              <Database className="w-5 h-5 text-[#1F7A8C]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Google Sheets
                </p>
                <p className="text-xs text-[#94A3B8]">
                  Conexão bootstrap via .env.local
                </p>
              </div>
              {googleStatus ? (
                <div className="flex items-center gap-2">
                  {googleStatus.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span
                    className={`text-xs font-mono ${
                      googleStatus.ok ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {googleStatus.message}
                  </span>
                </div>
              ) : (
                <Skeleton className="w-40 h-5 bg-[#0B1320]" />
              )}
            </div>
          </div>

          {/* Config Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 rounded-lg bg-[#143D59] space-y-4">
                  <Skeleton className="w-3/4 h-6 bg-[#0B1320]" />
                  <Skeleton className="w-full h-10 bg-[#0B1320]" />
                  <Skeleton className="w-full h-10 bg-[#0B1320]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DeepSeekSettings
                initialApiKey={configStatus?.services.deepseek.key_preview || null}
                initialModel={null}
                onSave={(data) => handleSave("deepseek", data)}
              />

              <EvolutionSettings
                initialUrl={configStatus?.services.evolution.url_preview || null}
                initialKey={configStatus?.services.evolution.key_preview || null}
                onSave={(data) => handleSave("evolution", data)}
              />

              <AsaasSettings
                initialKey={configStatus?.services.asaas.key_preview || null}
                onSave={(data) => handleSave("asaas", data)}
              />

              <N8nSettings
                initialSecret={configStatus?.services.n8n.key_preview || null}
                onSave={(data) => handleSave("n8n", data)}
              />
            </div>
          )}

          {/* Config Summary */}
          {configStatus && (
            <div className="mt-8 p-4 rounded-lg bg-[#143D59] border border-[#1E293B]">
              <p className="text-sm text-[#94A3B8]">
                Status do sistema:{" "}
                <span
                  className={`font-mono font-bold ${
                    configStatus.configured
                      ? "text-green-400"
                      : "text-[#F2C14E]"
                  }`}
                >
                  {configStatus.configured
                    ? "Totalmente configurado"
                    : "Configuração pendente"}
                </span>
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                {configStatus.configured
                  ? "Todas as integrações estão prontas para uso."
                  : "Configure todos os serviços acima para ativar as funcionalidades completas do sistema."}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
