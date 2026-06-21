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
  DialogClose,
} from "@/components/ui/dialog";
import {
  getSectors,
  createSector,
  updateSector,
  deleteSector,
} from "@/app/actions/sectors";

interface DbSector {
  id: string;
  code: string; // <-- Novo
  name: string;
}

export function SectorsAdmin() {
  const [sectors, setSectors] = useState<DbSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [code, setCode] = useState(""); // <-- Estado do código
  const [name, setName] = useState("");

  async function loadSectors() {
    setLoading(true);
    const data = await getSectors();
    setSectors(data as DbSector[]);
    setLoading(false);
  }

  useEffect(() => {
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

  async function save() {
    if (!code.trim() || !name.trim()) {
      alert("Código e Nome são obrigatórios!");
      return;
    }

    if (editId) {
      const res = await updateSector(editId, {
        code: code.trim(),
        name: name.trim(),
      });
      if (res.success) loadSectors();
      else alert(res.error);
    } else {
      const res = await createSector({ code: code.trim(), name: name.trim() });
      if (res.success) loadSectors();
      else alert(res.error);
    }
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
                <Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={() => openEdit(s)}
                >
                  <PencilSquareIcon className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="text-destructive"
                  onClick={() => handleDelete(s.id)}
                >
                  <TrashIcon className="size-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Setor" : "Novo Setor"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
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
