"use client";

import { useState, useMemo, useEffect } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

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
import { Pagination } from "@/components/ui/pagination";
import { CsvImporter, ParsedCSVItem } from "@/components/csv-importer";
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} from "@/app/actions/items";
import { getSectors } from "@/app/actions/sectors";

const UNITS = ["UN", "KG", "CX", "L"]; // Coloquei 'UN' primeiro como padrão
const ITEMS_PER_PAGE = 10;

interface DbItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  cost: number | null;
  sectors: { id: string; code: string; name: string }[]; // <-- Adicionado code aqui
}

export function ItemsAdmin() {
  const [items, setItems] = useState<DbItem[]>([]);
  const [sectors, setSectors] = useState<
    { id: string; code: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [code, setCode] = useState(""); // <-- Estado do Código
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("UN");
  const [cost, setCost] = useState<string>("");
  const [sectorIds, setSectorIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  async function loadData() {
    setLoading(true);
    const [fetchedItems, fetchedSectors] = await Promise.all([
      getItems(),
      getSectors(),
    ]);
    setItems(fetchedItems as DbItem[]);
    setSectors(fetchedSectors);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const lowerSearch = search.toLowerCase();
    // Agora a busca funciona tanto pelo código quanto pela descrição
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(lowerSearch) ||
        it.code.toLowerCase().includes(lowerSearch),
    );
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  function downloadTemplate() {
    const csvContent =
      "Codigo,Descricao,Unidade,Cod Setor,Nome do Setor,Custo\n789101010,Farinha de Trigo,KG,101,Cozinha,5.50\n123456789,Ovo,CX,102,Padaria,\n987654321,Amendoim,KG,101/102,Cozinha / Padaria,4.20";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "modelo-insumos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  function openNew() {
    setEditId(null);
    setCode("");
    setName("");
    setUnit("UN");
    setCost("");
    setSectorIds([]);
    setOpen(true);
  }

  function openEdit(item: DbItem) {
    setEditId(item.id);
    setCode(item.code);
    setName(item.name);
    setUnit(item.unit);
    setCost(item.cost !== null ? String(item.cost) : "");
    setSectorIds(item.sectors.map((s) => s.id));
    setOpen(true);
  }

  function toggleSector(id: string) {
    setSectorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function save() {
    // O código é obrigatório!
    if (!code.trim()) {
      alert("O campo Código é obrigatório!");
      return;
    }

    const parsedCost = cost ? parseFloat(cost.replace(",", ".")) : undefined;
    const data = {
      code: code.trim(),
      name: name.trim() || "Sem descrição", // Se não preencher, salva um fallback
      unit,
      sectorIds,
      cost: parsedCost && !isNaN(parsedCost) ? parsedCost : undefined,
    };

    if (editId) {
      const res = await updateItem(editId, data);
      if (res.success) loadData();
      else alert(res.error); // Mostra erro caso o código já exista, por exemplo
    } else {
      const res = await createItem(data);
      if (res.success) loadData();
      else alert(res.error);
    }
    setOpen(false);
  }

  async function handleDelete(id: string) {
    if (confirm("Tem a certeza de que deseja eliminar este item?")) {
      const res = await deleteItem(id);
      if (res.success) loadData();
    }
  }
  async function handleImport(parsedData: ParsedCSVItem[]) {
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of parsedData) {
      // Agora comparamos os CÓDIGOS que vieram na planilha com os CÓDIGOS reais dos setores
      const matchedSectorIds = item.sectorCodes
        .map((code) => {
          const found = sectors.find(
            (s) => s.code.toLowerCase() === code.toLowerCase(),
          );
          return found?.id;
        })
        .filter(Boolean) as string[];

      const res = await createItem({
        code: item.code,
        name: item.name,
        unit: item.unit.toUpperCase(),
        cost: item.cost,
        sectorIds: matchedSectorIds,
      });

      if (res.success) successCount++;
      else errorCount++;
    }

    alert(
      `Importação finalizada!\n✅ Sucesso: ${successCount}\n❌ Erros (códigos duplicados): ${errorCount}`,
    );
    loadData();
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
          <CsvImporter onImport={handleImport} />
          <Button onClick={openNew}>
            <PlusIcon className="size-5 mr-1" />
            Novo Item
          </Button>
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por código ou descrição..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10 h-12 text-base"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          A carregar itens e setores...
        </p>
      ) : (
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
                  {/* Destacando o Código */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {it.code}
                    </span>
                    <p className="font-medium truncate">{it.name}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground/80">
                      {it.unit}
                    </span>
                    <span>&bull;</span>
                    <span className="truncate">
                      {it.sectors.map((s) => s.name).join(", ") || "Sem setor"}
                    </span>
                  </div>
                  {it.cost !== null && it.cost !== undefined && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                      Custo ref: R${" "}
                      {Number(it.cost).toFixed(2).replace(".", ",")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    onClick={() => openEdit(it)}
                  >
                    <PencilSquareIcon className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="text-destructive"
                    onClick={() => handleDelete(it.id)}
                  >
                    <TrashIcon className="size-5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {/* NOVO CAMPO: Código */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-code" className="font-bold">
                Código de Barras / Referência{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: 789101010"
                className="h-11 border-primary/30 focus-visible:ring-primary/50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="item-name">Descrição do Produto</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Amendoim"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Unidade de Medida</Label>
                <Select
                  value={unit}
                  onValueChange={(value) => setUnit(value ?? "UN")}
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
                <Label htmlFor="item-cost">Custo Unitário</Label>
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
              <div className="flex items-center justify-between">
                <Label>Setores Vinculados</Label>
                {sectors.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSectorIds(
                        sectorIds.length === sectors.length
                          ? []
                          : sectors.map((s) => s.id),
                      )
                    }
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
