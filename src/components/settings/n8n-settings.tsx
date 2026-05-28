"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceCard } from "./service-card";
import { Webhook } from "lucide-react";

interface N8nSettingsProps {
  initialSecret: string | null;
  onSave: (data: { webhookSecret: string }) => Promise<void>;
}

export function N8nSettings({
  initialSecret,
  onSave,
}: N8nSettingsProps) {
  const [webhookSecret, setWebhookSecret] = useState(initialSecret || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!webhookSecret) return;
    setSaving(true);
    await onSave({ webhookSecret });
    setSaving(false);
  };

  return (
    <ServiceCard
      title="n8n"
      description="Automação para receber leads raspados via webhook"
      icon={<Webhook className="w-5 h-5 text-[#1F7A8C]" />}
      configured={!!initialSecret}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="n8n-secret" className="text-[#94A3B8] text-xs">
            Webhook Secret
          </Label>
          <Input
            id="n8n-secret"
            type="password"
            placeholder="Seu secret compartilhado"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !webhookSecret}
          className="w-full py-2 px-4 rounded-lg bg-[#F2C14E] text-[#0B1320] font-medium text-sm hover:bg-[#F2C14E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Salvando..." : "Salvar Configuração"}
        </button>
      </div>
    </ServiceCard>
  );
}
