"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Lead, StatusFunil, STATUS_FUNIL_OPTIONS } from "@/types/lead";
import { CANVAS_ORDER } from "@/config/constants";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { LeadDetailModal } from "./lead-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/leads");
      const data = await response.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
      toast.error("Erro ao carregar leads do Kanban");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const getColumnLeads = (status: StatusFunil): Lead[] => {
    return leads.filter((lead) => lead.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const leadId = event.active.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);

    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const dropTarget = over.data.current;

    // Se soltou em uma coluna
    const targetStatus =
      dropTarget?.status || over.id.toString().replace("column-", "");
    if (
      !targetStatus ||
      !STATUS_FUNIL_OPTIONS.includes(targetStatus as StatusFunil)
    ) {
      return;
    }

    const newStatus = targetStatus as StatusFunil;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Otimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    // Persistir no banco via Prisma
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (!result.success) {
        // Reverte em caso de erro
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, status: lead.status } : l
          )
        );
        toast.error("Erro ao atualizar status do lead");
      }
    } catch {
      // Reverte em caso de erro de rede
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status: lead.status } : l
        )
      );
      toast.error("Erro de rede ao atualizar lead");
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {CANVAS_ORDER.map((status) => (
          <div key={status} className="flex-shrink-0 w-72">
            <div className="p-4 rounded-xl bg-zinc-900 space-y-3">
              <Skeleton className="h-6 w-32 bg-zinc-950" />
              <Skeleton className="h-24 w-full bg-zinc-950" />
              <Skeleton className="h-24 w-full bg-zinc-950" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {CANVAS_ORDER.map((status) => (
            <motion.div
              key={status}
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <KanbanColumn
                status={status}
                leads={getColumnLeads(status)}
                onLeadClick={setSelectedLead}
              />
            </motion.div>
          ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="w-72 opacity-90">
              <KanbanCard lead={activeLead} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <LeadDetailModal
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
        onLeadUpdate={(updatedLead) => {
          setLeads((prev) =>
            prev.map((l) =>
              l.id === updatedLead.id ? { ...l, ...updatedLead } : l
            )
          );
          // Atualiza o selectedLead para refletir os dados no modal
          setSelectedLead((prev) =>
            prev?.id === updatedLead.id
              ? { ...prev, ...updatedLead }
              : prev
          );
        }}
      />
    </>
  );
}
