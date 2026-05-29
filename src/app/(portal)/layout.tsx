import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalHeader } from "@/components/portal/portal-header";
import { ChatWidget } from "@/components/portal/chat-widget";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-zinc-950">
      <PortalSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PortalHeader />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Chat Widget Omnichannel — flutuante no canto inferior direito */}
      <ChatWidget />
    </div>
  );
}
