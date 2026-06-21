"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  Cog6ToothIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { ROLE_LABELS } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/requisicao", label: "Separação", icon: ClipboardDocumentCheckIcon },
  { href: "/historico", label: "Histórico", icon: ClockIcon },
  { href: "/admin", label: "Cadastros", icon: Cog6ToothIcon },
];

export function Sidebar({
  onNavigate,
}: {
  collapsed?: boolean; // mantido por compatibilidade, mas não usado internamente
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useStore();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}

      {/* Nav */}
      <nav className="flex-1 space-y-1.5 p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors min-h-12",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-6 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Usuário */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">
            {user?.name.charAt(0) ?? "?"}
          </div>
          {user && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
