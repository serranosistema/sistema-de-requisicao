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
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout, getUsuarioAtual } from "@/app/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/requisicao", label: "Separação", icon: ClipboardDocumentCheckIcon },
  { href: "/historico", label: "Histórico", icon: ClockIcon },
  { href: "/admin", label: "Cadastros", icon: Cog6ToothIcon },
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
    getUsuarioAtual().then((data) => {
      if (data) setUser(data);
    });
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col bg-black text-zinc-400 shadow-xl">
      {/* Cabeçalho */}
      <div className="flex h-16 items-center px-6 border-b border-white/8">
        <span className="font-semibold text-white text-base tracking-tight">
          Requisição <span className="text-violet-400">Digital</span>
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
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-900/50"
                  : "hover:bg-white/6 hover:text-white text-zinc-400",
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="border-t border-white/8 p-3 flex flex-col gap-3">
        {/* Usuário */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-violet-300 text-sm font-semibold border border-violet-500/20">
            {user?.name?.charAt(0).toUpperCase() ?? "-"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white leading-tight">
              {user?.name || "Carregando..."}
            </p>
            <p className="truncate text-xs text-zinc-500 mt-0.5">
              {user?.email || "aguarde..."}
            </p>
          </div>
        </div>

        {/* Botão Sair */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:bg-red-600/10 hover:text-red-400 transition-colors border border-white/6 rounded-xl h-10"
        >
          <ArrowLeftOnRectangleIcon className="size-4" />
          <span className="text-sm">Sair da conta</span>
        </Button>
      </div>
    </div>
  );
}
