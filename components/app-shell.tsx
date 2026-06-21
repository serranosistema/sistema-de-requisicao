"use client";

import { useState, type ReactNode } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* ── Sidebar desktop ── some completamente com w-0 + overflow-hidden ── */}
      <aside
        className="hidden md:block border-r border-sidebar-border transition-all duration-300 overflow-hidden"
        style={{ width: collapsed ? 0 : "16rem" }} // 0 ou w-64 (256px)
      >
        <div className="w-64 h-full">
          <Sidebar />
        </div>
      </aside>

      {/* ── Sidebar mobile (overlay) ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-72 shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <Button
              variant="ghost"
              size="icon-lg"
              className="absolute right-2 top-3"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
            >
              <XMarkIcon className="size-5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Conteúdo principal ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
          {/* Mobile: abre drawer */}
          <Button
            variant="ghost"
            size="icon-lg"
            className="md:hidden"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
          >
            <Bars3Icon className="size-6" />
          </Button>

          {/* Desktop: toggle que some/mostra a sidebar */}
          <Button
            variant="ghost"
            size="icon-lg"
            className="hidden md:inline-flex"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={() => setCollapsed((c) => !c)}
          >
            <Bars3Icon className="size-6" />
          </Button>

          <h1 className="flex-1 truncate text-balance text-lg font-semibold md:text-xl">
            {title}
          </h1>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
