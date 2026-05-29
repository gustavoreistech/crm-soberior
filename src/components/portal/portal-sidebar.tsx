"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documentos", href: "/documentos", icon: FileText },
  { label: "Faturas", href: "/faturas", icon: Receipt },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("portal-sidebar-collapsed");
    if (stored) setCollapsed(stored === "true");
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem("portal-sidebar-collapsed", String(!prev));
      return !prev;
    });
  };

  return (
    <motion.aside
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "h-screen flex-shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          "flex items-center gap-2 p-4 border-b border-zinc-800 h-16",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#F2C14E] tracking-tight">
              SOBERIOR
            </span>
            <span className="text-[10px] text-zinc-500 font-mono self-end mb-0.5">
              portal
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <span className="text-lg font-bold text-[#F2C14E]">S</span>
          </Link>
        )}
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-zinc-800 text-[#F2C14E]"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto text-[#F2C14E]" />
                  )}
                </>
              )}
            </Link>
          );

          // When collapsed, wrap with a simple tooltip-like behavior via title
          if (collapsed) {
            return (
              <div key={item.href} className="relative group">
                {linkContent}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              </div>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-500 font-mono">
            v0.3.0 • Cliente
          </p>
        </div>
      )}
    </motion.aside>
  );
}
