"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Plus,
  ChevronLeft,
  Loader2,
  AlertCircle,
  MessageSquare,
  Headset,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// ──────────────────────────────────────────
// Tipos locais
// ──────────────────────────────────────────

interface TicketSummary {
  id: string;
  subject: string;
  status: string;
  priority: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: {
    content: string;
    createdAt: string;
    isFromStaff: boolean;
  } | null;
}

interface MessageData {
  id: string;
  content: string;
  source: string;
  isFromStaff: boolean;
  createdAt: string;
  user: { id: string } | null;
}

type ViewState = "list" | "new-ticket" | "chat";

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em Andamento",
  WAITING_CUSTOMER: "Aguardando Cliente",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-blue-400",
  IN_PROGRESS: "text-[#F2C14E]",
  WAITING_CUSTOMER: "text-zinc-400",
  RESOLVED: "text-emerald-400",
  CLOSED: "text-zinc-600",
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Hoje ${formatTime(iso)}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ontem ${formatTime(iso)}`;
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ──────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────

export function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ViewState>("list");
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const organizationId = session?.user?.organizationId;

  // ─── Scroll automático para o fim do chat ───
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => {
    if (view === "chat") {
      scrollToBottom();
    }
  }, [messages, view, scrollToBottom]);

  // ─── Focar input ao abrir chat ───
  useEffect(() => {
    if (view === "chat" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [view]);

  // ─── Carregar tickets ───
  const loadTickets = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/portal/tickets");
      const json = await res.json();
      if (json.success) {
        setTickets(json.data);
      } else {
        toast.error("Erro ao carregar chamados");
      }
    } catch {
      toast.error("Erro de conexão ao carregar chamados");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // ─── Carregar mensagens de um ticket ───
  const loadMessages = useCallback(async (ticketId: string) => {
    try {
      const res = await fetch(`/api/portal/tickets/${ticketId}/messages`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
      }
    } catch {
      toast.error("Erro ao carregar mensagens");
    }
  }, []);

  // ─── Abrir chat de um ticket ───
  const openChat = useCallback(
    async (ticketId: string) => {
      setActiveTicketId(ticketId);
      setView("chat");
      setMessages([]);
      await loadMessages(ticketId);
    },
    [loadMessages]
  );

  // ─── Voltar para lista ───
  const goToList = useCallback(() => {
    setView("list");
    setActiveTicketId(null);
    setMessages([]);
    loadTickets();
  }, [loadTickets]);

  // ─── Abrir/fechar widget ───
  const toggleWidget = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        // Abrindo: carrega tickets e reseta para lista
        setView("list");
        setActiveTicketId(null);
        setMessages([]);
        loadTickets();
      }
      return !prev;
    });
  }, [loadTickets]);

  // ─── Enviar mensagem ───
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !activeTicketId || sending) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    // Otimistic update
    const optimisticMsg: MessageData = {
      id: `temp-${Date.now()}`,
      content,
      source: "PORTAL",
      isFromStaff: false,
      createdAt: new Date().toISOString(),
      user: null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      const res = await fetch(
        `/api/portal/tickets/${activeTicketId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        // Remove optimistic message on failure
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMsg.id)
        );
        toast.error("Erro ao enviar mensagem");
      } else {
        // Replace optimistic with real
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id
              ? {
                  ...m,
                  id: json.data.id,
                  createdAt: json.data.createdAt,
                }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMsg.id)
      );
      toast.error("Erro de conexão ao enviar mensagem");
    } finally {
      setSending(false);
      scrollToBottom();
    }
  }, [inputText, activeTicketId, sending, scrollToBottom]);

  // ─── Criar novo ticket ───
  const createTicket = useCallback(async () => {
    if (!newSubject.trim() || creatingTicket) return;

    setCreatingTicket(true);
    try {
      const res = await fetch("/api/portal/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newSubject.trim(),
          description: newDescription.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Chamado criado com sucesso!");
        setNewSubject("");
        setNewDescription("");
        await openChat(json.data.id);
      } else {
        toast.error(json.error || "Erro ao criar chamado");
      }
    } catch {
      toast.error("Erro de conexão ao criar chamado");
    } finally {
      setCreatingTicket(false);
    }
  }, [newSubject, newDescription, creatingTicket, openChat]);

  // ─── Keyboard handler ───
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // ─── Se não estiver logado, não renderizar ───
  if (!organizationId) return null;

  const activeTicket = tickets.find((t) => t.id === activeTicketId) ?? null;

  return (
    <>
      {/* ─── Botão flutuante ─── */}
      <button
        onClick={toggleWidget}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
          isOpen
            ? "bg-zinc-800 text-zinc-200 rotate-90"
            : "bg-[#F2C14E] text-zinc-950 hover:bg-[#F2C14E]/90 hover:scale-105"
        )}
        aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* ─── Painel do chat ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed bottom-24 right-6 z-50",
              "w-[380px] max-[420px]:w-[calc(100vw-32px)]",
              "h-[560px] max-h-[calc(100vh-160px)]",
              "rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* ─── Header ─── */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
              {view !== "list" && (
                <button
                  onClick={goToList}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  aria-label="Voltar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <Headset className="w-5 h-5 text-[#F2C14E]" />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-zinc-100 truncate">
                  {view === "chat" && activeTicket
                    ? activeTicket.subject
                    : view === "new-ticket"
                    ? "Novo Chamado"
                    : "Atendimento"}
                </h2>
                <p className="text-[10px] text-zinc-500">
                  {view === "chat" && activeTicket
                    ? STATUS_LABEL[activeTicket.status] ?? activeTicket.status
                    : "Suporte SOBERIOR"}
                </p>
              </div>
            </div>

            {/* ─── Conteúdo ─── */}
            <div className="flex-1 overflow-y-auto">
              {view === "list" && (
                <TicketListView
                  tickets={tickets}
                  loading={loading}
                  onSelectTicket={openChat}
                  onNewTicket={() => setView("new-ticket")}
                />
              )}

              {view === "new-ticket" && (
                <NewTicketForm
                  subject={newSubject}
                  description={newDescription}
                  loading={creatingTicket}
                  onSubjectChange={setNewSubject}
                  onDescriptionChange={setNewDescription}
                  onSubmit={createTicket}
                  onCancel={() => setView("list")}
                />
              )}

              {view === "chat" && (
                <ChatMessages
                  messages={messages}
                  activeTicket={activeTicket}
                />
              )}
            </div>

            {/* ─── Input (apenas no chat) ─── */}
            {view === "chat" && (
              <div className="shrink-0 border-t border-zinc-800 p-3 bg-zinc-900/30">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    disabled={sending}
                    className={cn(
                      "flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5",
                      "text-sm text-zinc-200 placeholder:text-zinc-500",
                      "focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/50 focus:border-[#F2C14E]",
                      "disabled:opacity-50 transition-all"
                    )}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim() || sending}
                    className={cn(
                      "p-2.5 rounded-xl transition-all",
                      inputText.trim() && !sending
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
            )}

            {/* ─── Footer (apenas na lista) ─── */}
            {view === "list" && (
              <div className="shrink-0 border-t border-zinc-800 p-3 bg-zinc-900/30">
                <button
                  onClick={() => setView("new-ticket")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F2C14E]/10 text-[#F2C14E] hover:bg-[#F2C14E]/20 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Chamado
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ──────────────────────────────────────────
// Sub-componente: Lista de Tickets
// ──────────────────────────────────────────

function TicketListView({
  tickets,
  loading,
  onSelectTicket,
  onNewTicket,
}: {
  tickets: TicketSummary[];
  loading: boolean;
  onSelectTicket: (id: string) => void;
  onNewTicket: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#F2C14E]" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
        <MessageSquare className="w-10 h-10 text-zinc-700 mb-3" />
        <p className="text-sm text-zinc-400">
          Nenhum chamado ativo no momento.
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          Clique em "Novo Chamado" para abrir um.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800/50">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          onClick={() => onSelectTicket(ticket.id)}
          className="w-full text-left px-4 py-3 hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {ticket.subject}
              </p>
              {ticket.lastMessage && (
                <p className="text-xs text-zinc-500 mt-0.5 truncate">
                  {ticket.lastMessage.content}
                </p>
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium whitespace-nowrap",
                STATUS_COLOR[ticket.status] ?? "text-zinc-500"
              )}
            >
              {STATUS_LABEL[ticket.status] ?? ticket.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-zinc-600">
              {ticket.messageCount} mensagem
              {ticket.messageCount !== 1 ? "ns" : ""}
            </span>
            <span className="text-[10px] text-zinc-600">·</span>
            <span className="text-[10px] text-zinc-600">
              {formatDate(ticket.updatedAt)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────
// Sub-componente: Formulário Novo Ticket
// ──────────────────────────────────────────

function NewTicketForm({
  subject,
  description,
  loading,
  onSubjectChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
}: {
  subject: string;
  description: string;
  loading: boolean;
  onSubjectChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && subject.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">
          Assunto <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: Problema com acesso ao sistema"
          disabled={loading}
          className={cn(
            "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5",
            "text-sm text-zinc-200 placeholder:text-zinc-500",
            "focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/50 focus:border-[#F2C14E]",
            "disabled:opacity-50"
          )}
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">
          Descrição (opcional)
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Descreva seu problema em detalhes..."
          rows={4}
          disabled={loading}
          className={cn(
            "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 resize-none",
            "text-sm text-zinc-200 placeholder:text-zinc-500",
            "focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/50 focus:border-[#F2C14E]",
            "disabled:opacity-50"
          )}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          disabled={!subject.trim() || loading}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
            subject.trim() && !loading
              ? "bg-[#F2C14E] text-zinc-950 hover:bg-[#F2C14E]/90"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            "Criar Chamado"
          )}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Sub-componente: Mensagens do Chat
// ──────────────────────────────────────────

function ChatMessages({
  messages,
  activeTicket,
}: {
  messages: MessageData[];
  activeTicket: TicketSummary | null;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
        <AlertCircle className="w-8 h-8 text-zinc-700 mb-2" />
        <p className="text-sm text-zinc-500">
          Nenhuma mensagem ainda.
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          Envie uma mensagem para iniciar o atendimento.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex",
            msg.isFromStaff ? "justify-start" : "justify-end"
          )}
        >
          <div
            className={cn(
              "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
              msg.isFromStaff
                ? "bg-zinc-800 text-zinc-200 rounded-tl-sm"
                : "bg-[#F2C14E] text-zinc-950 rounded-tr-sm"
            )}
          >
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            <p
              className={cn(
                "text-[10px] mt-1 text-right",
                msg.isFromStaff ? "text-zinc-500" : "text-zinc-700"
              )}
            >
              {formatTime(msg.createdAt)}
              {msg.source === "WHATSAPP" && " · WhatsApp"}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
