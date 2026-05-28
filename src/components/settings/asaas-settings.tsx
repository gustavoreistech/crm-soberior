"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceCard } from "./service-card";
import { CreditCard } from "lucide-react";

interface AsaasSettingsProps {
  initialKey: string | null;
  onSave: (data: { apiKey: string }) => Promise<void>;
}

export function AsaasSettings({
  initialKey,
  onSave,
}: AsaasSettingsProps) {
  const [apiKey, setApiKey] = useState(initialKey || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey) return;
    setSaving(true);
    await onSave({ apiKey });
    setSaving(false);
  };

  return (
    <ServiceCard
      title="Asaas"
      description="Gateway de pagamento para webhooks de inadimplência"
      icon={<CreditCard className="w-5 h-5 text-[#F2C14E]" />}
      configured={!!initialKey}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="asaas-key" className="text-[#94A3B8] text-xs">
            API Key
          </Label>
          <Input
            id="asaas-key"
            type="password"
            placeholder="$aas_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !apiKey}
          className="w-full py-2 px-4 rounded-lg bg-[#F2C14E] text-[#0B1320] font-medium text-sm hover:bg-[#F2C14E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Salvando..." : "Salvar Configuração"}
        </button>
      </div>
    </ServiceCard>
  );
}
