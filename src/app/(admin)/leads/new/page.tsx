"use client";

import Sidebar from "@/components/layout/sidebar";
import { LeadForm } from "@/components/forms/lead-form";

export default function NewLeadPage() {
  return (
    <div className="flex h-screen bg-[#0B1320]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full">
          <LeadForm />
        </main>
      </div>
    </div>
  );
}
