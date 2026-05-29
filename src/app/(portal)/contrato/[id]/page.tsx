"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContractData {
  id: string;
  proposalId: string;
  signatureStatus: "PENDING" | "SIGNED";
  signedAt: string | null;
  organization: {
    id: string;
    name: string;
    cnpj: string | null;
    domain: string | null;
    email: string | null;
    telefone: string | null;
  };
  proposal: {
    id: string;
    value: number | null;
    pdfUrl: string | null;
    status: string;
  } | null;
}

export default function ContractPage() {
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado do fluxo de assinatura
  const [codigo2FA, setCodigo2FA] = useState("");
  const [sending2FA, setSending2FA] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    async function fetchContract() {
      try {
        const response = await fetch(`/api/signature/contract/${contractId}`);
        const result = await response.json();

        if (!result.success || !result.data) {
          setError(result.error || "Erro ao carregar contrato");
          return;
        }

        setContract(result.data);
      } catch (err) {
        setError("Erro de rede ao carregar contrato");
        console.error("[contrato] Erro:", err);
      } finally {
        setLoading(false);
      }
    }

    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  /** Solicita o código 2FA via WhatsApp */
  async function handleRequest2FA() {
    if (!contract) return;

    setSending2FA(true);
    const toastId = toast.loading("Solicitando código 2FA...");

    try {
      const response = await fetch("/api/signature/generate-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: contract.organization.telefone || "",
          organizationId: contract.organization.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Falha ao solicitar código", {
          id: toastId,
        });
        return;
      }

      toast.success("Código enviado via WhatsApp!", { id: toastId });
    } catch (err) {
      console.error("[contrato] Erro ao solicitar 2FA:", err);
      toast.error("Erro de rede ao solicitar código", { id: toastId });
    } finally {
      setSending2FA(false);
    }
  }

  /** Assina o contrato digitalmente */
  async function handleSignContract() {
    if (!contract || !codigo2FA.trim()) return;

    setSigning(true);
    const toastId = toast.loading("Assinando contrato...");

    try {
      const response = await fetch("/api/signature/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: contract.id,
          codigo: codigo2FA.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Falha ao assinar contrato", {
          id: toastId,
        });
        return;
      }

      toast.success("Contrato assinado com sucesso! 🎉", { id: toastId });

      // Atualiza o estado local
      setContract({
        ...contract,
        signatureStatus: "SIGNED",
        signedAt: result.data?.signedAt ?? new Date().toISOString(),
      });
    } catch (err) {
      console.error("[contrato] Erro ao assinar:", err);
      toast.error("Erro de rede ao assinar contrato", { id: toastId });
    } finally {
      setSigning(false);
    }
  }

  // ─── Estados de carregamento / erro ───

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#F2C14E]" />
          <p className="text-[#94A3B8] text-sm">Carregando contrato...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-[#EF4444]" />
          <h2 className="text-lg font-semibold text-white">
            Contrato não encontrado
          </h2>
          <p className="text-sm text-[#94A3B8]">
            {error || "O contrato que você está procurando não existe ou foi removido."}
          </p>
        </div>
      </div>
    );
  }

  // ─── Contrato já assinado ───

  if (contract.signatureStatus === "SIGNED") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
          </div>
          <h2 className="text-xl font-semibold text-white">
            Contrato Assinado! 🎉
          </h2>
          <p className="text-sm text-[#94A3B8]">
            O contrato com <strong className="text-white">{contract.organization.name}</strong>{" "}
            foi assinado digitalmente em{" "}
            {contract.signedAt
              ? new Date(contract.signedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "data desconhecida"}
            .
          </p>
          {contract.proposal?.pdfUrl && (
            <a
              href={contract.proposal.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#3B82F6] hover:text-[#60A5FA] transition-colors mt-2"
            >
              <ExternalLink className="w-4 h-4" />
              Baixar Proposta (PDF)
            </a>
          )}
        </div>
      </div>
    );
  }

  // ─── Fluxo de Assinatura ───

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#1F7A8C]/10 flex items-center justify-center mx-auto mb-4">
          <FileSignature className="w-7 h-7 text-[#1F7A8C]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Assinatura Digital de Contrato
        </h1>
        <p className="text-sm text-[#94A3B8]">
          {contract.organization.name}
        </p>
      </div>

      {/* Card: Dados do Contrato */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 mb-6">
        <h2 className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider mb-4">
          Dados do Contrato
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#64748B]">Empresa</span>
            <span className="text-white font-medium">
              {contract.organization.name}
            </span>
          </div>
          {contract.organization.cnpj && (
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">CNPJ</span>
              <span className="text-white font-mono">
                {contract.organization.cnpj}
              </span>
            </div>
          )}
          {contract.proposal?.value !== null &&
            contract.proposal?.value !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Valor</span>
                <span className="text-white font-mono">
                  R$ {contract.proposal.value.toLocaleString("pt-BR")}
                </span>
              </div>
            )}
          <div className="flex justify-between text-sm">
            <span className="text-[#64748B]">Status</span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#F2C14E]/10 text-[#F2C14E]">
              <Clock className="w-3 h-3" />
              Aguardando Assinatura
            </span>
          </div>
        </div>
      </div>

      {/* Card: Proposta PDF */}
      {contract.proposal?.pdfUrl && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 mb-6">
          <h2 className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider mb-4">
            Proposta Comercial
          </h2>
          <a
            href={contract.proposal.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
          >
            <FileText className="w-4 h-4" />
            Ler Proposta (PDF)
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Card: Assinatura */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
        <h2 className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider mb-4">
          Assinar Digitalmente
        </h2>

        <div className="space-y-4">
          {/* Botão: Solicitar código 2FA */}
          <Button
            variant="outline"
            className="w-full border-[#1F7A8C] text-[#1F7A8C] hover:bg-[#1F7A8C]/10"
            onClick={handleRequest2FA}
            disabled={sending2FA || signing}
          >
            {sending2FA ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando código...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 mr-2" />
                Solicitar Código 2FA (WhatsApp)
              </>
            )}
          </Button>

          {/* Input: Código 2FA */}
          <div className="space-y-1.5">
            <label
              htmlFor="codigo-2fa"
              className="text-xs text-[#94A3B8] flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              Insira o código recebido no WhatsApp
            </label>
            <Input
              id="codigo-2fa"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={codigo2FA}
              onChange={(e) =>
                setCodigo2FA(e.target.value.replace(/\D/g, ""))
              }
              className="bg-[#0B1320] border-[#1E293B] text-white placeholder:text-[#64748B] font-mono text-lg text-center tracking-[0.5em]"
              disabled={signing}
            />
          </div>

          {/* Botão: Assinar */}
          <Button
            className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-medium"
            onClick={handleSignContract}
            disabled={signing || codigo2FA.length < 6}
          >
            {signing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assinando...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Assinar Digitalmente
              </>
            )}
          </Button>

          <p className="text-xs text-[#64748B] text-center">
            Ao assinar, você declara que leu e concorda com os termos da proposta.
          </p>
        </div>
      </div>
    </div>
  );
}

// Ícone FileSignature usado no componente
function FileSignature({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />
      <path d="M18 12H6" />
      <path d="M18 8H6" />
      <path d="M18 4H6" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
      <path d="M12 2v14" />
    </svg>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
