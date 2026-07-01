"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TableCellsIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  exportCSV,
  exportPDF,
  FullRequisition,
  formatDatePTBR,
} from "./export-utils";

// Importando TODAS as actions que criamos
import {
  updateRequisitionStatus,
  deleteRequisition,
  deleteRequisitionItem,
  updateRequisitionDate,
} from "@/app/actions/requisitions";

export function RequisitionCard({
  req,
  dayString,
}: {
  req: FullRequisition;
  dayString: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Estados para edição de data
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState(() => {
    // Formata a data atual para YYYY-MM-DD para o input type="date"
    return new Date(req.createdAt).toISOString().split("T")[0];
  });

  const router = useRouter();

  // --- HANDLERS DE AÇÕES ---

  async function handleCompleteRequisition() {
    if (
      !confirm(
        "Tem certeza que deseja concluir esta requisição? Ela não receberá mais itens automáticos da separação.",
      )
    )
      return;

    setIsPending(true);
    const res = await updateRequisitionStatus(req.id, "CONCLUIDA");
    setIsPending(false);

    if (res.success) {
      setOpen(false);
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  async function handleDeleteRequisition() {
    if (
      !confirm(
        "ATENÇÃO: Deseja excluir esta requisição inteira? Todos os insumos dela serão apagados do histórico. Essa ação não pode ser desfeita.",
      )
    )
      return;

    setIsPending(true);
    const res = await deleteRequisition(req.id);
    setIsPending(false);

    if (res.success) {
      setOpen(false);
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  async function handleDeleteItem(itemId: string, itemName: string) {
    if (!confirm(`Deseja remover "${itemName}" desta requisição?`)) return;

    setIsPending(true);
    const res = await deleteRequisitionItem(itemId);
    setIsPending(false);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  async function handleSaveDate() {
    if (!dateValue) return;
    setIsPending(true);

    // Converte a string YYYY-MM-DD de volta para Data (setando 12h para evitar problemas de fuso horário)
    const [year, month, day] = dateValue.split("-");
    const newDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      12,
      0,
      0,
    );

    const res = await updateRequisitionDate(req.id, newDate);
    setIsPending(false);

    if (res.success) {
      setIsEditingDate(false);
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  // --- RENDERIZAÇÃO ---

  return (
    <>
      {/* O Card em si (Clicável) */}
      <div
        onClick={() => setOpen(true)}
        className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-lg text-primary group-hover:underline">
              {req.sector.name}
            </p>
            <p className="text-sm font-mono text-muted-foreground mt-0.5">
              Cód: {req.sector.code}
            </p>
          </div>
          <StatusBadge status={req.status as any} />
        </div>

        <div className="flex flex-col gap-1 text-sm bg-muted/30 p-3 rounded-lg border">
          {req.items.slice(0, 3).map((reqItem) => (
            <div key={reqItem.id} className="flex justify-between">
              <span className="truncate pr-2">{reqItem.item.name}</span>
              <span className="font-medium shrink-0">
                {reqItem.quantity} {reqItem.item.unit}
              </span>
            </div>
          ))}
          {req.items.length > 3 && (
            <p className="text-xs text-muted-foreground mt-1 pt-1 border-t italic">
              + {req.items.length - 3} itens ocultos...
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-auto pt-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              exportCSV([req], `Req_${req.sector.name}_${dayString}`);
            }}
          >
            <TableCellsIcon className="size-4" /> CSV
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              exportPDF([req], `Req_${req.sector.name}_${dayString}`);
            }}
          >
            <DocumentArrowDownIcon className="size-4" /> PDF
          </Button>
        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO/EDIÇÃO COMPLETA */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalhes da Separação</DialogTitle>
          </DialogHeader>

          <div className="bg-muted/50 p-4 rounded-xl border flex flex-col gap-1 shrink-0">
            <p className="text-sm text-muted-foreground">Setor de Destino:</p>
            <p className="text-lg font-bold">
              [{req.sector.code}] {req.sector.name}
            </p>

            {/* CONTROLE DE EDIÇÃO DE DATA */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-muted-foreground">
                Data:
              </span>
              {isEditingDate ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className="h-8 w-40 text-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                    onClick={handleSaveDate}
                    disabled={isPending}
                  >
                    <CheckIcon className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                    onClick={() => setIsEditingDate(false)}
                    disabled={isPending}
                  >
                    <XMarkIcon className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {formatDatePTBR(req.createdAt)}
                  </p>
                  <button
                    onClick={() => setIsEditingDate(true)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Editar data"
                  >
                    <PencilIcon className="size-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm font-medium mt-1">Status: {req.status}</p>
          </div>

          <h3 className="font-semibold text-lg mt-2 flex justify-between items-center">
            <span>Insumos Separados ({req.items.length})</span>
          </h3>

          {/* LISTA DE INSUMOS COM OPÇÃO DE EXCLUIR */}
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
            {req.items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic p-4 text-center border rounded-lg bg-muted/20">
                Nenhum insumo nesta requisição.
              </p>
            ) : (
              req.items.map((reqItem) => (
                <div
                  key={reqItem.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card group/item hover:border-red-200 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{reqItem.item.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Cód: {reqItem.item.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary">
                        {reqItem.quantity}
                      </span>
                      <span className="text-sm font-semibold ml-1">
                        {reqItem.item.unit}
                      </span>
                    </div>
                    {/* Botão de Excluir Item Específico */}
                    <button
                      onClick={() =>
                        handleDeleteItem(reqItem.id, reqItem.item.name)
                      }
                      disabled={isPending}
                      className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100"
                      title="Remover insumo"
                    >
                      <TrashIcon className="size-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="mt-4 flex-col sm:flex-row sm:justify-between gap-3 shrink-0">
            {/* Esquerda: Excluir Requisição Inteira */}
            <div className="w-full sm:w-auto">
              <Button
                variant="destructive"
                className="w-full sm:w-auto bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none"
                onClick={handleDeleteRequisition}
                disabled={isPending}
              >
                <TrashIcon className="size-4 mr-2" />
                Excluir Requisição
              </Button>
            </div>

            {/* Direita: Concluir / Fechar */}
            <div className="flex gap-2 w-full sm:w-auto">
              {req.status === "ABERTA" && (
                <Button
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleCompleteRequisition}
                  disabled={isPending || req.items.length === 0}
                >
                  <CheckCircleIcon className="size-4 mr-2" />
                  {isPending ? "Processando..." : "Concluir"}
                </Button>
              )}
              <Button
                variant={req.status === "ABERTA" ? "outline" : "default"}
                className="flex-1 sm:flex-none"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
