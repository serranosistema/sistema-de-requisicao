"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
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
import { cn } from "@/lib/utils";

import { getSectors } from "@/app/actions/sectors";
import { getItems } from "@/app/actions/items";
import { createRequisition } from "@/app/actions/requisitions";

interface DbSector {
  id: string;
  name: string;
}

interface DbItem {
  id: string;
  name: string;
  unit: string;
  sectors: { id: string }[];
}

const parseBrFloat = (val: string) => parseFloat(val.replace(",", ".") || "0");

// Chaves do LocalStorage
const STORAGE_SECTOR_KEY = "@requi/draft-sector";
const STORAGE_CART_KEY = "@requi/draft-cart";

export default function SeparacaoPage() {
  const router = useRouter();

  // Estados Base do Banco
  const [sectors, setSectors] = useState<DbSector[]>([]);
  const [items, setItems] = useState<DbItem[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados de Interface e Carrinho
  const [sectorId, setSectorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  // Controle de Hidratação do Next.js
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // 1. CARREGAMENTO INICIAL: Busca DB e Recupera LocalStorage
  useEffect(() => {
    async function loadInitialData() {
      setLoadingDb(true);
      const [fetchedSectors, fetchedItems] = await Promise.all([
        getSectors(),
        getItems(),
      ]);
      setSectors(fetchedSectors);
      setItems(fetchedItems);
      setLoadingDb(false);

      // Recupera o estado do LocalStorage
      const savedSector = localStorage.getItem(STORAGE_SECTOR_KEY);
      const savedCart = localStorage.getItem(STORAGE_CART_KEY);

      if (savedSector) setSectorId(savedSector);
      if (savedCart) {
        try {
          setQuantities(JSON.parse(savedCart));
        } catch (error) {
          console.error("Falha ao recuperar carrinho do cache", error);
        }
      }
      setIsClientLoaded(true);
    }
    loadInitialData();
  }, []);

  // 2. SINCRONIZAÇÃO: Salva no LocalStorage a cada alteração
  useEffect(() => {
    if (!isClientLoaded) return; // Evita sobrescrever o cache antes de carregar

    if (sectorId) {
      localStorage.setItem(STORAGE_SECTOR_KEY, sectorId);
    } else {
      localStorage.removeItem(STORAGE_SECTOR_KEY);
    }

    localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(quantities));
  }, [sectorId, quantities, isClientLoaded]);

  // Cálculos Memoizados
  const sectorItems = useMemo(
    () =>
      sectorId
        ? items.filter((i) => i.sectors.some((s) => s.id === sectorId))
        : [],
    [items, sectorId],
  );

  const filteredItems = useMemo(() => {
    let result = sectorItems;
    if (showOnlySelected) {
      result = result.filter((i) => parseBrFloat(quantities[i.id] || "0") > 0);
    }
    if (searchQuery.trim()) {
      result = result.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return result;
  }, [sectorItems, searchQuery, showOnlySelected, quantities]);

  const selectedCount = Object.values(quantities).filter(
    (q) => parseBrFloat(q || "0") > 0,
  ).length;

  // Handlers de Ação
  function handleQtyChange(itemId: string, unit: string, rawValue: string) {
    if (rawValue === "") {
      setQuantities((prev) => ({ ...prev, [itemId]: "" }));
      return;
    }

    let localizedValue = rawValue.replace(".", ",");
    const isFractional = unit === "KG" || unit === "L";

    if (!isFractional && localizedValue.includes(",")) {
      localizedValue = localizedValue.split(",")[0];
    }

    const isValidBRNumber = /^[0-9]+(,[0-9]*)?$/.test(localizedValue);

    if (isValidBRNumber) {
      setQuantities((prev) => ({ ...prev, [itemId]: localizedValue }));
    }
  }

  function adjustQty(itemId: string, unit: string, amount: number) {
    const currentNum = parseBrFloat(quantities[itemId] || "0");
    let nextValue = currentNum + amount;

    if (nextValue < 0) nextValue = 0;

    const isFractional = unit === "KG" || unit === "L";
    if (!isFractional) nextValue = Math.floor(nextValue);

    const nextValueStr =
      nextValue === 0 ? "" : String(nextValue).replace(".", ",");

    setQuantities((prev) => ({ ...prev, [itemId]: nextValueStr }));
  }

  async function handleSave() {
    if (!sectorId) return;

    const chosen = Object.entries(quantities)
      .map(([itemId, qtyStr]) => ({
        itemId,
        quantity: parseBrFloat(qtyStr || "0"),
      }))
      .filter((item) => item.quantity > 0);

    if (chosen.length === 0) return;

    setSaving(true);
    const res = await createRequisition(sectorId, chosen);
    setSaving(false);

    if (res.success) {
      // LIMPA O CACHE APÓS SUCESSO
      localStorage.removeItem(STORAGE_SECTOR_KEY);
      localStorage.removeItem(STORAGE_CART_KEY);

      setQuantities({});
      setSearchQuery("");
      setShowOnlySelected(false);
      setSectorId(null); // Volta para a tela inicial

      router.push("/historico");
    } else {
      alert(res.error);
    }
  }

  function handleBack() {
    setSectorId(null);
    setSearchQuery("");
    setShowOnlySelected(false);
    // Nota: Mantemos o quantities intacto no cache caso ela queira voltar ao setor depois
  }

  // --- SUB-COMPONENTES DE RENDERIZAÇÃO ---

  function renderSectorSelection() {
    return (
      <div className="mx-auto max-w-4xl pb-20">
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
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BuildingStorefrontIcon className="size-7" />
              </div>
              <span className="text-base font-semibold">{s.name}</span>
            </button>
          ))}
          {sectors.length === 0 && (
            <p className="col-span-full py-12 text-center text-muted-foreground">
              Nenhum setor cadastrado. Vá em Cadastros primeiro.
            </p>
          )}
        </div>
      </div>
    );
  }

  function renderItemSelection() {
    return (
      <div className="mx-auto max-w-4xl pb-24">
        {/* CABEÇALHO: Setor Atual */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10 rounded-xl shrink-0"
          >
            <ArrowLeftIcon className="size-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
              Setor
            </p>
            <p className="text-lg sm:text-xl font-bold text-primary leading-tight truncate">
              {sectors.find((s) => s.id === sectorId)?.name}
            </p>
          </div>
        </div>

        {/* CARRINHO NO TOPO */}
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 mb-6 rounded-2xl border-2 transition-all",
            selectedCount > 0
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border bg-card",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                selectedCount > 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <ArchiveBoxArrowDownIcon className="size-6" />
            </div>
            <div>
              <p className="font-bold text-lg leading-none">
                {selectedCount} {selectedCount === 1 ? "insumo" : "insumos"}
              </p>
              <p className="text-sm text-muted-foreground">no carrinho</p>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto font-bold rounded-xl h-12 shrink-0"
            onClick={handleSave}
            disabled={selectedCount === 0 || saving}
          >
            {saving ? "Salvando..." : "Baixar Estoque"}
          </Button>
        </div>

        {/* BUSCA E FILTRO */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar insumo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base rounded-xl"
            />
          </div>
          <Button
            variant={showOnlySelected ? "default" : "outline"}
            className="h-12 rounded-xl px-4 w-full sm:w-auto"
            onClick={() => setShowOnlySelected((v) => !v)}
          >
            <FunnelIcon
              className={cn("size-5", showOnlySelected ? "mr-2" : "")}
            />
            <span
              className={cn(
                "font-semibold",
                showOnlySelected ? "inline" : "hidden sm:inline",
              )}
            >
              Revisar ({selectedCount})
            </span>
          </Button>
        </div>

        {/* LISTA DE INSUMOS */}
        <div className="flex flex-col gap-3">
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center mt-4">
              <p className="text-base text-muted-foreground font-medium">
                {showOnlySelected
                  ? "Nenhum insumo no carrinho ainda."
                  : searchQuery.trim()
                    ? `Nenhum resultado para "${searchQuery}".`
                    : "Nenhum insumo vinculado a este setor."}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const qtyStr = quantities[item.id] || "";
              const qtyValue = parseBrFloat(qtyStr);
              const active = qtyValue > 0;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 p-4 transition-all",
                    active
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-base sm:text-lg">
                      {item.name}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      Unidade:{" "}
                      <span className="text-foreground">{item.unit}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                    <Button
                      variant={active ? "default" : "outline"}
                      size="icon"
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0"
                      onClick={() => adjustQty(item.id, item.unit, -1)}
                      disabled={qtyValue <= 0}
                    >
                      <MinusIcon className="size-5" />
                    </Button>

                    <Input
                      type="text"
                      inputMode="decimal"
                      value={qtyStr}
                      placeholder="0"
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) =>
                        handleQtyChange(item.id, item.unit, e.target.value)
                      }
                      className="h-10 sm:h-11 flex-1 sm:w-20 text-center text-lg font-bold rounded-xl border-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />

                    <Button
                      variant={active ? "default" : "outline"}
                      size="icon"
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0"
                      onClick={() => adjustQty(item.id, item.unit, 1)}
                    >
                      <PlusIcon className="size-5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // --- RENDER PRINCIPAL ---
  if (loadingDb || !isClientLoaded) {
    return (
      <AppShell title="Carregando...">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground animate-pulse">
            Buscando setores e itens...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={sectorId ? "Separando Insumos" : "Reqi - Separação"}>
      <div className="flex h-full flex-col -m-4 md:-m-6">
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
          {!sectorId ? renderSectorSelection() : renderItemSelection()}
        </div>
      </div>
    </AppShell>
  );
}
