"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarItemProps {
  item: NavItem;
}

export function SidebarItem({ item }: SidebarItemProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const isActive = pathname === item.href;

  const linkContent = (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-zinc-800 text-[#F2C14E]"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
        collapsed && "justify-center px-0"
      )}
    >
      <item.icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Link href={item.href}>{linkContent}</Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="bg-zinc-900 border-zinc-800 text-zinc-200"
        >
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return <Link href={item.href}>{linkContent}</Link>;
}
