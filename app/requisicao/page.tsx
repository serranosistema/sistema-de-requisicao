"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  MinusIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  ArrowLeftIcon,
  ArchiveBoxArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function SeparacaoPage() {
  const router = useRouter();
  const { sectors, items, addRequisition } = useStore();

  const [sectorId, setSectorId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const sectorItems = useMemo(
    () => (sectorId ? items.filter((i) => i.sectorIds.includes(sectorId)) : []),
    [items, sectorId],
  );

  const filteredItems = useMemo(() => {
    let result = sectorItems;
    if (showOnlySelected) {
      result = result.filter((i) => (quantities[i.id] ?? 0) > 0);
    }
    if (searchQuery.trim()) {
      result = result.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return result;
  }, [sectorItems, searchQuery, showOnlySelected, quantities]);

  const selectedCount = Object.values(quantities).filter((q) => q > 0).length;

  function setQty(itemId: string, value: number) {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, value) }));
  }

  function handleSave() {
    if (!sectorId) return;
    const chosen = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    if (chosen.length === 0) return;

    addRequisition(sectorId, chosen);
    setQuantities({});
    setSearchQuery("");
    setShowOnlySelected(false);
    router.push("/historico");
  }

  function handleBack() {
    setSectorId(null);
    setSearchQuery("");
    setShowOnlySelected(false);
    setQuantities({});
  }

  // ─── Tela de seleção de setor ───────────────────────────────────────────────
  if (!sectorId) {
    return (
      <AppShell title="Reqi - Separação">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 mt-4 text-center sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight">
              Iniciar Separação
            </h2>
            <p className="text-muted-foreground mt-1 text-lg">
              Para qual setor você vai separar insumos agora?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sectors.map((s) => (
              <button
                key={s.id}
                onClick={() => setSectorId(s.id)}
                className="flex min-h-40 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-border bg-card p-6 text-center transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
              >
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BuildingStorefrontIcon className="size-8" />
                </div>
                <span className="text-lg font-semibold">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  // ─── Tela de separação ──────────────────────────────────────────────────────
  //
  // Estrutura de layout (padrão Next.js):
  //   AppShell > main (overflow-hidden, flex)
  //     └── div.h-full.flex.flex-col          ← ocupa toda a altura do main
  //           ├── div.shrink-0                ← header estático (nunca rola)
  //           └── div.flex-1.overflow-y-auto  ← única região que rola
  //
  // O -m-4 / md:-m-6 cancela o padding do <main> do AppShell para que o
  // header encoste nas bordas sem gaps. O padding é reaplicado internamente.
  //
  return (
    <AppShell title="Separando Insumos">
      {/* Cancela o padding do <main> e ocupa toda a altura disponível */}
      <div className="flex h-full flex-col -m-4 md:-m-6">
        {/* ── Header estático ── nunca rola, fica sempre no topo ── */}
        <div className="shrink-0 border-b border-border bg-background px-4 md:px-6 pt-4 pb-4 shadow-sm">
          {/* Linha superior: voltar + nome do setor */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Voltar para setores"
              onClick={handleBack}
              className="rounded-xl"
            >
              <ArrowLeftIcon className="size-6" />
            </Button>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Setor em separação
              </p>
              <p className="text-xl font-bold text-primary">
                {sectors.find((s) => s.id === sectorId)?.name}
              </p>
            </div>
          </div>

          {/* Linha inferior: busca + filtro */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar insumo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-2xl"
              />
            </div>
            <Button
              variant={showOnlySelected ? "default" : "outline"}
              className={cn(
                "h-14 rounded-2xl px-4 transition-all",
                showOnlySelected && "shadow-md",
              )}
              onClick={() => setShowOnlySelected((v) => !v)}
            >
              <FunnelIcon
                className={cn("size-6", showOnlySelected ? "mr-2" : "")}
              />
              <span
                className={cn(
                  "font-semibold",
                  showOnlySelected ? "inline" : "hidden sm:hidden",
                )}
              >
                Revisar Carrinho ({selectedCount})
              </span>
            </Button>
          </div>
        </div>

        {/* ── Área de scroll ── só esta região rola ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6">
          <div className="mx-auto max-w-4xl flex flex-col gap-3 py-4 pb-36">
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center mt-4">
                <p className="text-lg text-muted-foreground font-medium">
                  {showOnlySelected
                    ? "Nenhum insumo no carrinho ainda."
                    : searchQuery.trim()
                      ? `Nenhum insumo encontrado para "${searchQuery}".`
                      : "Nenhum insumo cadastrado para este setor."}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const qty = quantities[item.id] ?? 0;
                const active = qty > 0;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 p-4 transition-all",
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-lg">{item.name}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        Unidade de saída:{" "}
                        <span className="text-foreground">{item.unit}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={active ? "default" : "outline"}
                        size="icon-lg"
                        className="size-14 rounded-xl"
                        onClick={() => setQty(item.id, qty - 1)}
                        disabled={qty === 0}
                      >
                        <MinusIcon className="size-6" />
                      </Button>
                      <Input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min={0}
                        value={qty}
                        onChange={(e) =>
                          setQty(item.id, Number(e.target.value))
                        }
                        className="h-14 w-24 text-center text-xl font-bold rounded-xl border-2"
                      />
                      <Button
                        variant={active ? "default" : "outline"}
                        size="icon-lg"
                        className="size-14 rounded-xl"
                        onClick={() => setQty(item.id, qty + 1)}
                      >
                        <PlusIcon className="size-6" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Rodapé fixo ── fora do flex column, sempre sobre o conteúdo ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-background/95 px-4 py-4 backdrop-blur-lg md:pl-72 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div
              className={cn(
                "p-3 rounded-xl transition-colors",
                selectedCount > 0
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted",
              )}
            >
              <ArchiveBoxArrowDownIcon className="size-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium uppercase tracking-wider">
                No carrinho
              </span>
              <span className="font-bold text-lg text-foreground leading-none">
                {selectedCount} {selectedCount === 1 ? "insumo" : "insumos"}
              </span>
            </div>
          </div>
          <Button
            size="lg"
            className="h-16 px-8 text-xl font-bold rounded-2xl shadow-lg transition-transform active:scale-95"
            onClick={handleSave}
            disabled={selectedCount === 0}
          >
            <CheckIcon className="size-7 mr-2" strokeWidth={2.5} />
            Baixar Estoque
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
