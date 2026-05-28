"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Building2,
  User,
  Phone,
  DollarSign,
  TrendingUp,
  Target,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export function LeadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    Nome: "",
    Empresa: "",
    Telefone: "",
    Investimento_Ads: "",
    Conversoes: "",
    ROAS: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.Nome || !formData.Empresa || !formData.Telefone) {
      toast.error("Preencha os campos obrigatórios: Nome, Empresa e Telefone");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        Nome: formData.Nome,
        Empresa: formData.Empresa,
        Telefone: formData.Telefone,
        Investimento_Ads: Number(formData.Investimento_Ads) || 0,
        Conversoes: Number(formData.Conversoes) || 0,
        ROAS: Number(formData.ROAS) || 0,
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Lead cadastrado com sucesso!");
        router.push("/");
      } else {
        toast.error(result.error || "Erro ao cadastrar lead");
      }
    } catch {
      toast.error("Erro de rede ao cadastrar lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <div>
        <h2 className="text-xl font-bold text-white">Novo Lead</h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          Cadastre um novo lead no funil de vendas
        </p>
      </div>

      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[#F2C14E] flex items-center gap-2">
          <User className="w-4 h-4" />
          Informações Básicas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-[#94A3B8] text-xs">
              Nome <span className="text-red-400">*</span>
            </Label>
            <Input
              id="nome"
              placeholder="Nome do contato"
              value={formData.Nome}
              onChange={(e) => handleChange("Nome", e.target.value)}
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="empresa" className="text-[#94A3B8] text-xs">
              Empresa <span className="text-red-400">*</span>
            </Label>
            <Input
              id="empresa"
              placeholder="Nome da empresa"
              value={formData.Empresa}
              onChange={(e) => handleChange("Empresa", e.target.value)}
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="telefone" className="text-[#94A3B8] text-xs">
              WhatsApp <span className="text-red-400">*</span>
            </Label>
            <Input
              id="telefone"
              placeholder="5511999999999"
              value={formData.Telefone}
              onChange={(e) => handleChange("Telefone", e.target.value)}
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono"
            />
            <p className="text-[10px] text-[#64748B]">
              Formato: 5511999999999 (código do país + DDD + número)
            </p>
          </div>
        </div>
      </div>

      {/* Métricas de Marketing */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[#1F7A8C] flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Métricas de Marketing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="investimento"
              className="text-[#94A3B8] text-xs flex items-center gap-1"
            >
              <DollarSign className="w-3 h-3 text-[#F2C14E]" />
              Investimento em Ads (R$)
            </Label>
            <Input
              id="investimento"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.Investimento_Ads}
              onChange={(e) =>
                handleChange("Investimento_Ads", e.target.value)
              }
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="conversoes"
              className="text-[#94A3B8] text-xs flex items-center gap-1"
            >
              <Target className="w-3 h-3 text-[#22C55E]" />
              Conversões Reportadas
            </Label>
            <Input
              id="conversoes"
              type="number"
              placeholder="0"
              value={formData.Conversoes}
              onChange={(e) => handleChange("Conversoes", e.target.value)}
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="roas"
              className="text-[#94A3B8] text-xs flex items-center gap-1"
            >
              <TrendingUp className="w-3 h-3 text-[#1F7A8C]" />
              ROAS
            </Label>
            <Input
              id="roas"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.ROAS}
              onChange={(e) => handleChange("ROAS", e.target.value)}
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/")}
          className="border-[#1E293B] text-[#94A3B8] hover:bg-[#143D59] hover:text-white"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#F2C14E] text-[#0B1320] hover:bg-[#F2C14E]/90 gap-2 flex-1"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Cadastrando..." : "Cadastrar Lead"}
        </Button>
      </div>
    </form>
  );
}
