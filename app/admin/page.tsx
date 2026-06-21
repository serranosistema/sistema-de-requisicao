"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

// Importamos os novos componentes separados
import { SectorsAdmin } from "@/components/sectors-admin";
import { ItemsAdmin } from "@/components/items-admin";

type Tab = "sectors" | "items";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("sectors");

  return (
    <AppShell title="Cadastros">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="inline-flex w-fit rounded-xl border border-border bg-card p-1">
          {(
            [
              { id: "sectors", label: "Setores" },
              { id: "items", label: "Itens" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-5 py-2.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Renderiza o componente limpo conforme a aba selecionada */}
        {tab === "sectors" ? <SectorsAdmin /> : <ItemsAdmin />}
      </div>
    </AppShell>
  );
}
