"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciais inválidas. Verifique seu e-mail e senha.");
        return;
      }

      if (result?.ok) {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Erro de rede ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1320]">
      <div className="w-full max-w-sm p-8 rounded-xl bg-[#143D59] border border-[#1E293B]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#F2C14E]">SOBERIOR</h1>
          <p className="text-sm text-[#94A3B8] mt-1">AI & Data Analytics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs text-[#94A3B8] font-medium"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full px-3 py-2 rounded-lg bg-[#0B1320] border border-[#1E293B] text-white placeholder:text-[#64748B] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/50"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs text-[#94A3B8] font-medium"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-[#0B1320] border border-[#1E293B] text-white placeholder:text-[#64748B] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/50"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#F2C14E] text-[#0B1320] font-medium text-sm hover:bg-[#F2C14E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
