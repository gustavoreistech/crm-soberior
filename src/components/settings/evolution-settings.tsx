"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceCard } from "./service-card";
import { testEvolutionConnection } from "@/lib/evolution-api";
import { MessageCircle } from "lucide-react";

interface EvolutionSettingsProps {
  initialUrl: string | null;
  initialKey: string | null;
  onSave: (data: { apiUrl: string; apiKey: string }) => Promise<void>;
}

export function EvolutionSettings({
  initialUrl,
  initialKey,
  onSave,
}: EvolutionSettingsProps) {
  const [apiUrl, setApiUrl] = useState(initialUrl || "");
  const [apiKey, setApiKey] = useState(initialKey || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!apiUrl || !apiKey) return;
    setSaving(true);
    await onSave({ apiUrl, apiKey });
    setSaving(false);
  };

  return (
    <ServiceCard
      title="Evolution API"
      description="WhatsApp API para envio de códigos 2FA"
      icon={<MessageCircle className="w-5 h-5 text-[#22C55E]" />}
      configured={!!initialUrl && !!initialKey}
      onTest={() => testEvolutionConnection(apiUrl, apiKey)}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="evo-url" className="text-[#94A3B8] text-xs">
            URL da Instância
          </Label>
          <Input
            id="evo-url"
            type="url"
            placeholder="https://evo.seudominio.com"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="evo-key" className="text-[#94A3B8] text-xs">
            API Key
          </Label>
          <Input
            id="evo-key"
            type="password"
            placeholder="Sua API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !apiUrl || !apiKey}
          className="w-full py-2 px-4 rounded-lg bg-[#F2C14E] text-[#0B1320] font-medium text-sm hover:bg-[#F2C14E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Salvando..." : "Salvar Configuração"}
        </button>
      </div>
    </ServiceCard>
  );
}
