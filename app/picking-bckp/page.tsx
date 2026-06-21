"use client"

import { useState } from "react"
import {
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline"
import { AppShell } from "@/components/app-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function PickingPage() {
  const { requisitions, sectorName, itemName, itemUnit, toggleItemPicked, updateRequisitionStatus } =
    useStore()
  const queue = requisitions.filter((r) => r.status === "PENDING" || r.status === "PICKING")
  const [selectedId, setSelectedId] = useState<string | null>(queue[0]?.id ?? null)

  const selected = requisitions.find((r) => r.id === selectedId)
  const allPicked = selected ? selected.items.every((i) => i.picked) : false

  function startPicking(id: string) {
    setSelectedId(id)
    const req = requisitions.find((r) => r.id === id)
    if (req?.status === "PENDING") updateRequisitionStatus(id, "PICKING")
  }

  return (
    <AppShell title="Separação no Estoque">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Fila */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Fila de separação ({queue.length})
          </h2>
          {queue.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
              Nenhuma requisição na fila.
            </p>
          )}
          {queue.map((r) => (
            <button
              key={r.id}
              onClick={() => startPicking(r.id)}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors",
                selectedId === r.id ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium">
                  <BuildingStorefrontIcon className="size-5 text-primary" />
                  {sectorName(r.sectorId)}
                </span>
                <StatusBadge status={r.status} />
              </div>
              <span className="text-sm text-muted-foreground">
                {r.items.length} itens · {r.requesterName}
              </span>
            </button>
          ))}
        </div>

        {/* Detalhe de separação */}
        <div className="rounded-2xl border border-border bg-card">
          {!selected ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <ClipboardDocumentCheckIcon className="size-12" />
              <p>Selecione uma requisição na fila para iniciar a separação.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 className="font-semibold">{sectorName(selected.sectorId)}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selected.items.filter((i) => i.picked).length} de {selected.items.length} separados
                  </p>
                </div>
                <Button
                  size="lg"
                  className="h-12"
                  disabled={!allPicked || selected.status === "COMPLETED"}
                  onClick={() => updateRequisitionStatus(selected.id, "COMPLETED")}
                >
                  <CheckCircleIcon className="size-5" />
                  Concluir Separação
                </Button>
              </div>
              <ul className="divide-y divide-border">
                {selected.items.map((it) => (
                  <li key={it.id}>
                    <label className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-muted">
                      <Checkbox
                        checked={!!it.picked}
                        onCheckedChange={() => toggleItemPicked(selected.id, it.id)}
                        className="size-7"
                      />
                      <div className="flex flex-1 items-center justify-between gap-3">
                        <span className={cn("font-medium", it.picked && "text-muted-foreground line-through")}>
                          {itemName(it.itemId)}
                        </span>
                        <span className="shrink-0 rounded-lg bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
                          {it.quantity} {itemUnit(it.itemId)}
                        </span>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
