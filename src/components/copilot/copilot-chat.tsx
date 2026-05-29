"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  Bot,
  User,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CopilotContextType } from "@/types/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CopilotChatProps {
  organizationId: string;
  contextType: CopilotContextType;
}

export function CopilotChat({
  organizationId,
  contextType,
}: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Olá! Sou o **Soberior Copilot**. Tenho acesso completo aos dados desta ${
        contextType === "LEAD" ? "organização (lead)" : "organização"
      }. Como posso ajudar?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Foca no input quando o componente monta
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend() {
    const content = input.trim();
    if (!content || isStreaming) return;

    setInput("");
    setError(null);

    // Adiciona mensagem do usuário
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Cria placeholder para resposta da IA
    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    setIsStreaming(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          message: content,
          contextType,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ?? `Erro HTTP ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("Stream não disponível");
      }

      // Leitura do stream SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Processa linhas SSE: "data: {...}\n\n"
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // mantém linha incompleta no buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6); // remove "data: "
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const token =
              parsed.choices?.[0]?.delta?.content ??
              parsed.choices?.[0]?.text ??
              "";

            if (token) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: msg.content + token }
                    : msg
                )
              );
            }
          } catch {
            // Ignora tokens que não são JSON válido (ex: linhas de keep-alive)
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Cancelamento pelo usuário
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    msg.content || "Conversa cancelada.",
                }
              : msg
          )
        );
      } else {
        const errorMsg =
          err instanceof Error ? err.message : "Erro ao comunicar com o Copilot";
        setError(errorMsg);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: `❌ **Erro:** ${errorMsg}`,
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setAbortController(null);
      inputRef.current?.focus();
    }
  }

  function handleCancel() {
    abortController?.abort();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "p-1.5 rounded-full shrink-0 mt-0.5",
                msg.role === "assistant"
                  ? "bg-[#F2C14E]/10 border border-[#F2C14E]/20"
                  : "bg-zinc-800 border border-zinc-700"
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="w-4 h-4 text-[#F2C14E]" />
              ) : (
                <User className="w-4 h-4 text-zinc-400" />
              )}
            </div>

            {/* Conteúdo */}
            <div
              className={cn(
                "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                msg.role === "assistant"
                  ? "bg-zinc-800/50 text-zinc-200 rounded-tl-sm border border-zinc-800"
                  : "bg-[#F2C14E] text-zinc-950 rounded-tr-sm"
              )}
            >
              <div className="prose prose-invert prose-sm max-w-none [&_strong]:text-[#F2C14E] [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5">
                {msg.content || (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#F2C14E] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#F2C14E] rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1.5 h-1.5 bg-[#F2C14E] rounded-full animate-bounce [animation-delay:0.2s]" />
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3 bg-zinc-900/30">
        {/* Error */}
        {error && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre este cliente..."
            rows={1}
            disabled={isStreaming}
            className={cn(
              "flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 resize-none",
              "text-sm text-zinc-200 placeholder:text-zinc-500",
              "focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/50 focus:border-[#F2C14E]",
              "disabled:opacity-50 transition-all min-h-[38px] max-h-[120px]"
            )}
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />

          {isStreaming ? (
            <button
              onClick={handleCancel}
              className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all shrink-0"
              aria-label="Cancelar"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-red-400" />
              </div>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "p-2.5 rounded-xl transition-all shrink-0",
                input.trim()
                  ? "bg-[#F2C14E] text-zinc-950 hover:bg-[#F2C14E]/90"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
              aria-label="Enviar"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-[10px] text-zinc-600 mt-1.5 text-center">
          O Copilot tem acesso completo aos dados do cliente no banco.
          <br />
          Pressione Enter para enviar, Shift+Enter para nova linha.
        </p>
      </div>
    </div>
  );
}
