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
  Globe,
  Target,
  TrendingUp,
  BadgeCheck,
  FileText,
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

  const statusColor = STATUS_FUNIL_COLORS[lead.status] || "#1E3A5F";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#143D59] border-[#1E293B] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <span>{lead.organization.name}</span>
            <span className="text-sm text-[#64748B] font-normal">
              #{lead.id.slice(0, 8)}
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
            <span className="text-sm font-medium">{lead.status}</span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
              <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresa</span>
              </div>
              <p className="text-sm text-white">{lead.organization.name}</p>
            </div>

            {lead.organization.domain && (
              <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
                <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Domínio</span>
                </div>
                <p className="text-sm text-white truncate">
                  {lead.organization.domain}
                </p>
              </div>
            )}

            {lead.organization.cnpj && (
              <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
                <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  <span>CNPJ</span>
                </div>
                <p className="text-sm font-mono text-white">
                  {lead.organization.cnpj}
                </p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-[#0B1320] space-y-1">
              <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Ativo</span>
              </div>
              <p className="text-sm font-mono text-white">
                {lead.organization.isActive ? "Sim" : "Não"}
              </p>
            </div>
          </div>

          {/* Metrics */}
          {(lead.score !== null || lead.lostRevenue !== null) && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                Métricas
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {lead.score !== null && (
                  <div className="p-3 rounded-lg bg-[#0B1320] text-center">
                    <div className="flex justify-center mb-1">
                      <Target className="w-4 h-4 text-[#F2C14E]" />
                    </div>
                    <p className="text-lg font-mono text-[#F2C14E] font-bold">
                      {lead.score}
                    </p>
                    <p className="text-[10px] text-[#64748B]">Score</p>
                  </div>
                )}

                {lead.lostRevenue !== null && (
                  <div className="p-3 rounded-lg bg-[#0B1320] text-center">
                    <div className="flex justify-center mb-1">
                      <TrendingUp className="w-4 h-4 text-[#EF4444]" />
                    </div>
                    <p className="text-lg font-mono text-[#EF4444] font-bold">
                      R$ {lead.lostRevenue.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      Receita Perdida
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
