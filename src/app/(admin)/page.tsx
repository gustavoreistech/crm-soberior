"use client";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-[#0B1320]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Kanban"
          description="Gerencie seus leads pelo funil de vendas"
          action={
            <Button
              onClick={() => router.push("/leads/new")}
              className="bg-[#F2C14E] text-[#0B1320] hover:bg-[#F2C14E]/90 gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Novo Lead
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto p-8">
          <KanbanBoard />
        </main>
      </div>
    </div>
  );
}
