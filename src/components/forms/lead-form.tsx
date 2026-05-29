"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Building2,
  Globe,
  FileText,
  Mail,
  Phone,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export function LeadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    cnpj: "",
    email: "",
    telefone: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Preencha o campo obrigatório: Nome da Empresa");
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
      };

      if (formData.domain) payload.domain = formData.domain;
      if (formData.cnpj) payload.cnpj = formData.cnpj;
      if (formData.email) payload.email = formData.email;
      if (formData.telefone) payload.telefone = formData.telefone;

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

      {/* Informações da Organização */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[#F2C14E] flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Informações da Empresa
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[#94A3B8] text-xs">
              Nome da Empresa <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Razão social ou nome fantasia"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cnpj" className="text-[#94A3B8] text-xs flex items-center gap-1">
              <FileText className="w-3 h-3" />
              CNPJ
            </Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) => handleChange("cnpj", e.target.value)}
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[#94A3B8] text-xs flex items-center gap-1">
              <Mail className="w-3 h-3" />
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contato@empresa.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefone" className="text-[#94A3B8] text-xs flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Telefone
            </Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => handleChange("telefone", e.target.value)}
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="domain" className="text-[#94A3B8] text-xs flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Domínio
            </Label>
            <Input
              id="domain"
              placeholder="empresa.com.br"
              value={formData.domain}
              onChange={(e) => handleChange("domain", e.target.value)}
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
