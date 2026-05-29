"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { FileText, Download, Loader2, FileIcon } from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  url: string | null;
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/portal/documents");
        const result = await response.json();
        if (result.success) {
          setDocuments(result.data);
        }
      } catch (error) {
        console.error("[portal-documentos] Erro ao carregar documentos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1320] p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#F2C14E]" />
          Documentos
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Acesse os documentos do seu projeto
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#F2C14E]" />
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-[#143D59] border border-[#1E293B] hover:border-[#F2C14E]/30 transition-colors"
            >
              <div className="p-2 rounded-lg bg-[#0B1320]">
                <FileIcon className="w-5 h-5 text-[#1F7A8C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {doc.name}
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {doc.type} &middot;{" "}
                  {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-[#0B1320] transition-colors"
                >
                  <Download className="w-4 h-4 text-[#94A3B8]" />
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[#64748B]">
            Nenhum documento disponível no momento.
          </p>
          <p className="text-xs text-[#475569] mt-1">
            Os documentos serão exibidos aqui após a conclusão do onboarding.
          </p>
        </div>
      )}
    </div>
  );
}
