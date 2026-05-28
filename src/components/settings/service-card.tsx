"use client";

import { ReactNode, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, XCircle, TestTube } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  configured: boolean;
  onTest?: () => Promise<{ success: boolean; message: string }>;
  children: ReactNode;
}

export function ServiceCard({
  title,
  description,
  icon,
  configured,
  onTest,
  children,
}: ServiceCardProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    if (!onTest) return;
    setTesting(true);
    setTestResult(null);
    const result = await onTest();
    setTestResult(result);
    setTesting(false);
  };

  return (
    <Card className="bg-[#143D59] border-[#1E293B]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0B1320]">{icon}</div>
            <div>
              <CardTitle className="text-white text-base">{title}</CardTitle>
              <CardDescription className="text-[#94A3B8] text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-mono",
              configured
                ? "border-green-500/30 text-green-400 bg-green-500/10"
                : "border-red-500/30 text-red-400 bg-red-500/10"
            )}
          >
            {configured ? "Configurado" : "Não configurado"}
          </Badge>
        </div>
      </CardHeader>

      <Separator className="bg-[#1E293B]" />

      <CardContent className="pt-4 space-y-4">
        {children}

        {onTest && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || !configured}
              className="border-[#1F7A8C] text-[#1F7A8C] hover:bg-[#1F7A8C]/20 hover:text-white gap-2"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              {testing ? "Testando..." : "Testar Conexão"}
            </Button>

            {testResult && (
              <div
                className={cn(
                  "flex items-center gap-2 text-sm p-2 rounded-md",
                  testResult.success
                    ? "text-green-400 bg-green-500/10"
                    : "text-red-400 bg-red-500/10"
                )}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="font-mono text-xs">{testResult.message}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
