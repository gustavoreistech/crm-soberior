"use client";

import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/types/lead";
import { STATUS_FUNIL_COLORS } from "@/config/constants";
import { Building2, Target, TrendingUp } from "lucide-react";

interface KanbanCardProps {
  lead: Lead;
  onClick?: (lead: Lead) => void;
}

export function KanbanCard({ lead, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: { type: "lead", lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusColor = STATUS_FUNIL_COLORS[lead.status] || "#1E3A5F";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(lead)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="bg-zinc-950 rounded-lg border border-zinc-800 p-3 cursor-grab active:cursor-grabbing hover:border-[#1F7A8C]/50 transition-colors group"
    >
      {/* Status Indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
          {lead.status}
        </span>
      </div>

      {/* Organization Name */}
      <h3 className="text-sm font-medium text-white mb-1 truncate">
        {lead.organization.name}
      </h3>
      {lead.organization.domain && (
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] mb-3">
          <Building2 className="w-3 h-3" />
          <span className="truncate">{lead.organization.domain}</span>
        </div>
      )}

      {/* Metrics */}
      <div className="space-y-1.5">
        {lead.score !== null && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-[#64748B]">
              <Target className="w-3 h-3" />
              <span>Score</span>
            </div>
            <span className="font-mono text-[#F2C14E]">{lead.score}</span>
          </div>
        )}

        {lead.lostRevenue !== null && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-[#64748B]">
              <TrendingUp className="w-3 h-3" />
              <span>Receita Perdida</span>
            </div>
            <span className="font-mono text-[#EF4444]">
              R$ {lead.lostRevenue.toLocaleString("pt-BR")}
            </span>
          </div>
        )}
      </div>

      {/* Hover hint */}
      <div className="mt-2 pt-2 border-t border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-[#1F7A8C]">Arraste para mover</span>
      </div>
    </motion.div>
  );
}
