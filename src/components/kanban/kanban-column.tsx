"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Lead, StatusFunil } from "@/types/lead";
import { STATUS_FUNIL_COLORS } from "@/config/constants";
import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
  status: StatusFunil;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

export function KanbanColumn({
  status,
  leads,
  onLeadClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: "column", status },
  });

  const columnColor = STATUS_FUNIL_COLORS[status] || "#1E3A5F";

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-all duration-200 ${
        isOver
          ? "border-[#F2C14E]/50 bg-[#143D59]/80"
          : "border-[#1E293B] bg-[#143D59]"
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-[#1E293B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: columnColor }}
            />
            <h3 className="text-sm font-medium text-white">{status}</h3>
          </div>
          <span className="text-xs font-mono text-[#64748B] bg-[#0B1320] px-2 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Cards Container (Droppable) */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-220px)]"
      >
        <SortableContext
          items={leads.map((l) => l.ID)}
          strategy={verticalListSortingStrategy}
        >
          {leads.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-[#64748B] border border-dashed border-[#1E293B] rounded-lg">
              Arraste leads para cá
            </div>
          ) : (
            leads.map((lead) => (
              <KanbanCard
                key={lead.ID}
                lead={lead}
                onClick={onLeadClick}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
