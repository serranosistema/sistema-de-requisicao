"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

import { SectorsAdmin } from "@/components/sectors-admin";
import { ItemsAdmin } from "@/components/items-admin";

type Tab = "sectors" | "items";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("sectors");

  return (
    <AppShell title="Cadastros">
      <div className="flex h-full flex-col -m-4 md:-m-6">
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-24">
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
                    "rounded-lg px-5 py-2.5 text-sm font-medium transition-colors shrink-0",
                    tab === t.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "sectors" ? <SectorsAdmin /> : <ItemsAdmin />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
