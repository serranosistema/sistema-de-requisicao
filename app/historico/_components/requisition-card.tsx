"use client";

import { useState } from "react";
import {
  TableCellsIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  exportCSV,
  exportPDF,
  FullRequisition,
  formatDatePTBR,
} from "./export-utils";

export function RequisitionCard({
  req,
  dayString,
}: {
  req: FullRequisition;
  dayString: string;
}) {
  const [open, setOpen] = useState(false);

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
          {/* O e.stopPropagation() impede que clicar no botão abra o modal ao mesmo tempo */}
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

      {/* MODAL DE VISUALIZAÇÃO COMPLETA */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalhes da Separação</DialogTitle>
          </DialogHeader>

          <div className="bg-muted/50 p-4 rounded-xl border flex flex-col gap-1 shrink-0">
            <p className="text-sm text-muted-foreground">Setor de Destino:</p>
            <p className="text-lg font-bold">
              [{req.sector.code}] {req.sector.name}
            </p>
            <p className="text-sm mt-2 font-medium">
              Data: {formatDatePTBR(req.createdAt)}
            </p>
            <p className="text-sm font-medium">Status: {req.status}</p>
          </div>

          <h3 className="font-semibold text-lg mt-2">
            Insumos Separados ({req.items.length})
          </h3>

          {/* Lista com Scroll interno caso haja muitos itens */}
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
            {req.items.map((reqItem) => (
              <div
                key={reqItem.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{reqItem.item.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    Cód: {reqItem.item.code}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">
                    {reqItem.quantity}
                  </span>
                  <span className="text-sm font-semibold ml-1">
                    {reqItem.item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4 sm:justify-between shrink-0">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV([req], `Req_${req.sector.name}`)}
              >
                Baixar CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportPDF([req], `Req_${req.sector.name}`)}
              >
                Baixar PDF
              </Button>
            </div>
            <Button
              className="mt-2 sm:mt-0 w-full sm:w-auto"
              onClick={() => setOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
