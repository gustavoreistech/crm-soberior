"use client";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { SRECommandCenter } from "@/components/sre/sre-command-center";
import { Button } from "@/components/ui/button";
import { PlusCircle, SeparatorHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Kanban"
          description="Gerencie seus leads pelo funil de vendas"
          action={
            <Button
              onClick={() => router.push("/leads/new")}
              className="bg-[#F2C14E] text-zinc-950 hover:bg-[#F2C14E]/90 gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Novo Lead
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          <KanbanBoard />

          <Separator className="bg-zinc-800" />

          <SRECommandCenter />
        </main>
      </div>
    </div>
  );
}
