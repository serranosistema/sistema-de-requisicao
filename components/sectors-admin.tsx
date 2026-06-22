"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getSectors,
  createSector,
  updateSector,
  deleteSector,
} from "@/app/actions/sectors";

interface DbSector {
  id: string;
  code: string;
  name: string;
}

export function SectorsAdmin() {
  const [sectors, setSectors] = useState<DbSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Novos estados para otimização e controle
  const [isSaving, setIsSaving] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  async function loadSectors() {
    try {
      const data = await getSectors();
      setSectors(data as DbSector[]);
      // Atualiza o cache silenciosamente
      sessionStorage.setItem("@val-sectors", JSON.stringify(data));
    } catch (error) {
      console.error("Erro ao buscar setores", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 1. Tenta carregar do cache para renderização instantânea
    const cached = sessionStorage.getItem("@val-sectors");
    if (cached) {
      setSectors(JSON.parse(cached));
      setLoading(false);
    }
    // 2. Sempre busca do banco em background para garantir dados frescos
    loadSectors();
  }, []);

  function openNew() {
    setEditId(null);
    setCode("");
    setName("");
    setOpen(true);
  }

  function openEdit(sector: DbSector) {
    setEditId(sector.id);
    setCode(sector.code);
    setName(sector.name);
    setOpen(true);
  }

  async function save(e?: React.FormEvent) {
    if (e) e.preventDefault(); // Evita que a página recarregue ao apertar Enter

    if (!code.trim() || !name.trim()) {
      alert("Código e Nome são obrigatórios!");
      return;
    }

    setIsSaving(true); // Bloqueia o botão

    if (editId) {
      const res = await updateSector(editId, {
        code: code.trim(),
        name: name.trim(),
      });
      if (res.success) await loadSectors();
      else alert(res.error);
    } else {
      const res = await createSector({ code: code.trim(), name: name.trim() });
      if (res.success) await loadSectors();
      else alert(res.error);
    }

    setIsSaving(false); // Desbloqueia o botão
    setOpen(false);
  }

  async function handleDelete(id: string) {
    if (confirm("Tem a certeza de que deseja eliminar este setor?")) {
      const res = await deleteSector(id);
      if (res.success) loadSectors();
    }
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

      {loading ? (
        <p className="text-muted-foreground text-sm py-4">
          A carregar setores...
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {s.code}
                </span>
                <span className="font-medium truncate">{s.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                  <PencilSquareIcon className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(s.id)}
                >
                  <TrashIcon className="size-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Setor" : "Novo Setor"}</DialogTitle>
          </DialogHeader>

          {/* Formulário otimizado */}
          <form onSubmit={save} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sector-code" className="font-bold">
                Código (ID do Setor) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sector-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: 101"
                className="h-11 border-primary/30"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sector-name">
                Nome do setor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sector-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cozinha"
                className="h-11"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
