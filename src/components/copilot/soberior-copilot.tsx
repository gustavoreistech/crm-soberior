"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopilotChat } from "./copilot-chat";
import type { CopilotContextType } from "@/types/api";

interface SoberiorCopilotProps {
  organizationId: string;
  contextType: CopilotContextType;
  /** Nome da organização para exibir no header */
  organizationName?: string;
  /** Variante de trigger: "icon" (padrão) ou "tab" (para usar dentro de abas) */
  variant?: "icon" | "tab";
}

export function SoberiorCopilot({
  organizationId,
  contextType,
  organizationName,
  variant = "icon",
}: SoberiorCopilotProps) {
  const [open, setOpen] = useState(false);

  if (variant === "tab") {
    return (
      <div className="h-full flex flex-col">
        {/* Header da Tab */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#F2C14E]/10 border border-[#F2C14E]/20">
              <Bot className="w-4 h-4 text-[#F2C14E]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">
                Soberior Copilot
              </h3>
              <p className="text-[10px] text-zinc-500">
                IA contextual • Dados em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <CopilotChat
            organizationId={organizationId}
            contextType={contextType}
          />
        </div>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
          "border-[#F2C14E]/30 text-[#F2C14E] hover:bg-[#F2C14E]/10 cursor-pointer"
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Soberior Copilot
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-[420px] p-0 bg-zinc-950 border-zinc-800"
        showCloseButton={true}
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 pr-8">
            <div className="p-1.5 rounded-lg bg-[#F2C14E]/10 border border-[#F2C14E]/20">
              <Bot className="w-4 h-4 text-[#F2C14E]" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold text-zinc-200">
                Soberior Copilot
              </SheetTitle>
              {organizationName && (
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {organizationName}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Chat */}
        <div className="flex-1 h-[calc(100vh-120px)]">
          <CopilotChat
            organizationId={organizationId}
            contextType={contextType}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
