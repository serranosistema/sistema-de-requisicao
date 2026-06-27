"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout, getUsuarioAtual } from "@/app/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/requisicao", label: "Separação", icon: ClipboardDocumentCheckIcon },
  { href: "/historico", label: "Histórico", icon: ClockIcon },
  { href: "/admin", label: "Cadastros", icon: Cog6ToothIcon },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: ClipboardDocumentListIcon,
  },
];

interface UserData {
  name: string;
  email: string;
  role: string;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    // 1. Tenta pegar os dados cacheados na sessão
    const cachedUser = sessionStorage.getItem("@req-user");

    if (cachedUser) {
      // Se existir, usa imediatamente e cancela a busca no BD
      setUser(JSON.parse(cachedUser));
      return;
    }

    // 2. Se não tiver cache, busca no BD e salva para a próxima vez
    getUsuarioAtual().then((data) => {
      if (data) {
        setUser(data);
        sessionStorage.setItem("@req-user", JSON.stringify(data));
      }
    });
  }, []);

  async function handleLogout() {
    // 3. Limpa o cache ao sair para não vazar dados de sessão
    sessionStorage.removeItem("@req-user");
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col bg-card border-r border-border shadow-xl">
      {/* Cabeçalho */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="font-semibold text-foreground text-base tracking-tight">
          Requisição <span className="text-primary">Digital</span>
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
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
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 min-h-12",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="border-t border-border p-3 flex flex-col gap-3">
        {/* Usuário */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
            {user?.name?.charAt(0).toUpperCase() ?? "-"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground leading-tight">
              {user?.name || "Carregando..."}
            </p>
            <p className="truncate text-xs text-muted-foreground mt-0.5">
              {user?.email || "aguarde..."}
            </p>
          </div>
        </div>

        {/* Botão Sair */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors border border-border rounded-xl h-10"
        >
          <ArrowLeftOnRectangleIcon className="size-4" />
          <span className="text-sm">Sair da conta</span>
        </Button>
      </div>
    </div>
  );
}
