"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  Send,
  MessageSquare,
  ChevronRight,
  Filter,
  Smartphone,
  Globe,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  XCircle,
} from "lucide-react";

// ──────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────

interface OrganizationRef {
  id: string;
  name: string;
}

interface UserRef {
  id: string;
  email: string;
}

interface TicketItem {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  source: string;
  organization: OrganizationRef;
  user: UserRef | null;
  assignedTo: UserRef | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: {
    content: string;
    createdAt: string;
    isFromStaff: boolean;
  } | null;
}

interface MessageItem {
  id: string;
  content: string;
  source: string;
  isFromStaff: boolean;
  createdAt: string;
  user: { id: string; email: string } | null;
}

interface TicketDetail {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  source: string;
  organization: { id: string; name: string; telefone: string | null };
  user: UserRef | null;
  assignedTo: UserRef | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages: MessageItem[];
}

// ──────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "Todos os Status" },
  { value: "OPEN", label: "Aberto" },
  { value: "IN_PROGRESS", label: "Em Andamento" },
  { value: "WAITING_CUSTOMER", label: "Aguardando Cliente" },
  { value: "RESOLVED", label: "Resolvido" },
  { value: "CLOSED", label: "Fechado" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  OPEN: { label: "Aberto", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: AlertCircle },
  IN_PROGRESS: { label: "Em Andamento", color: "text-[#F2C14E] bg-[#F2C14E]/10 border-[#F2C14E]/20", icon: Play },
  WAITING_CUSTOMER: { label: "Aguardando", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20", icon: Clock },
  RESOLVED: { label: "Resolvido", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  CLOSED: { label: "Fechado", color: "text-zinc-600 bg-zinc-600/10 border-zinc-600/20", icon: XCircle },
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "text-zinc-500",
  MEDIUM: "text-[#F2C14E]",
  HIGH: "text-orange-400",
  URGENT: "text-red-400",
};

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ──────────────────────────────────────────
// Página Principal
// ──────────────────────────────────────────

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ─── Scroll do chat ───
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
    }
  }, [selectedTicket?.messages, scrollToBottom]);

  // ─── Carregar tickets ───
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", "50");

      const res = await fetch(`/api/helpdesk/tickets?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTickets(json.data);
      } else {
        toast.error("Erro ao carregar tickets");
      }
    } catch {
      toast.error("Erro de conexão ao carregar tickets");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // ─── Selecionar ticket ───
  const selectTicket = useCallback(async (ticketId: string) => {
    setLoadingDetail(true);
    setSelectedTicket(null);
    try {
      const res = await fetch(`/api/helpdesk/tickets/${ticketId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedTicket(json.data);
      } else {
        toast.error("Erro ao carregar detalhes do ticket");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // ─── Enviar resposta ───
  const sendReply = useCallback(async () => {
    if (!replyText.trim() || !selectedTicket || sending) return;

    const content = replyText.trim();
    setReplyText("");
    setSending(true);

    // Otimistic update
    const optimisticMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      content,
      source: selectedTicket.source,
      isFromStaff: true,
      createdAt: new Date().toISOString(),
      user: { id: "staff", email: "Suporte" },
    };
    setSelectedTicket((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticMsg] } : prev
    );
    scrollToBottom();

    try {
      const res = await fetch(
        `/api/helpdesk/tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        // Remove optimistic on failure
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.filter(
                  (m) => m.id !== optimisticMsg.id
                ),
              }
            : prev
        );
        toast.error("Erro ao enviar resposta");
      } else {
        // Replace optimistic with real
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === optimisticMsg.id
                    ? {
                        ...m,
                        id: json.data.id,
                        createdAt: json.data.createdAt,
                      }
                    : m
                ),
              }
            : prev
        );

        // Atualiza a lista de tickets também
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? {
                  ...t,
                  lastMessage: { content, createdAt: new Date().toISOString(), isFromStaff: true },
                  status: "WAITING_CUSTOMER",
                }
              : t
          )
        );

        if (json.data.whatsappError) {
          toast.warning(
            `Mensagem salva, mas WhatsApp falhou: ${json.data.whatsappError}`
          );
        }
      }
    } catch {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.filter(
                (m) => m.id !== optimisticMsg.id
              ),
            }
          : prev
      );
      toast.error("Erro de conexão ao enviar resposta");
    } finally {
      setSending(false);
      scrollToBottom();
    }
  }, [replyText, selectedTicket, sending, scrollToBottom]);

  // ─── Atualizar status do ticket ───
  const updateTicketStatus = useCallback(
    async (ticketId: string, newStatus: string) => {
      try {
        const res = await fetch(`/api/helpdesk/tickets/${ticketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success(`Status atualizado para ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`);
          // Atualiza local
          setTickets((prev) =>
            prev.map((t) =>
              t.id === ticketId ? { ...t, status: newStatus } : t
            )
          );
          setSelectedTicket((prev) =>
            prev && prev.id === ticketId ? { ...prev, status: newStatus } : prev
          );
        } else {
          toast.error("Erro ao atualizar status");
        }
      } catch {
        toast.error("Erro de conexão ao atualizar status");
      }
    },
    []
  );

  // ─── Keyboard: Enter envia mensagem ───
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendReply();
      }
    },
    [sendReply]
  );

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Helpdesk"
          description="Atendimento Omnichannel — Tickets e Mensagens"
        />

        <main className="flex-1 flex overflow-hidden">
          {/* ─── Painel Esquerdo: Lista de Tickets ─── */}
          <div className="w-[400px] flex-shrink-0 border-r border-zinc-800 flex flex-col">
            {/* Filtros */}
            <div className="p-4 border-b border-zinc-800 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar tickets..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/50 focus:border-[#F2C14E]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/50"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#F2C14E]" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <MessageSquare className="w-10 h-10 text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-500">
                    Nenhum ticket encontrado.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {tickets.map((ticket) => {
                    const StatusIcon =
                      STATUS_CONFIG[ticket.status]?.icon ?? AlertCircle;
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => selectTicket(ticket.id)}
                        className={cn(
                          "w-full text-left px-4 py-3.5 hover:bg-zinc-800/30 transition-colors",
                          selectedTicket?.id === ticket.id && "bg-zinc-800/40"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">
                              {ticket.subject}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {ticket.organization.name}
                            </p>
                          </div>
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 shrink-0 mt-0.5",
                              selectedTicket?.id === ticket.id
                                ? "text-[#F2C14E]"
                                : "text-zinc-600"
                            )}
                          />
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                              STATUS_CONFIG[ticket.status]?.color ??
                                "text-zinc-500 border-zinc-700"
                            )}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {STATUS_CONFIG[ticket.status]?.label ??
                              ticket.status}
                          </span>

                          {ticket.source === "WHATSAPP" ? (
                            <Smartphone className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Globe className="w-3 h-3 text-blue-400" />
                          )}

                          <span
                            className={cn(
                              "text-[10px] font-mono",
                              PRIORITY_COLOR[ticket.priority] ?? "text-zinc-500"
                            )}
                          >
                            {ticket.priority}
                          </span>

                          <span className="text-[10px] text-zinc-600 ml-auto">
                            {formatDate(ticket.updatedAt)}
                          </span>
                        </div>

                        {ticket.lastMessage && (
                          <p className="text-xs text-zinc-600 mt-1.5 truncate">
                            {ticket.lastMessage.isFromStaff ? "👤 Staff: " : "👤 Cliente: "}
                            {ticket.lastMessage.content}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ─── Painel Direito: Chat ─── */}
          <div className="flex-1 flex flex-col">
            {loadingDetail ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#F2C14E]" />
              </div>
            ) : selectedTicket ? (
              <>
                {/* Header do Ticket */}
                <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-white truncate">
                        {selectedTicket.subject}
                      </h2>
                      {selectedTicket.source === "WHATSAPP" ? (
                        <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-zinc-500">
                        {selectedTicket.organization.name}
                      </span>
                      {selectedTicket.organization.telefone && (
                        <span className="text-xs text-zinc-600 font-mono">
                          {selectedTicket.organization.telefone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações de Status */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) =>
                        updateTicketStatus(
                          selectedTicket.id,
                          e.target.value
                        )
                      }
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/50"
                    >
                      {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto p-6">
                  {selectedTicket.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <AlertCircle className="w-8 h-8 text-zinc-700 mb-2" />
                      <p className="text-sm text-zinc-500">
                        Nenhuma mensagem neste ticket.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedTicket.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.isFromStaff
                              ? "justify-start"
                              : "justify-end"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                              msg.isFromStaff
                                ? "bg-zinc-800 text-zinc-200 rounded-tl-sm"
                                : msg.source === "WHATSAPP"
                                ? "bg-emerald-900/40 text-emerald-100 rounded-tr-sm border border-emerald-800/30"
                                : "bg-[#F2C14E] text-zinc-950 rounded-tr-sm"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <div
                              className={cn(
                                "flex items-center justify-between gap-2 mt-1.5",
                                msg.isFromStaff
                                  ? "text-zinc-500"
                                  : msg.source === "WHATSAPP"
                                  ? "text-emerald-300/60"
                                  : "text-zinc-700"
                              )}
                            >
                              <span className="text-[10px]">
                                {formatTime(msg.createdAt)}
                              </span>
                              <span className="text-[10px]">
                                {msg.isFromStaff
                                  ? "Staff"
                                  : msg.source === "WHATSAPP"
                                  ? "WhatsApp"
                                  : "Cliente"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input de Resposta */}
                <div className="border-t border-zinc-800 p-4 bg-zinc-900/30">
                  <div className="flex items-end gap-3">
                    <textarea
                      ref={inputRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Digite sua resposta... (Enter para enviar)"
                      rows={2}
                      disabled={sending}
                      className={cn(
                        "flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 resize-none",
                        "text-sm text-zinc-200 placeholder:text-zinc-500",
                        "focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/50 focus:border-[#F2C14E]",
                        "disabled:opacity-50 transition-all"
                      )}
                    />
                    <button
                      onClick={sendReply}
                      disabled={!replyText.trim() || sending}
                      className={cn(
                        "p-3 rounded-xl transition-all shrink-0",
                        replyText.trim() && !sending
                          ? "bg-[#F2C14E] text-zinc-950 hover:bg-[#F2C14E]/90"
                          : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      )}
                      aria-label="Enviar"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <MessageSquare className="w-16 h-16 text-zinc-800 mb-4" />
                <h3 className="text-lg font-medium text-zinc-400">
                  Selecione um Ticket
                </h3>
                <p className="text-sm text-zinc-600 mt-1 max-w-sm">
                  Escolha um ticket na lista ao lado para visualizar as
                  mensagens e responder.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
