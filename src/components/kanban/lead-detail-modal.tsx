"use client";

import { Lead } from "@/types/lead";
import { STATUS_FUNIL_COLORS } from "@/config/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Mail,
  Phone,
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailModal({
  lead,
  open,
  onOpenChange,
}: LeadDetailModalProps) {
  if (!lead) return null;

  const statusColor = STATUS_FUNIL_COLORS[lead.Status_Funil] || "#1E3A5F";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#143D59] border-[#1E293B] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <span>{lead.Nome}</span>
            <span className="text-sm text-[#64748B] font-normal">
              #{lead.ID.slice(0, 8)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-sm font-medium">{lead.Status_Funil}</span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
              <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresa</span>
              </div>
              <p className="text-sm text-white">{lead.Empresa}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
              <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                <Phone className="w-3.5 h-3.5" />
                <span>Telefone</span>
              </div>
              <p className="text-sm font-mono text-white">{lead.Telefone}</p>
            </div>

            {lead.Email && (
              <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
                <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </div>
                <p className="text-sm text-white truncate">{lead.Email}</p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
              <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>Criado em</span>
              </div>
              <p className="text-sm font-mono text-white">
                {new Date(lead.Data_Criacao).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
              Métricas de Marketing
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[#0B1320] text-center">
                <div className="flex justify-center mb-1">
                  <DollarSign className="w-4 h-4 text-[#F2C14E]" />
                </div>
                <p className="text-lg font-mono text-[#F2C14E] font-bold">
                  R$ {lead.Investimento_Ads.toLocaleString("pt-BR")}
                </p>
                <p className="text-[10px] text-[#64748B]">Investimento Ads</p>
              </div>

              <div className="p-3 rounded-lg bg-[#0B1320] text-center">
                <div className="flex justify-center mb-1">
                  <Target className="w-4 h-4 text-[#22C55E]" />
                </div>
                <p className="text-lg font-mono text-[#22C55E] font-bold">
                  {lead.Conversoes}
                </p>
                <p className="text-[10px] text-[#64748B]">Conversões</p>
              </div>

              <div className="p-3 rounded-lg bg-[#0B1320] text-center">
                <div className="flex justify-center mb-1">
                  <TrendingUp className="w-4 h-4 text-[#1F7A8C]" />
                </div>
                <p className="text-lg font-mono text-[#1F7A8C] font-bold">
                  {lead.ROAS.toFixed(2)}x
                </p>
                <p className="text-[10px] text-[#64748B]">ROAS</p>
              </div>
            </div>
          </div>

          {/* DeepSeek Data */}
          {lead.Dados_DeepSeek && (
            <div className="p-3 rounded-lg bg-[#0B1320] border border-[#1F7A8C]/30">
              <div className="flex items-center gap-1.5 mb-2">
                <ExternalLink className="w-3.5 h-3.5 text-[#1F7A8C]" />
                <span className="text-xs font-medium text-[#1F7A8C]">
                  DeepSeek Insights
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-mono leading-relaxed">
                {lead.Dados_DeepSeek}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
