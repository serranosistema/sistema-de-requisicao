"use client";

import { useState, useMemo } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

// Importando os componentes que acabamos de criar (e os que vamos ajustar)
import { Pagination } from "@/components/ui/pagination";
import { CsvImporter } from "@/components/csv-importer";

type Tab = "sectors" | "items";
const UNITS = ["KG", "UN", "CX", "L"];
const ITEMS_PER_PAGE = 10;

export default function AdminPage() {
  const store = useStore();
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

        {tab === "sectors" ? (
          <SectorsAdmin store={store} />
        ) : (
          <ItemsAdmin store={store} />
        )}
      </div>
    </AppShell>
  );
}

function SectorsAdmin({ store }: { store: ReturnType<typeof useStore> }) {
  const { sectors, addSector, updateSector, deleteSector } = store;
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");

  function openNew() {
    setEditId(null);
    setName("");
    setOpen(true);
  }
  function openEdit(id: string, current: string) {
    setEditId(id);
    setName(current);
    setOpen(true);
  }
  function save() {
    if (!name.trim()) return;
    if (editId) updateSector(editId, name.trim());
    else addSector(name.trim());
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          Setores cadastrados ({sectors.length})
        </h2>
        <Button size="lg" className="h-11" onClick={openNew}>
          <PlusIcon className="size-5" />
          <span className="hidden sm:inline">Novo Setor</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <span className="font-medium">{s.name}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Editar"
                onClick={() => openEdit(s.id, s.name)}
              >
                <PencilSquareIcon className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Excluir"
                className="text-destructive"
                onClick={() => deleteSector(s.id)}
              >
                <TrashIcon className="size-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Setor" : "Novo Setor"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="sector-name">Nome do setor</Label>
            <Input
              id="sector-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cozinha"
              className="h-11"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemsAdmin({ store }: { store: ReturnType<typeof useStore> }) {
  const {
    items,
    sectors,
    addItem,
    updateItem,
    deleteItem,
    sectorName,
    importFromCSV,
  } = store;

  // Estados do modal
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("KG");
  const [cost, setCost] = useState<string>("");
  const [sectorIds, setSectorIds] = useState<string[]>([]);

  // Estados de Busca e Paginação
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtra e pagina os dados
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((it) =>
      it.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Função para baixar a planilha modelo
  function downloadTemplate() {
    const csvContent =
      "Nome,Unidade,Setor,Custo\nFarinha de Trigo,KG,Cozinha,5.50\nOvo,CX,Padaria,\nLeite,L,Confeitaria,4.20";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "modelo-insumos-val.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function openNew() {
    setEditId(null);
    setName("");
    setUnit("KG");
    setCost("");
    setSectorIds([]);
    setOpen(true);
  }

  // Permite ts-ignore temporário até atualizarmos o tipo Item no types.ts
  // @ts-ignore
  function openEdit(item: Item & { cost?: number }) {
    setEditId(item.id);
    setName(item.name);
    setUnit(item.unit);
    setCost(item.cost ? String(item.cost) : "");
    setSectorIds(item.sectorIds);
    setOpen(true);
  }

  function toggleSector(id: string) {
    setSectorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function save() {
    if (!name.trim()) return;
    const parsedCost = cost ? parseFloat(cost.replace(",", ".")) : undefined;

    const data = {
      name: name.trim(),
      unit,
      sectorIds,
      cost: !isNaN(parsedCost as number) ? parsedCost : undefined,
    };

    if (editId) updateItem(editId, data);
    else addItem(data);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold">Itens cadastrados ({items.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="gap-2"
          >
            <ArrowDownTrayIcon className="size-4" />
            <span className="hidden sm:inline">Baixar Modelo</span>
          </Button>

          <CsvImporter onImport={importFromCSV} />

          <Button onClick={openNew}>
            <PlusIcon className="size-5 mr-1" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar insumo por nome..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reseta a paginação ao buscar
          }}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Lista de Itens Paginada */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {paginatedItems.length === 0 ? (
          <p className="col-span-full py-8 text-center text-muted-foreground">
            Nenhum item encontrado.
          </p>
        ) : (
          paginatedItems.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{it.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground/80">
                    {it.unit}
                  </span>
                  <span>&bull;</span>
                  <span className="truncate">
                    {it.sectorIds.map(sectorName).join(", ") || "Sem setor"}
                  </span>
                </div>
                {/* @ts-ignore - temporário */}
                {it.cost !== undefined && (
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                    {/* @ts-ignore */}
                    Custo ref: R$ {it.cost.toFixed(2).replace(".", ",")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {/* @ts-ignore */}
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Editar"
                  onClick={() => openEdit(it)}
                >
                  <PencilSquareIcon className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Excluir"
                  className="text-destructive"
                  onClick={() => deleteItem(it.id)}
                >
                  <TrashIcon className="size-5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação Dinâmica */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal de Cadastro/Edição */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-name">Nome do item</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Farinha de Trigo"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Unidade</Label>
                <Select
                  value={unit}
                  onValueChange={(value) => setUnit(value ?? "KG")}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="item-cost">Custo (Opcional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    id="item-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0,00"
                    className="h-11 pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {/* === NOVO: Cabeçalho dos setores com o botão "Marcar todos" === */}
              <div className="flex items-center justify-between">
                <Label>Setores disponíveis</Label>
                {sectors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (sectorIds.length === sectors.length) {
                        setSectorIds([]); // Desmarca todos
                      } else {
                        setSectorIds(sectors.map((s) => s.id)); // Marca todos
                      }
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {sectorIds.length === sectors.length
                      ? "Desmarcar todos"
                      : "Marcar todos"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {sectors.length === 0 ? (
                  <p className="col-span-2 text-sm text-muted-foreground py-2">
                    Cadastre setores primeiro.
                  </p>
                ) : (
                  sectors.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={sectorIds.includes(s.id)}
                        onCheckedChange={() => toggleSector(s.id)}
                      />
                      <span className="text-sm truncate">{s.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
