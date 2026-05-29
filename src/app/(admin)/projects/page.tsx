"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { ProjectDetailModal } from "@/components/kanban/project-detail-modal";
import {
  Building2,
  Activity,
  CreditCard,
  Milestone,
  Search,
  Loader2,
  AlertCircle,
  FolderKanban,
  Rocket,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectListItem } from "@/app/api/projects/route";
import type { ProjectData } from "@/components/kanban/project-detail-modal";

// ──────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ONBOARDING: { label: "Onboarding", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  ACTIVE: { label: "Ativo", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  CHURN: { label: "Churn", color: "text-red-400 bg-red-500/10 border-red-500/20" },
};

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

// ──────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modal State
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Erro ao carregar projetos.");
        return;
      }
      setProjects(json.data as ProjectListItem[]);
    } catch (err) {
      console.error("[PROJECTS_PAGE]", err);
      setError("Erro de conexão ao carregar projetos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenProject = useCallback(
    (project: ProjectListItem) => {
      const projectData: ProjectData = {
        id: project.id,
        organizationId: project.organizationId,
        organizationName: project.organizationName,
        organizationDomain: project.organizationDomain,
        organizationCnpj: project.organizationCnpj,
        status: project.status,
        uptimeStatus: project.uptimeStatus,
        milestones: [], // Será carregado dinamicamente se necessário; por enquanto vazio
        subscription: project.subscription
          ? {
              planName: project.subscription.planName,
              value: project.subscription.value,
              status: project.subscription.status,
            }
          : null,
        createdAt: project.createdAt,
      };
      setSelectedProject(projectData);
      setModalOpen(true);
    },
    []
  );

  // Filtro por busca
  const filtered = search.trim()
    ? projects.filter(
        (p) =>
          p.organizationName.toLowerCase().includes(search.toLowerCase()) ||
          p.organizationDomain?.toLowerCase().includes(search.toLowerCase()) ||
          p.organizationCnpj?.includes(search)
      )
    : projects;

  // ─── Render ─────────────────────────────

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Projetos"
          description="Gerencie todos os projetos e clientes ativos"
        />

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Barra de busca */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por empresa, domínio ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#F2C14E]/40 focus:border-[#F2C14E]/60 transition-colors"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#F2C14E] animate-spin" />
                <p className="text-sm text-zinc-500">Carregando projetos...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3 text-center max-w-sm">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-sm text-zinc-400">{error}</p>
                <button
                  onClick={fetchProjects}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3 text-center max-w-sm">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-zinc-500" />
                </div>
                {search ? (
                  <>
                    <p className="text-sm text-zinc-400">
                      Nenhum projeto encontrado para &ldquo;{search}&rdquo;.
                    </p>
                    <button
                      onClick={() => setSearch("")}
                      className="px-4 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      Limpar busca
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-zinc-300">
                      Nenhum projeto cadastrado
                    </p>
                    <p className="text-xs text-zinc-500">
                      Os projetos aparecerão aqui após o onboarding de novos leads.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* Seção: Onboarding em Andamento (Destaque) */}
          {/* ============================================ */}
          {!loading && !error && filtered.filter((p) => p.status === "ONBOARDING").length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-medium text-zinc-300">
                  Onboarding em Andamento
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered
                  .filter((p) => p.status === "ONBOARDING")
                  .map((project, index) => {
                    const progress =
                      project.milestoneCount > 0
                        ? Math.round(
                            (project.completedMilestones / project.milestoneCount) * 100
                          )
                        : 0;

                    return (
                      <motion.button
                        key={project.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        onClick={() => handleOpenProject(project)}
                        className="w-full text-left p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                              <Rocket className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                                {project.organizationName}
                              </p>
                              {project.organizationDomain && (
                                <p className="text-[11px] text-zinc-500 truncate">
                                  {project.organizationDomain}
                                </p>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-blue-400/50 group-hover:text-blue-400 transition-colors shrink-0" />
                        </div>

                        {/* Progress simplificado */}
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {project.completedMilestones}/{project.milestoneCount} milestones
                          </span>
                        </div>

                        <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: index * 0.04 + 0.3, ease: "easeOut" }}
                            className="h-full rounded-full bg-blue-500"
                          />
                        </div>
                      </motion.button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* Project Grid (Todos os projetos) */}
          {/* ============================================ */}
          {!loading && !error && filtered.length > 0 && (
            <>
              {/* Separador visual se tem onboarding */}
              {filtered.filter((p) => p.status === "ONBOARDING").length > 0 && (
                <div className="border-t border-zinc-800 pt-6">
                  <h2 className="text-sm font-medium text-zinc-500 mb-4">
                    Todos os Projetos
                  </h2>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((project, index) => {
                const stageCfg = STATUS_CONFIG[project.status] ?? {
                  label: project.status,
                  color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
                };

                const progress =
                  project.milestoneCount > 0
                    ? Math.round(
                        (project.completedMilestones / project.milestoneCount) * 100
                      )
                    : 0;

                return (
                  <motion.button
                    key={project.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    onClick={() => handleOpenProject(project)}
                    className="w-full text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-[#F2C14E] transition-colors">
                            {project.organizationName}
                          </p>
                          {project.organizationDomain && (
                            <p className="text-[11px] text-zinc-500 truncate">
                              {project.organizationDomain}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0",
                          stageCfg.color
                        )}
                      >
                        {stageCfg.label}
                      </span>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {/* MRR */}
                      <div className="p-2.5 rounded-lg bg-zinc-950">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-600 mb-1">
                          <CreditCard className="w-3 h-3" />
                          MRR
                        </div>
                        <p className="text-xs font-mono font-bold text-[#F2C14E]">
                          {formatCurrency(project.subscription?.value ?? null)}
                        </p>
                      </div>

                      {/* Uptime */}
                      <div className="p-2.5 rounded-lg bg-zinc-950">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-600 mb-1">
                          <Activity className="w-3 h-3" />
                          Uptime
                        </div>
                        <p
                          className={cn(
                            "text-xs font-mono font-bold",
                            project.uptimeStatus >= 95
                              ? "text-emerald-400"
                              : project.uptimeStatus >= 80
                              ? "text-[#F2C14E]"
                              : "text-red-400"
                          )}
                        >
                          {project.uptimeStatus}%
                        </p>
                      </div>

                      {/* Milestones */}
                      <div className="p-2.5 rounded-lg bg-zinc-950">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-600 mb-1">
                          <Milestone className="w-3 h-3" />
                          Progresso
                        </div>
                        <p className="text-xs font-mono font-bold text-white">
                          {project.completedMilestones}/{project.milestoneCount}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: index * 0.04 + 0.3, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          progress >= 80
                            ? "bg-emerald-500"
                            : progress >= 40
                            ? "bg-[#F2C14E]"
                            : "bg-zinc-600"
                        )}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
          )}
        </main>
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
