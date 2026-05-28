"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  PlusCircle,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE } from "@/config/constants";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Novo Lead", href: "/leads/new", icon: PlusCircle },
  { label: "Configurações", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen flex-shrink-0 bg-[#0B1320] border-r border-[#1E293B] flex flex-col">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-[#1E293B]">
        <h1 className="text-xl font-bold text-[#F2C14E] tracking-tight">
          {APP_NAME}
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5 font-mono">
          {APP_TAGLINE}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#143D59] text-[#F2C14E]"
                  : "text-[#94A3B8] hover:bg-[#143D59]/50 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1E293B]">
        <p className="text-[10px] text-[#64748B] font-mono">
          v0.1.0 • {APP_NAME}
        </p>
      </div>
    </aside>
  );
}
