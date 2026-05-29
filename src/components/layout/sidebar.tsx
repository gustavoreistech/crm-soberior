"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  Headset,
  Receipt,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/config/constants";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { SidebarItem } from "./sidebar-item";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Novo Lead", href: "/leads/new", icon: PlusCircle },
  { label: "Projetos", href: "/projects", icon: Briefcase },
  { label: "Helpdesk", href: "/helpdesk", icon: Headset },
  { label: "Faturas", href: "/invoices", icon: Receipt },
  { label: "Configurações", href: "/settings", icon: Settings },
];

function SidebarContent() {
  const { collapsed, toggle } = useSidebar();

  return (
    <motion.aside
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "h-screen flex-shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 p-4 border-b border-zinc-800",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <h1 className="text-xl font-bold text-[#F2C14E] tracking-tight truncate">
            {APP_NAME}
          </h1>
        )}
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <SidebarItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-500 font-mono">
            v0.2.0 • {APP_NAME}
          </p>
        </div>
      )}
    </motion.aside>
  );
}

export default function Sidebar() {
  return (
    <SidebarProvider>
      <SidebarContent />
    </SidebarProvider>
  );
}
