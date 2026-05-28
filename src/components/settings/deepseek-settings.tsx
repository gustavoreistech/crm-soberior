"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceCard } from "./service-card";
import { testDeepSeekConnection } from "@/lib/deepseek-api";
import { Brain } from "lucide-react";

interface DeepSeekSettingsProps {
  initialApiKey: string | null;
  initialModel: string | null;
  onSave: (data: { apiKey: string; model: string }) => Promise<void>;
}

export function DeepSeekSettings({
  initialApiKey,
  initialModel,
  onSave,
}: DeepSeekSettingsProps) {
  const [apiKey, setApiKey] = useState(initialApiKey || "");
  const [model, setModel] = useState(initialModel || "deepseek-chat");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey) return;
    setSaving(true);
    await onSave({ apiKey, model });
    setSaving(false);
  };

  return (
    <ServiceCard
      title="DeepSeek API"
      description="IA para enriquecimento cognitivo de leads"
      icon={<Brain className="w-5 h-5 text-[#1F7A8C]" />}
      configured={!!initialApiKey}
      onTest={() => testDeepSeekConnection(apiKey)}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="deepseek-key" className="text-[#94A3B8] text-xs">
            API Key
          </Label>
          <Input
            id="deepseek-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deepseek-model" className="text-[#94A3B8] text-xs">
            Modelo
          </Label>
          <Input
            id="deepseek-model"
            placeholder="deepseek-chat"
            value={model}
            onChange={(e) => setModel(e.target.value)}
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
