"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function PortalHeader() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name ?? "Cliente";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 flex-shrink-0 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Breadcrumb / Saudação */}
      <div>
        <p className="text-sm text-zinc-400">
          Bem-vindo,{" "}
          <span className="text-zinc-200 font-medium">{userName}</span>
        </p>
      </div>

      {/* Avatar / Menu do Usuário */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={cn(
            "flex items-center gap-2 p-1.5 rounded-lg transition-colors",
            dropdownOpen
              ? "bg-zinc-800 text-[#F2C14E]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          )}
          aria-label="Menu do usuário"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-[#F2C14E]">
            {initials}
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl py-1 z-50">
            <div className="px-3 py-2 border-b border-zinc-800">
              <p className="text-sm text-zinc-200 font-medium truncate">
                {userName}
              </p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                {session?.user?.email ?? ""}
              </p>
            </div>

            <div className="px-3 py-2 flex items-center gap-2 text-xs text-zinc-500">
              <User className="w-3.5 h-3.5" />
              <span>Cliente</span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
